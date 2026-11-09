/**
 * SelectionService - Notifies subscribers when the Figma selection changes
 */
export class SelectionService {
  private selectionCallbacks: Set<(nodes: readonly SceneNode[]) => void> = new Set();

  constructor() {
    figma.on('selectionchange', () => {
      const selection = figma.currentPage.selection;
      this.selectionCallbacks.forEach((callback) => callback(selection));
    });
  }

  /**
   * Register callback for selection changes
   *
   * @returns Unsubscribe function
   */
  onSelectionChange(callback: (nodes: readonly SceneNode[]) => void): () => void {
    this.selectionCallbacks.add(callback);
    return () => {
      this.selectionCallbacks.delete(callback);
    };
  }
}
