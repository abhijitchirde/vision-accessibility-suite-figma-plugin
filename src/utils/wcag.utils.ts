import { WCAGLevel } from '../types/common.types';
import { WCAG_CONTRAST_THRESHOLDS, LARGE_TEXT_SIZE, BOLD_FONT_WEIGHT } from '../constants/wcag.constants';

/**
 * Determine if text qualifies as "large text" according to WCAG
 * Large text is 18pt+ (24px+) or 14pt+ (18.66px+) bold
 */
export function isLargeText(fontSize: number, fontWeight: number = 400): boolean {
  // Check if font is bold
  const isBold = fontWeight >= BOLD_FONT_WEIGHT;

  if (isBold) {
    return fontSize >= LARGE_TEXT_SIZE.BOLD_PX;
  } else {
    return fontSize >= LARGE_TEXT_SIZE.NORMAL_PX;
  }
}

/**
 * Get the WCAG compliance level for a contrast ratio
 */
export function getWCAGLevel(ratio: number, isLarge: boolean): 'AAA' | 'AA' | 'Fail' {
  const aaaThreshold = isLarge ? WCAG_CONTRAST_THRESHOLDS.AAA.LARGE_TEXT : WCAG_CONTRAST_THRESHOLDS.AAA.NORMAL_TEXT;
  const aaThreshold = isLarge ? WCAG_CONTRAST_THRESHOLDS.AA.LARGE_TEXT : WCAG_CONTRAST_THRESHOLDS.AA.NORMAL_TEXT;

  if (ratio >= aaaThreshold) {
    return 'AAA';
  } else if (ratio >= aaThreshold) {
    return 'AA';
  } else {
    return 'Fail';
  }
}

/**
 * Get minimum contrast ratio for a specific WCAG level and text size
 */
export function getMinimumContrast(level: WCAGLevel, isLarge: boolean): number {
  return isLarge ? WCAG_CONTRAST_THRESHOLDS[level].LARGE_TEXT : WCAG_CONTRAST_THRESHOLDS[level].NORMAL_TEXT;
}

/**
 * Check if contrast ratio passes a specific WCAG level
 */
export function passesWCAG(ratio: number, level: WCAGLevel, isLarge: boolean): boolean {
  const threshold = getMinimumContrast(level, isLarge);
  return ratio >= threshold;
}
