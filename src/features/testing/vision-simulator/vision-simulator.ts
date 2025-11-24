/**
 * Vision Simulator - Core Plugin Logic
 *
 * Handles:
 * - Exporting nodes as images
 * - Generating canvas copies with simulated filters
 * - Managing plugin data for generated nodes
 *
 * Note: Actual filter application happens in UI thread (Canvas API required)
 */

import {
  SimulationType,
  GenerateOptions,
  GeneratedNodeData,
  SimulationResult,
} from './vision-simulator.types';
import {
  PLUGIN_DATA_KEYS,
  IMAGE_EXPORT_SETTINGS,
  DEFAULT_COPY_SPACING,
  LABEL_SETTINGS,
  FILTER_METADATA,
} from './vision-simulator.constants';

export class VisionSimulator {
  /**
   * Export a node as an image for simulation
   *
   * @param node - Node to export
   * @returns Image data (PNG format)
   */
  async exportNodeAsImage(node: SceneNode): Promise<Uint8Array | null> {
    // Only export nodes that can be exported as images
    if (
      !('exportAsync' in node) ||
      typeof node.exportAsync !== 'function'
    ) {
      console.warn(`Node ${node.name} cannot be exported as image`);
      return null;
    }

    try {
      const imageData = await node.exportAsync(IMAGE_EXPORT_SETTINGS);
      return imageData;
    } catch (error) {
      console.error(`Failed to export node ${node.name}:`, error);
      return null;
    }
  }

  /**
   * Get currently selected exportable node(s)
   *
   * @returns Array of selected nodes that can be exported
   */
  getSelectedNodes(): SceneNode[] {
    const selection = figma.currentPage.selection;

    return selection.filter(
      (node) => 'exportAsync' in node && typeof node.exportAsync === 'function'
    );
  }

  /**
   * Generate canvas copies with simulated filters
   *
   * Creates physical copies of the selected node on the canvas,
   * each with a different visual impairment filter applied.
   *
   * @param node - Node to duplicate
   * @param filters - Filters to apply (one copy per filter)
   * @param options - Generation options
   * @returns Array of generated node IDs
   */
  async generateSimulations(
    node: SceneNode,
    filters: SimulationType[],
    options: Partial<GenerateOptions> = {}
  ): Promise<string[]> {
    const {
      position = 'right',
      spacing = DEFAULT_COPY_SPACING,
      includeLabel = true,
    } = options;

    const generatedIds: string[] = [];

    // Export original node
    const originalImage = await this.exportNodeAsImage(node);
    if (!originalImage) {
      throw new Error(`Failed to export node: ${node.name}`);
    }

    // Calculate positions for generated copies
    const nodeWidth = 'width' in node ? node.width : 0;
    const nodeHeight = 'height' in node ? node.height : 0;
    const nodeX = 'x' in node ? node.x : 0;
    const nodeY = 'y' in node ? node.y : 0;

    // Generate a copy for each filter
    for (let i = 0; i < filters.length; i++) {
      const filter = filters[i];

      if (filter === 'original') {
        continue; // Skip original
      }

      try {
        // Create frame to hold the simulated image
        const frame = figma.createFrame();
        frame.name = `${node.name} - ${FILTER_METADATA[filter].name}`;
        frame.resize(nodeWidth, nodeHeight);

        // Position the frame
        if (position === 'right') {
          frame.x = nodeX + (nodeWidth + spacing) * (i + 1);
          frame.y = nodeY;
        } else {
          // below
          frame.x = nodeX;
          frame.y = nodeY + (nodeHeight + spacing) * (i + 1);
        }

        // Store metadata in plugin data
        const metadata: GeneratedNodeData = {
          isSimulation: true,
          originalNodeId: node.id,
          filter,
          generatedAt: Date.now(),
        };

        frame.setPluginData(PLUGIN_DATA_KEYS.GENERATED_NODE, JSON.stringify(metadata));

        // Add label if requested
        if (includeLabel) {
          this.addLabel(frame, FILTER_METADATA[filter].name);
        }

        // Add to current page
        figma.currentPage.appendChild(frame);
        generatedIds.push(frame.id);

        console.log(`Generated simulation: ${filter} for ${node.name}`);
      } catch (error) {
        console.error(`Failed to generate ${filter} simulation:`, error);
      }
    }

    return generatedIds;
  }

  /**
   * Add a text label to a generated frame
   *
   * @param frame - Frame to add label to
   * @param labelText - Label text
   */
  private addLabel(frame: FrameNode, labelText: string): void {
    const label = figma.createText();

    // Load default font
    figma.loadFontAsync({ family: 'Inter', style: 'Regular' }).then(() => {
      label.fontName = { family: 'Inter', style: 'Regular' };
      label.fontSize = LABEL_SETTINGS.fontSize;
      label.characters = labelText;

      // Position label at top-left with padding
      label.x = LABEL_SETTINGS.padding;
      label.y = LABEL_SETTINGS.padding;

      // Create background for label
      const bg = figma.createRectangle();
      bg.resize(label.width + LABEL_SETTINGS.padding * 2, label.height + LABEL_SETTINGS.padding * 2);
      bg.fills = [
        {
          type: 'SOLID',
          color: {
            r: LABEL_SETTINGS.backgroundColor.r / 255,
            g: LABEL_SETTINGS.backgroundColor.g / 255,
            b: LABEL_SETTINGS.backgroundColor.b / 255,
          },
          opacity: LABEL_SETTINGS.backgroundColor.a,
        },
      ];
      bg.name = 'Label Background';

      // Set text color
      label.fills = [
        {
          type: 'SOLID',
          color: {
            r: LABEL_SETTINGS.textColor.r / 255,
            g: LABEL_SETTINGS.textColor.g / 255,
            b: LABEL_SETTINGS.textColor.b / 255,
          },
        },
      ];

      // Add to frame
      frame.appendChild(bg);
      frame.appendChild(label);
    });
  }

  /**
   * Check if a node is a generated simulation
   *
   * @param node - Node to check
   * @returns True if node is a generated simulation
   */
  isGeneratedSimulation(node: SceneNode): boolean {
    try {
      const data = node.getPluginData(PLUGIN_DATA_KEYS.GENERATED_NODE);
      if (!data) return false;

      const metadata: GeneratedNodeData = JSON.parse(data);
      return metadata.isSimulation === true;
    } catch {
      return false;
    }
  }

  /**
   * Get metadata for a generated simulation node
   *
   * @param node - Generated node
   * @returns Metadata or null
   */
  getGeneratedMetadata(node: SceneNode): GeneratedNodeData | null {
    try {
      const data = node.getPluginData(PLUGIN_DATA_KEYS.GENERATED_NODE);
      if (!data) return null;

      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * Delete all generated simulations for a given original node
   *
   * @param originalNodeId - Original node ID
   */
  deleteGeneratedSimulations(originalNodeId: string): void {
    const allNodes = figma.currentPage.findAll();

    for (const node of allNodes) {
      const metadata = this.getGeneratedMetadata(node);
      if (metadata && metadata.originalNodeId === originalNodeId) {
        node.remove();
      }
    }
  }

  /**
   * Prepare image data for UI processing
   *
   * Exports node and returns data that UI can use with Canvas API
   *
   * @param nodeId - Node ID
   * @returns Image data and dimensions
   */
  async prepareImageForPreview(
    nodeId: string
  ): Promise<{
    imageData: Uint8Array;
    width: number;
    height: number;
    nodeName: string;
  } | null> {
    const node = figma.getNodeById(nodeId);
    if (!node || node.type === 'PAGE' || node.type === 'DOCUMENT') {
      console.error(`Node not found or not exportable: ${nodeId}`);
      return null;
    }

    const imageData = await this.exportNodeAsImage(node as SceneNode);
    if (!imageData) {
      return null;
    }

    const width = 'width' in node ? node.width : 0;
    const height = 'height' in node ? node.height : 0;

    return {
      imageData,
      width,
      height,
      nodeName: node.name,
    };
  }

  /**
   * Apply filtered image back to canvas
   *
   * Creates a new image fill from processed image data
   *
   * @param frameId - Frame ID to apply image to
   * @param imageData - Processed image data (PNG)
   */
  async applyFilteredImage(frameId: string, imageData: Uint8Array): Promise<void> {
    const frame = figma.getNodeById(frameId) as FrameNode;
    if (!frame) {
      throw new Error(`Frame not found: ${frameId}`);
    }

    try {
      // Create image from processed data
      const image = figma.createImage(imageData);

      // Apply as fill
      frame.fills = [
        {
          type: 'IMAGE',
          imageHash: image.hash,
          scaleMode: 'FILL',
        },
      ];

      console.log(`Applied filtered image to frame: ${frame.name}`);
    } catch (error) {
      console.error('Failed to apply filtered image:', error);
      throw error;
    }
  }

  /**
   * Get all nodes on current page (for selection)
   *
   * @returns List of exportable nodes
   */
  getAllExportableNodes(): Array<{ id: string; name: string; type: string }> {
    const allNodes = figma.currentPage.findAll((node) => {
      return 'exportAsync' in node && typeof node.exportAsync === 'function';
    });

    return allNodes.map((node) => ({
      id: node.id,
      name: node.name,
      type: node.type,
    }));
  }
}
