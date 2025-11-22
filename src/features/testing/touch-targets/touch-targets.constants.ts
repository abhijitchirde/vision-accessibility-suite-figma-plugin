/**
 * Touch Targets Constants
 *
 * Platform-specific minimum touch target sizes based on:
 * - WCAG 2.5.5 Target Size
 * - iOS Human Interface Guidelines
 * - Android Material Design
 * - Windows Design Guidelines
 */

import { PlatformRequirement } from './touch-targets.types';

/**
 * Platform-specific touch target requirements
 *
 * Note: All sizes are in pixels (px) for consistency in Figma
 * Original platform units are noted in descriptions
 */
export const PLATFORM_REQUIREMENTS: Record<string, PlatformRequirement> = {
  'web-AA': {
    platform: 'web',
    minWidth: 24,
    minHeight: 24,
    unit: 'px',
    description: 'WCAG 2.5.5 Level AA (24×24px)',
    reference: 'https://www.w3.org/WAI/WCAG21/Understanding/target-size.html'
  },
  'web-AAA': {
    platform: 'web',
    minWidth: 44,
    minHeight: 44,
    unit: 'px',
    description: 'WCAG 2.5.5 Level AAA (44×44px)',
    reference: 'https://www.w3.org/WAI/WCAG21/Understanding/target-size.html'
  },
  'ios-AA': {
    platform: 'ios',
    minWidth: 44,
    minHeight: 44,
    unit: 'pt',
    description: 'iOS HIG (44×44pt minimum)',
    reference: 'https://developer.apple.com/design/human-interface-guidelines/accessibility'
  },
  'ios-AAA': {
    platform: 'ios',
    minWidth: 44,
    minHeight: 44,
    unit: 'pt',
    description: 'iOS HIG (44×44pt minimum)',
    reference: 'https://developer.apple.com/design/human-interface-guidelines/accessibility'
  },
  'android-AA': {
    platform: 'android',
    minWidth: 48,
    minHeight: 48,
    unit: 'dp',
    description: 'Material Design (48×48dp minimum)',
    reference: 'https://material.io/design/usability/accessibility.html'
  },
  'android-AAA': {
    platform: 'android',
    minWidth: 48,
    minHeight: 48,
    unit: 'dp',
    description: 'Material Design (48×48dp minimum)',
    reference: 'https://material.io/design/usability/accessibility.html'
  },
  'windows-AA': {
    platform: 'windows',
    minWidth: 44,
    minHeight: 44,
    unit: 'px',
    description: 'Windows Design (44×44px minimum)',
    reference: 'https://docs.microsoft.com/en-us/windows/apps/design/accessibility/accessible-text-requirements'
  },
  'windows-AAA': {
    platform: 'windows',
    minWidth: 44,
    minHeight: 44,
    unit: 'px',
    description: 'Windows Design (44×44px minimum)',
    reference: 'https://docs.microsoft.com/en-us/windows/apps/design/accessibility/accessible-text-requirements'
  }
};

/**
 * Interactive node types that should be checked for touch target size
 */
export const INTERACTIVE_NODE_TYPES = [
  'FRAME',
  'COMPONENT',
  'INSTANCE',
  'RECTANGLE',
  'ELLIPSE',
  'POLYGON',
  'STAR',
  'VECTOR',
  'TEXT'
] as const;

/**
 * Severity thresholds based on how far below minimum size
 */
export const SEVERITY_THRESHOLDS = {
  critical: 0.5,  // Less than 50% of required size
  high: 0.7,      // Less than 70% of required size
  medium: 0.9,    // Less than 90% of required size
  low: 1.0        // Meets or exceeds required size
} as const;
