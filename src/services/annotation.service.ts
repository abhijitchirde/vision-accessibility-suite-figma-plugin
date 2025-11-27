/**
 * AnnotationService - Handles creation and management of canvas annotations
 *
 * Features:
 * - Create annotation badges with text labels
 * - Create arrow connectors between badges and target elements
 * - Support movable annotations with auto-updating arrows
 * - Manage annotation lifecycle (create, update, delete)
 * - Group annotations in a dedicated layer for easy management
 */

export interface AnnotationConfig {
  targetNodeId: string;
  label: string;
  text?: string;
  altText?: string;
  color?: string;
  icon?: string;
  badgePosition?: { x: number; y: number };
}

export interface AnnotationData {
  badgeId: string;
  lineId: string;
  targetNodeId: string;
  groupId: string;
}

export class AnnotationService {
  private static ANNOTATION_LAYER_NAME = '__A11y Annotations__';
  private static ANNOTATION_PREFIX = 'a11y-annotation';

  /**
   * Get or create the annotations container frame
   */
  private getAnnotationsContainer(): FrameNode {
    const currentPage = figma.currentPage;

    // Try to find existing annotations layer
    const existing = currentPage.findOne(
      (node) =>
        node.type === 'FRAME' &&
        node.name === AnnotationService.ANNOTATION_LAYER_NAME
    ) as FrameNode | null;

    if (existing) {
      return existing;
    }

    // Create new annotations layer
    const container = figma.createFrame();
    container.name = AnnotationService.ANNOTATION_LAYER_NAME;
    container.x = 0;
    container.y = 0;
    container.resize(100, 100); // Minimal size, will auto-expand
    container.clipsContent = false;
    container.fills = []; // Transparent
    container.locked = false;

    // Move to top of layer stack for visibility
    currentPage.appendChild(container);

    return container;
  }

  /**
   * Create a complete annotation (badge + line) for a target node
   */
  async createAnnotation(config: AnnotationConfig): Promise<AnnotationData | null> {
    try {
      const targetNode = await figma.getNodeByIdAsync(config.targetNodeId) as SceneNode;
      if (!targetNode) {
        console.error('Target node not found:', config.targetNodeId);
        return null;
      }

      const container = this.getAnnotationsContainer();

      // Create badge first (with absolute positioning)
      const badge = await this.createBadge(config, targetNode);

      // Create line connecting badge to target
      const line = this.createLine(targetNode, badge);

      // Group them together - this preserves absolute positions
      const annotationGroup = figma.group([badge, line], container);
      annotationGroup.name = `${AnnotationService.ANNOTATION_PREFIX}-${config.label}`;

      // Store metadata linking annotation to target
      annotationGroup.setPluginData('targetNodeId', config.targetNodeId);
      annotationGroup.setPluginData('annotationType', 'alt-text');

      console.log('Created annotation:', {
        badge: { id: badge.id, x: badge.x, y: badge.y, width: badge.width, height: badge.height },
        line: { id: line.id },
        group: { id: annotationGroup.id, x: annotationGroup.x, y: annotationGroup.y }
      });

      return {
        badgeId: badge.id,
        lineId: line.id,
        targetNodeId: config.targetNodeId,
        groupId: annotationGroup.id,
      };
    } catch (error) {
      console.error('Failed to create annotation:', error);
      return null;
    }
  }

  /**
   * Create a badge (rectangle with text)
   */
  private async createBadge(config: AnnotationConfig, targetNode: SceneNode): Promise<FrameNode> {
    try {
      const badge = figma.createFrame();
      badge.name = `${config.label}-badge`;

      // Badge styling
      const bgColor = this.parseColor(config.color || '#4F46E5'); // Indigo by default
      badge.fills = [
        {
          type: 'SOLID',
          color: bgColor,
        },
      ];
      badge.cornerRadius = 4;
      badge.paddingLeft = 8;
      badge.paddingRight = 8;
      badge.paddingTop = 6;
      badge.paddingBottom = 6;
      badge.layoutMode = 'VERTICAL'; // Changed to vertical for column layout
      badge.itemSpacing = 2;
      badge.counterAxisSizingMode = 'AUTO';
      badge.primaryAxisSizingMode = 'AUTO';
      badge.primaryAxisAlignItems = 'MIN'; // Left align

      console.log('Badge created, loading fonts...');

      // Load fonts (use Bold instead of SemiBold for better availability)
      try {
        await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
      } catch (e) {
        // Fallback to Medium if Bold not available
        await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
      }

      // Create label text (smaller, bold/medium)
      const labelText = figma.createText();
      try {
        labelText.fontName = { family: 'Inter', style: 'Bold' };
      } catch (e) {
        labelText.fontName = { family: 'Inter', style: 'Medium' };
      }
      labelText.fontSize = 10;
      labelText.characters = config.label;
      labelText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }]; // White text
      labelText.textAlignHorizontal = 'LEFT';
      labelText.letterSpacing = { value: 0.5, unit: 'PIXELS' };
      badge.appendChild(labelText);

      console.log('Label text added:', config.label);

      // If alt text is provided, add it as a second line
      if (config.altText) {
        await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
        const altTextNode = figma.createText();
        altTextNode.fontName = { family: 'Inter', style: 'Regular' };
        altTextNode.fontSize = 9;
        // Truncate alt text if too long
        const truncatedAltText = config.altText.length > 40
          ? config.altText.substring(0, 37) + '...'
          : config.altText;
        altTextNode.characters = truncatedAltText;
        altTextNode.fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95 } }];
        altTextNode.textAlignHorizontal = 'LEFT';
        badge.appendChild(altTextNode);
        console.log('Alt text added:', truncatedAltText);
      }

      // Position badge (absolute coordinates)
      if (config.badgePosition) {
        badge.x = config.badgePosition.x;
        badge.y = config.badgePosition.y;
      } else {
        // Default position: top-right of target node with offset (doubled for longer line)
        const targetBounds = this.getAbsoluteBounds(targetNode);
        console.log('Target bounds:', targetBounds);
        badge.x = targetBounds.x + targetBounds.width + 40; // Doubled from 20 to 40
        badge.y = targetBounds.y - 10;
        console.log('Badge positioned at:', badge.x, badge.y);
      }

      return badge;
    } catch (error) {
      console.error('Error creating badge:', error);
      throw error;
    }
  }

  /**
   * Create a line connecting badge to target element
   */
  private createLine(targetNode: SceneNode, badge: FrameNode): LineNode {
    const targetBounds = this.getAbsoluteBounds(targetNode);
    const badgeBounds = {
      x: badge.x,
      y: badge.y,
      width: badge.width,
      height: badge.height,
    };

    // Calculate connection points for horizontal line
    // Connect from left edge of badge to right edge of target at same Y
    const lineY = badgeBounds.y + badgeBounds.height / 2;
    const targetRightX = targetBounds.x + targetBounds.width;
    const badgeLeftX = badgeBounds.x;

    // Create horizontal line
    const line = figma.createLine();
    line.name = 'annotation-line';

    // Set line position and length
    line.x = targetRightX;
    line.y = lineY;
    line.resize(badgeLeftX - targetRightX, 0);

    // Line styling - dashed
    line.strokes = [
      {
        type: 'SOLID',
        color: { r: 0.31, g: 0.27, b: 0.9 }, // Indigo
      },
    ];
    line.strokeWeight = 1.5;
    line.strokeCap = 'ROUND';
    line.dashPattern = [4, 4]; // Dashed pattern
    line.opacity = 0.7;

    console.log('Line created connecting target and badge');

    return line;
  }

  /**
   * Update line position when badge or target moves
   * Note: Lines don't auto-update, so this would need to be called manually
   * Currently not implemented as annotations are considered static
   */
  async updateLine(annotationGroupId: string): Promise<boolean> {
    // Not implemented - annotations are static
    console.log('Line update not implemented - annotations are static');
    return true;
  }

  /**
   * Delete an annotation by group ID
   */
  async deleteAnnotation(annotationGroupId: string): Promise<boolean> {
    try {
      const group = await figma.getNodeByIdAsync(annotationGroupId);
      if (!group) return false;

      group.remove();
      return true;
    } catch (error) {
      console.error('Failed to delete annotation:', error);
      return false;
    }
  }

  /**
   * Delete all annotations for a specific target node
   */
  deleteAnnotationsForTarget(targetNodeId: string): number {
    const container = this.getAnnotationsContainer();
    let deletedCount = 0;

    container.findAll((node) => {
      if (node.type === 'GROUP' && node.getPluginData('targetNodeId') === targetNodeId) {
        node.remove();
        deletedCount++;
      }
      return false; // Continue searching
    });

    return deletedCount;
  }

  /**
   * Get all annotations on the current page
   */
  getAllAnnotations(): AnnotationData[] {
    const container = this.getAnnotationsContainer();
    const annotations: AnnotationData[] = [];

    container.findAll((node) => {
      if (node.type === 'GROUP' && node.name.startsWith(AnnotationService.ANNOTATION_PREFIX)) {
        const badge = node.findOne((n) => n.name.includes('badge'));
        const line = node.findOne((n) => n.name === 'annotation-line');
        const targetNodeId = node.getPluginData('targetNodeId');

        if (badge && line && targetNodeId) {
          annotations.push({
            badgeId: badge.id,
            lineId: line.id,
            targetNodeId,
            groupId: node.id,
          });
        }
      }
      return false; // Continue searching
    });

    return annotations;
  }

  /**
   * Show/hide all annotations
   */
  setAnnotationsVisible(visible: boolean): void {
    const container = this.getAnnotationsContainer();
    container.visible = visible;
  }

  /**
   * Get absolute bounds of a node (handles nested nodes)
   */
  private getAbsoluteBounds(node: SceneNode): { x: number; y: number; width: number; height: number } {
    return {
      x: node.absoluteBoundingBox?.x || 0,
      y: node.absoluteBoundingBox?.y || 0,
      width: node.absoluteBoundingBox?.width || 0,
      height: node.absoluteBoundingBox?.height || 0,
    };
  }

  /**
   * Parse color string to Figma RGB
   */
  private parseColor(color: string): RGB {
    // Simple hex color parser (#RRGGBB)
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      return { r, g, b };
    }

    // Default to indigo
    return { r: 0.31, g: 0.27, b: 0.9 };
  }
}
