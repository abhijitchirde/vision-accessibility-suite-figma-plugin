/**
 * Accessibility Notes Types
 * 
 * Type definitions for platform-specific accessibility annotations
 */

/**
 * Platform types supported for accessibility notes
 */
export type PlatformType = 
  | 'web'           // Accessible Name (generic voice experiences)
  | 'aria'          // ARIA notes (web-specific)
  | 'ios'           // iOS (VoiceOver)
  | 'android'       // Android (TalkBack)
  | 'windows'       // Windows (Narrator)
  | 'react-native'  // React Native
  | 'tv'            // TV platforms
  | 'general';      // General notes (platform-agnostic)

/**
 * Single platform-specific note
 */
export interface PlatformNote {
  accessibleName: string;  // Main accessibility label/name
  note: string;            // Additional notes/description
  createdAt: number;       // Timestamp
  updatedAt: number;       // Timestamp
}

/**
 * Accessibility note data stored in plugin data
 * Supports multiple platform-specific notes per node
 */
export interface AccessibilityNoteData {
  notes: Partial<Record<PlatformType, PlatformNote>>;  // One note per platform
  version: number;         // Data schema version (for future migrations)
}

/**
 * Node information with accessibility note (for a specific platform)
 */
export interface NoteNodeInfo {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  platform: PlatformType;      // Which platform this note is for
  noteData: PlatformNote | null;  // The platform-specific note data
}

/**
 * Platform template field definition
 */
export interface PlatformTemplateField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  placeholder?: string;
  options?: string[];  // For select type
  required?: boolean;
  helpText?: string;
}

/**
 * Platform template configuration
 */
export interface PlatformTemplate {
  platform: PlatformType;
  label: string;
  description: string;
  icon: string;  // Icon name from Icon component
  fields: PlatformTemplateField[];
  codeGenerator?: (data: Record<string, string>) => string;  // Optional code snippet generator
}

/**
 * Statistics for notes panel
 */
export interface NoteStats {
  total: number;
  byPlatform: Record<PlatformType, number>;
}



