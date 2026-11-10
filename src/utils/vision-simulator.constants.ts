/**
 * Vision Simulator Constants
 *
 * Color blindness simulation uses the Machado, Oliveira and Fernandes (2009)
 * model in linear RGB: see machado-matrices.ts and applyColorBlindness in
 * image-utils.ts. This file holds filter metadata, default settings and presets.
 */

import {
  FilterMetadata,
  FilterPreset,
  TransformationMatrix,
  SimulationType,
  ColorBlindnessType,
  BlurConfig,
  GhostingConfig,
  YellowingConfig,
  ContrastLossConfig,
  BrightLightConfig,
  CentralVisionLossConfig,
  PeripheralVisionLossConfig,
} from "./vision-simulator.types";

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
 * Default central vision loss configuration (macular degeneration)
 */
export const DEFAULT_CENTRAL_VISION_LOSS_CONFIG: CentralVisionLossConfig = {
  radius: 150, // 150px radius of affected center area
  severity: 0.8, // 80% severity (significant center vision loss)
};

/**
 * Default peripheral vision loss configuration (glaucoma/tunnel vision)
 *
 * For generate mode: Uses smaller radius to ensure visible darkening
 */
export const DEFAULT_PERIPHERAL_VISION_LOSS_CONFIG: PeripheralVisionLossConfig =
  {
    tunnelRadius: 60, // 60px radius of clear center area (small for visible effect)
    severity: 0.8, // 80% severity (strong peripheral darkening for clear demonstration)
  };

/**
 * Default severity levels for partial color vision deficiencies
 *
 * These represent "typical" severity for anomalous trichromacy.
 * Users can adjust via severity slider.
 */
export const DEFAULT_ANOMALY_SEVERITY = {
  protanomaly: 0.6, // Moderate severity (60%)
  deuteranomaly: 0.6, // Moderate severity (60%)
  tritanomaly: 0.6, // Moderate severity (60%)
};

/**
 * Severity level names and percentages
 */
export const SEVERITY_PRESETS = {
  mild: 0.3, // 30% - Mild partial deficiency
  moderate: 0.6, // 60% - Moderate partial deficiency
  severe: 0.9, // 90% - Severe partial deficiency (almost complete)
  complete: 1.0, // 100% - Complete dichromacy
};

/**
 * Filter metadata for UI display
 */
export const FILTER_METADATA: Record<
  Exclude<SimulationType, "original">,
  FilterMetadata
> = {
  // Complete Color Blindness (Dichromacy)
  protanopia: {
    id: "protanopia",
    name: "Protanopia",
    category: "color-blind",
    description: "Complete: can't see red (missing red cones). About 1% of males.",
    severity: "high",
    scientificName: "Protanopia (Red-blind)",
  },
  deuteranopia: {
    id: "deuteranopia",
    name: "Deuteranopia",
    category: "color-blind",
    description: "Complete: can't see green (missing green cones). About 1% of males.",
    severity: "high",
    scientificName: "Deuteranopia (Green-blind)",
  },
  tritanopia: {
    id: "tritanopia",
    name: "Tritanopia",
    category: "color-blind",
    description: "Complete: can't see blue (missing blue cones). Very rare, about 0.001% of people.",
    severity: "medium",
    scientificName: "Tritanopia (Blue-blind)",
  },
  achromatopsia: {
    id: "achromatopsia",
    name: "Achromatopsia",
    category: "color-blind",
    description: "No color vision: everything looks grey. About 0.003% of people.",
    severity: "critical",
    scientificName: "Achromatopsia (Total color blindness)",
  },
  // Partial Color Vision Deficiencies (Anomalous Trichromacy)
  protanomaly: {
    id: "protanomaly",
    name: "Protanomaly",
    category: "color-blind",
    description: "Partial: red looks weaker (weak red cones). About 1% of males.",
    severity: "medium",
    scientificName: "Protanomaly (Weak red)",
  },
  deuteranomaly: {
    id: "deuteranomaly",
    name: "Deuteranomaly",
    category: "color-blind",
    description: "Partial: green looks weaker (weak green cones). About 5-6% of males, the most common type.",
    severity: "medium",
    scientificName: "Deuteranomaly (Weak green)",
  },
  tritanomaly: {
    id: "tritanomaly",
    name: "Tritanomaly",
    category: "color-blind",
    description: "Partial: blue looks weaker (weak blue cones). Rare, about 0.01% of people.",
    severity: "low",
    scientificName: "Tritanomaly (Weak blue)",
  },
  // Other Visual Impairments
  blurred: {
    id: "blurred",
    name: "Blurred",
    category: "other",
    description: "Blurred vision, as with cataracts or uncorrected eyesight.",
    severity: "medium",
  },
  ghosting: {
    id: "ghosting",
    name: "Ghosting",
    category: "other",
    description: "Double vision (diplopia).",
    severity: "medium",
  },
  yellowing: {
    id: "yellowing",
    name: "Yellowing",
    category: "other",
    description: "Yellow tint from an aging lens or cataracts.",
    severity: "low",
  },
  "loss-of-contrast": {
    id: "loss-of-contrast",
    name: "Loss of Contrast",
    category: "other",
    description: "Reduced contrast sensitivity, common with age.",
    severity: "medium",
  },
  "bright-light": {
    id: "bright-light",
    name: "Bright Light",
    category: "other",
    description: "Light sensitivity (photophobia), or a screen in bright sunlight.",
    severity: "low",
  },
  // Visual Field Defects
  "central-vision-loss": {
    id: "central-vision-loss",
    name: "Central Loss",
    category: "visual-field",
    description: "Macular degeneration: dark, blurry center with clearer edges.",
    severity: "high",
    scientificName: "Macular Degeneration",
  },
  "peripheral-vision-loss": {
    id: "peripheral-vision-loss",
    name: "Peripheral Loss",
    category: "visual-field",
    description: "Glaucoma / tunnel vision: clear center, dark and blurry edges.",
    severity: "high",
    scientificName: "Glaucoma (Tunnel Vision)",
  },
};

/**
 * Ordered list of all filters for UI display
 * Grouped by deficiency type for easier understanding and comparison
 */
export const ALL_FILTERS: Exclude<SimulationType, "original">[] = [
  // Red deficiency (protan)
  "protanopia", // Complete red-blind
  "protanomaly", // Weak red
  // Green deficiency (deutan) - MOST COMMON
  "deuteranopia", // Complete green-blind
  "deuteranomaly", // Weak green (~5-6% of males) - MOST COMMON!
  // Blue deficiency (tritan)
  "tritanopia", // Complete blue-blind
  "tritanomaly", // Weak blue
  // Total color blindness
  "achromatopsia", // Complete absence of color vision
  // Visual field defects
  "central-vision-loss", // Macular degeneration
  "peripheral-vision-loss", // Glaucoma/tunnel vision
  // Other impairments
  "blurred",
  "ghosting",
  "yellowing",
  "loss-of-contrast",
  "bright-light",
];

/**
 * Color blindness filters only (both complete and partial)
 * Grouped by deficiency type for easier understanding
 */
export const COLOR_BLIND_FILTERS: SimulationType[] = [
  // Red deficiency (protan)
  "protanopia", // Complete
  "protanomaly", // Partial
  // Green deficiency (deutan) - MOST COMMON
  "deuteranopia", // Complete
  "deuteranomaly", // Partial (~5-6% males)
  // Blue deficiency (tritan)
  "tritanopia", // Complete
  "tritanomaly", // Partial
  // Total color blindness
  "achromatopsia",
];

/**
 * Complete dichromacy filters (missing cone types)
 */
export const DICHROMACY_FILTERS: ColorBlindnessType[] = [
  "protanopia",
  "deuteranopia",
  "tritanopia",
  "achromatopsia",
];

/**
 * Partial color vision deficiency filters (weak cone types)
 */
export const ANOMALY_FILTERS: ColorBlindnessType[] = [
  "protanomaly",
  "deuteranomaly",
  "tritanomaly",
];

/**
 * Visual field defect filters
 */
export const VISUAL_FIELD_FILTERS: SimulationType[] = [
  "central-vision-loss", // Macular degeneration
  "peripheral-vision-loss", // Glaucoma/tunnel vision
];

/**
 * Other visual impairment filters
 */
export const OTHER_FILTERS: SimulationType[] = [
  "blurred",
  "ghosting",
  "yellowing",
  "loss-of-contrast",
  "bright-light",
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
  format: "PNG" as const,
  constraint: { type: "SCALE" as const, value: 2 }, // 2x for better quality
};

/**
 * Figma can't store images larger than 4096px on a side ("Image is too
 * large"). Designs that would exceed this at 2x are exported at a lower
 * scale; the target leaves a little room for rounding and effects.
 */
export const MAX_IMAGE_SIDE = 4096;
export const MAX_EXPORT_SIDE_TARGET = 4000;

/**
 * Canvas copy label settings
 */
export const LABEL_SETTINGS = {
  fontSize: 14,
  fontFamily: "Inter",
  padding: 8,
  backgroundColor: { r: 0, g: 0, b: 0, a: 0.8 },
  textColor: { r: 255, g: 255, b: 255 },
};

/**
 * Plugin data keys
 */
export const PLUGIN_DATA_KEYS = {
  GENERATED_NODE: "vision-simulator-generated",
  ORIGINAL_NODE_ID: "vision-simulator-original",
  FILTER_TYPE: "vision-simulator-filter",
};

/**
 * Default built-in filter presets
 *
 * These simulate common real-world vision conditions by combining multiple filters.
 */
export const DEFAULT_PRESETS: FilterPreset[] = [
  {
    id: "advanced-cataracts",
    name: "Advanced Cataracts",
    description: "Severe cataracts: heavy blur, yellowing, and contrast loss",
    isBuiltIn: true,
    filters: [
      {
        type: "blurred",
        config: {
          radius: 15,
          iterations: 3,
        },
      },
      {
        type: "yellowing",
        config: {
          intensity: 0.8,
          temperature: 2000,
        },
      },
      {
        type: "loss-of-contrast",
        config: {
          reduction: 0.6,
        },
      },
    ],
  },
  {
    id: "aging-vision-65",
    name: "Aging Vision (65+)",
    description:
      "Typical age-related vision changes: mild blur, yellowing, and slight contrast loss",
    isBuiltIn: true,
    filters: [
      {
        type: "blurred",
        config: {
          radius: 4,
          iterations: 1,
        },
      },
      {
        type: "yellowing",
        config: {
          intensity: 0.3,
          temperature: 2800,
        },
      },
      {
        type: "loss-of-contrast",
        config: {
          reduction: 0.25,
        },
      },
    ],
  },
  {
    id: "aging-vision-80",
    name: "Aging Vision (80+)",
    description:
      "Advanced aging: high blur, yellowing, contrast loss, and central vision degradation",
    isBuiltIn: true,
    filters: [
      {
        type: "blurred",
        config: {
          radius: 10,
          iterations: 2,
        },
      },
      {
        type: "yellowing",
        config: {
          intensity: 0.7,
          temperature: 2200,
        },
      },
      {
        type: "loss-of-contrast",
        config: {
          reduction: 0.5,
        },
      },
      {
        type: "central-vision-loss",
        config: {
          radius: 120,
          severity: 0.4,
        },
      },
    ],
  },
  {
    id: "outdoor-viewing",
    name: "Outdoor Viewing",
    description:
      "Bright sunlight conditions: intense brightness, washout, and glare",
    isBuiltIn: true,
    filters: [
      {
        type: "bright-light",
        config: {
          intensity: 0.8,
          washout: 0.6,
        },
      },
      {
        type: "loss-of-contrast",
        config: {
          reduction: 0.4,
        },
      },
    ],
  },
  {
    id: "night-vision",
    name: "Night Vision",
    description: "Low-light conditions: reduced contrast and mild blur",
    isBuiltIn: true,
    filters: [
      {
        type: "loss-of-contrast",
        config: {
          reduction: 0.55,
        },
      },
      {
        type: "blurred",
        config: {
          radius: 3,
          iterations: 1,
        },
      },
    ],
  },
];

/**
 * Scientific references and resources
 */
export const REFERENCES = {
  brettel1997:
    "Brettel, H., Viénot, F., & Mollon, J. D. (1997). Computerized simulation of color appearance for dichromats. JOSA A, 14(10), 2647-2655.",
  machado2009:
    "Machado, G. M., Oliveira, M. M., & Fernandes, L. A. (2009). A physiologically-based model for simulation of color vision deficiency. IEEE Transactions on Visualization and Computer Graphics, 15(6), 1291-1298.",
  wcag21_contrast:
    "https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html",
  color_blindness_info:
    "https://www.nei.nih.gov/learn-about-eye-health/eye-conditions-and-diseases/color-blindness",
  machado_simulation:
    "https://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/CVD_Simulation.html",
  colorblind_research:
    "https://ixora.io/projects/colorblindness/color-blindness-simulation-research/",
};
