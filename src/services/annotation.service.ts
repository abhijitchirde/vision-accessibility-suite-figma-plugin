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
  color?: string;
  icon?: string;
  badgePosition?: { x: number; y: number };
}

export interface AnnotationData {
  badgeId: string;
  arrowId: string;
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
   * Create a complete annotation (badge + arrow) for a target node
   */
  async createAnnotation(config: AnnotationConfig): Promise<AnnotationData | null> {
    try {
      const targetNode = await figma.getNodeByIdAsync(config.targetNodeId) as SceneNode;
      if (!targetNode) {
        console.error('Target node not found:', config.targetNodeId);
        return null;
      }

      const container = this.getAnnotationsContainer();

      // Create group for this annotation (badge + arrow)
      const annotationGroup = figma.group([], container);
      annotationGroup.name = `${AnnotationService.ANNOTATION_PREFIX}-${config.label}`;

      // Create badge
      const badge = this.createBadge(config, targetNode);
      annotationGroup.appendChild(badge);

      // Create arrow
      const arrow = this.createArrow(targetNode, badge);
      annotationGroup.appendChild(arrow);

      // Store metadata linking annotation to target
      annotationGroup.setPluginData('targetNodeId', config.targetNodeId);
      annotationGroup.setPluginData('annotationType', 'alt-text');

      return {
        badgeId: badge.id,
        arrowId: arrow.id,
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
  private createBadge(config: AnnotationConfig, targetNode: SceneNode): FrameNode {
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
    badge.cornerRadius = 6;
    badge.paddingLeft = 8;
    badge.paddingRight = 8;
    badge.paddingTop = 6;
    badge.paddingBottom = 6;
    badge.layoutMode = 'HORIZONTAL';
    badge.itemSpacing = 6;
    badge.counterAxisSizingMode = 'AUTO';
    badge.primaryAxisSizingMode = 'AUTO';

    // Create label text
    const labelText = figma.createText();
    labelText.fontName = { family: 'Inter', style: 'Medium' };
    labelText.fontSize = 12;
    labelText.characters = config.label;
    labelText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }]; // White text
    badge.appendChild(labelText);

    // If additional text is provided, add it
    if (config.text) {
      const detailText = figma.createText();
      detailText.fontName = { family: 'Inter', style: 'Regular' };
      detailText.fontSize = 11;
      detailText.characters = config.text;
      detailText.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
      badge.appendChild(detailText);
    }

    // Position badge
    if (config.badgePosition) {
      badge.x = config.badgePosition.x;
      badge.y = config.badgePosition.y;
    } else {
      // Default position: top-right of target node with offset
      const targetBounds = this.getAbsoluteBounds(targetNode);
      badge.x = targetBounds.x + targetBounds.width + 20;
      badge.y = targetBounds.y - 10;
    }

    return badge;
  }

  /**
   * Create an arrow connecting badge to target element
   */
  private createArrow(targetNode: SceneNode, badge: FrameNode): VectorNode {
    const targetBounds = this.getAbsoluteBounds(targetNode);
    const badgeBounds = this.getAbsoluteBounds(badge);

    // Calculate connection points
    const targetPoint = {
      x: targetBounds.x + targetBounds.width / 2,
      y: targetBounds.y + targetBounds.height / 2,
    };

    const badgePoint = {
      x: badgeBounds.x,
      y: badgeBounds.y + badgeBounds.height / 2,
    };

    // Create line vector
    const arrow = figma.createVector();
    arrow.name = 'annotation-arrow';

    // Create vector network for arrow line
    const vectorPaths: VectorPaths = [
      {
        windingRule: 'NONZERO',
        data: `M ${badgePoint.x} ${badgePoint.y} L ${targetPoint.x} ${targetPoint.y}`,
      },
    ];
    arrow.vectorPaths = vectorPaths;

    // Arrow styling
    arrow.strokes = [
      {
        type: 'SOLID',
        color: { r: 0.31, g: 0.27, b: 0.9 }, // Indigo
      },
    ];
    arrow.strokeWeight = 2;
    arrow.strokeCap = 'ROUND';
    arrow.opacity = 0.6;

    // Add arrowhead (simple triangle at target end)
    // Note: For simplicity, we're using a line. A proper arrowhead would require a more complex vector path.

    return arrow;
  }

  /**
   * Update arrow position when badge or target moves
   */
  async updateArrow(annotationGroupId: string): Promise<boolean> {
    try {
      const group = await figma.getNodeByIdAsync(annotationGroupId) as GroupNode;
      if (!group || group.type !== 'GROUP') return false;

      const targetNodeId = group.getPluginData('targetNodeId');
      const targetNode = await figma.getNodeByIdAsync(targetNodeId) as SceneNode;
      if (!targetNode) return false;

      // Find badge and arrow in group
      const badge = group.findOne((n) => n.name.includes('badge')) as FrameNode;
      const arrow = group.findOne((n) => n.name === 'annotation-arrow') as VectorNode;

      if (!badge || !arrow) return false;

      // Recalculate arrow path
      const targetBounds = this.getAbsoluteBounds(targetNode);
      const badgeBounds = this.getAbsoluteBounds(badge);

      const targetPoint = {
        x: targetBounds.x + targetBounds.width / 2,
        y: targetBounds.y + targetBounds.height / 2,
      };

      const badgePoint = {
        x: badgeBounds.x,
        y: badgeBounds.y + badgeBounds.height / 2,
      };

      // Update arrow vector path
      const vectorPaths: VectorPaths = [
        {
          windingRule: 'NONZERO',
          data: `M ${badgePoint.x} ${badgePoint.y} L ${targetPoint.x} ${targetPoint.y}`,
        },
      ];
      arrow.vectorPaths = vectorPaths;

      return true;
    } catch (error) {
      console.error('Failed to update arrow:', error);
      return false;
    }
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
        const arrow = node.findOne((n) => n.name === 'annotation-arrow');
        const targetNodeId = node.getPluginData('targetNodeId');

        if (badge && arrow && targetNodeId) {
          annotations.push({
            badgeId: badge.id,
            arrowId: arrow.id,
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
