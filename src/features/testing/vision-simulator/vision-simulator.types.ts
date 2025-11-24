/**
 * Vision Simulator Type Definitions
 *
 * Defines interfaces for vision impairment simulations
 * including color blindness and other visual conditions
 */

import { Severity } from '../../../types/common.types';

/**
 * Supported color blindness types
 */
export type ColorBlindnessType =
  | 'protanopia'      // Red-blind (missing L-cones)
  | 'deuteranopia'    // Green-blind (missing M-cones)
  | 'tritanopia'      // Blue-blind (missing S-cones)
  | 'achromatopsia';  // Total color blindness (no cones)

/**
 * Other visual impairment types
 */
export type OtherVisionType =
  | 'blurred'         // Blurred vision (cataracts, uncorrected refractive error)
  | 'ghosting'        // Double vision (diplopia)
  | 'yellowing'       // Yellow tint (aging lens, cataracts)
  | 'loss-of-contrast' // Reduced contrast sensitivity
  | 'bright-light';   // Light sensitivity (photophobia)

/**
 * All supported simulation types
 */
export type SimulationType = ColorBlindnessType | OtherVisionType | 'original';

/**
 * Filter category for UI organization
 */
export type FilterCategory = 'color-blind' | 'other';

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
export type SimulationMode = 'preview' | 'generate';

/**
 * Options for generating simulations on canvas
 */
export interface GenerateOptions {
  filters: SimulationType[]; // Which filters to apply
  createCopies: boolean; // Create new frames or modify originals
  position?: 'right' | 'below'; // Where to place generated copies
  spacing?: number; // Space between generated copies (default: 50px)
  includeLabel?: boolean; // Add label to generated copies
}

/**
 * Options for live preview simulation
 */
export interface PreviewOptions {
  filter: SimulationType; // Currently selected filter
  zoom: number; // Zoom level (0.25, 0.5, 1, 2, etc.)
  quality?: 'low' | 'medium' | 'high'; // Preview quality (affects performance)
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
  filter: SimulationType;
  generatedAt: number;
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
 * Filter-specific configuration union
 */
export type FilterConfig =
  | { type: 'blur'; config: BlurConfig }
  | { type: 'ghosting'; config: GhostingConfig }
  | { type: 'yellowing'; config: YellowingConfig }
  | { type: 'loss-of-contrast'; config: ContrastLossConfig }
  | { type: 'bright-light'; config: BrightLightConfig };

/**
 * Vision Simulator state
 */
export interface VisionSimulatorState {
  mode: SimulationMode;
  selectedFilters: SimulationType[]; // For generate mode
  currentFilter: SimulationType; // For preview mode
  zoom: number;
  isProcessing: boolean;
  error?: string;
}
