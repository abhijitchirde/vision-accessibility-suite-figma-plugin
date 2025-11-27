/**
 * Headings Constants
 */

import { HeadingLevel } from './headings.types';

export const HEADINGS_CONSTANTS = {
  // Storage
  STORAGE_KEY: 'headings',
  ANNOTATION_TYPE: 'heading',

  // Badge styling
  BADGE_WIDTH: 36,
  BADGE_HEIGHT: 24,
  BADGE_CORNER_RADIUS: 4,
  BADGE_TEXT_SIZE: 12,
  BADGE_TEXT_COLOR: '#FFFFFF', // White text

  // Colors for each heading level
  BADGE_COLORS: {
    H1: '#9747FF', // Purple
    H2: '#1E88E5', // Blue
    H3: '#00897B', // Teal
    H4: '#43A047', // Green
    H5: '#FDD835', // Yellow
    H6: '#FB8C00', // Orange
  } as Record<HeadingLevel, string>,

  // Auto-detection thresholds
  HEADING_MIN_FONT_SIZE: 20, // Minimum font size to be considered a potential heading
  HEADING_MIN_FONT_WEIGHT: 600, // Minimum font weight (Semi-bold or bolder)

  // Validation rules
  VALIDATION: {
    MAX_H1_COUNT: 1, // Maximum number of H1 headings per page
    REQUIRE_H1: true, // Require at least one H1 on the page
    SEQUENTIAL_LEVELS: true, // Heading levels should not skip (e.g., H1 → H3)
  },

  // WCAG Reference
  WCAG_REFERENCE: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',
} as const;

/**
 * Get badge color for a heading level
 */
export function getHeadingBadgeColor(level: HeadingLevel): string {
  return HEADINGS_CONSTANTS.BADGE_COLORS[level];
}

/**
 * Get text color for badge based on background (for yellow H5, use dark text)
 */
export function getHeadingBadgeTextColor(level: HeadingLevel): string {
  // Yellow badge needs dark text for contrast
  if (level === 'H5') {
    return '#000000';
  }
  return HEADINGS_CONSTANTS.BADGE_TEXT_COLOR;
}

/**
 * Heading level to number (H1 = 1, H2 = 2, etc.)
 */
export function headingLevelToNumber(level: HeadingLevel): number {
  return parseInt(level.charAt(1), 10);
}

/**
 * Number to heading level (1 = H1, 2 = H2, etc.)
 */
export function numberToHeadingLevel(num: number): HeadingLevel {
  if (num < 1 || num > 6) {
    throw new Error(`Invalid heading number: ${num}. Must be 1-6.`);
  }
  return `H${num}` as HeadingLevel;
}
