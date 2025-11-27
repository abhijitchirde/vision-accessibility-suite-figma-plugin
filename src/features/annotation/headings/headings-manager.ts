/**
 * HeadingsManager - Manages heading hierarchy annotations
 *
 * Features:
 * - Manual heading assignment (H1-H6) for selected text nodes
 * - Automatic detection of potential headings
 * - Hierarchy validation (one H1, sequential levels)
 * - Color-coded badges on canvas (purple H1, blue H2, etc.)
 * - Document outline generation
 * - Store heading data in plugin data (persisted in Figma file)
 */

import { StorageService } from '../../../services/storage.service';
import { SelectionService } from '../../../services/selection.service';
import {
  HeadingItem,
  HeadingLevel,
  TextNodeInfo,
  HeadingStats,
  HeadingValidationIssue,
  HeadingHierarchy,
} from './headings.types';
import {
  HEADINGS_CONSTANTS,
  getHeadingBadgeColor,
  getHeadingBadgeTextColor,
  headingLevelToNumber,
} from './headings.constants';

export class HeadingsManager {
  private storage: StorageService;
  private selection: SelectionService;

  constructor(storage: StorageService, selection: SelectionService) {
    this.storage = storage;
    this.selection = selection;
  }

  /**
   * Get all headings for the current page
   */
  async getHeadings(): Promise<HeadingItem[]> {
    const currentPage = figma.currentPage;
    const headingsData = await this.storage.getPluginData<HeadingItem[]>(
      `${HEADINGS_CONSTANTS.STORAGE_KEY}_${currentPage.id}`
    );

    if (!headingsData || headingsData.length === 0) {
      return [];
    }

    // Verify all nodes still exist and update text content + font metadata
    const validItems: HeadingItem[] = [];
    for (const item of headingsData) {
      try {
        const node = await figma.getNodeByIdAsync(item.nodeId);
        if (node && node.type === 'TEXT') {
          // Update text content and font metadata in case they changed
          const textNode = node as TextNode;
          const fontSize = typeof textNode.fontSize === 'number' ? textNode.fontSize : item.fontSize || 16;
          const fontWeight = this.getFontWeight(textNode);
          const fontFamily = this.getFontFamily(textNode);

          validItems.push({
            ...item,
            text: textNode.characters,
            nodeName: textNode.name,
            fontSize,
            fontWeight,
            fontFamily,
          });
        }
      } catch (error) {
        console.warn(`Node ${item.nodeId} no longer exists, skipping`);
      }
    }

    return validItems;
  }

  /**
   * Get all text nodes on the current page (for manual selection UI)
   */
  async getTextNodes(): Promise<TextNodeInfo[]> {
    const currentPage = figma.currentPage;
    const textNodes: TextNodeInfo[] = [];

    // Find all text nodes
    const allTextNodes = currentPage.findAll((node) => node.type === 'TEXT') as TextNode[];

    for (const node of allTextNodes) {
      // Skip empty text nodes
      if (!node.characters || node.characters.trim().length === 0) {
        continue;
      }

      // Detect if this looks like a heading (large font, bold)
      const fontSize = node.fontSize as number;
      const fontWeight = this.getFontWeight(node);
      const isLikelyHeading =
        fontSize >= HEADINGS_CONSTANTS.HEADING_MIN_FONT_SIZE ||
        fontWeight >= HEADINGS_CONSTANTS.HEADING_MIN_FONT_WEIGHT;

      // Get parent frame info
      const parentFrame = this.getParentFrame(node);

      textNodes.push({
        nodeId: node.id,
        nodeName: node.name,
        text: node.characters,
        fontSize,
        fontWeight,
        isLikelyHeading,
        bounds: this.getAbsoluteBounds(node),
        parentFrameId: parentFrame?.id,
        parentFrameName: parentFrame?.name,
      });
    }

    return textNodes;
  }

  /**
   * Add a heading for a specific node (manual addition)
   */
  async addHeading(
    nodeId: string,
    level: HeadingLevel
  ): Promise<{
    success: boolean;
    item?: HeadingItem;
    error?: string;
  }> {
    try {
      const node = await figma.getNodeByIdAsync(nodeId);

      if (!node || node.type !== 'TEXT') {
        return {
          success: false,
          error: 'Invalid node. Please select a text layer.',
        };
      }

      const textNode = node as TextNode;

      // Check if already has a heading assigned
      const existingHeadings = await this.getHeadings();
      const existing = existingHeadings.find((h) => h.nodeId === nodeId);

      if (existing) {
        return {
          success: false,
          error: `This node already has heading level ${existing.level} assigned.`,
        };
      }

      // Get parent frame info
      const parentFrame = this.getParentFrame(textNode);

      // Extract font metadata
      const fontSize = typeof textNode.fontSize === 'number' ? textNode.fontSize : 16;
      const fontWeight = this.getFontWeight(textNode);
      const fontFamily = this.getFontFamily(textNode);

      // Create heading item
      const item: HeadingItem = {
        nodeId: textNode.id,
        nodeName: textNode.name,
        level,
        text: textNode.characters,
        fontSize,
        fontWeight,
        fontFamily,
        parentFrameId: parentFrame?.id,
        parentFrameName: parentFrame?.name,
        lastModified: new Date().toISOString(),
      };

      // Add to existing headings
      const updatedHeadings = [...existingHeadings, item];

      // Save to plugin data
      const currentPage = figma.currentPage;
      await this.storage.setPluginData(
        `${HEADINGS_CONSTANTS.STORAGE_KEY}_${currentPage.id}`,
        updatedHeadings
      );

      // Create badge annotation
      const annotationId = await this.createHeadingBadge(textNode, level);
      item.annotationId = annotationId;

      // Update storage with annotation ID
      await this.storage.setPluginData(
        `${HEADINGS_CONSTANTS.STORAGE_KEY}_${currentPage.id}`,
        updatedHeadings
      );

      return {
        success: true,
        item,
      };
    } catch (error) {
      console.error('Error adding heading:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Add heading for currently selected node(s)
   */
  async addSelectedAsHeading(level: HeadingLevel): Promise<{
    success: boolean;
    items?: HeadingItem[];
    error?: string;
  }> {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      return {
        success: false,
        error: 'No nodes selected. Please select a text layer.',
      };
    }

    const addedItems: HeadingItem[] = [];
    const errors: string[] = [];

    // Add each selected text node
    for (const node of selection) {
      if (node.type === 'TEXT') {
        const result = await this.addHeading(node.id, level);
        if (result.success && result.item) {
          addedItems.push(result.item);
        } else if (result.error) {
          errors.push(`${node.name}: ${result.error}`);
        }
      } else {
        errors.push(`${node.name}: Not a text layer`);
      }
    }

    if (addedItems.length === 0) {
      return {
        success: false,
        error: errors.join('\n'),
      };
    }

    return {
      success: true,
      items: await this.getHeadings(),
    };
  }

  /**
   * Remove a heading
   */
  async removeHeading(nodeId: string): Promise<{
    success: boolean;
    items?: HeadingItem[];
    error?: string;
  }> {
    const existingHeadings = await this.getHeadings();

    // Find the heading to remove
    const headingToRemove = existingHeadings.find((h) => h.nodeId === nodeId);
    if (!headingToRemove) {
      return {
        success: false,
        error: 'Heading not found.',
      };
    }

    // Remove the heading
    const updatedHeadings = existingHeadings.filter((h) => h.nodeId !== nodeId);

    // Save to plugin data
    const currentPage = figma.currentPage;
    await this.storage.setPluginData(
      `${HEADINGS_CONSTANTS.STORAGE_KEY}_${currentPage.id}`,
      updatedHeadings
    );

    // Delete annotation
    if (headingToRemove.annotationId) {
      await this.deleteAnnotation(headingToRemove.annotationId);
    }

    return {
      success: true,
      items: updatedHeadings,
    };
  }

  /**
   * Update heading level
   */
  async updateHeadingLevel(
    nodeId: string,
    newLevel: HeadingLevel
  ): Promise<{
    success: boolean;
    items?: HeadingItem[];
    error?: string;
  }> {
    const existingHeadings = await this.getHeadings();

    // Find the heading to update
    const headingIndex = existingHeadings.findIndex((h) => h.nodeId === nodeId);
    if (headingIndex === -1) {
      return {
        success: false,
        error: 'Heading not found.',
      };
    }

    const heading = existingHeadings[headingIndex];

    // Update level
    heading.level = newLevel;
    heading.lastModified = new Date().toISOString();

    // Save to plugin data
    const currentPage = figma.currentPage;
    await this.storage.setPluginData(
      `${HEADINGS_CONSTANTS.STORAGE_KEY}_${currentPage.id}`,
      existingHeadings
    );

    // Update badge
    if (heading.annotationId) {
      await this.deleteAnnotation(heading.annotationId);
    }

    try {
      const node = await figma.getNodeByIdAsync(nodeId);
      if (node && node.type === 'TEXT') {
        const annotationId = await this.createHeadingBadge(node as TextNode, newLevel);
        heading.annotationId = annotationId;

        // Save again with new annotation ID
        await this.storage.setPluginData(
          `${HEADINGS_CONSTANTS.STORAGE_KEY}_${currentPage.id}`,
          existingHeadings
        );
      }
    } catch (error) {
      console.error('Error updating heading badge:', error);
    }

    return {
      success: true,
      items: existingHeadings,
    };
  }

  /**
   * Create a color-coded heading badge
   */
  private async createHeadingBadge(
    targetNode: TextNode,
    level: HeadingLevel
  ): Promise<string> {
    const container = this.getAnnotationsContainer();

    // Create badge frame
    const badge = figma.createFrame();
    badge.name = `heading-badge-${level}`;
    badge.resize(HEADINGS_CONSTANTS.BADGE_WIDTH, HEADINGS_CONSTANTS.BADGE_HEIGHT);
    badge.cornerRadius = HEADINGS_CONSTANTS.BADGE_CORNER_RADIUS;

    // Set background color based on heading level
    const bgColor = getHeadingBadgeColor(level);
    badge.fills = [
      {
        type: 'SOLID',
        color: this.parseColor(bgColor),
      },
    ];

    // Center the text
    badge.layoutMode = 'HORIZONTAL';
    badge.primaryAxisAlignItems = 'CENTER';
    badge.counterAxisAlignItems = 'CENTER';
    badge.primaryAxisSizingMode = 'FIXED';
    badge.counterAxisSizingMode = 'FIXED';

    // Load font and create text
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
    const text = figma.createText();
    text.fontName = { family: 'Inter', style: 'Bold' };
    text.fontSize = HEADINGS_CONSTANTS.BADGE_TEXT_SIZE;
    text.characters = level;

    // Set text color (white for most, black for yellow H5)
    const textColor = getHeadingBadgeTextColor(level);
    text.fills = [
      {
        type: 'SOLID',
        color: this.parseColor(textColor),
      },
    ];

    badge.appendChild(text);

    // Position badge at top-left of target node
    const bounds = this.getAbsoluteBounds(targetNode);
    badge.x = bounds.x - HEADINGS_CONSTANTS.BADGE_WIDTH - 8; // 8px gap
    badge.y = bounds.y;

    // Add to container
    container.appendChild(badge);

    // Store metadata
    badge.setPluginData('targetNodeId', targetNode.id);
    badge.setPluginData('annotationType', HEADINGS_CONSTANTS.ANNOTATION_TYPE);
    badge.setPluginData('headingLevel', level);

    console.log(`Created ${level} badge for node ${targetNode.id}`);

    return badge.id;
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
   * Toggle visibility of all heading annotations
   */
  async toggleAnnotationsVisibility(visible: boolean): Promise<void> {
    const container = this.getAnnotationsContainer();

    // Find all heading badges
    container.findAll((node) => {
      if (node.getPluginData('annotationType') === HEADINGS_CONSTANTS.ANNOTATION_TYPE) {
        node.visible = visible;
      }
      return false;
    });
  }

  /**
   * Zoom to a heading in Figma canvas
   */
  async zoomToHeading(nodeId: string): Promise<boolean> {
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
   * Validate heading hierarchy and return issues
   */
  async validateHeadings(): Promise<HeadingValidationIssue[]> {
    const headings = await this.getHeadings();
    const issues: HeadingValidationIssue[] = [];

    if (headings.length === 0) {
      return issues;
    }

    // Sort headings by level for validation
    const sortedHeadings = [...headings].sort((a, b) => {
      const aLevel = headingLevelToNumber(a.level);
      const bLevel = headingLevelToNumber(b.level);
      return aLevel - bLevel;
    });

    // Check for H1
    const h1Count = headings.filter((h) => h.level === 'H1').length;

    if (h1Count === 0 && HEADINGS_CONSTANTS.VALIDATION.REQUIRE_H1) {
      issues.push({
        type: 'no_h1',
        severity: 'error',
        message: 'Page should have at least one H1 heading.',
      });
    }

    if (h1Count > HEADINGS_CONSTANTS.VALIDATION.MAX_H1_COUNT) {
      issues.push({
        type: 'multiple_h1',
        severity: 'error',
        message: `Page has ${h1Count} H1 headings. Should have only one.`,
      });
    }

    // Check for skipped levels (e.g., H1 → H3)
    if (HEADINGS_CONSTANTS.VALIDATION.SEQUENTIAL_LEVELS) {
      const levels = headings.map((h) => headingLevelToNumber(h.level)).sort((a, b) => a - b);
      const uniqueLevels = Array.from(new Set(levels));

      for (let i = 1; i < uniqueLevels.length; i++) {
        const currentLevel = uniqueLevels[i];
        const previousLevel = uniqueLevels[i - 1];

        if (currentLevel - previousLevel > 1) {
          const skippedLevel = previousLevel + 1;
          issues.push({
            type: 'skipped_level',
            severity: 'warning',
            message: `Heading level H${skippedLevel} is skipped. Headings should be sequential.`,
            level: `H${currentLevel}` as HeadingLevel,
          });
        }
      }
    }

    // Check for empty headings
    for (const heading of headings) {
      if (!heading.text || heading.text.trim().length === 0) {
        issues.push({
          type: 'empty_heading',
          severity: 'warning',
          message: `Heading ${heading.level} is empty.`,
          nodeId: heading.nodeId,
          level: heading.level,
        });
      }
    }

    return issues;
  }

  /**
   * Get heading statistics
   */
  async getStats(): Promise<HeadingStats> {
    const headings = await this.getHeadings();
    const issues = await this.validateHeadings();

    // Count by level
    const byLevel: Record<HeadingLevel, number> = {
      H1: 0,
      H2: 0,
      H3: 0,
      H4: 0,
      H5: 0,
      H6: 0,
    };

    for (const heading of headings) {
      byLevel[heading.level]++;
    }

    // Check if valid (no errors, warnings are ok)
    const hasErrors = issues.some((issue) => issue.severity === 'error');

    return {
      total: headings.length,
      byLevel,
      validationIssues: issues,
      isValid: !hasErrors,
    };
  }

  /**
   * Generate document outline (hierarchical structure)
   */
  async getDocumentOutline(): Promise<HeadingHierarchy[]> {
    const headings = await this.getHeadings();

    if (headings.length === 0) {
      return [];
    }

    // Sort headings by their position in the document (Y coordinate)
    const sortedHeadings = [...headings].sort((a, b) => {
      // We need to get the actual node positions
      // For now, we'll assume they're already in document order
      return 0;
    });

    // Build hierarchy
    const root: HeadingHierarchy[] = [];
    const stack: HeadingHierarchy[] = [];

    for (const heading of sortedHeadings) {
      const level = headingLevelToNumber(heading.level);
      const node: HeadingHierarchy = {
        level: heading.level,
        text: heading.text,
        nodeId: heading.nodeId,
        children: [],
      };

      // Pop stack until we find a parent (lower level number)
      while (stack.length > 0 && headingLevelToNumber(stack[stack.length - 1].level) >= level) {
        stack.pop();
      }

      // Add to parent or root
      if (stack.length === 0) {
        root.push(node);
      } else {
        stack[stack.length - 1].children.push(node);
      }

      // Push to stack
      stack.push(node);
    }

    return root;
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
   * Get parent frame of a node
   */
  private getParentFrame(node: SceneNode): FrameNode | null {
    let current = node.parent;
    while (current && current.type !== 'PAGE') {
      if (current.type === 'FRAME') {
        return current as FrameNode;
      }
      current = current.parent;
    }
    return null;
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
   * Get font weight from a text node
   */
  private getFontWeight(node: TextNode): number {
    const fontName = node.fontName;
    if (fontName === figma.mixed) {
      return 400; // Default to normal weight
    }

    const style = (fontName as FontName).style.toLowerCase();

    // Map font style to weight
    if (style.includes('thin')) return 100;
    if (style.includes('extralight') || style.includes('ultra light')) return 200;
    if (style.includes('light')) return 300;
    if (style.includes('normal') || style.includes('regular')) return 400;
    if (style.includes('medium')) return 500;
    if (style.includes('semibold') || style.includes('semi bold')) return 600;
    if (style.includes('bold') && !style.includes('semi')) return 700;
    if (style.includes('extrabold') || style.includes('ultra bold')) return 800;
    if (style.includes('black') || style.includes('heavy')) return 900;

    return 400; // Default
  }

  /**
   * Get font family from a text node
   */
  private getFontFamily(node: TextNode): string {
    const fontName = node.fontName;
    if (fontName === figma.mixed) {
      return 'Mixed'; // Multiple fonts in text
    }

    return (fontName as FontName).family;
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
