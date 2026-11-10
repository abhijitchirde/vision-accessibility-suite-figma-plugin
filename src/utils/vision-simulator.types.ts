/**
 * Vision Simulator Type Definitions
 *
 * Defines interfaces for vision impairment simulations
 * including color blindness and other visual conditions
 */

import { Severity } from "../types/common.types";

/**
 * Supported color blindness types
 *
 * Includes both complete dichromacy (missing cone type) and partial
 * color vision deficiencies / anomalous trichromacy (weak cone type).
 */
export type ColorBlindnessType =
  // Complete dichromacy (missing cone types)
  | "protanopia" // Red-blind (missing L-cones) ~1% males
  | "deuteranopia" // Green-blind (missing M-cones) ~1% males
  | "tritanopia" // Blue-blind (missing S-cones) ~0.001% population
  | "achromatopsia" // Total color blindness (no cones) ~0.003% population
  // Partial color vision deficiencies (anomalous trichromacy - weak cone types)
  | "protanomaly" // Weak red (weak L-cones) ~1% males
  | "deuteranomaly" // Weak green (weak M-cones) **~5-6% males** - most common!
  | "tritanomaly"; // Weak blue (weak S-cones) ~0.01% population

/**
 * Visual field defect types
 */
export type VisualFieldDefectType =
  | "central-vision-loss" // Macular degeneration - blur/obscure center
  | "peripheral-vision-loss"; // Glaucoma/tunnel vision - blur/darken edges

/**
 * Other visual impairment types
 */
export type OtherVisionType =
  | "blurred" // Blurred vision (cataracts, uncorrected refractive error)
  | "ghosting" // Double vision (diplopia)
  | "yellowing" // Yellow tint (aging lens, cataracts)
  | "loss-of-contrast" // Reduced contrast sensitivity
  | "bright-light"; // Light sensitivity (photophobia)

/**
 * All supported simulation types
 */
export type SimulationType =
  | ColorBlindnessType
  | VisualFieldDefectType
  | OtherVisionType
  | "original";

/**
 * Filter category for UI organization
 */
export type FilterCategory = "color-blind" | "visual-field" | "other";

/**
 * Filter metadata for UI display
 */
export interface FilterMetadata {
  id: SimulationType;
  name: string;
  category: FilterCategory;
  description: string;
  severity?: Severity; // For informational purposes
  scientificName?: string; // Medical/scientific term
}

/**
 * RGB color representation (0-255)
 */
export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * RGBA color with alpha channel
 */
export interface RGBA extends RGB {
  a: number;
}

/**
 * Color transformation matrix (3x3)
 * Used for color blindness simulations
 */
export type TransformationMatrix = [
  [number, number, number],
  [number, number, number],
  [number, number, number]
];

/**
 * Simulation mode
 */
export type SimulationMode = "preview" | "generate";

/**
 * Options for generating simulations on canvas
 */
export interface GenerateOptions {
  filters: SimulationType[]; // Which filters to apply
  createCopies: boolean; // Create new frames or modify originals
  position?: "right" | "below"; // Where to place generated copies
  spacing?: number; // Space between generated copies (default: 50px)
  includeLabel?: boolean; // Add label to generated copies
}

/**
 * Options for live preview simulation
 */
export interface PreviewOptions {
  filter: SimulationType; // Currently selected filter
  zoom: number; // Zoom level (0.25, 0.5, 1, 2, etc.)
  quality?: "low" | "medium" | "high"; // Preview quality (affects performance)
}

/**
 * Simulation result metadata
 */
export interface SimulationResult {
  nodeId: string;
  nodeName: string;
  originalImage: Uint8Array; // Original image data
  filteredImage: Uint8Array; // Filtered image data
  filter: SimulationType;
  width: number;
  height: number;
  timestamp: number;
}

/**
 * Generated node metadata (stored in plugin data)
 */
export interface GeneratedNodeData {
  isSimulation: true;
  originalNodeId: string;
  /** Simulation applied, or "original" when a preset was applied */
  filter: SimulationType;
  /** Display name used for the frame (filter or preset name) */
  label?: string;
  generatedAt: number;
}

/**
 * Color blindness configuration with severity support
 *
 * Enables simulation of both complete dichromacy and partial color vision
 * deficiencies (anomalous trichromacy) through the severity parameter.
 */
export interface ColorBlindnessConfig {
  type: ColorBlindnessType;
  severity: number; // 0-1 (0 = normal vision, 1 = complete dichromacy)
}

/**
 * Central vision loss configuration (macular degeneration)
 *
 * Simulates loss of central vision while peripheral vision remains clear.
 */
export interface CentralVisionLossConfig {
  radius: number; // Radius of affected center area in pixels
  severity: number; // 0-1 (0 = no loss, 1 = complete center blindness)
}

/**
 * Peripheral vision loss configuration (glaucoma/tunnel vision)
 *
 * Simulates loss of peripheral vision creating a tunnel vision effect.
 */
export interface PeripheralVisionLossConfig {
  tunnelRadius: number; // Radius of clear center area in pixels
  severity: number; // 0-1 (0 = no loss, 1 = extreme tunnel vision)
}

/**
 * Blur configuration
 */
export interface BlurConfig {
  radius: number; // Blur radius in pixels
  iterations?: number; // Number of blur passes (default: 1)
}

/**
 * Ghosting (double vision) configuration
 */
export interface GhostingConfig {
  offset: { x: number; y: number }; // Ghost image offset
  opacity: number; // Ghost image opacity (0-1)
}

/**
 * Yellowing configuration
 */
export interface YellowingConfig {
  intensity: number; // Yellow tint intensity (0-1)
  temperature: number; // Color temperature shift
}

/**
 * Contrast loss configuration
 */
export interface ContrastLossConfig {
  reduction: number; // Contrast reduction factor (0-1)
}

/**
 * Bright light configuration
 */
export interface BrightLightConfig {
  intensity: number; // Brightness increase (0-1)
  washout: number; // Color washout factor (0-1)
}

/**
 * Filter-specific configuration union for "other" filters
 */
export type OtherFilterConfig =
  | { type: "blur"; config: BlurConfig }
  | { type: "ghosting"; config: GhostingConfig }
  | { type: "yellowing"; config: YellowingConfig }
  | { type: "loss-of-contrast"; config: ContrastLossConfig }
  | { type: "bright-light"; config: BrightLightConfig };

/**
 * Complete filter configuration that can represent any filter type
 * with its parameters. Used by the preset system.
 */
export type CompleteFilterConfig =
  | { type: ColorBlindnessType; severity?: number } // default: 1.0 for -opia, 0.6 for -omaly
  | { type: "central-vision-loss"; config: CentralVisionLossConfig }
  | { type: "peripheral-vision-loss"; config: PeripheralVisionLossConfig }
  | { type: "blurred"; config: BlurConfig }
  | { type: "ghosting"; config: GhostingConfig }
  | { type: "yellowing"; config: YellowingConfig }
  | { type: "loss-of-contrast"; config: ContrastLossConfig }
  | { type: "bright-light"; config: BrightLightConfig };

/**
 * Filter preset - a named collection of filters applied sequentially
 */
export interface FilterPreset {
  id: string; // Unique identifier
  name: string; // Display name (e.g., "Advanced Cataracts")
  description: string; // Brief description of what this preset simulates
  filters: CompleteFilterConfig[]; // Filters to apply in sequence
  isBuiltIn?: boolean; // Whether this is a built-in preset (cannot be deleted)
  createdAt?: number; // Timestamp
  updatedAt?: number; // Timestamp
}

/**
 * Filter with optional severity
 *
 * Allows specification of severity for color blindness filters.
 * Severity is optional for backward compatibility - defaults to 1.0 (complete deficiency).
 */
export interface FilterWithSeverity {
  filter: SimulationType;
  severity?: number; // 0-1, only applies to color blindness filters. Defaults to 1.0
}

/**
 * Vision Simulator state
 */
export interface VisionSimulatorState {
  mode: SimulationMode;
  selectedFilters: SimulationType[]; // For generate mode
  currentFilter: SimulationType; // For preview mode
  currentSeverity: number; // Current severity level for color blindness/visual field filters (0-1)
  currentRadius: number; // Current radius for visual field defects

  // Configurations for "other" filters
  blurConfig: BlurConfig;
  ghostingConfig: GhostingConfig;
  yellowingConfig: YellowingConfig;
  contrastLossConfig: ContrastLossConfig;
  brightLightConfig: BrightLightConfig;

  // Preset management
  selectedPreset: FilterPreset | null; // Currently selected preset
  customPresets: FilterPreset[]; // User-created presets

  zoom: number;
  isProcessing: boolean;
  error?: string;
}
