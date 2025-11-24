/**
 * Vision Simulator Constants
 *
 * Color blindness transformation matrices based on:
 * - Brettel, Viénot, and Mollon (1997) - "Computerized simulation of color appearance for dichromats"
 * - Machado, Oliveira, and Fernandes (2009) - "A Physiologically-based Model for Simulation of Color Vision Deficiency"
 *
 * References:
 * - https://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/CVD_Simulation.html
 * - https://ixora.io/projects/colorblindness/color-blindness-simulation-research/
 */

import {
  FilterMetadata,
  TransformationMatrix,
  SimulationType,
  BlurConfig,
  GhostingConfig,
  YellowingConfig,
  ContrastLossConfig,
  BrightLightConfig,
} from './vision-simulator.types';

/**
 * Color blindness transformation matrices
 *
 * These matrices transform RGB values to simulate how colors appear
 * to people with different types of color vision deficiencies.
 *
 * Usage: [R', G', B'] = Matrix × [R, G, B]
 */

/**
 * Protanopia (Red-blind) - Missing L-cones
 * Affects ~1% of males, 0.01% of females
 */
export const PROTANOPIA_MATRIX: TransformationMatrix = [
  [0.567, 0.433, 0.0],
  [0.558, 0.442, 0.0],
  [0.0, 0.242, 0.758],
];

/**
 * Deuteranopia (Green-blind) - Missing M-cones
 * Affects ~1% of males, 0.01% of females
 */
export const DEUTERANOPIA_MATRIX: TransformationMatrix = [
  [0.625, 0.375, 0.0],
  [0.7, 0.3, 0.0],
  [0.0, 0.3, 0.7],
];

/**
 * Tritanopia (Blue-blind) - Missing S-cones
 * Affects ~0.001% of population (very rare)
 */
export const TRITANOPIA_MATRIX: TransformationMatrix = [
  [0.95, 0.05, 0.0],
  [0.0, 0.433, 0.567],
  [0.0, 0.475, 0.525],
];

/**
 * Achromatopsia (Total color blindness) - No functional cones
 * Grayscale conversion using luminance weights
 * Affects ~0.003% of population
 */
export const ACHROMATOPSIA_MATRIX: TransformationMatrix = [
  [0.299, 0.587, 0.114],
  [0.299, 0.587, 0.114],
  [0.299, 0.587, 0.114],
];

/**
 * Map simulation types to transformation matrices
 */
export const TRANSFORMATION_MATRICES: Record<
  'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia',
  TransformationMatrix
> = {
  protanopia: PROTANOPIA_MATRIX,
  deuteranopia: DEUTERANOPIA_MATRIX,
  tritanopia: TRITANOPIA_MATRIX,
  achromatopsia: ACHROMATOPSIA_MATRIX,
};

/**
 * Default configurations for other visual impairments
 */

export const DEFAULT_BLUR_CONFIG: BlurConfig = {
  radius: 8, // 8px blur radius (moderate blur)
  iterations: 2, // Apply blur twice for smoother effect
};

export const DEFAULT_GHOSTING_CONFIG: GhostingConfig = {
  offset: { x: 10, y: 5 }, // Ghost offset in pixels
  opacity: 0.5, // 50% opacity for ghost image
};

export const DEFAULT_YELLOWING_CONFIG: YellowingConfig = {
  intensity: 0.6, // 60% yellow tint
  temperature: 2500, // Color temperature (K) - warm/yellow
};

export const DEFAULT_CONTRAST_LOSS_CONFIG: ContrastLossConfig = {
  reduction: 0.5, // Reduce contrast by 50%
};

export const DEFAULT_BRIGHT_LIGHT_CONFIG: BrightLightConfig = {
  intensity: 0.7, // 70% brightness increase
  washout: 0.4, // 40% color washout (desaturation)
};

/**
 * Filter metadata for UI display
 */
export const FILTER_METADATA: Record<Exclude<SimulationType, 'original'>, FilterMetadata> = {
  // Color Blindness
  protanopia: {
    id: 'protanopia',
    name: 'Protanopia',
    category: 'color-blind',
    description: 'Red-blind (missing L-cones)',
    severity: 'high',
    scientificName: 'Protanopia (Red-blind)',
  },
  deuteranopia: {
    id: 'deuteranopia',
    name: 'Deuteranopia',
    category: 'color-blind',
    description: 'Green-blind (missing M-cones)',
    severity: 'high',
    scientificName: 'Deuteranopia (Green-blind)',
  },
  tritanopia: {
    id: 'tritanopia',
    name: 'Tritanopia',
    category: 'color-blind',
    description: 'Blue-blind (missing S-cones)',
    severity: 'medium',
    scientificName: 'Tritanopia (Blue-blind)',
  },
  achromatopsia: {
    id: 'achromatopsia',
    name: 'Achromatopsia',
    category: 'color-blind',
    description: 'Total color blindness',
    severity: 'critical',
    scientificName: 'Achromatopsia (Total color blindness)',
  },
  // Other Visual Impairments
  blurred: {
    id: 'blurred',
    name: 'Blurred',
    category: 'other',
    description: 'Blurred vision (cataracts, refractive error)',
    severity: 'medium',
  },
  ghosting: {
    id: 'ghosting',
    name: 'Ghosting',
    category: 'other',
    description: 'Double vision (diplopia)',
    severity: 'medium',
  },
  yellowing: {
    id: 'yellowing',
    name: 'Yellowing',
    category: 'other',
    description: 'Yellow tint (aging lens, cataracts)',
    severity: 'low',
  },
  'loss-of-contrast': {
    id: 'loss-of-contrast',
    name: 'Loss of Contrast',
    category: 'other',
    description: 'Reduced contrast sensitivity',
    severity: 'medium',
  },
  'bright-light': {
    id: 'bright-light',
    name: 'Bright Light',
    category: 'other',
    description: 'Light sensitivity (photophobia)',
    severity: 'low',
  },
};

/**
 * Ordered list of all filters for UI display
 */
export const ALL_FILTERS: Exclude<SimulationType, 'original'>[] = [
  // Color blindness (most impactful first)
  'protanopia',
  'deuteranopia',
  'tritanopia',
  'achromatopsia',
  // Other impairments
  'blurred',
  'ghosting',
  'yellowing',
  'loss-of-contrast',
  'bright-light',
];

/**
 * Color blindness filters only
 */
export const COLOR_BLIND_FILTERS: SimulationType[] = [
  'protanopia',
  'deuteranopia',
  'tritanopia',
  'achromatopsia',
];

/**
 * Other visual impairment filters
 */
export const OTHER_FILTERS: SimulationType[] = [
  'blurred',
  'ghosting',
  'yellowing',
  'loss-of-contrast',
  'bright-light',
];

/**
 * Zoom levels for preview mode
 */
export const ZOOM_LEVELS = [0.25, 0.5, 1, 2, 4];

/**
 * Default zoom level (100%)
 */
export const DEFAULT_ZOOM = 1;

/**
 * Maximum image dimensions for preview (performance optimization)
 */
export const MAX_PREVIEW_WIDTH = 800;
export const MAX_PREVIEW_HEIGHT = 600;

/**
 * Default spacing between generated copies
 */
export const DEFAULT_COPY_SPACING = 50;

/**
 * Image export settings
 */
export const IMAGE_EXPORT_SETTINGS = {
  format: 'PNG' as const,
  constraint: { type: 'SCALE' as const, value: 2 }, // 2x for better quality
};

/**
 * Canvas copy label settings
 */
export const LABEL_SETTINGS = {
  fontSize: 14,
  fontFamily: 'Inter',
  padding: 8,
  backgroundColor: { r: 0, g: 0, b: 0, a: 0.8 },
  textColor: { r: 255, g: 255, b: 255 },
};

/**
 * Plugin data keys
 */
export const PLUGIN_DATA_KEYS = {
  GENERATED_NODE: 'vision-simulator-generated',
  ORIGINAL_NODE_ID: 'vision-simulator-original',
  FILTER_TYPE: 'vision-simulator-filter',
};

/**
 * Scientific references and resources
 */
export const REFERENCES = {
  brettel1997:
    'Brettel, H., Viénot, F., & Mollon, J. D. (1997). Computerized simulation of color appearance for dichromats. JOSA A, 14(10), 2647-2655.',
  machado2009:
    'Machado, G. M., Oliveira, M. M., & Fernandes, L. A. (2009). A physiologically-based model for simulation of color vision deficiency. IEEE Transactions on Visualization and Computer Graphics, 15(6), 1291-1298.',
  wcag21_contrast: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html',
  color_blindness_info: 'https://www.nei.nih.gov/learn-about-eye-health/eye-conditions-and-diseases/color-blindness',
  machado_simulation: 'https://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/CVD_Simulation.html',
  colorblind_research: 'https://ixora.io/projects/colorblindness/color-blindness-simulation-research/',
};
