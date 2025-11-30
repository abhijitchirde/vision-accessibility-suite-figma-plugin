/**
 * Accessibility Notes Manager
 * 
 * Core logic for managing accessibility notes on Figma nodes
 */

import { AccessibilityNoteData, PlatformNote, NoteNodeInfo, PlatformType, NoteStats } from './notes.types';
import { NOTES_STORAGE_KEY, NOTES_DATA_VERSION } from './notes.constants';

/**
 * Notes Manager Class
 * 
 * Handles creation, retrieval, updating, and deletion of accessibility notes
 * Supports multiple platform-specific notes per node
 */
export class NotesManager {
  /**
   * Get all accessibility notes data from a node
   * Handles migration from old format (single platform) to new format (multiple platforms)
   */
  static getAllNotesData(node: SceneNode): AccessibilityNoteData | null {
    try {
      const data = node.getPluginData(NOTES_STORAGE_KEY);
      if (!data) return null;

      const parsed = JSON.parse(data) as any;

      // Check if this is old format (has platform field at root level)
      if (parsed.platform && !parsed.notes) {
        // Migrate old format to new format
        const migratedData: AccessibilityNoteData = {
          notes: {
            [parsed.platform]: {
              accessibleName: parsed.accessibleName || '',
              note: parsed.note || '',
              createdAt: parsed.createdAt || Date.now(),
              updatedAt: parsed.updatedAt || Date.now(),
            }
          },
          version: NOTES_DATA_VERSION,
        };
        
        // Save migrated data
        node.setPluginData(NOTES_STORAGE_KEY, JSON.stringify(migratedData));
        console.log('Migrated old note format to new format for node:', node.id);
        
        return migratedData;
      }

      // Validate new data structure
      if (!parsed.notes || typeof parsed.notes !== 'object') {
        return null;
      }

      return parsed as AccessibilityNoteData;
    } catch (error) {
      console.error('Error parsing note data:', error);
      return null;
    }
  }

  /**
   * Get accessibility note for a specific platform from a node
   */
  static getPlatformNote(node: SceneNode, platform: PlatformType): PlatformNote | null {
    const allNotes = this.getAllNotesData(node);
    if (!allNotes) return null;
    
    return allNotes.notes[platform] || null;
  }

  /**
   * Save or update accessibility note for a specific platform
   */
  static saveNote(
    node: SceneNode,
    platform: PlatformType,
    accessibleName: string,
    note: string
  ): void {
    // Get existing notes data or create new structure
    let notesData = this.getAllNotesData(node);
    
    if (!notesData) {
      notesData = {
        notes: {},
        version: NOTES_DATA_VERSION,
      };
    }

    // Get existing platform note to preserve createdAt
    const existingPlatformNote = notesData.notes[platform];

    // Update or create the platform-specific note
    notesData.notes[platform] = {
      accessibleName,
      note,
      createdAt: existingPlatformNote?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    // Save back to node
    node.setPluginData(NOTES_STORAGE_KEY, JSON.stringify(notesData));
  }

  /**
   * Update existing accessibility note for a specific platform
   */
  static updateNote(
    node: SceneNode,
    platform: PlatformType,
    accessibleName: string,
    note: string
  ): void {
    // Update is the same as save - it will preserve createdAt if note exists
    this.saveNote(node, platform, accessibleName, note);
  }

  /**
   * Remove accessibility note for a specific platform from a node
   */
  static removePlatformNote(node: SceneNode, platform: PlatformType): void {
    const notesData = this.getAllNotesData(node);
    if (!notesData) return;

    // Remove the platform-specific note
    delete notesData.notes[platform];

    // If no notes left, remove all plugin data
    if (Object.keys(notesData.notes).length === 0) {
      node.setPluginData(NOTES_STORAGE_KEY, '');
    } else {
      // Otherwise save the updated data
      node.setPluginData(NOTES_STORAGE_KEY, JSON.stringify(notesData));
    }
  }

  /**
   * Remove all accessibility notes from a node
   */
  static removeNote(node: SceneNode): void {
    node.setPluginData(NOTES_STORAGE_KEY, '');
  }

  /**
   * Check if node has any accessibility notes
   */
  static hasNote(node: SceneNode): boolean {
    const notesData = this.getAllNotesData(node);
    return notesData !== null && Object.keys(notesData.notes).length > 0;
  }

  /**
   * Check if node has a note for a specific platform
   */
  static hasPlatformNote(node: SceneNode, platform: PlatformType): boolean {
    return this.getPlatformNote(node, platform) !== null;
  }

  /**
   * Get all platforms that have notes on this node
   */
  static getNotePlatforms(node: SceneNode): PlatformType[] {
    const notesData = this.getAllNotesData(node);
    if (!notesData) return [];
    
    return Object.keys(notesData.notes) as PlatformType[];
  }

  /**
   * Get all nodes with accessibility notes on current page
   * Returns one entry per platform-note combination
   */
  static getAllNotedNodes(page: PageNode): NoteNodeInfo[] {
    const notedNodes: NoteNodeInfo[] = [];

    const traverse = (node: BaseNode) => {
      if ('getPluginData' in node) {
        const allNotesData = this.getAllNotesData(node as SceneNode);
        if (allNotesData && allNotesData.notes) {
          // Create one entry for each platform that has a note
          for (const [platform, platformNote] of Object.entries(allNotesData.notes)) {
            notedNodes.push({
              nodeId: node.id,
              nodeName: node.name,
              nodeType: node.type,
              platform: platform as PlatformType,
              noteData: platformNote as PlatformNote,
            });
          }
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
      if (note.platform) {
        byPlatform[note.platform]++;
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
      note.platform || '',
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
      markdown += `### ${note.nodeName} (${note.platform})\n\n`;
      markdown += `- **Type**: ${note.nodeType}\n`;
      markdown += `- **Platform**: ${note.platform}\n`;
      markdown += `- **Accessible Name**: ${note.noteData?.accessibleName}\n`;
      if (note.noteData?.note) {
        markdown += `- **Note**: ${note.noteData.note}\n`;
      }
      markdown += `\n---\n\n`;
    }

    return markdown;
  }
}



