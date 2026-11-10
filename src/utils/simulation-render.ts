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
 * Pixel-based settings (blur radius, ghosting offset, ...) are tuned for a
 * 2x export. Very large designs are exported at a lower scale to stay under
 * Figma's image size limit; this is the factor to scale those settings by.
 */
export function exportPixelFactor(exportScale: number | undefined): number {
  return exportScale ? exportScale / IMAGE_EXPORT_SETTINGS.constraint.value : 1;
}

/**
 * The visual-field defaults are tuned for a 500px image; this keeps the
 * effect the same relative size on any image. Returned in 2x-export pixels
 * (the unit filter configs use), hence the division by pixelScale.
 */
function relativeRadius(
  defaultRadius: number,
  width: number,
  height: number,
  pixelScale: number
): number {
  return ((defaultRadius / 500) * Math.min(width, height)) / pixelScale;
}

/**
 * Filter config for a Quick simulation card (default settings), or null
 * for "original".
 */
export function quickSimulationConfig(
  filter: SimulationType,
  width: number,
  height: number,
  pixelScale: number = 1
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
      return {
        type: "central-vision-loss",
        config: {
          radius: relativeRadius(DEFAULT_CENTRAL_VISION_LOSS_CONFIG.radius, width, height, pixelScale),
          severity: DEFAULT_CENTRAL_VISION_LOSS_CONFIG.severity,
        },
      };
    case "peripheral-vision-loss":
      return {
        type: "peripheral-vision-loss",
        config: {
          tunnelRadius: relativeRadius(DEFAULT_PERIPHERAL_VISION_LOSS_CONFIG.tunnelRadius, width, height, pixelScale),
          severity: DEFAULT_PERIPHERAL_VISION_LOSS_CONFIG.severity,
        },
      };
    default:
      return null;
  }
}

/**
 * Apply one Quick simulation filter with its default settings.
 * `pixelScale` scales pixel-based settings (see exportPixelFactor).
 */
export function renderQuickSimulation(
  source: Uint8ClampedArray,
  width: number,
  height: number,
  filter: SimulationType,
  pixelScale: number = 1
): Uint8ClampedArray {
  const config = quickSimulationConfig(filter, width, height, pixelScale);
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
  blurRadius: number;
  blurIterations: number;
  ghostingOffsetX: number;
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
 * "original". Pixel values come out in 2x-export pixels (see
 * applyFilterConfig); `scale` is this image's size relative to that.
 */
export function visionLabConfig(
  s: VisionLabSettings,
  width: number,
  height: number,
  scale: number
): CompleteFilterConfig | null {
  const filter = s.filter;
  if (COLOR_BLIND_FILTERS.includes(filter)) {
    return { type: filter as ColorBlindnessType, severity: s.severity };
  }
  // The radius slider is a fraction of the image's smaller side
  const fieldRadius = (s.radius * Math.min(width, height)) / scale;
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
        config: { radius: fieldRadius, severity: s.severity },
      };
    case "peripheral-vision-loss":
      return {
        type: "peripheral-vision-loss",
        config: { tunnelRadius: fieldRadius, severity: s.severity },
      };
    default:
      return null;
  }
}

/**
 * Apply the Vision Lab filter or preset. `scale` is the image size relative
 * to the full export; pixel-based settings are scaled by it so the
 * downscaled preview matches what "Add current view to Figma" produces.
 * Returns the input unchanged for "original" with no preset.
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
  const config = visionLabConfig(s, width, height, scale);
  return config ? applyFilterConfig(source, width, height, config, scale) : source;
}
