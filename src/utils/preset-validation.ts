/**
 * Preset validation and format upgrade
 *
 * Checks that a preset (from an imported JSON file, or from storage) has the
 * shape the filters expect, so a bad file can't crash the preview. Used by
 * both the UI (import) and the plugin code (loading saved presets).
 *
 * PRESET_FILTER_SPEC is the single description of every filter's settings
 * and allowed ranges in the current format (v2). The checks below use it,
 * and the Preset Manager's filter reference is meant to be built from it
 * too, so the documentation can't drift from what's accepted.
 *
 * Ranges are generous (wider than the sliders) so hand-edited presets still
 * work, but keep out values that would freeze the plugin (e.g. huge blurs).
 *
 * Format versions:
 * - v1 (no "version"): pixel values were in pixels of the plugin's 2x
 *   export, and visual field radii were fixed pixel sizes.
 * - v2: blur radius and ghosting offset in design pixels; visual field
 *   radius as radiusPercent of the design's smaller side.
 * v1 presets are converted with upgradePreset when imported or loaded.
 */

import {
  CompleteFilterConfig,
  FilterPreset,
  PRESET_FORMAT_VERSION,
} from "./vision-simulator.types";

/** One setting of a filter, as written in a preset file */
export interface FilterSettingSpec {
  /** Where it lives, e.g. ["config", "offset", "x"] */
  path: string[];
  min: number;
  max: number;
  unit?: string;
  /** Missing is allowed (a default is used) */
  optional?: boolean;
  about: string;
}

export interface FilterSpec {
  about: string;
  settings: FilterSettingSpec[];
}

const severityAbout = "0 = normal vision, 1 = complete deficiency";

const colorBlindness = (about: string, defaultSeverity: number): FilterSpec => ({
  about,
  settings: [
    {
      path: ["severity"],
      min: 0,
      max: 1,
      optional: true,
      about: `${severityAbout} (default ${defaultSeverity})`,
    },
  ],
});

/** Every filter type a preset can use, with its settings (format v2) */
export const PRESET_FILTER_SPEC: Record<string, FilterSpec> = {
  protanopia: colorBlindness("Can't see red (missing red cones)", 1),
  deuteranopia: colorBlindness("Can't see green (missing green cones)", 1),
  tritanopia: colorBlindness("Can't see blue (missing blue cones)", 1),
  achromatopsia: colorBlindness("No color vision: everything is grey", 1),
  protanomaly: colorBlindness("Red looks weaker (weak red cones)", 0.6),
  deuteranomaly: colorBlindness("Green looks weaker (weak green cones)", 0.6),
  tritanomaly: colorBlindness("Blue looks weaker (weak blue cones)", 0.6),
  "central-vision-loss": {
    about: "Macular degeneration: dark, blurry centre",
    settings: [
      { path: ["config", "radiusPercent"], min: 0, max: 100, unit: "%", about: "Size of the affected centre, as % of the design's smaller side" },
      { path: ["config", "severity"], min: 0, max: 1, about: "0 = no loss, 1 = centre almost black" },
    ],
  },
  "peripheral-vision-loss": {
    about: "Glaucoma / tunnel vision: clear centre, dark edges",
    settings: [
      { path: ["config", "radiusPercent"], min: 0, max: 100, unit: "%", about: "Size of the clear centre, as % of the design's smaller side" },
      { path: ["config", "severity"], min: 0, max: 1, about: "0 = no loss, 1 = edges almost black" },
    ],
  },
  blurred: {
    about: "Blurred vision (cataracts, uncorrected eyesight)",
    settings: [
      { path: ["config", "radius"], min: 0, max: 50, unit: "px", about: "Blur radius in design pixels" },
      { path: ["config", "iterations"], min: 1, max: 10, optional: true, about: "Blur passes; more is smoother (default 1)" },
    ],
  },
  ghosting: {
    about: "Double vision (diplopia)",
    settings: [
      { path: ["config", "offset", "x"], min: -250, max: 250, unit: "px", about: "Horizontal shift of the ghost image, in design pixels" },
      { path: ["config", "offset", "y"], min: -250, max: 250, unit: "px", about: "Vertical shift of the ghost image, in design pixels" },
      { path: ["config", "opacity"], min: 0, max: 1, about: "How visible the ghost image is" },
    ],
  },
  yellowing: {
    about: "Yellow tint from an aging lens or cataracts",
    settings: [
      { path: ["config", "intensity"], min: 0, max: 1, about: "Strength of the tint" },
      { path: ["config", "temperature"], min: 1000, max: 10000, unit: "K", about: "Color temperature; lower is warmer/yellower" },
    ],
  },
  "loss-of-contrast": {
    about: "Reduced contrast sensitivity",
    settings: [
      { path: ["config", "reduction"], min: 0, max: 1, about: "0 = no change, 1 = flat grey" },
    ],
  },
  "bright-light": {
    about: "Light sensitivity, or a screen in bright sunlight",
    settings: [
      { path: ["config", "intensity"], min: 0, max: 1, about: "Brightness increase" },
      { path: ["config", "washout"], min: 0, max: 1, about: "How much colors fade towards white" },
    ],
  },
};

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

function getPath(value: unknown, path: string[]): unknown {
  let current = value;
  for (const key of path) {
    if (!isObject(current)) return undefined;
    current = current[key];
  }
  return current;
}

function settingName(path: string[]): string {
  return path[0] === "config" ? path.slice(1).join(".") : path.join(".");
}

/**
 * v1 files used different settings for some filters: visual field radii in
 * pixels, and blur/ghosting pixels of a 2x export (so wider ranges).
 */
const V1_OVERRIDES: Record<string, FilterSpec> = {
  "central-vision-loss": {
    about: "",
    settings: [
      { path: ["config", "radius"], min: 0, max: 10000, unit: "px", about: "" },
      { path: ["config", "severity"], min: 0, max: 1, about: "" },
    ],
  },
  "peripheral-vision-loss": {
    about: "",
    settings: [
      { path: ["config", "tunnelRadius"], min: 0, max: 10000, unit: "px", about: "" },
      { path: ["config", "severity"], min: 0, max: 1, about: "" },
    ],
  },
  blurred: {
    about: "",
    settings: [
      { path: ["config", "radius"], min: 0, max: 100, unit: "px", about: "" },
      { path: ["config", "iterations"], min: 1, max: 10, optional: true, about: "" },
    ],
  },
  ghosting: {
    about: "",
    settings: [
      { path: ["config", "offset", "x"], min: -500, max: 500, unit: "px", about: "" },
      { path: ["config", "offset", "y"], min: -500, max: 500, unit: "px", about: "" },
      { path: ["config", "opacity"], min: 0, max: 1, about: "" },
    ],
  },
};

/**
 * Check one filter of a preset.
 * @param version - Preset format version (1 or 2)
 * @returns A short reason if it's invalid, or null if it's fine
 */
export function validateFilterConfig(
  filter: unknown,
  version: number = PRESET_FORMAT_VERSION
): string | null {
  if (!isObject(filter) || typeof filter.type !== "string") {
    return "a filter is missing its type";
  }
  const type = filter.type;
  const spec =
    (version === 1 && V1_OVERRIDES[type]) || PRESET_FILTER_SPEC[type];
  if (!spec) return `unknown filter type "${type}"`;

  if (spec.settings.some((s) => s.path[0] === "config") && !isObject(filter.config)) {
    return `${type}: missing "config"`;
  }

  for (const setting of spec.settings) {
    const value = getPath(filter, setting.path);
    if (value === undefined && setting.optional) continue;
    if (!isNumberIn(value, setting.min, setting.max)) {
      const unit = setting.unit ?? "";
      return `${type}: ${settingName(setting.path)} must be a number from ${setting.min}${unit} to ${setting.max}${unit}`;
    }
  }
  return null;
}

/**
 * Check a whole preset.
 * @returns A short reason if it's invalid, or null if it's fine
 */
export function validatePreset(preset: unknown): string | null {
  if (!isObject(preset)) return "a preset isn't an object";

  const version = preset.version === undefined ? 1 : preset.version;
  if (version !== 1 && version !== 2) {
    return `preset format version ${String(preset.version)} isn't supported (made with a newer version of the plugin?)`;
  }
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
    const problem = validateFilterConfig(filter, version);
    if (problem) return `"${name}": ${problem}`;
  }
  return null;
}

/**
 * Reference design size used to convert v1 visual field radii (pixels) to
 * percentages: the same 500px reference Quick simulation's defaults used.
 */
const V1_REFERENCE_SIZE = 500;
/** v1 pixel values were in pixels of a 2x export */
const V1_EXPORT_SCALE = 2;

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

/**
 * Convert a valid preset to the current format (v2). v2 presets are
 * returned with `version` set; v1 presets get their pixel values converted.
 */
export function upgradePreset(preset: FilterPreset): FilterPreset {
  if (preset.version === PRESET_FORMAT_VERSION) return preset;

  const filters = preset.filters.map((filter): CompleteFilterConfig => {
    const legacy = filter as any;
    switch (filter.type) {
      case "blurred":
        return {
          type: "blurred",
          config: { ...legacy.config, radius: legacy.config.radius / V1_EXPORT_SCALE },
        };
      case "ghosting":
        return {
          type: "ghosting",
          config: {
            ...legacy.config,
            offset: {
              x: legacy.config.offset.x / V1_EXPORT_SCALE,
              y: legacy.config.offset.y / V1_EXPORT_SCALE,
            },
          },
        };
      case "central-vision-loss":
        return {
          type: "central-vision-loss",
          config: {
            radiusPercent: clampPercent((legacy.config.radius / V1_REFERENCE_SIZE) * 100),
            severity: legacy.config.severity,
          },
        };
      case "peripheral-vision-loss":
        return {
          type: "peripheral-vision-loss",
          config: {
            radiusPercent: clampPercent((legacy.config.tunnelRadius / V1_REFERENCE_SIZE) * 100),
            severity: legacy.config.severity,
          },
        };
      default:
        return filter;
    }
  });

  return { ...preset, version: PRESET_FORMAT_VERSION, filters };
}

/**
 * Keep only the valid presets from stored or imported data, converted to
 * the current format (v2), with description defaulting to "".
 */
export function sanitizePresets(value: unknown): FilterPreset[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((preset) => validatePreset(preset) === null)
    .map((preset) =>
      upgradePreset({
        ...(preset as FilterPreset),
        description: (preset as FilterPreset).description ?? "",
      })
    );
}
