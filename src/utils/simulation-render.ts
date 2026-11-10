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

/**
 * Default config for a simulation added to the Vision Lab stack: the Quick
 * simulation defaults, with the color blindness severity written out so its
 * slider has a value (1.0 for complete -opia types, 0.6 for -omaly).
 */
export function defaultStackConfig(
  filter: SimulationType
): CompleteFilterConfig | null {
  const config = quickSimulationConfig(filter);
  if (config && COLOR_BLIND_FILTERS.includes(config.type as SimulationType)) {
    const partial = /omaly$/.test(config.type);
    return { type: config.type as ColorBlindnessType, severity: partial ? 0.6 : 1 };
  }
  return config;
}

/**
 * Apply a stack of simulations top to bottom (each one's output is the next
 * one's input). `scale` is image pixels per design pixel, so a downscaled
 * preview matches what "Add current view to Figma" produces. An empty
 * stack returns the input unchanged.
 */
export function renderStack(
  source: Uint8ClampedArray,
  width: number,
  height: number,
  configs: CompleteFilterConfig[],
  scale: number
): Uint8ClampedArray {
  if (configs.length === 0) return source;
  return applyFilterPreset(
    source,
    width,
    height,
    { id: "stack", name: "stack", description: "", filters: configs },
    scale
  );
}

const pct = (value: number | undefined, fallback = 1) =>
  `${Math.round((value ?? fallback) * 100)}%`;
const num = (value: number) => String(Number(value.toFixed(2)));

/** Short one-line description of a config's settings, e.g. "4px · 2 passes" */
export function describeFilterConfig(config: CompleteFilterConfig): string {
  switch (config.type) {
    case "blurred": {
      const passes = config.config.iterations ?? 1;
      return `${num(config.config.radius)}px · ${passes} pass${passes === 1 ? "" : "es"}`;
    }
    case "ghosting":
      return `${num(config.config.offset.x)}, ${num(config.config.offset.y)}px · ${pct(config.config.opacity)}`;
    case "yellowing":
      return `${pct(config.config.intensity)} · ${config.config.temperature}K`;
    case "loss-of-contrast":
      return `−${pct(config.config.reduction)}`;
    case "bright-light":
      return `${pct(config.config.intensity)} · washout ${pct(config.config.washout)}`;
    case "central-vision-loss":
    case "peripheral-vision-loss":
      return `${num(config.config.radiusPercent)}% area · ${pct(config.config.severity)}`;
    default:
      // Color blindness
      return `severity ${pct(
        (config as { severity?: number }).severity,
        /omaly$/.test(config.type) ? 0.6 : 1
      )}`;
  }
}
