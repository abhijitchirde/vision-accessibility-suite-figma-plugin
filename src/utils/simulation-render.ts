/**
 * Simulation rendering (pure: no DOM, no Figma API)
 *
 * Turns what the user picked (a Quick simulation card, or the Vision Lab
 * settings) into a filter config, and applies it with applyFilterConfig,
 * the single filter registry in image-utils.ts. Kept separate from the
 * React view so it can be tested on its own.
 */

import {
  SimulationType,
  ColorBlindnessType,
  CompleteFilterConfig,
  FilterPreset,
} from "./vision-simulator.types";
import {
  COLOR_BLIND_FILTERS,
  DEFAULT_BLUR_CONFIG,
  DEFAULT_GHOSTING_CONFIG,
  DEFAULT_YELLOWING_CONFIG,
  DEFAULT_CONTRAST_LOSS_CONFIG,
  DEFAULT_BRIGHT_LIGHT_CONFIG,
  DEFAULT_CENTRAL_VISION_LOSS_CONFIG,
  DEFAULT_PERIPHERAL_VISION_LOSS_CONFIG,
  IMAGE_EXPORT_SETTINGS,
} from "./vision-simulator.constants";
import { applyFilterConfig, applyFilterPreset } from "./image-utils";

/**
 * Image pixels per design pixel for an exported design: the export scale
 * (2x normally; less for very large designs, to stay under Figma's image
 * size limit). Filter settings are in design pixels and use this to
 * convert.
 */
export function imagePixelsPerDesignPixel(exportScale: number | undefined): number {
  return exportScale ?? IMAGE_EXPORT_SETTINGS.constraint.value;
}

/**
 * Filter config for a Quick simulation card (default settings), or null
 * for "original".
 */
export function quickSimulationConfig(
  filter: SimulationType
): CompleteFilterConfig | null {
  if (COLOR_BLIND_FILTERS.includes(filter)) {
    // No severity: type-appropriate default (complete = 1.0, anomalies = 0.6)
    return { type: filter as ColorBlindnessType };
  }
  switch (filter) {
    case "blurred":
      return { type: "blurred", config: DEFAULT_BLUR_CONFIG };
    case "ghosting":
      return { type: "ghosting", config: DEFAULT_GHOSTING_CONFIG };
    case "yellowing":
      return { type: "yellowing", config: DEFAULT_YELLOWING_CONFIG };
    case "loss-of-contrast":
      return { type: "loss-of-contrast", config: DEFAULT_CONTRAST_LOSS_CONFIG };
    case "bright-light":
      return { type: "bright-light", config: DEFAULT_BRIGHT_LIGHT_CONFIG };
    case "central-vision-loss":
      return { type: "central-vision-loss", config: DEFAULT_CENTRAL_VISION_LOSS_CONFIG };
    case "peripheral-vision-loss":
      return { type: "peripheral-vision-loss", config: DEFAULT_PERIPHERAL_VISION_LOSS_CONFIG };
    default:
      return null;
  }
}

/**
 * Apply one Quick simulation filter with its default settings.
 * `pixelScale` is image pixels per design pixel (see
 * imagePixelsPerDesignPixel).
 */
export function renderQuickSimulation(
  source: Uint8ClampedArray,
  width: number,
  height: number,
  filter: SimulationType,
  pixelScale: number = IMAGE_EXPORT_SETTINGS.constraint.value
): Uint8ClampedArray {
  const config = quickSimulationConfig(filter);
  return config
    ? applyFilterConfig(source, width, height, config, pixelScale)
    : source;
}

/** Everything Vision Lab needs to render one view */
export interface VisionLabSettings {
  filter: SimulationType;
  preset: FilterPreset | null;
  severity: number;
  /** Visual field radius as a fraction of the image's smaller side */
  radius: number;
  /** Design pixels */
  blurRadius: number;
  blurIterations: number;
  /** Design pixels */
  ghostingOffsetX: number;
  /** Design pixels */
  ghostingOffsetY: number;
  ghostingOpacity: number;
  yellowingIntensity: number;
  yellowingTemperature: number;
  contrastReduction: number;
  brightLightIntensity: number;
  brightLightWashout: number;
}

/**
 * Filter config for the Vision Lab single-simulation settings, or null for
 * "original".
 */
export function visionLabConfig(
  s: VisionLabSettings
): CompleteFilterConfig | null {
  const filter = s.filter;
  if (COLOR_BLIND_FILTERS.includes(filter)) {
    return { type: filter as ColorBlindnessType, severity: s.severity };
  }
  const radiusPercent = s.radius * 100;
  switch (filter) {
    case "blurred":
      return {
        type: "blurred",
        config: { radius: s.blurRadius, iterations: s.blurIterations },
      };
    case "ghosting":
      return {
        type: "ghosting",
        config: {
          offset: { x: s.ghostingOffsetX, y: s.ghostingOffsetY },
          opacity: s.ghostingOpacity,
        },
      };
    case "yellowing":
      return {
        type: "yellowing",
        config: {
          intensity: s.yellowingIntensity,
          temperature: s.yellowingTemperature,
        },
      };
    case "loss-of-contrast":
      return { type: "loss-of-contrast", config: { reduction: s.contrastReduction } };
    case "bright-light":
      return {
        type: "bright-light",
        config: {
          intensity: s.brightLightIntensity,
          washout: s.brightLightWashout,
        },
      };
    case "central-vision-loss":
      return {
        type: "central-vision-loss",
        config: { radiusPercent, severity: s.severity },
      };
    case "peripheral-vision-loss":
      return {
        type: "peripheral-vision-loss",
        config: { radiusPercent, severity: s.severity },
      };
    default:
      return null;
  }
}

/**
 * Apply the Vision Lab filter or preset. `scale` is image pixels per design
 * pixel, so the downscaled preview matches what "Add current view to Figma"
 * produces. Returns the input unchanged for "original" with no preset.
 */
export function renderVisionLab(
  source: Uint8ClampedArray,
  width: number,
  height: number,
  s: VisionLabSettings,
  scale: number
): Uint8ClampedArray {
  if (s.preset) {
    return applyFilterPreset(source, width, height, s.preset, scale);
  }
  const config = visionLabConfig(s);
  return config ? applyFilterConfig(source, width, height, config, scale) : source;
}
