/**
 * StorageService - Handles plugin data persistence using Figma's Plugin Data API
 */
export class StorageService {
  /**
   * Store data on a specific node
   */
  setNodeData<T>(
    node: SceneNode,
    key: string,
    value: T
  ): void {
    try {
      const serialized = JSON.stringify({
        version: '1.0.0',
        data: value,
        timestamp: new Date().toISOString(),
      });
      node.setPluginData(key, serialized);
    } catch (error) {
      console.error('Failed to set node data:', error);
      throw new Error(`Storage error: ${error.message}`);
    }
  }

  /**
   * Retrieve data from a specific node
   */
  getNodeData<T>(
    node: SceneNode,
    key: string
  ): T | null {
    try {
      const raw = node.getPluginData(key);
      if (!raw) return null;

      const parsed = JSON.parse(raw);

      // Apply migrations if needed
      const migrated = this.migrateData(parsed);

      return migrated.data as T;
    } catch (error) {
      console.error('Failed to get node data:', error);
      return null;
    }
  }

  /**
   * Delete data from a specific node
   */
  deleteNodeData(node: SceneNode, key: string): void {
    node.setPluginData(key, '');
  }

  /**
   * Store plugin-wide settings
   */
  setPluginData<T>(key: string, value: T): void {
    const serialized = JSON.stringify({
      version: '1.0.0',
      data: value,
      timestamp: new Date().toISOString(),
    });
    figma.root.setPluginData(key, serialized);
  }

  /**
   * Retrieve plugin-wide settings
   */
  getPluginData<T>(key: string): T | null {
    try {
      const raw = figma.root.getPluginData(key);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      const migrated = this.migrateData(parsed);

      return migrated.data as T;
    } catch (error) {
      console.error('Failed to get plugin data:', error);
      return null;
    }
  }

  /**
   * Check if node has data for a specific key
   */
  hasNodeData(node: SceneNode, key: string): boolean {
    const data = node.getPluginData(key);
    return data !== '';
  }

  /**
   * Migrate data from old versions
   */
  private migrateData(stored: any): any {
    const version = stored.version || '0.0.0';

    // Current version, no migration needed
    if (version === '1.0.0') {
      return stored;
    }

    // Future migrations would go here
    return stored;
  }
}
