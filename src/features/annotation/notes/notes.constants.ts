/**
 * Accessibility Notes Constants
 * 
 * Platform templates, configurations, and reference data
 */

import { PlatformTemplate, PlatformType } from './notes.types';

/**
 * Storage key for accessibility notes
 */
export const NOTES_STORAGE_KEY = 'accessibility-notes';

/**
 * Data schema version
 */
export const NOTES_DATA_VERSION = 1;

/**
 * Platform metadata and descriptions
 */
export const PLATFORM_METADATA: Record<PlatformType, {
  label: string;
  description: string;
  icon: string;
}> = {
  web: {
    label: 'Accessible Name',
    description: 'Generic voice experiences',
    icon: 'globe',
  },
  aria: {
    label: 'ARIA notes',
    description: 'Web (ARIA attributes)',
    icon: 'globe',
  },
  ios: {
    label: 'VoiceOver',
    description: 'Native iOS and MacOS apps',
    icon: 'smartphone',
  },
  android: {
    label: 'TalkBack',
    description: 'Android apps',
    icon: 'smartphone',
  },
  windows: {
    label: 'Narrator',
    description: 'Native Windows Apps',
    icon: 'monitor',
  },
  'react-native': {
    label: 'React Native',
    description: 'Mobile apps built with React',
    icon: 'code',
  },
  tv: {
    label: 'TV notes',
    description: 'Smart TV apps and 10ft experiences',
    icon: 'tv',
  },
  general: {
    label: 'General notes',
    description: 'Platform-agnostic accessibility notes',
    icon: 'file-text',
  },
};

/**
 * Platform template configurations
 * 
 * These define the UI and data structure for each platform
 */
export const PLATFORM_TEMPLATES: Record<PlatformType, PlatformTemplate> = {
  web: {
    platform: 'web',
    label: 'Accessible Name',
    description: 'Generic voice experiences',
    icon: 'globe',
    fields: [
      {
        id: 'accessibleName',
        label: 'Accessible Name',
        type: 'text',
        placeholder: 'All apps',
        required: true,
        helpText: 'Required when an element has no visible text label. The accessible name is used by assistive technologies like screen readers and voice control.',
      },
      {
        id: 'note',
        label: 'Note',
        type: 'textarea',
        placeholder: '',
        helpText: 'Enter additional information for Engineering as needed such as role, value, state, or description.',
      },
    ],
  },
  aria: {
    platform: 'aria',
    label: 'ARIA notes',
    description: 'Web (ARIA attributes)',
    icon: 'globe',
    fields: [
      {
        id: 'accessibleName',
        label: 'Accessible Name',
        type: 'text',
        placeholder: 'e.g., Submit button',
        required: true,
        helpText: 'ARIA accessible name for web (aria-label, aria-labelledby, etc.)',
      },
      {
        id: 'note',
        label: 'Note',
        type: 'textarea',
        placeholder: 'Additional ARIA attributes (role, state, properties)',
        helpText: 'Enter ARIA-specific information such as role, aria-expanded, aria-hidden, aria-describedby, or other ARIA attributes.',
      },
    ],
  },
  ios: {
    platform: 'ios',
    label: 'iOS (VoiceOver)',
    description: 'Native iOS and MacOS apps',
    icon: 'smartphone',
    fields: [
      {
        id: 'accessibleName',
        label: 'Accessible Name',
        type: 'text',
        placeholder: 'e.g., Submit button',
        required: true,
        helpText: 'VoiceOver label for iOS/MacOS native apps',
      },
      {
        id: 'note',
        label: 'Note',
        type: 'textarea',
        placeholder: 'Additional VoiceOver properties or context',
        helpText: 'Hint, trait, or other VoiceOver-specific information',
      },
    ],
  },
  android: {
    platform: 'android',
    label: 'Android (TalkBack)',
    description: 'Android apps',
    icon: 'smartphone',
    fields: [
      {
        id: 'accessibleName',
        label: 'Accessible Name',
        type: 'text',
        placeholder: 'e.g., Submit button',
        required: true,
        helpText: 'contentDescription for Android TalkBack',
      },
      {
        id: 'note',
        label: 'Note',
        type: 'textarea',
        placeholder: 'Additional TalkBack properties or context',
        helpText: 'Additional accessibility properties or implementation notes',
      },
    ],
  },
  windows: {
    platform: 'windows',
    label: 'Windows (Narrator)',
    description: 'Native Windows Apps',
    icon: 'monitor',
    fields: [
      {
        id: 'accessibleName',
        label: 'Accessible Name',
        type: 'text',
        placeholder: 'e.g., Submit button',
        required: true,
        helpText: 'AutomationProperties.Name for Windows Narrator',
      },
      {
        id: 'note',
        label: 'Note',
        type: 'textarea',
        placeholder: 'Additional Narrator properties or context',
        helpText: 'Additional UIA properties or implementation notes',
      },
    ],
  },
  'react-native': {
    platform: 'react-native',
    label: 'React Native',
    description: 'Mobile apps built with React',
    icon: 'code',
    fields: [
      {
        id: 'accessibleName',
        label: 'Accessible Name',
        type: 'text',
        placeholder: 'e.g., Submit button',
        required: true,
        helpText: 'accessibilityLabel for React Native',
      },
      {
        id: 'note',
        label: 'Note',
        type: 'textarea',
        placeholder: 'Additional accessibility properties',
        helpText: 'accessibilityHint, accessibilityRole, or other props',
      },
    ],
  },
  tv: {
    platform: 'tv',
    label: 'TV Platforms',
    description: 'Smart TV apps and 10ft experiences',
    icon: 'tv',
    fields: [
      {
        id: 'accessibleName',
        label: 'Accessible Name',
        type: 'text',
        placeholder: 'e.g., Play video',
        required: true,
        helpText: 'Accessible name for TV screen readers',
      },
      {
        id: 'note',
        label: 'Note',
        type: 'textarea',
        placeholder: 'Additional TV accessibility notes',
        helpText: 'Platform-specific requirements (Android TV, tvOS, etc.)',
      },
    ],
  },
  general: {
    platform: 'general',
    label: 'General Notes',
    description: 'Platform-agnostic accessibility notes',
    icon: 'file-text',
    fields: [
      {
        id: 'accessibleName',
        label: 'Title',
        type: 'text',
        placeholder: 'e.g., Navigation menu',
        required: true,
        helpText: 'Short descriptive title for this note',
      },
      {
        id: 'note',
        label: 'Note',
        type: 'textarea',
        placeholder: 'General accessibility notes or requirements',
        helpText: 'Platform-agnostic accessibility requirements or documentation',
      },
    ],
  },
};

/**
 * Platform order for display
 */
export const PLATFORM_ORDER: PlatformType[] = [
  'web',
  'aria',
  'ios',
  'android',
  'windows',
  'react-native',
  'tv',
  'general',
];

/**
 * Default platform selection
 */
export const DEFAULT_PLATFORM: PlatformType = 'web';

/**
 * Badge colors for different platforms
 */
export const PLATFORM_BADGE_COLORS: Record<PlatformType, string> = {
  web: '#3b82f6',           // Blue
  aria: '#2563eb',          // Darker Blue
  ios: '#10b981',           // Green
  android: '#a78bfa',       // Purple
  windows: '#06b6d4',       // Cyan
  'react-native': '#f59e0b', // Amber
  tv: '#ec4899',            // Pink
  general: '#6b7280',       // Gray
};



