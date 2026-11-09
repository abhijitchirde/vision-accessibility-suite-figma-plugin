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

import { SimulationType, GeneratedNodeData } from './vision-simulator.types';
import {
  PLUGIN_DATA_KEYS,
  IMAGE_EXPORT_SETTINGS,
  DEFAULT_COPY_SPACING,
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
   * Where simulations of a source node are added.
   *
   * Never inside the user's frames (that would break auto layout, get
   * clipped, or change components). If the source is inside a Section,
   * use the nearest Section so simulations move with it; otherwise the page.
   */
  getSimulationContainer(source: SceneNode): PageNode | SectionNode {
    let node = source.parent;
    while (node && node.type !== 'PAGE' && node.type !== 'DOCUMENT') {
      if (node.type === 'SECTION') return node;
      node = node.parent;
    }
    return figma.currentPage;
  }

  /**
   * Work out where the next simulation of a source node should go, in page
   * (absolute) coordinates.
   *
   * The new frame goes to the right of the source, or to the right of the
   * right-most simulation already made from the same source, so repeated
   * simulations form a row instead of stacking on top of each other.
   * Simulations directly on the page are counted too, so a row started
   * before 0.13 (when everything went on the page) continues seamlessly.
   */
  getNextSimulationPosition(
    source: SceneNode,
    container: PageNode | SectionNode,
    spacing: number = DEFAULT_COPY_SPACING
  ): { x: number; y: number } {
    const box = this.getAbsoluteBox(source);
    let rightEdge = box.x + box.width;

    const candidates =
      container.type === 'PAGE'
        ? container.children
        : [...container.children, ...figma.currentPage.children];

    for (const child of candidates) {
      const metadata = this.getGeneratedMetadata(child);
      if (metadata && metadata.originalNodeId === source.id) {
        const childBox = this.getAbsoluteBox(child);
        rightEdge = Math.max(rightEdge, childBox.x + childBox.width);
      }
    }

    return { x: rightEdge + spacing, y: box.y };
  }

  /** A node's bounds in page coordinates */
  private getAbsoluteBox(node: SceneNode): Rect {
    if ('absoluteBoundingBox' in node && node.absoluteBoundingBox) {
      return node.absoluteBoundingBox;
    }
    return { x: node.x, y: node.y, width: node.width, height: node.height };
  }

  /**
   * Grow a Section so a frame inside it isn't left hanging over its edge.
   * Frame coordinates are relative to the Section.
   */
  private growSectionToFit(section: SectionNode, frame: FrameNode): void {
    const neededWidth = frame.x + frame.width + DEFAULT_COPY_SPACING;
    const neededHeight = frame.y + frame.height + DEFAULT_COPY_SPACING;
    if (neededWidth > section.width || neededHeight > section.height) {
      section.resizeWithoutConstraints(
        Math.max(section.width, neededWidth),
        Math.max(section.height, neededHeight)
      );
    }
  }

  /**
   * Create a frame showing a filtered image of a source node, on the page
   * or in the source's nearest Section (see getSimulationContainer).
   *
   * Called once the UI has finished filtering, so a failed filter never
   * leaves an empty frame behind.
   *
   * @param sourceNodeId - Node the simulation was made from
   * @param filter - Simulation applied ("original" when a preset was applied)
   * @param imageData - Filtered PNG, at the export scale
   * @param label - Name for the frame (filter or preset name)
   * @returns The new frame
   */
  async createSimulationFrame(
    sourceNodeId: string,
    filter: SimulationType,
    imageData: Uint8Array,
    label: string
  ): Promise<FrameNode> {
    const source = await figma.getNodeByIdAsync(sourceNodeId);
    if (!source || source.type === 'PAGE' || source.type === 'DOCUMENT') {
      throw new Error('The original layer no longer exists');
    }
    const sourceNode = source as SceneNode;

    const image = figma.createImage(imageData);
    const size = await image.getSizeAsync();
    const scale = IMAGE_EXPORT_SETTINGS.constraint.value;

    const container = this.getSimulationContainer(sourceNode);
    const position = this.getNextSimulationPosition(sourceNode, container);

    const frame = figma.createFrame();
    frame.name = `${sourceNode.name} - ${label}`;
    frame.resize(size.width / scale, size.height / scale);
    frame.clipsContent = false;
    frame.fills = [
      {
        type: 'IMAGE',
        imageHash: image.hash,
        scaleMode: 'FILL',
      },
    ];

    const metadata: GeneratedNodeData = {
      isSimulation: true,
      originalNodeId: sourceNode.id,
      filter,
      label,
      generatedAt: Date.now(),
    };
    frame.setPluginData(PLUGIN_DATA_KEYS.GENERATED_NODE, JSON.stringify(metadata));

    container.appendChild(frame);

    // Children of a Section are positioned relative to it
    if (container.type === 'SECTION') {
      const origin = this.getAbsoluteBox(container);
      frame.x = position.x - origin.x;
      frame.y = position.y - origin.y;
      this.growSectionToFit(container, frame);
    } else {
      frame.x = position.x;
      frame.y = position.y;
    }

    return frame;
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
    const node = await figma.getNodeByIdAsync(nodeId);
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
}
