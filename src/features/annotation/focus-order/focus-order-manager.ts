/**
 * FocusOrderManager - Manages focus order annotations for keyboard navigation
 *
 * Features:
 * - Add/remove elements from focus order
 * - Reorder elements via drag-and-drop
 * - Create numbered circular badges on canvas
 * - Store focus order in plugin data (persisted in Figma file)
 * - Zoom to elements in focus order
 */

import { StorageService } from '../../../services/storage.service';
import { SelectionService } from '../../../services/selection.service';
import {
  FocusOrderItem,
  FocusableNodeInfo,
  FocusOrderStats,
} from './focus-order.types';
import { FOCUS_ORDER_CONSTANTS } from './focus-order.constants';

export class FocusOrderManager {
  private storage: StorageService;
  private selection: SelectionService;

  constructor(storage: StorageService, selection: SelectionService) {
    this.storage = storage;
    this.selection = selection;
  }

  /**
   * Get all focus order items for the current page
   */
  async getFocusOrder(): Promise<FocusOrderItem[]> {
    const currentPage = figma.currentPage;
    const focusOrderData = await this.storage.getPluginData<FocusOrderItem[]>(
      `${FOCUS_ORDER_CONSTANTS.STORAGE_KEY}_${currentPage.id}`
    );

    if (!focusOrderData || focusOrderData.length === 0) {
      return [];
    }

    // Verify all nodes still exist
    const validItems: FocusOrderItem[] = [];
    for (const item of focusOrderData) {
      try {
        const node = await figma.getNodeByIdAsync(item.nodeId);
        if (node) {
          validItems.push(item);
        }
      } catch (error) {
        console.warn(`Node ${item.nodeId} no longer exists, skipping`);
      }
    }

    return validItems;
  }

  /**
   * Add currently selected node(s) to focus order
   */
  async addSelectedToFocusOrder(): Promise<{
    success: boolean;
    items?: FocusOrderItem[];
    error?: string;
  }> {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      return {
        success: false,
        error: 'No nodes selected. Please select a focusable element.',
      };
    }

    // Get existing focus order
    const existingItems = await this.getFocusOrder();

    // Add selected nodes that aren't already in focus order
    const newItems: FocusOrderItem[] = [];
    let nextOrder = existingItems.length + 1;

    for (const node of selection) {
      // Check if already in focus order
      const alreadyExists = existingItems.some((item) => item.nodeId === node.id);
      if (alreadyExists) {
        continue;
      }

      // Create focus order item
      const item: FocusOrderItem = {
        nodeId: node.id,
        nodeName: node.name,
        order: nextOrder,
        lastModified: new Date().toISOString(),
      };

      newItems.push(item);
      nextOrder++;
    }

    if (newItems.length === 0) {
      return {
        success: false,
        error: 'Selected node(s) already in focus order.',
      };
    }

    // Combine with existing items
    const allItems = [...existingItems, ...newItems];

    // Save to plugin data
    const currentPage = figma.currentPage;
    await this.storage.setPluginData(
      `${FOCUS_ORDER_CONSTANTS.STORAGE_KEY}_${currentPage.id}`,
      allItems
    );

    // Create annotations for new items
    await this.createAnnotationsForItems(newItems);

    return {
      success: true,
      items: allItems,
    };
  }

  /**
   * Remove an item from focus order
   */
  async removeFocusOrderItem(nodeId: string): Promise<{
    success: boolean;
    items?: FocusOrderItem[];
    error?: string;
  }> {
    const existingItems = await this.getFocusOrder();

    // Find the item to remove
    const itemToRemove = existingItems.find((item) => item.nodeId === nodeId);
    if (!itemToRemove) {
      return {
        success: false,
        error: 'Item not found in focus order.',
      };
    }

    // Remove the item
    const updatedItems = existingItems.filter((item) => item.nodeId !== nodeId);

    // Renumber remaining items
    updatedItems.forEach((item, index) => {
      item.order = index + 1;
      item.lastModified = new Date().toISOString();
    });

    // Save to plugin data
    const currentPage = figma.currentPage;
    await this.storage.setPluginData(
      `${FOCUS_ORDER_CONSTANTS.STORAGE_KEY}_${currentPage.id}`,
      updatedItems
    );

    // Delete annotation
    if (itemToRemove.annotationId) {
      await this.deleteAnnotation(itemToRemove.annotationId);
    }

    // Update all annotations with new numbers
    await this.updateAllAnnotations(updatedItems);

    return {
      success: true,
      items: updatedItems,
    };
  }

  /**
   * Reorder focus items (called after drag-and-drop)
   */
  async reorderFocusItems(items: FocusOrderItem[]): Promise<{
    success: boolean;
    items?: FocusOrderItem[];
    error?: string;
  }> {
    // Renumber items based on new order
    const reorderedItems = items.map((item, index) => ({
      ...item,
      order: index + 1,
      lastModified: new Date().toISOString(),
    }));

    // Save to plugin data
    const currentPage = figma.currentPage;
    await this.storage.setPluginData(
      `${FOCUS_ORDER_CONSTANTS.STORAGE_KEY}_${currentPage.id}`,
      reorderedItems
    );

    // Update all annotations with new numbers
    await this.updateAllAnnotations(reorderedItems);

    return {
      success: true,
      items: reorderedItems,
    };
  }

  /**
   * Create numbered circular badge annotations for items
   */
  private async createAnnotationsForItems(items: FocusOrderItem[]): Promise<void> {
    const currentPage = figma.currentPage;

    for (const item of items) {
      try {
        const node = await figma.getNodeByIdAsync(item.nodeId);
        if (!node || !('absoluteBoundingBox' in node)) {
          continue;
        }

        // Create circular badge
        const annotationId = await this.createCircularBadge(
          node as SceneNode,
          item.order
        );

        // Update item with annotation ID
        item.annotationId = annotationId;
      } catch (error) {
        console.error(`Failed to create annotation for ${item.nodeId}:`, error);
      }
    }

    // Load all items, update the ones we modified with annotation IDs, and save back
    const allItems = await this.getFocusOrder();
    for (const modifiedItem of items) {
      const itemInStorage = allItems.find(i => i.nodeId === modifiedItem.nodeId);
      if (itemInStorage && modifiedItem.annotationId) {
        itemInStorage.annotationId = modifiedItem.annotationId;
      }
    }

    await this.storage.setPluginData(
      `${FOCUS_ORDER_CONSTANTS.STORAGE_KEY}_${currentPage.id}`,
      allItems
    );
  }

  /**
   * Create a circular badge with number
   */
  private async createCircularBadge(
    targetNode: SceneNode,
    number: number
  ): Promise<string> {
    const container = this.getAnnotationsContainer();

    // Create badge frame (32x32px with 30px corner radius for squircle shape)
    const badge = figma.createFrame();
    badge.name = `focus-order-badge-${number}`;
    badge.resize(
      FOCUS_ORDER_CONSTANTS.BADGE_SIZE,
      FOCUS_ORDER_CONSTANTS.BADGE_SIZE
    );

    // Set corner radius to 30px for smooth rounded square (squircle)
    badge.cornerRadius = 30;

    // Purple background
    badge.fills = [
      {
        type: 'SOLID',
        color: this.parseColor(FOCUS_ORDER_CONSTANTS.BADGE_COLOR),
      },
    ];

    // Center the text with fixed sizing
    badge.layoutMode = 'HORIZONTAL';
    badge.primaryAxisAlignItems = 'CENTER';
    badge.counterAxisAlignItems = 'CENTER';
    badge.primaryAxisSizingMode = 'FIXED';
    badge.counterAxisSizingMode = 'FIXED';

    // Load font and create text
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
    const text = figma.createText();
    text.fontName = { family: 'Inter', style: 'Bold' };
    text.fontSize = 16;
    text.characters = number.toString();
    text.fills = [
      {
        type: 'SOLID',
        color: this.parseColor(FOCUS_ORDER_CONSTANTS.BADGE_TEXT_COLOR),
      },
    ];

    badge.appendChild(text);

    // Position badge relative to target node (x-48px, y=y)
    const bounds = this.getAbsoluteBounds(targetNode);
    badge.x = bounds.x - 48;
    badge.y = bounds.y;

    // Add to container
    container.appendChild(badge);

    // Store metadata
    badge.setPluginData('targetNodeId', targetNode.id);
    badge.setPluginData('annotationType', FOCUS_ORDER_CONSTANTS.ANNOTATION_TYPE);
    badge.setPluginData('focusOrder', number.toString());

    console.log(`Created circular badge ${number} for node ${targetNode.id}`);

    return badge.id;
  }

  /**
   * Update all annotations with new numbers after reorder
   */
  private async updateAllAnnotations(items: FocusOrderItem[]): Promise<void> {
    for (const item of items) {
      if (item.annotationId) {
        try {
          // Update existing badge instead of recreating
          const badge = await figma.getNodeByIdAsync(item.annotationId);
          if (badge && badge.type === 'FRAME') {
            // Find the text node inside the badge and update it
            const textNode = badge.findOne((n) => n.type === 'TEXT') as TextNode;
            if (textNode) {
              await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
              textNode.characters = item.order.toString();
            }
            // Update badge name
            badge.name = `focus-order-badge-${item.order}`;
            // Update plugin data
            badge.setPluginData('focusOrder', item.order.toString());
          }
        } catch (error) {
          console.warn(`Failed to update annotation ${item.annotationId}, will recreate`);
          // If update fails, recreate the badge
          try {
            await this.deleteAnnotation(item.annotationId);
            const node = await figma.getNodeByIdAsync(item.nodeId);
            if (node && 'absoluteBoundingBox' in node) {
              const annotationId = await this.createCircularBadge(
                node as SceneNode,
                item.order
              );
              item.annotationId = annotationId;
            }
          } catch (recreateError) {
            console.error(`Failed to recreate annotation for ${item.nodeId}:`, recreateError);
          }
        }
      } else {
        // Create new annotation if missing
        try {
          const node = await figma.getNodeByIdAsync(item.nodeId);
          if (node && 'absoluteBoundingBox' in node) {
            const annotationId = await this.createCircularBadge(
              node as SceneNode,
              item.order
            );
            item.annotationId = annotationId;
          }
        } catch (error) {
          console.error(`Failed to create annotation for ${item.nodeId}:`, error);
        }
      }
    }

    // Save updated items
    const currentPage = figma.currentPage;
    await this.storage.setPluginData(
      `${FOCUS_ORDER_CONSTANTS.STORAGE_KEY}_${currentPage.id}`,
      items
    );
  }

  /**
   * Delete annotation by ID
   */
  private async deleteAnnotation(annotationId: string): Promise<void> {
    try {
      const annotation = await figma.getNodeByIdAsync(annotationId);
      if (annotation) {
        annotation.remove();
      }
    } catch (error) {
      console.error(`Failed to delete annotation ${annotationId}:`, error);
    }
  }

  /**
   * Get or create the annotations container
   */
  private getAnnotationsContainer(): FrameNode {
    const currentPage = figma.currentPage;
    const containerName = '__A11y Annotations__';

    // Try to find existing container
    const existing = currentPage.findOne(
      (node) => node.type === 'FRAME' && node.name === containerName
    ) as FrameNode | null;

    if (existing) {
      return existing;
    }

    // Create new container
    const container = figma.createFrame();
    container.name = containerName;
    container.x = 0;
    container.y = 0;
    container.resize(100, 100);
    container.clipsContent = false;
    container.fills = [];
    container.locked = false;

    currentPage.appendChild(container);

    return container;
  }

  /**
   * Toggle visibility of all focus order annotations
   */
  async toggleAnnotationsVisibility(visible: boolean): Promise<void> {
    const container = this.getAnnotationsContainer();

    // Find all focus order badges
    container.findAll((node) => {
      if (
        node.getPluginData('annotationType') === FOCUS_ORDER_CONSTANTS.ANNOTATION_TYPE
      ) {
        node.visible = visible;
      }
      return false;
    });
  }

  /**
   * Zoom to a focus order item in Figma canvas
   */
  async zoomToItem(nodeId: string): Promise<boolean> {
    try {
      const node = await figma.getNodeByIdAsync(nodeId);
      if (!node) return false;

      figma.currentPage.selection = [node as SceneNode];
      figma.viewport.scrollAndZoomIntoView([node as SceneNode]);

      return true;
    } catch (error) {
      console.error(`Failed to zoom to node ${nodeId}:`, error);
      return false;
    }
  }

  /**
   * Get statistics about focus order
   */
  async getStats(): Promise<FocusOrderStats> {
    const items = await this.getFocusOrder();

    return {
      total: items.length,
      percentageComplete: items.length > 0 ? 100 : 0,
    };
  }

  /**
   * Get absolute bounds of a node
   */
  private getAbsoluteBounds(node: SceneNode): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    return {
      x: node.absoluteBoundingBox?.x || 0,
      y: node.absoluteBoundingBox?.y || 0,
      width: node.absoluteBoundingBox?.width || 0,
      height: node.absoluteBoundingBox?.height || 0,
    };
  }

  /**
   * Parse hex color to Figma RGB
   */
  private parseColor(color: string): RGB {
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      return { r, g, b };
    }
    return { r: 0.54, g: 0.36, b: 0.96 }; // Default purple
  }
}
