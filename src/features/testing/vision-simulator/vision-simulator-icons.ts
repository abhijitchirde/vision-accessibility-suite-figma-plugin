/**
 * Icon configurations for vision simulator filters
 * Color blind filters use color bars, other filters use icon symbols
 */

export type FilterColorBar = {
  type: 'color-bars';
  colors: string[]; // Array of hex colors for the bars
  description: string; // Accessibility description
};

export type FilterIconSymbol = {
  type: 'icon';
  icon: string; // Icon identifier or SVG path
  color: string; // Main color for the icon
  description: string; // Accessibility description
};

export type FilterIconConfig = FilterColorBar | FilterIconSymbol;

/**
 * Icon configurations for each vision simulation type
 */
export const FILTER_ICONS: Record<string, FilterIconConfig> = {
  // Color blind conditions - use color bars
  protanopia: {
    type: 'color-bars',
    colors: ['#999999', '#4CAF50', '#2196F3'], // Gray (missing red), Green, Blue
    description: 'Red-blind: cannot distinguish red',
  },
  deuteranopia: {
    type: 'color-bars',
    colors: ['#F44336', '#999999', '#2196F3'], // Red, Gray (missing green), Blue
    description: 'Green-blind: cannot distinguish green',
  },
  tritanopia: {
    type: 'color-bars',
    colors: ['#F44336', '#4CAF50', '#999999'], // Red, Green, Gray (missing blue)
    description: 'Blue-blind: cannot distinguish blue',
  },
  achromatopsia: {
    type: 'color-bars',
    colors: ['#333333', '#888888', '#CCCCCC'], // Dark gray, Medium gray, Light gray
    description: 'Total color blindness: sees only grayscale',
  },

  // Partial color vision deficiencies (anomalous trichromacy) - use lighter/muted colors
  protanomaly: {
    type: 'color-bars',
    colors: ['#FFCCCB', '#4CAF50', '#2196F3'], // Light red (weak), Green, Blue
    description: 'Weak red: reduced red sensitivity',
  },
  deuteranomaly: {
    type: 'color-bars',
    colors: ['#F44336', '#C8E6C9', '#2196F3'], // Red, Light green (weak), Blue
    description: 'Weak green: reduced green sensitivity',
  },
  tritanomaly: {
    type: 'color-bars',
    colors: ['#F44336', '#4CAF50', '#BBDEFB'], // Red, Green, Light blue (weak)
    description: 'Weak blue: reduced blue sensitivity',
  },

  // Other vision conditions - use icon symbols
  blurred: {
    type: 'icon',
    icon: 'blur-circle',
    color: '#9C27B0',
    description: 'Blurred vision: reduced sharpness',
  },
  ghosting: {
    type: 'icon',
    icon: 'double-square',
    color: '#E1BEE7',
    description: 'Ghosting: double vision effect',
  },
  yellowing: {
    type: 'icon',
    icon: 'diamond',
    color: '#FFB300',
    description: 'Yellowing: warm color shift',
  },
  'loss-of-contrast': {
    type: 'icon',
    icon: 'low-contrast-circle',
    color: '#9E9E9E',
    description: 'Loss of contrast: reduced color differentiation',
  },
  'bright-light': {
    type: 'icon',
    icon: 'starburst',
    color: '#FFF59D',
    description: 'Bright light sensitivity: washed out colors',
  },

  // Visual field defects - use icon symbols
  'central-vision-loss': {
    type: 'icon',
    icon: 'center-dot',
    color: '#D32F2F',
    description: 'Central vision loss: blurred/dark center (macular degeneration)',
  },
  'peripheral-vision-loss': {
    type: 'icon',
    icon: 'tunnel',
    color: '#1976D2',
    description: 'Peripheral vision loss: tunnel vision (glaucoma)',
  },
};
