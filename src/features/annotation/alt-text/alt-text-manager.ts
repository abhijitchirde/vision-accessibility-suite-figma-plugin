/**
 * Alt-Text Manager - Core logic for managing alt text annotations
 */

import { StorageService } from '../../../services/storage.service';
import { AnnotationService } from '../../../services/annotation.service';
import {
  AltTextData,
  AltTextValidationResult,
  ImageNodeInfo,
  AltTextStats,
  AltTextStatus,
} from './alt-text.types';
import {
  ALT_TEXT_STORAGE_KEY,
  ALT_TEXT_GUIDELINES,
  VALIDATION_RULES,
  STATUS_COLORS,
  DECORATIVE_INDICATORS,
} from './alt-text.constants';

export class AltTextManager {
  constructor(
    private storage: StorageService,
    private annotation: AnnotationService
  ) {}

  /**
   * Find all image nodes on the current page
   */
  async findImageNodes(): Promise<ImageNodeInfo[]> {
    const currentPage = figma.currentPage;
    const imageNodes: ImageNodeInfo[] = [];

    // Find all nodes that might contain images
    const nodes = currentPage.findAll((node) => {
      // Check if node has fills property and contains an image fill
      if ('fills' in node && Array.isArray(node.fills)) {
        return node.fills.some(
          (fill) => fill.type === 'IMAGE' && fill.visible !== false
        );
      }
      return false;
    });

    // Process each node to extract image info
    for (const node of nodes) {
      const info = await this.getImageNodeInfo(node as SceneNode);
      if (info) {
        imageNodes.push(info);
      }
    }

    return imageNodes;
  }

  /**
   * Get information about an image node
   */
  private async getImageNodeInfo(node: SceneNode): Promise<ImageNodeInfo | null> {
    try {
      if (!('fills' in node)) return null;

      const fills = node.fills as readonly Paint[];
      const hasImageFill = fills.some(
        (fill) => fill.type === 'IMAGE' && fill.visible !== false
      );

      if (!hasImageFill) return null;

      // Generate thumbnail
      let thumbnail: Uint8Array | undefined;
      try {
        const exportSettings: ExportSettings = {
          format: 'PNG',
          constraint: { type: 'SCALE', value: 0.25 }, // 25% scale for thumbnail
        };
        thumbnail = await node.exportAsync(exportSettings);
      } catch (error) {
        console.warn('Failed to export thumbnail:', error);
      }

      return {
        nodeId: node.id,
        nodeName: node.name,
        type: node.type,
        hasImageFill,
        thumbnail,
        width: node.width,
        height: node.height,
      };
    } catch (error) {
      console.error('Error getting image node info:', error);
      return null;
    }
  }

  /**
   * Get alt text data for a specific node
   */
  async getAltTextForNode(nodeId: string): Promise<AltTextData | null> {
    const node = await figma.getNodeByIdAsync(nodeId) as SceneNode;
    if (!node) return null;

    return this.storage.getNodeData<AltTextData>(node, ALT_TEXT_STORAGE_KEY);
  }

  /**
   * Set alt text for a node
   */
  async setAltText(
    nodeId: string,
    altText: string,
    isDecorative: boolean = false
  ): Promise<AltTextData | null> {
    const node = await figma.getNodeByIdAsync(nodeId) as SceneNode;
    if (!node) return null;

    // Get existing data to preserve annotation ID
    const existingData = this.storage.getNodeData<AltTextData>(node, ALT_TEXT_STORAGE_KEY);

    // Validate alt text
    const validation = this.validateAltText(altText, isDecorative);

    // Determine status
    const status = this.determineStatus(altText, isDecorative, validation);

    // Create alt text data, preserving annotation ID if it exists
    const altTextData: AltTextData = {
      nodeId,
      nodeName: node.name,
      altText,
      isDecorative,
      status,
      validationErrors: validation.errors,
      validationWarnings: validation.warnings,
      lastModified: new Date().toISOString(),
      annotationId: existingData?.annotationId, // Preserve existing annotation ID
    };

    // Store data
    this.storage.setNodeData(node, ALT_TEXT_STORAGE_KEY, altTextData);

    // Create or update canvas annotation
    await this.updateAnnotation(nodeId, altTextData);

    return altTextData;
  }

  /**
   * Remove alt text from a node
   */
  async removeAltText(nodeId: string): Promise<boolean> {
    const node = await figma.getNodeByIdAsync(nodeId) as SceneNode;
    if (!node) return false;

    // Get existing data to find annotation
    const existingData = this.storage.getNodeData<AltTextData>(node, ALT_TEXT_STORAGE_KEY);
    if (existingData?.annotationId) {
      await this.annotation.deleteAnnotation(existingData.annotationId);
    }

    // Remove stored data
    this.storage.deleteNodeData(node, ALT_TEXT_STORAGE_KEY);

    return true;
  }

  /**
   * Validate alt text
   */
  validateAltText(altText: string, isDecorative: boolean): AltTextValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // If decorative, alt text should be empty
    if (isDecorative) {
      if (altText.trim() !== '') {
        warnings.push('Decorative images should have empty alt text');
      }
      return { isValid: true, errors, warnings, suggestions };
    }

    // Check if alt text is empty
    if (altText.trim() === '') {
      errors.push('Alt text is required for non-decorative images');
      return { isValid: false, errors, warnings, suggestions };
    }

    // Check minimum length
    if (altText.length < ALT_TEXT_GUIDELINES.MIN_LENGTH) {
      warnings.push(
        `Alt text is too short. Consider adding more description (minimum ${ALT_TEXT_GUIDELINES.MIN_LENGTH} characters recommended)`
      );
    }

    // Check maximum length
    if (altText.length > ALT_TEXT_GUIDELINES.MAX_LENGTH) {
      errors.push(
        `Alt text is too long (${altText.length} characters). Keep it under ${ALT_TEXT_GUIDELINES.MAX_LENGTH} characters`
      );
    }

    // Check for bad patterns (filename-like, generic)
    for (const pattern of VALIDATION_RULES.BAD_PATTERNS) {
      if (pattern.test(altText)) {
        warnings.push(
          'Alt text appears to be a filename or generic placeholder. Provide a descriptive alternative'
        );
        break;
      }
    }

    // Check for redundant phrases
    const redundantPhrases = [
      'image of',
      'picture of',
      'photo of',
      'graphic of',
      'screenshot of',
    ];
    for (const phrase of redundantPhrases) {
      if (altText.toLowerCase().includes(phrase)) {
        suggestions.push(`Avoid redundant phrase "${phrase}". Screen readers already announce it's an image`);
        break;
      }
    }

    const isValid = errors.length === 0;
    return { isValid, errors, warnings, suggestions };
  }

  /**
   * Determine alt text status
   */
  private determineStatus(
    altText: string,
    isDecorative: boolean,
    validation: AltTextValidationResult
  ): AltTextStatus {
    if (isDecorative) {
      return 'decorative';
    }

    if (!validation.isValid || altText.trim() === '') {
      return 'incomplete';
    }

    if (validation.warnings.length > 0) {
      return 'needs-review';
    }

    return 'complete';
  }

  /**
   * Create or update canvas annotation for a node
   */
  private async updateAnnotation(nodeId: string, data: AltTextData): Promise<void> {
    // Delete existing annotation if it exists
    if (data.annotationId) {
      await this.annotation.deleteAnnotation(data.annotationId);
    }

    // Create new annotation
    const color = STATUS_COLORS[data.status];
    const label = data.isDecorative
      ? 'DECORATIVE'
      : 'ALT';

    const annotationData = await this.annotation.createAnnotation({
      targetNodeId: nodeId,
      label,
      color,
      altText: data.isDecorative ? undefined : data.altText,
    });

    if (annotationData) {
      // Update stored data with annotation ID
      data.annotationId = annotationData.groupId;
      const node = await figma.getNodeByIdAsync(nodeId) as SceneNode;
      if (node) {
        this.storage.setNodeData(node, ALT_TEXT_STORAGE_KEY, data);
      }
    }
  }

  /**
   * Get statistics for all alt text on the page
   */
  async getStats(): Promise<AltTextStats> {
    const imageNodes = await this.findImageNodes();
    const total = imageNodes.length;

    let complete = 0;
    let incomplete = 0;
    let decorative = 0;
    let needsReview = 0;

    for (const imageNode of imageNodes) {
      const altTextData = await this.getAltTextForNode(imageNode.nodeId);
      if (!altTextData) {
        incomplete++;
      } else {
        switch (altTextData.status) {
          case 'complete':
            complete++;
            break;
          case 'incomplete':
            incomplete++;
            break;
          case 'decorative':
            decorative++;
            break;
          case 'needs-review':
            needsReview++;
            break;
        }
      }
    }

    const percentageComplete =
      total > 0 ? Math.round(((complete + decorative) / total) * 100) : 0;

    return {
      total,
      complete,
      incomplete,
      decorative,
      needsReview,
      percentageComplete,
    };
  }

  /**
   * Auto-suggest if image should be decorative based on node name
   */
  suggestDecorative(nodeName: string): boolean {
    const lowerName = nodeName.toLowerCase();
    return DECORATIVE_INDICATORS.some((indicator) => lowerName.includes(indicator));
  }

  /**
   * Check if annotation exists on canvas for a given annotation ID
   */
  private async checkAnnotationExists(annotationId: string): Promise<boolean> {
    try {
      const annotation = await figma.getNodeByIdAsync(annotationId);
      return annotation !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all image nodes with their alt text data
   */
  async getAllImageNodesWithAltText(): Promise<Array<ImageNodeInfo & { altTextData: AltTextData | null }>> {
    const imageNodes = await this.findImageNodes();
    return Promise.all(
      imageNodes.map(async (node) => {
        const altTextData = await this.getAltTextForNode(node.nodeId);

        // Check if annotation is missing from canvas
        if (altTextData && altTextData.annotationId) {
          const annotationExists = await this.checkAnnotationExists(altTextData.annotationId);
          altTextData.annotationMissing = !annotationExists;
        }

        return {
          ...node,
          altTextData,
        };
      })
    );
  }

  /**
   * Show/hide all alt text annotations
   */
  setAnnotationsVisible(visible: boolean): void {
    this.annotation.setAnnotationsVisible(visible);
  }

  /**
   * Scroll and zoom to a specific element on the canvas
   */
  async scrollAndZoomToNode(nodeId: string): Promise<boolean> {
    try {
      const node = await figma.getNodeByIdAsync(nodeId) as SceneNode;
      if (!node) {
        console.error('Node not found:', nodeId);
        return false;
      }

      // Scroll to the node and zoom in
      figma.viewport.scrollAndZoomIntoView([node]);

      // Also select the node to make it more visible
      figma.currentPage.selection = [node];

      return true;
    } catch (error) {
      console.error('Failed to scroll and zoom to node:', error);
      return false;
    }
  }

  /**
   * Restore a deleted annotation for a node (recreate it on canvas)
   */
  async restoreAnnotation(nodeId: string): Promise<boolean> {
    try {
      const node = await figma.getNodeByIdAsync(nodeId) as SceneNode;
      if (!node) {
        console.error('Node not found:', nodeId);
        return false;
      }

      // Get existing alt text data
      const altTextData = this.storage.getNodeData<AltTextData>(node, ALT_TEXT_STORAGE_KEY);
      if (!altTextData) {
        console.error('No alt text data found for node:', nodeId);
        return false;
      }

      // Recreate the annotation on canvas
      await this.updateAnnotation(nodeId, altTextData);

      // Clear the annotationMissing flag
      altTextData.annotationMissing = false;
      this.storage.setNodeData(node, ALT_TEXT_STORAGE_KEY, altTextData);

      return true;
    } catch (error) {
      console.error('Failed to restore annotation:', error);
      return false;
    }
  }
}
