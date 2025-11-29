/**
 * Accessibility Notes Manager
 * 
 * Core logic for managing accessibility notes on Figma nodes
 */

import { AccessibilityNoteData, NoteNodeInfo, PlatformType, NoteStats } from './notes.types';
import { NOTES_STORAGE_KEY, NOTES_DATA_VERSION } from './notes.constants';

/**
 * Notes Manager Class
 * 
 * Handles creation, retrieval, updating, and deletion of accessibility notes
 */
export class NotesManager {
  /**
   * Save accessibility note to a node
   */
  static saveNote(
    node: SceneNode,
    platform: PlatformType,
    accessibleName: string,
    note: string
  ): void {
    const noteData: AccessibilityNoteData = {
      platform,
      accessibleName,
      note,
      version: NOTES_DATA_VERSION,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    node.setPluginData(NOTES_STORAGE_KEY, JSON.stringify(noteData));
  }

  /**
   * Get accessibility note from a node
   */
  static getNote(node: SceneNode): AccessibilityNoteData | null {
    try {
      const data = node.getPluginData(NOTES_STORAGE_KEY);
      if (!data) return null;

      const parsed = JSON.parse(data) as AccessibilityNoteData;

      // Validate data structure - platform is required, but accessibleName can be empty
      if (!parsed.platform) {
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('Error parsing note data:', error);
      return null;
    }
  }

  /**
   * Update existing accessibility note
   */
  static updateNote(
    node: SceneNode,
    platform: PlatformType,
    accessibleName: string,
    note: string
  ): void {
    const existingNote = this.getNote(node);

    const noteData: AccessibilityNoteData = {
      platform,
      accessibleName,
      note,
      version: NOTES_DATA_VERSION,
      createdAt: existingNote?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    node.setPluginData(NOTES_STORAGE_KEY, JSON.stringify(noteData));
  }

  /**
   * Remove accessibility note from a node
   */
  static removeNote(node: SceneNode): void {
    node.setPluginData(NOTES_STORAGE_KEY, '');
  }

  /**
   * Check if node has accessibility note
   */
  static hasNote(node: SceneNode): boolean {
    return this.getNote(node) !== null;
  }

  /**
   * Get all nodes with accessibility notes on current page
   */
  static getAllNotedNodes(page: PageNode): NoteNodeInfo[] {
    const notedNodes: NoteNodeInfo[] = [];

    const traverse = (node: BaseNode) => {
      if ('getPluginData' in node) {
        const noteData = this.getNote(node as SceneNode);
        if (noteData) {
          notedNodes.push({
            nodeId: node.id,
            nodeName: node.name,
            nodeType: node.type,
            noteData,
          });
        }
      }

      if ('children' in node) {
        for (const child of node.children) {
          traverse(child);
        }
      }
    };

    traverse(page);
    return notedNodes;
  }

  /**
   * Get statistics about accessibility notes
   */
  static getStats(page: PageNode): NoteStats {
    const allNotes = this.getAllNotedNodes(page);

    const byPlatform: Record<PlatformType, number> = {
      web: 0,
      aria: 0,
      ios: 0,
      android: 0,
      windows: 0,
      'react-native': 0,
      tv: 0,
      general: 0,
    };

    for (const note of allNotes) {
      if (note.noteData) {
        byPlatform[note.noteData.platform]++;
      }
    }

    return {
      total: allNotes.length,
      byPlatform,
    };
  }

  /**
   * Get node by ID from document (async version for cross-page access)
   * Note: This works across all pages in the document
   */
  static async getNodeByIdAsync(nodeId: string): Promise<SceneNode | null> {
    try {
      if (!nodeId) {
        console.error('NotesManager.getNodeByIdAsync - No nodeId provided');
        return null;
      }

      console.log('NotesManager.getNodeByIdAsync - Looking for node:', nodeId);
      const node = await figma.getNodeByIdAsync(nodeId);
      
      if (!node) {
        console.error(`NotesManager.getNodeByIdAsync - Node with ID ${nodeId} not found in document`);
        return null;
      }
      
      console.log('NotesManager.getNodeByIdAsync - Found node:', (node as any).name, node.type);
      
      if (!('getPluginData' in node)) {
        console.error(`NotesManager.getNodeByIdAsync - Node ${nodeId} does not support plugin data`);
        return null;
      }
      
      // Check if node was removed (this property exists on BaseNode)
      if ('removed' in node && node.removed) {
        console.error(`NotesManager.getNodeByIdAsync - Node ${nodeId} has been removed`);
        return null;
      }
      
      console.log('NotesManager.getNodeByIdAsync - Successfully retrieved node:', nodeId);
      return node as SceneNode;
    } catch (error) {
      console.error('NotesManager.getNodeByIdAsync - Error getting node by ID:', nodeId, error);
      return null;
    }
  }

  /**
   * Get node by ID from document (synchronous - only works for current page)
   * @deprecated Use getNodeByIdAsync instead for cross-page access
   */
  static getNodeById(nodeId: string): SceneNode | null {
    try {
      if (!nodeId) {
        console.error('NotesManager.getNodeById - No nodeId provided');
        return null;
      }

      const node = figma.getNodeById(nodeId);
      
      if (!node) {
        return null;
      }
      
      if (!('getPluginData' in node)) {
        return null;
      }
      
      return node as SceneNode;
    } catch (error) {
      // If sync version fails, caller should use async version
      return null;
    }
  }

  /**
   * Scroll and zoom to a specific node (async for cross-page access)
   */
  static async scrollAndZoomToNode(nodeId: string): Promise<void> {
    const node = await this.getNodeByIdAsync(nodeId);
    if (node) {
      figma.currentPage.selection = [node];
      figma.viewport.scrollAndZoomIntoView([node]);
    }
  }

  /**
   * Export accessibility notes to JSON
   */
  static exportNotesToJSON(page: PageNode): string {
    const notes = this.getAllNotedNodes(page);
    return JSON.stringify(notes, null, 2);
  }

  /**
   * Export accessibility notes to CSV
   */
  static exportNotesToCSV(page: PageNode): string {
    const notes = this.getAllNotedNodes(page);

    const headers = ['Node Name', 'Node Type', 'Platform', 'Accessible Name', 'Note'];
    const rows = notes.map((note) => [
      note.nodeName,
      note.nodeType,
      note.noteData?.platform || '',
      note.noteData?.accessibleName || '',
      note.noteData?.note || '',
    ]);

    const csvRows = [headers, ...rows];
    return csvRows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
  }

  /**
   * Export accessibility notes to Markdown
   */
  static exportNotesToMarkdown(page: PageNode): string {
    const notes = this.getAllNotedNodes(page);
    const stats = this.getStats(page);

    let markdown = `# Accessibility Notes\n\n`;
    markdown += `**Page**: ${page.name}\n`;
    markdown += `**Total Notes**: ${stats.total}\n\n`;

    markdown += `## Summary by Platform\n\n`;
    for (const [platform, count] of Object.entries(stats.byPlatform)) {
      if (count > 0) {
        markdown += `- **${platform}**: ${count} notes\n`;
      }
    }

    markdown += `\n## Notes\n\n`;

    for (const note of notes) {
      markdown += `### ${note.nodeName}\n\n`;
      markdown += `- **Type**: ${note.nodeType}\n`;
      markdown += `- **Platform**: ${note.noteData?.platform}\n`;
      markdown += `- **Accessible Name**: ${note.noteData?.accessibleName}\n`;
      if (note.noteData?.note) {
        markdown += `- **Note**: ${note.noteData.note}\n`;
      }
      markdown += `\n---\n\n`;
    }

    return markdown;
  }
}



