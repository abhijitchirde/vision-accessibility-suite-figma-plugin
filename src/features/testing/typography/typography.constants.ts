/**
 * Typography Constants
 *
 * WCAG-based typography rules and thresholds:
 * - WCAG 2.1 Success Criterion 1.4.8 (Visual Presentation) - AAA
 * - WCAG 2.1 Success Criterion 1.4.12 (Text Spacing) - AA
 * - Universal typography best practices
 */

/**
 * Font Size Thresholds
 *
 * Based on:
 * - WCAG 1.4.4 (Resize Text)
 * - Universal accessibility recommendations
 * - Browser default base size (16px)
 */
export const FONT_SIZE = {
  /** Absolute minimum (below this is critical) */
  CRITICAL_MIN: 9,
  /** Warning threshold (legibility concerns) */
  WARNING_MIN: 11,
  /** Recommended minimum for body text */
  RECOMMENDED_MIN: 16,
  /** Threshold for "large text" classification (18pt = ~24px or 14pt bold = ~18.66px) */
  LARGE_TEXT: 18,
  /** Threshold for "large text" when bold (14pt = ~18.66px) */
  LARGE_TEXT_BOLD: 18.66
} as const;

/**
 * Line Height Thresholds
 *
 * Based on WCAG 1.4.8 (Visual Presentation) - AAA Level
 * Line spacing (leading) is at least space-and-a-half within paragraphs (1.5)
 */
export const LINE_HEIGHT = {
  /** Minimum for body text (WCAG AAA) */
  BODY_MIN: 1.5,
  /** Recommended for headings */
  HEADING_RECOMMENDED: 1.2,
  /** Absolute minimum (below this is critical) */
  CRITICAL_MIN: 1.1
} as const;

/**
 * Line Length Thresholds (in characters)
 *
 * Based on WCAG 1.4.8 (Visual Presentation) - AAA Level
 * Width is no more than 80 characters or glyphs
 */
export const LINE_LENGTH = {
  /** Optimal range for readability */
  OPTIMAL_MIN: 50,
  OPTIMAL_MAX: 75,
  /** Maximum (WCAG AAA) */
  WCAG_MAX: 80,
  /** Critical threshold */
  CRITICAL_MAX: 100
} as const;

/**
 * Letter Spacing Thresholds
 *
 * Based on WCAG 1.4.12 (Text Spacing) - AA Level
 * Letter spacing (tracking) to at least 0.12 times the font size
 */
export const LETTER_SPACING = {
  /** Minimum ratio (letter-spacing / font-size) - WCAG AA */
  MIN_RATIO: 0.12,
  /** Recommended ratio for better readability */
  RECOMMENDED_RATIO: 0.15
} as const;

/**
 * Text Alignment Recommendations
 *
 * Based on accessibility best practices:
 * - Left alignment preferred for LTR languages (easier eye tracking)
 * - Avoid full justification (creates uneven spacing, reading difficulties)
 */
export const TEXT_ALIGN = {
  PREFERRED: 'LEFT',
  AVOID: ['JUSTIFIED']
} as const;

/**
 * Font Weight Thresholds
 *
 * Based on legibility best practices
 */
export const FONT_WEIGHT = {
  /** Minimum for body text */
  BODY_MIN: 400,
  /** Minimum for large headings */
  HEADING_MIN: 300,
  /** Critical minimum */
  CRITICAL_MIN: 200
} as const;

/**
 * Paragraph Spacing Recommendations
 *
 * Based on WCAG 1.4.8 (Visual Presentation) - AAA Level
 * Paragraph spacing is at least 1.5 times larger than the line spacing
 */
export const PARAGRAPH_SPACING = {
  /** Minimum ratio (paragraph-spacing / line-spacing) */
  MIN_RATIO: 1.5
} as const;

/**
 * Severity thresholds for typography issues
 */
export const SEVERITY_RULES = {
  fontSize: {
    critical: FONT_SIZE.CRITICAL_MIN,
    high: FONT_SIZE.WARNING_MIN,
    medium: FONT_SIZE.RECOMMENDED_MIN,
    low: Infinity
  },
  lineHeight: {
    critical: LINE_HEIGHT.CRITICAL_MIN,
    high: LINE_HEIGHT.HEADING_RECOMMENDED,
    medium: LINE_HEIGHT.BODY_MIN,
    low: Infinity
  },
  lineLength: {
    critical: LINE_LENGTH.CRITICAL_MAX,
    high: LINE_LENGTH.WCAG_MAX,
    medium: LINE_LENGTH.OPTIMAL_MAX,
    low: 0
  }
} as const;

/**
 * WCAG References
 */
export const WCAG_REFERENCES = {
  VISUAL_PRESENTATION: 'https://www.w3.org/WAI/WCAG21/Understanding/visual-presentation.html',
  TEXT_SPACING: 'https://www.w3.org/WAI/WCAG21/Understanding/text-spacing.html',
  RESIZE_TEXT: 'https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html'
} as const;
