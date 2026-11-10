/**
 * Simulation rendering (pure: no DOM, no Figma API)
 *
 * Turns what the user picked (a Quick simulation card, or the Vision Lab
 * settings) into filtered pixels. Kept separate from the React view so it
 * can be tested on its own.
 */

import {
  SimulationType,
  ColorBlindnessType,
  FilterPreset,
} from "./vision-simulator.types";
import {
  COLOR_BLIND_FILTERS,
  DEFAULT_BLUR_CONFIG,
  DEFAULT_GHOSTING_CONFIG,
  DEFAULT_CENTRAL_VISION_LOSS_CONFIG,
  DEFAULT_PERIPHERAL_VISION_LOSS_CONFIG,
  IMAGE_EXPORT_SETTINGS,
} from "./vision-simulator.constants";
import {
  applyColorBlindness,
  applyBlur,
  applyGhosting,
  applyYellowing,
  applyContrastLoss,
  applyBrightLight,
  applyCentralVisionLoss,
  applyPeripheralVisionLoss,
  applyFilterPreset,
  scaleBlurRadius,
} from "./image-utils";

/**
 * Pixel-based settings (blur radius, ghosting offset, ...) are tuned for a
 * 2x export. Very large designs are exported at a lower scale to stay under
 * Figma's image size limit; this is the factor to scale those settings by.
 */
export function exportPixelFactor(exportScale: number | undefined): number {
  return exportScale ? exportScale / IMAGE_EXPORT_SETTINGS.constraint.value : 1;
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
  let filtered: Uint8ClampedArray = source;

  if (COLOR_BLIND_FILTERS.includes(filter)) {
    // Type-appropriate default severity (complete = 1.0, anomalies = 0.6)
    filtered = applyColorBlindness(source, filter as ColorBlindnessType);
  } else if (filter === "blurred") {
    filtered = applyBlur(source, width, height, {
      ...DEFAULT_BLUR_CONFIG,
      radius: scaleBlurRadius(DEFAULT_BLUR_CONFIG.radius, pixelScale),
    });
  } else if (filter === "ghosting") {
    const { offset } = DEFAULT_GHOSTING_CONFIG;
    filtered = applyGhosting(source, width, height, {
      ...DEFAULT_GHOSTING_CONFIG,
      offset: {
        x: Math.round(offset.x * pixelScale),
        y: Math.round(offset.y * pixelScale),
      },
    });
  } else if (filter === "yellowing") {
    filtered = applyYellowing(source);
  } else if (filter === "loss-of-contrast") {
    filtered = applyContrastLoss(source);
  } else if (filter === "bright-light") {
    filtered = applyBrightLight(source);
  } else if (filter === "central-vision-loss") {
    // Scale the radius with the image so the effect looks the same at any size
    // (default radii are tuned for a 500px image)
    const imageSize = Math.min(width, height);
    filtered = applyCentralVisionLoss(
      source,
      width,
      height,
      {
        radius: (DEFAULT_CENTRAL_VISION_LOSS_CONFIG.radius / 500) * imageSize,
        severity: DEFAULT_CENTRAL_VISION_LOSS_CONFIG.severity,
      },
      pixelScale
    );
  } else if (filter === "peripheral-vision-loss") {
    // Same scaling as central vision loss
    const imageSize = Math.min(width, height);
    filtered = applyPeripheralVisionLoss(
      source,
      width,
      height,
      {
        tunnelRadius:
          (DEFAULT_PERIPHERAL_VISION_LOSS_CONFIG.tunnelRadius / 500) *
          imageSize,
        severity: DEFAULT_PERIPHERAL_VISION_LOSS_CONFIG.severity,
      },
      pixelScale
    );
  }

  return filtered;
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

  const filter = s.filter;
  if (filter === "original") return source;

  if (COLOR_BLIND_FILTERS.includes(filter)) {
    return applyColorBlindness(source, filter as ColorBlindnessType, s.severity);
  }

  switch (filter) {
    case "blurred":
      return applyBlur(source, width, height, {
        radius: scaleBlurRadius(s.blurRadius, scale),
        iterations: s.blurIterations,
      });
    case "ghosting":
      return applyGhosting(source, width, height, {
        offset: {
          x: Math.round(s.ghostingOffsetX * scale),
          y: Math.round(s.ghostingOffsetY * scale),
        },
        opacity: s.ghostingOpacity,
      });
    case "yellowing":
      return applyYellowing(source, {
        intensity: s.yellowingIntensity,
        temperature: s.yellowingTemperature,
      });
    case "loss-of-contrast":
      return applyContrastLoss(source, { reduction: s.contrastReduction });
    case "bright-light":
      return applyBrightLight(source, {
        intensity: s.brightLightIntensity,
        washout: s.brightLightWashout,
      });
    case "central-vision-loss":
      return applyCentralVisionLoss(
        source,
        width,
        height,
        { radius: s.radius * Math.min(width, height), severity: s.severity },
        scale
      );
    case "peripheral-vision-loss":
      return applyPeripheralVisionLoss(
        source,
        width,
        height,
        {
          tunnelRadius: s.radius * Math.min(width, height),
          severity: s.severity,
        },
        scale
      );
    default:
      return source;
  }
}
