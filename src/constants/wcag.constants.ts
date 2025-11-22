// WCAG 2.1 Contrast thresholds
export const WCAG_CONTRAST_THRESHOLDS = {
  AA: {
    NORMAL_TEXT: 4.5,
    LARGE_TEXT: 3.0,
  },
  AAA: {
    NORMAL_TEXT: 7.0,
    LARGE_TEXT: 4.5,
  },
} as const;

// Large text definition (18pt+ or 14pt+ bold)
export const LARGE_TEXT_SIZE = {
  NORMAL_PT: 18,
  NORMAL_PX: 24,
  BOLD_PT: 14,
  BOLD_PX: 18.66,
} as const;

// Font weight threshold for bold text
export const BOLD_FONT_WEIGHT = 700;
