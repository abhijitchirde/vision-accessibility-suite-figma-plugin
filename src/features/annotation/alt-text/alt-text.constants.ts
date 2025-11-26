/**
 * Alt-Text Constants
 */

/**
 * Storage keys for plugin data
 */
export const ALT_TEXT_STORAGE_KEY = 'accessibility-alt-text';

/**
 * WCAG Guidelines for Alt Text
 */
export const ALT_TEXT_GUIDELINES = {
  MIN_LENGTH: 10, // Minimum characters for meaningful alt text
  MAX_LENGTH: 200, // Maximum recommended length (screen readers may cut off)
  OPTIMAL_LENGTH: 125, // Optimal length for best experience
};

/**
 * Validation rules
 */
export const VALIDATION_RULES = {
  // Patterns that indicate poor alt text quality
  BAD_PATTERNS: [
    /^image[_-]?\d+/i, // image_123, image-456
    /^img[_-]?\d+/i, // img_123, img-456
    /^screenshot/i, // screenshot, Screenshot
    /^picture/i, // picture, Picture
    /^photo/i, // photo, Photo
    /\.png$/i, // ends with .png
    /\.jpg$/i, // ends with .jpg
    /\.jpeg$/i, // ends with .jpeg
    /\.gif$/i, // ends with .gif
    /\.svg$/i, // ends with .svg
    /^untitled/i, // untitled
  ],

  // Required words that indicate good descriptive alt text
  // (Not enforced, but used for suggestions)
  DESCRIPTIVE_KEYWORDS: [
    'showing',
    'displaying',
    'depicting',
    'illustrating',
    'featuring',
  ],
};

/**
 * Annotation badge colors by status
 */
export const STATUS_COLORS = {
  complete: '#10B981', // Green
  incomplete: '#EF4444', // Red
  decorative: '#6B7280', // Gray
  'needs-review': '#F59E0B', // Orange/Yellow
};

/**
 * Status labels for UI
 */
export const STATUS_LABELS = {
  complete: 'Complete',
  incomplete: 'Missing Alt Text',
  decorative: 'Decorative',
  'needs-review': 'Needs Review',
};

/**
 * Common decorative image indicators
 * (These are used to auto-suggest decorative status)
 */
export const DECORATIVE_INDICATORS = [
  'divider',
  'separator',
  'spacer',
  'decoration',
  'ornament',
  'background',
  'bg',
  'pattern',
  'texture',
];

/**
 * Example good alt text for reference
 */
export const ALT_TEXT_EXAMPLES = {
  informative: 'A bar chart showing sales growth from 2020 to 2024, with a 45% increase',
  functional: 'Search button',
  decorative: '', // Empty string for decorative images
  complex: 'Organizational chart with CEO at top, three VPs below, and six managers in third tier',
};

/**
 * Help text for users
 */
export const HELP_TEXT = {
  altTextPurpose:
    'Alt text describes images for screen reader users and appears when images fail to load.',
  decorativeGuideline:
    'Mark images as decorative if they serve only visual design purposes and convey no meaningful information.',
  lengthGuideline:
    'Keep alt text concise but descriptive. Aim for 125 characters or less, with a maximum of 200 characters.',
  qualityGuideline:
    'Describe what the image conveys, not just what it shows. Avoid phrases like "image of" or "picture of".',
};
