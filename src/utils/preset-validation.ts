/**
 * Preset validation
 *
 * Checks that a preset (from an imported JSON file, or from storage) has the
 * shape the filters expect, so a bad file can't crash the preview. Used by
 * both the UI (import) and the plugin code (loading saved presets).
 *
 * Ranges are generous (wider than the sliders) so hand-edited presets still
 * work, but keep values that would freeze the plugin out (e.g. huge blurs).
 */

import { CompleteFilterConfig, FilterPreset } from "./vision-simulator.types";

const COLOR_BLINDNESS_TYPES = [
  "protanopia",
  "deuteranopia",
  "tritanopia",
  "achromatopsia",
  "protanomaly",
  "deuteranomaly",
  "tritanomaly",
];

const MAX_FILTERS_PER_PRESET = 20;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNumberIn(value: unknown, min: number, max: number): boolean {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
  );
}

/**
 * Check one filter of a preset.
 * @returns A short reason if it's invalid, or null if it's fine
 */
export function validateFilterConfig(filter: unknown): string | null {
  if (!isObject(filter) || typeof filter.type !== "string") {
    return "a filter is missing its type";
  }
  const type = filter.type;

  if (COLOR_BLINDNESS_TYPES.indexOf(type) !== -1) {
    if (filter.severity !== undefined && !isNumberIn(filter.severity, 0, 1)) {
      return `${type}: severity must be between 0 and 1`;
    }
    return null;
  }

  const config = filter.config;
  if (!isObject(config)) return `${type}: missing "config"`;

  switch (type) {
    case "blurred":
      if (!isNumberIn(config.radius, 0, 100)) return "blurred: radius must be 0–100";
      if (config.iterations !== undefined && !isNumberIn(config.iterations, 1, 10)) {
        return "blurred: iterations must be 1–10";
      }
      return null;
    case "ghosting": {
      const offset = config.offset;
      if (!isObject(offset) || !isNumberIn(offset.x, -500, 500) || !isNumberIn(offset.y, -500, 500)) {
        return "ghosting: offset needs x and y between -500 and 500";
      }
      if (!isNumberIn(config.opacity, 0, 1)) return "ghosting: opacity must be 0–1";
      return null;
    }
    case "yellowing":
      if (!isNumberIn(config.intensity, 0, 1)) return "yellowing: intensity must be 0–1";
      if (!isNumberIn(config.temperature, 1000, 10000)) {
        return "yellowing: temperature must be 1000–10000";
      }
      return null;
    case "loss-of-contrast":
      if (!isNumberIn(config.reduction, 0, 1)) return "loss-of-contrast: reduction must be 0–1";
      return null;
    case "bright-light":
      if (!isNumberIn(config.intensity, 0, 1)) return "bright-light: intensity must be 0–1";
      if (!isNumberIn(config.washout, 0, 1)) return "bright-light: washout must be 0–1";
      return null;
    case "central-vision-loss":
      if (!isNumberIn(config.radius, 0, 10000)) return "central-vision-loss: radius must be 0–10000";
      if (!isNumberIn(config.severity, 0, 1)) return "central-vision-loss: severity must be 0–1";
      return null;
    case "peripheral-vision-loss":
      if (!isNumberIn(config.tunnelRadius, 0, 10000)) {
        return "peripheral-vision-loss: tunnelRadius must be 0–10000";
      }
      if (!isNumberIn(config.severity, 0, 1)) return "peripheral-vision-loss: severity must be 0–1";
      return null;
    default:
      return `unknown filter type "${type}"`;
  }
}

/**
 * Check a whole preset.
 * @returns A short reason if it's invalid, or null if it's fine
 */
export function validatePreset(preset: unknown): string | null {
  if (!isObject(preset)) return "a preset isn't an object";
  if (typeof preset.id !== "string" || !preset.id.trim() || preset.id.length > 200) {
    return "a preset is missing its id";
  }
  const name = typeof preset.name === "string" ? preset.name : "";
  if (!name.trim() || name.length > 100) {
    return `preset "${preset.id}" needs a name (up to 100 characters)`;
  }
  if (preset.description !== undefined && typeof preset.description !== "string") {
    return `"${name}": description must be text`;
  }
  if (!Array.isArray(preset.filters) || preset.filters.length === 0) {
    return `"${name}" has no filters`;
  }
  if (preset.filters.length > MAX_FILTERS_PER_PRESET) {
    return `"${name}" has more than ${MAX_FILTERS_PER_PRESET} filters`;
  }
  for (const filter of preset.filters) {
    const problem = validateFilterConfig(filter);
    if (problem) return `"${name}": ${problem}`;
  }
  return null;
}

/**
 * Keep only the valid presets from stored data, normalised to the
 * FilterPreset shape (description defaults to "").
 */
export function sanitizePresets(value: unknown): FilterPreset[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((preset) => validatePreset(preset) === null)
    .map((preset) => ({
      ...(preset as FilterPreset),
      description: (preset as FilterPreset).description ?? "",
      filters: (preset as FilterPreset).filters as CompleteFilterConfig[],
    }));
}
