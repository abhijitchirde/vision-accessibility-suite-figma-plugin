/**
 * Custom presets and the selected preset, saved per user with
 * figma.clientStorage: they follow the user to every file and also work in
 * files they can only view.
 *
 * Older versions saved presets in the document (plugin data). When a file
 * still has those, they are imported into the user's presets once; their ids
 * are remembered so a preset the user deletes isn't imported again. The
 * document data itself is left untouched.
 */

import { FilterPreset } from "../utils/vision-simulator.types";
import { sanitizePresets } from "../utils/preset-validation";

const PRESETS_KEY = "customPresets";
const SELECTED_KEY = "selectedPresetId";
const IMPORTED_LEGACY_KEY = "importedLegacyPresetIds";

// Document plugin-data keys used before presets moved to clientStorage
const LEGACY_PRESETS_KEY = "vision-simulator-presets";
const LEGACY_SELECTED_KEY = "vision-simulator-selected-preset";

async function getStored(key: string): Promise<unknown> {
  return figma.clientStorage.getAsync(key).catch(() => undefined);
}

function readLegacyPresets(): FilterPreset[] {
  try {
    const raw = figma.root.getPluginData(LEGACY_PRESETS_KEY);
    return raw ? sanitizePresets(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

/**
 * Load the user's custom presets, importing any still saved in this
 * document by an older version.
 *
 * @returns The presets, and how many were newly imported from the document
 */
export async function loadCustomPresets(): Promise<{
  presets: FilterPreset[];
  importedFromFile: number;
}> {
  const stored = sanitizePresets(await getStored(PRESETS_KEY));
  const legacy = readLegacyPresets();
  if (legacy.length === 0) return { presets: stored, importedFromFile: 0 };

  const importedValue = await getStored(IMPORTED_LEGACY_KEY);
  const alreadyImported = Array.isArray(importedValue)
    ? importedValue.filter((id): id is string => typeof id === "string")
    : [];

  const known = new Set([...stored.map((p) => p.id), ...alreadyImported]);
  const newPresets = legacy
    .filter((p) => !known.has(p.id))
    .map((p) => ({ ...p, isBuiltIn: false }));

  // Remember every legacy id seen, so deleting one later sticks
  const allImported = Array.from(
    new Set([...alreadyImported, ...legacy.map((p) => p.id)])
  );
  await figma.clientStorage
    .setAsync(IMPORTED_LEGACY_KEY, allImported)
    .catch(() => undefined);

  if (newPresets.length === 0) return { presets: stored, importedFromFile: 0 };

  const merged = [...stored, ...newPresets];
  await saveCustomPresets(merged);
  return { presets: merged, importedFromFile: newPresets.length };
}

/** Save the user's custom presets (invalid ones are dropped) */
export async function saveCustomPresets(presets: unknown): Promise<number> {
  const valid = sanitizePresets(presets).filter((p) => !p.isBuiltIn);
  await figma.clientStorage.setAsync(PRESETS_KEY, valid);
  return valid.length;
}

/** Last selected preset id, falling back to one saved in the document */
export async function loadSelectedPresetId(): Promise<string | null> {
  const stored = await getStored(SELECTED_KEY);
  // "" means the user cleared the selection: don't fall back to the document
  if (typeof stored === "string") return stored || null;
  try {
    return figma.root.getPluginData(LEGACY_SELECTED_KEY) || null;
  } catch {
    return null;
  }
}

/** Save the selected preset id (null clears it) */
export async function saveSelectedPresetId(id: string | null): Promise<void> {
  if (id) {
    await figma.clientStorage.setAsync(SELECTED_KEY, id);
  } else {
    // Store "" rather than deleting, so the document fallback isn't used
    await figma.clientStorage.setAsync(SELECTED_KEY, "");
  }
}
