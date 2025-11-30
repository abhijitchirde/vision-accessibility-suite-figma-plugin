/**
 * Preset Storage Utilities
 *
 * Handles saving and loading filter presets from plugin data.
 */

import { FilterPreset } from './vision-simulator.types';

const STORAGE_KEY = 'vision-simulator-presets';

/**
 * Load custom presets from plugin storage
 *
 * @returns Array of custom filter presets
 */
export function loadCustomPresets(): FilterPreset[] {
  try {
    const data = figma.root.getPluginData(STORAGE_KEY);
    if (!data) {
      return [];
    }

    const presets = JSON.parse(data) as FilterPreset[];
    return presets.filter((p) => !p.isBuiltIn); // Only return custom presets
  } catch (error) {
    console.error('Failed to load custom presets:', error);
    return [];
  }
}

/**
 * Save custom presets to plugin storage
 *
 * @param presets - Array of custom filter presets to save
 */
export function saveCustomPresets(presets: FilterPreset[]): void {
  try {
    const customOnly = presets.filter((p) => !p.isBuiltIn);
    figma.root.setPluginData(STORAGE_KEY, JSON.stringify(customOnly));
  } catch (error) {
    console.error('Failed to save custom presets:', error);
  }
}

/**
 * Add a new custom preset
 *
 * @param preset - Preset to add
 * @returns Updated array of all custom presets
 */
export function addCustomPreset(preset: FilterPreset): FilterPreset[] {
  const existingPresets = loadCustomPresets();

  // Ensure the preset has timestamps
  const newPreset: FilterPreset = {
    ...preset,
    isBuiltIn: false,
    createdAt: preset.createdAt || Date.now(),
    updatedAt: Date.now(),
  };

  const updatedPresets = [...existingPresets, newPreset];
  saveCustomPresets(updatedPresets);
  return updatedPresets;
}

/**
 * Update an existing custom preset
 *
 * @param presetId - ID of preset to update
 * @param updates - Partial preset data to update
 * @returns Updated array of all custom presets, or null if preset not found
 */
export function updateCustomPreset(
  presetId: string,
  updates: Partial<Omit<FilterPreset, 'id' | 'isBuiltIn'>>
): FilterPreset[] | null {
  const existingPresets = loadCustomPresets();
  const index = existingPresets.findIndex((p) => p.id === presetId);

  if (index === -1) {
    return null;
  }

  existingPresets[index] = {
    ...existingPresets[index],
    ...updates,
    updatedAt: Date.now(),
  };

  saveCustomPresets(existingPresets);
  return existingPresets;
}

/**
 * Delete a custom preset
 *
 * @param presetId - ID of preset to delete
 * @returns Updated array of remaining custom presets
 */
export function deleteCustomPreset(presetId: string): FilterPreset[] {
  const existingPresets = loadCustomPresets();
  const filteredPresets = existingPresets.filter((p) => p.id !== presetId);
  saveCustomPresets(filteredPresets);
  return filteredPresets;
}

/**
 * Export presets as JSON string
 *
 * @param presets - Presets to export
 * @returns JSON string representation
 */
export function exportPresets(presets: FilterPreset[]): string {
  return JSON.stringify(presets, null, 2);
}

/**
 * Import presets from JSON string
 *
 * @param jsonString - JSON string containing presets
 * @returns Parsed presets array, or null if parsing failed
 */
export function importPresets(jsonString: string): FilterPreset[] | null {
  try {
    const presets = JSON.parse(jsonString) as FilterPreset[];

    // Validate structure
    if (!Array.isArray(presets)) {
      return null;
    }

    // Validate each preset has required fields
    for (const preset of presets) {
      if (!preset.id || !preset.name || !Array.isArray(preset.filters)) {
        return null;
      }
    }

    return presets;
  } catch (error) {
    console.error('Failed to import presets:', error);
    return null;
  }
}
