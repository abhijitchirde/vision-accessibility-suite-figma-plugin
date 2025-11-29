/**
 * Landmarks Constants
 */

import { LandmarkRole } from './landmarks.types';

export const LANDMARKS_CONSTANTS = {
  // Storage
  STORAGE_KEY: 'landmarks_data',
  ANNOTATION_TYPE: 'landmark',

  // Badge dimensions
  BADGE_HEIGHT: 24,
  BADGE_CORNER_RADIUS: 4,
  BADGE_TEXT_SIZE: 11,
  BADGE_PADDING: 8,

  // Validation rules
  VALIDATION: {
    REQUIRE_MAIN: true,
    MAX_MAIN_COUNT: 1,
    REQUIRE_LABELS_FOR_MULTIPLE_NAV: true,
    REQUIRE_LABELS_FOR_MULTIPLE_SECTION: true,
  },
};

/**
 * Landmark role metadata
 */
export const LANDMARK_METADATA: Record<
  LandmarkRole,
  {
    label: string;
    htmlTag: string;
    ariaRole: string;
    description: string;
    icon: string;
    color: string;
    requiresLabel: boolean;
  }
> = {
  header: {
    label: 'Header',
    htmlTag: '<header>',
    ariaRole: 'banner',
    description: 'Site header, typically containing logo and top navigation',
    icon: '⌃',
    color: '#5B21B6', // Purple
    requiresLabel: false,
  },
  nav: {
    label: 'Navigation',
    htmlTag: '<nav>',
    ariaRole: 'navigation',
    description: 'Site navigation links',
    icon: '⊞',
    color: '#0D9488', // Teal
    requiresLabel: true, // If multiple nav landmarks
  },
  main: {
    label: 'Main Content',
    htmlTag: '<main>',
    ariaRole: 'main',
    description: 'Primary page content (one per page)',
    icon: '■',
    color: '#2563EB', // Blue
    requiresLabel: false,
  },
  aside: {
    label: 'Aside',
    htmlTag: '<aside>',
    ariaRole: 'complementary',
    description: 'Supporting content, sidebars',
    icon: '▭',
    color: '#7C3AED', // Purple-Blue
    requiresLabel: false,
  },
  footer: {
    label: 'Footer',
    htmlTag: '<footer>',
    ariaRole: 'contentinfo',
    description: 'Site footer, typically containing copyright and links',
    icon: '⌄',
    color: '#475569', // Slate
    requiresLabel: false,
  },
  form: {
    label: 'Form',
    htmlTag: '<form>',
    ariaRole: 'form',
    description: 'Form region',
    icon: '◫',
    color: '#059669', // Green
    requiresLabel: true,
  },
  section: {
    label: 'Section',
    htmlTag: '<section>',
    ariaRole: 'region',
    description: 'Generic content section',
    icon: '▬',
    color: '#DC2626', // Red
    requiresLabel: true, // If multiple section landmarks
  },
};

/**
 * Get landmark badge color
 */
export function getLandmarkBadgeColor(role: LandmarkRole): string {
  return LANDMARK_METADATA[role].color;
}

/**
 * Get landmark badge text color (white for all roles)
 */
export function getLandmarkBadgeTextColor(_role: LandmarkRole): string {
  return '#FFFFFF';
}

/**
 * Get landmark icon symbol
 */
export function getLandmarkIcon(role: LandmarkRole): string {
  return LANDMARK_METADATA[role].icon;
}

/**
 * Get landmark HTML tag
 */
export function getLandmarkHtmlTag(role: LandmarkRole): string {
  return LANDMARK_METADATA[role].htmlTag;
}

/**
 * Get landmark ARIA role
 */
export function getLandmarkAriaRole(role: LandmarkRole): string {
  return LANDMARK_METADATA[role].ariaRole;
}

/**
 * Check if landmark role requires a label when multiple exist
 */
export function landmarkRequiresLabel(role: LandmarkRole): boolean {
  return LANDMARK_METADATA[role].requiresLabel;
}

/**
 * Get all landmark roles
 */
export function getAllLandmarkRoles(): LandmarkRole[] {
  return Object.keys(LANDMARK_METADATA) as LandmarkRole[];
}



