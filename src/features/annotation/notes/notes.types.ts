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
 * Accessibility note data stored in plugin data
 */
export interface AccessibilityNoteData {
  platform: PlatformType;
  accessibleName: string;  // Main accessibility label/name
  note: string;            // Additional notes/description
  version: number;         // Data schema version (for future migrations)
  createdAt: number;       // Timestamp
  updatedAt: number;       // Timestamp
}

/**
 * Node information with accessibility note
 */
export interface NoteNodeInfo {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  noteData: AccessibilityNoteData | null;
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



