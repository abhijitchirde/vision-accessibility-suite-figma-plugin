/**
 * SelectionService - Handles Figma selection management and node traversal
 */
export class SelectionService {
  private selectionCallbacks: Set<(nodes: readonly SceneNode[]) => void> = new Set();

  constructor() {
    // Listen for selection changes
    figma.on('selectionchange', () => {
      const selection = figma.currentPage.selection;
      this.selectionCallbacks.forEach((callback) => callback(selection));
    });
  }

  /**
   * Get current selection
   */
  getCurrentSelection(): readonly SceneNode[] {
    return figma.currentPage.selection;
  }

  /**
   * Register callback for selection changes
   */
  onSelectionChange(callback: (nodes: readonly SceneNode[]) => void): () => void {
    this.selectionCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.selectionCallbacks.delete(callback);
    };
  }

  /**
   * Find all nodes of a specific type in current page
   */
  findNodesOfType<T extends SceneNode>(
    type: NodeType,
    searchRoot: BaseNode = figma.currentPage
  ): T[] {
    const nodes: T[] = [];

    function traverse(node: BaseNode) {
      if ('type' in node && node.type === type) {
        nodes.push(node as T);
      }

      if ('children' in node) {
        for (const child of node.children) {
          traverse(child);
        }
      }
    }

    traverse(searchRoot);
    return nodes;
  }

  /**
   * Traverse node tree and execute callback for each node
   */
  traverseNode(node: BaseNode, callback: (node: SceneNode) => void): void {
    if ('type' in node) {
      callback(node as SceneNode);
    }

    if ('children' in node) {
      for (const child of node.children) {
        this.traverseNode(child, callback);
      }
    }
  }

  /**
   * Get all text nodes from selection or entire page
   */
  getTextNodes(useSelection: boolean = false): TextNode[] {
    if (useSelection) {
      const selection = this.getCurrentSelection();
      const textNodes: TextNode[] = [];

      selection.forEach((node) => {
        this.traverseNode(node, (n) => {
          if (n.type === 'TEXT') {
            textNodes.push(n);
          }
        });
      });

      return textNodes;
    } else {
      return this.findNodesOfType<TextNode>('TEXT');
    }
  }
}
