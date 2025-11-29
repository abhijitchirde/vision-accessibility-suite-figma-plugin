/**
 * LandmarksManager - Manages landmark role annotations
 *
 * Features:
 * - Manual landmark assignment (header, nav, main, aside, footer, form, section) for selected frames
 * - Validation (one main, labeled nav/sections if multiple)
 * - Color-coded badges on canvas
 * - Optional aria-label for landmarks
 * - Store landmark data in plugin data (persisted in Figma file)
 */

import { StorageService } from '../../../services/storage.service';
import { SelectionService } from '../../../services/selection.service';
import {
  LandmarkItem,
  LandmarkRole,
  LandmarkStats,
  LandmarkValidationIssue,
} from './landmarks.types';
import {
  LANDMARKS_CONSTANTS,
  getLandmarkBadgeColor,
  getLandmarkBadgeTextColor,
  getLandmarkHtmlTag,
  landmarkRequiresLabel,
} from './landmarks.constants';

export class LandmarksManager {
  private storage: StorageService;
  private selection: SelectionService;

  constructor(storage: StorageService, selection: SelectionService) {
    this.storage = storage;
    this.selection = selection;
  }

  /**
   * Get all landmarks for the current page
   */
  async getLandmarks(): Promise<LandmarkItem[]> {
    const currentPage = figma.currentPage;
    const landmarksData = await this.storage.getPluginData<LandmarkItem[]>(
      `${LANDMARKS_CONSTANTS.STORAGE_KEY}_${currentPage.id}`
    );

    if (!landmarksData || landmarksData.length === 0) {
      return [];
    }

    // Verify all nodes still exist and update node names
    const validItems: LandmarkItem[] = [];
    for (const item of landmarksData) {
      try {
        const node = await figma.getNodeByIdAsync(item.nodeId);
        if (node && (node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'SECTION')) {
          validItems.push({
            ...item,
            nodeName: node.name,
          });
        }
      } catch (error) {
        console.warn(`Node ${item.nodeId} no longer exists, skipping`);
      }
    }

    return validItems;
  }

  /**
   * Add a landmark for the selected node
   */
  async addSelectedAsLandmark(
    role: LandmarkRole,
    label?: string
  ): Promise<{
    success: boolean;
    item?: LandmarkItem;
    error?: string;
  }> {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      return {
        success: false,
        error: 'No nodes selected. Please select a section on your design then pick a landmark and click the add button.',
      };
    }

    if (selection.length > 1) {
      return {
        success: false,
        error: 'Multiple nodes selected. Please select a single frame or section.',
      };
    }

    const node = selection[0];

    if (node.type !== 'FRAME' && node.type !== 'GROUP' && node.type !== 'SECTION') {
      return {
        success: false,
        error: 'Invalid node type. Please select a frame, section, or group.',
      };
    }

    return await this.addLandmark(node.id, role, label);
  }

  /**
   * Add a landmark for a specific node
   */
  async addLandmark(
    nodeId: string,
    role: LandmarkRole,
    label?: string
  ): Promise<{
    success: boolean;
    item?: LandmarkItem;
    error?: string;
  }> {
    try {
      const node = await figma.getNodeByIdAsync(nodeId);

      if (!node || (node.type !== 'FRAME' && node.type !== 'GROUP' && node.type !== 'SECTION')) {
        return {
          success: false,
          error: 'Invalid node. Please select a frame, section, or group.',
        };
      }

      // Check if already has a landmark assigned
      const existingLandmarks = await this.getLandmarks();
      const existing = existingLandmarks.find((l) => l.nodeId === nodeId);

      if (existing) {
        return {
          success: false,
          error: `This node already has landmark role "${existing.role}" assigned.`,
        };
      }

      // Get parent frame info
      const parentFrame = this.getParentFrame(node as SceneNode);

      // Create landmark item
      const item: LandmarkItem = {
        nodeId: node.id,
        nodeName: node.name,
        role,
        label,
        parentFrameId: parentFrame?.id,
        parentFrameName: parentFrame?.name,
        lastModified: new Date().toISOString(),
      };

      // Add to existing landmarks
      const updatedLandmarks = [...existingLandmarks, item];

      // Save to plugin data
      const currentPage = figma.currentPage;
      await this.storage.setPluginData(
        `${LANDMARKS_CONSTANTS.STORAGE_KEY}_${currentPage.id}`,
        updatedLandmarks
      );

      // Create badge annotation
      const annotationId = await this.createLandmarkBadge(node as FrameNode | GroupNode | SectionNode, role, label);
      item.annotationId = annotationId;

      // Update storage with annotation ID
      await this.storage.setPluginData(
        `${LANDMARKS_CONSTANTS.STORAGE_KEY}_${currentPage.id}`,
        updatedLandmarks
      );

      return {
        success: true,
        item,
      };
    } catch (error) {
      console.error('Error adding landmark:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Remove a landmark
   */
  async removeLandmark(nodeId: string): Promise<{
    success: boolean;
    items?: LandmarkItem[];
    error?: string;
  }> {
    const existingLandmarks = await this.getLandmarks();

    // Find the landmark to remove
    const landmarkToRemove = existingLandmarks.find((l) => l.nodeId === nodeId);
    if (!landmarkToRemove) {
      return {
        success: false,
        error: 'Landmark not found.',
      };
    }

    // Remove the landmark
    const updatedLandmarks = existingLandmarks.filter((l) => l.nodeId !== nodeId);

    // Save to plugin data
    const currentPage = figma.currentPage;
    await this.storage.setPluginData(
      `${LANDMARKS_CONSTANTS.STORAGE_KEY}_${currentPage.id}`,
      updatedLandmarks
    );

    // Delete annotation
    if (landmarkToRemove.annotationId) {
      await this.deleteAnnotation(landmarkToRemove.annotationId);
    }

    return {
      success: true,
      items: updatedLandmarks,
    };
  }

  /**
   * Update landmark role
   */
  async updateLandmarkRole(
    nodeId: string,
    newRole: LandmarkRole
  ): Promise<{
    success: boolean;
    items?: LandmarkItem[];
    error?: string;
  }> {
    const existingLandmarks = await this.getLandmarks();

    // Find the landmark to update
    const landmarkIndex = existingLandmarks.findIndex((l) => l.nodeId === nodeId);
    if (landmarkIndex === -1) {
      return {
        success: false,
        error: 'Landmark not found.',
      };
    }

    const landmark = existingLandmarks[landmarkIndex];

    // Update role
    landmark.role = newRole;
    landmark.lastModified = new Date().toISOString();

    // Save to plugin data
    const currentPage = figma.currentPage;
    await this.storage.setPluginData(
      `${LANDMARKS_CONSTANTS.STORAGE_KEY}_${currentPage.id}`,
      existingLandmarks
    );

    // Update badge
    if (landmark.annotationId) {
      await this.deleteAnnotation(landmark.annotationId);
    }

    try {
      const node = await figma.getNodeByIdAsync(nodeId);
      if (node && (node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'SECTION')) {
        const annotationId = await this.createLandmarkBadge(
          node as FrameNode | GroupNode | SectionNode,
          newRole,
          landmark.label
        );
        landmark.annotationId = annotationId;

        // Save again with new annotation ID
        await this.storage.setPluginData(
          `${LANDMARKS_CONSTANTS.STORAGE_KEY}_${currentPage.id}`,
          existingLandmarks
        );
      }
    } catch (error) {
      console.error('Error updating landmark badge:', error);
    }

    return {
      success: true,
      items: existingLandmarks,
    };
  }

  /**
   * Update landmark label
   */
  async updateLandmarkLabel(
    nodeId: string,
    label: string
  ): Promise<{
    success: boolean;
    items?: LandmarkItem[];
    error?: string;
  }> {
    const existingLandmarks = await this.getLandmarks();

    // Find the landmark to update
    const landmarkIndex = existingLandmarks.findIndex((l) => l.nodeId === nodeId);
    if (landmarkIndex === -1) {
      return {
        success: false,
        error: 'Landmark not found.',
      };
    }

    const landmark = existingLandmarks[landmarkIndex];

    // Update label
    landmark.label = label || undefined;
    landmark.lastModified = new Date().toISOString();

    // Save to plugin data
    const currentPage = figma.currentPage;
    await this.storage.setPluginData(
      `${LANDMARKS_CONSTANTS.STORAGE_KEY}_${currentPage.id}`,
      existingLandmarks
    );

    // Update badge
    if (landmark.annotationId) {
      await this.deleteAnnotation(landmark.annotationId);
    }

    try {
      const node = await figma.getNodeByIdAsync(nodeId);
      if (node && (node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'SECTION')) {
        const annotationId = await this.createLandmarkBadge(
          node as FrameNode | GroupNode | SectionNode,
          landmark.role,
          landmark.label
        );
        landmark.annotationId = annotationId;

        // Save again with new annotation ID
        await this.storage.setPluginData(
          `${LANDMARKS_CONSTANTS.STORAGE_KEY}_${currentPage.id}`,
          existingLandmarks
        );
      }
    } catch (error) {
      console.error('Error updating landmark badge:', error);
    }

    return {
      success: true,
      items: existingLandmarks,
    };
  }

  /**
   * Create a color-coded landmark badge
   */
  private async createLandmarkBadge(
    targetNode: FrameNode | GroupNode | SectionNode,
    role: LandmarkRole,
    label?: string
  ): Promise<string> {
    const container = this.getAnnotationsContainer();

    // Determine badge text
    const htmlTag = getLandmarkHtmlTag(role);
    const badgeText = label ? `${htmlTag} "${label}"` : htmlTag;

    // Load font
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

    // Create temporary text to measure width
    const tempText = figma.createText();
    tempText.fontName = { family: 'Inter', style: 'Bold' };
    tempText.fontSize = LANDMARKS_CONSTANTS.BADGE_TEXT_SIZE;
    tempText.characters = badgeText;
    const textWidth = tempText.width;
    tempText.remove();

    // Calculate badge width (text width + padding)
    const badgeWidth = textWidth + (LANDMARKS_CONSTANTS.BADGE_PADDING * 2);

    // Create badge frame
    const badge = figma.createFrame();
    badge.name = `landmark-badge-${role}`;
    badge.resize(badgeWidth, LANDMARKS_CONSTANTS.BADGE_HEIGHT);
    badge.cornerRadius = LANDMARKS_CONSTANTS.BADGE_CORNER_RADIUS;

    // Set background color based on landmark role
    const bgColor = getLandmarkBadgeColor(role);
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
    badge.paddingLeft = LANDMARKS_CONSTANTS.BADGE_PADDING;
    badge.paddingRight = LANDMARKS_CONSTANTS.BADGE_PADDING;

    // Create text
    const text = figma.createText();
    text.fontName = { family: 'Inter', style: 'Bold' };
    text.fontSize = LANDMARKS_CONSTANTS.BADGE_TEXT_SIZE;
    text.characters = badgeText;

    // Set text color
    const textColor = getLandmarkBadgeTextColor(role);
    text.fills = [
      {
        type: 'SOLID',
        color: this.parseColor(textColor),
      },
    ];

    badge.appendChild(text);

    // Position badge at top-left of target node
    const bounds = this.getAbsoluteBounds(targetNode);
    badge.x = bounds.x;
    badge.y = bounds.y - LANDMARKS_CONSTANTS.BADGE_HEIGHT - 8; // 8px gap above

    // Add to container
    container.appendChild(badge);

    // Store metadata
    badge.setPluginData('targetNodeId', targetNode.id);
    badge.setPluginData('annotationType', LANDMARKS_CONSTANTS.ANNOTATION_TYPE);
    badge.setPluginData('landmarkRole', role);

    console.log(`Created ${role} badge for node ${targetNode.id}`);

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
   * Toggle visibility of all landmark annotations
   */
  async toggleAnnotationsVisibility(visible: boolean): Promise<void> {
    const container = this.getAnnotationsContainer();

    // Find all landmark badges
    container.findAll((node) => {
      if (node.getPluginData('annotationType') === LANDMARKS_CONSTANTS.ANNOTATION_TYPE) {
        node.visible = visible;
      }
      return false;
    });
  }

  /**
   * Zoom to a landmark in Figma canvas
   */
  async zoomToLandmark(nodeId: string): Promise<boolean> {
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
   * Validate landmark structure and return issues
   */
  async validateLandmarks(): Promise<LandmarkValidationIssue[]> {
    const landmarks = await this.getLandmarks();
    const issues: LandmarkValidationIssue[] = [];

    if (landmarks.length === 0) {
      return issues;
    }

    // Check for main landmark
    const mainCount = landmarks.filter((l) => l.role === 'main').length;

    if (mainCount === 0 && LANDMARKS_CONSTANTS.VALIDATION.REQUIRE_MAIN) {
      issues.push({
        type: 'no_main',
        severity: 'error',
        message: 'Page should have exactly one <main> landmark.',
      });
    }

    if (mainCount > LANDMARKS_CONSTANTS.VALIDATION.MAX_MAIN_COUNT) {
      issues.push({
        type: 'multiple_main',
        severity: 'error',
        message: `Page has ${mainCount} <main> landmarks. Should have only one.`,
      });
    }

    // Check for multiple nav landmarks without labels
    if (LANDMARKS_CONSTANTS.VALIDATION.REQUIRE_LABELS_FOR_MULTIPLE_NAV) {
      const navLandmarks = landmarks.filter((l) => l.role === 'nav');
      if (navLandmarks.length > 1) {
        const unlabeledNav = navLandmarks.filter((l) => !l.label || l.label.trim().length === 0);
        if (unlabeledNav.length > 0) {
          issues.push({
            type: 'unlabeled_nav',
            severity: 'warning',
            message: `Found ${navLandmarks.length} <nav> landmarks. Each should have a unique aria-label.`,
            role: 'nav',
          });
        }
      }
    }

    // Check for multiple section landmarks without labels
    if (LANDMARKS_CONSTANTS.VALIDATION.REQUIRE_LABELS_FOR_MULTIPLE_SECTION) {
      const sectionLandmarks = landmarks.filter((l) => l.role === 'section');
      if (sectionLandmarks.length > 1) {
        const unlabeledSection = sectionLandmarks.filter(
          (l) => !l.label || l.label.trim().length === 0
        );
        if (unlabeledSection.length > 0) {
          issues.push({
            type: 'unlabeled_section',
            severity: 'warning',
            message: `Found ${sectionLandmarks.length} <section> landmarks. Each should have a unique aria-label.`,
            role: 'section',
          });
        }
      }
    }

    return issues;
  }

  /**
   * Get landmark statistics
   */
  async getStats(): Promise<LandmarkStats> {
    const landmarks = await this.getLandmarks();
    const issues = await this.validateLandmarks();

    // Count by role
    const byRole: Record<LandmarkRole, number> = {
      header: 0,
      nav: 0,
      main: 0,
      aside: 0,
      footer: 0,
      form: 0,
      section: 0,
    };

    for (const landmark of landmarks) {
      byRole[landmark.role]++;
    }

    // Check if valid (no errors, warnings are ok)
    const hasErrors = issues.some((issue) => issue.severity === 'error');

    return {
      total: landmarks.length,
      byRole,
      validationIssues: issues,
      isValid: !hasErrors,
    };
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
    return { r: 0.36, g: 0.13, b: 0.71 }; // Default purple
  }
}

