# Vision Accessibility Suite - Data Models & Storage Strategy

**Version**: 1.0
**Last Updated**: 2025-12-09
**Status**: Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Storage Architecture](#storage-architecture)
3. [Data Models](#data-models)
4. [Storage Keys](#storage-keys)
5. [Data Versioning](#data-versioning)
6. [Export Formats](#export-formats)
7. [Best Practices](#best-practices)
8. [Performance Optimization](#performance-optimization)

---

## Overview

### Storage Strategy

Vision Accessibility Suite stores all data locally in Figma files using the Plugin Data API. This ensures:

- **Privacy**: No external data transmission
- **Persistence**: Data survives file close/reopen
- **Sync**: Automatic with Figma's file sync
- **Portability**: Data travels with the file

For complete implementation details, see [implementation.md](./implementation.md).

### Storage Layers

```
┌─────────────────────────────────────────┐
│        Plugin-Level Storage              │
│  - Custom presets                        │
│  - Selected preset/filter                │
│  - Global settings                       │
└─────────────────────────────────────────┘
                   │
                   ↓
           Figma Plugin Data API
          (figma.root.setPluginData)
```

---

## Storage Architecture

### Plugin Data API Usage

The plugin uses Figma's Plugin Data API to store data at the document root level:

```typescript
// Save data
figma.root.setPluginData(key, JSON.stringify(value));

// Load data
const data = figma.root.getPluginData(key);
const parsed = data ? JSON.parse(data) : null;
```

### Storage Service

**File**: `src/services/storage.service.ts`

```typescript
export class StorageService {
  /**
   * Save plugin data to Figma root
   */
  async setPluginData<T>(key: string, value: T): Promise<void> {
    try {
      figma.root.setPluginData(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to save plugin data for key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Load plugin data from Figma root
   */
  async getPluginData<T>(key: string): Promise<T | null> {
    try {
      const data = figma.root.getPluginData(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Failed to load plugin data for key: ${key}`, error);
      return null;
    }
  }

  /**
   * Delete plugin data
   */
  async deletePluginData(key: string): Promise<void> {
    try {
      figma.root.setPluginData(key, "");
    } catch (error) {
      console.error(`Failed to delete plugin data for key: ${key}`, error);
      throw error;
    }
  }
}
```

---

## Data Models

### 1. Filter Preset

**File**: `src/utils/vision-simulator.types.ts`

```typescript
export interface FilterPreset {
  id: string; // Unique identifier (e.g., "advanced-cataracts")
  name: string; // Display name (e.g., "Advanced Cataracts")
  description: string; // Brief description
  filters: CompleteFilterConfig[]; // Array of filters to apply sequentially
  isBuiltIn?: boolean; // true for built-in presets (cannot be deleted)
  createdAt?: number; // Timestamp (milliseconds)
  updatedAt?: number; // Timestamp (milliseconds)
}
```

**Example**:

```json
{
  "id": "advanced-cataracts",
  "name": "Advanced Cataracts",
  "description": "Severe cataracts with blur, yellowing, and contrast loss",
  "filters": [
    {
      "type": "blurred",
      "config": { "radius": 15, "iterations": 3 }
    },
    {
      "type": "yellowing",
      "config": { "intensity": 0.8, "temperature": 2000 }
    },
    {
      "type": "loss-of-contrast",
      "config": { "reduction": 0.6 }
    }
  ],
  "isBuiltIn": true,
  "createdAt": 1702234567890
}
```

---

### 2. Complete Filter Config

**File**: `src/utils/vision-simulator.types.ts`

```typescript
export type CompleteFilterConfig =
  | { type: ColorBlindnessType; severity: number }
  | { type: "central-vision-loss"; config: CentralVisionLossConfig }
  | { type: "peripheral-vision-loss"; config: PeripheralVisionLossConfig }
  | { type: "blurred"; config: BlurConfig }
  | { type: "ghosting"; config: GhostingConfig }
  | { type: "yellowing"; config: YellowingConfig }
  | { type: "loss-of-contrast"; config: ContrastLossConfig }
  | { type: "bright-light"; config: BrightLightConfig };
```

---

### 3. Filter Type Definitions

#### Color Blindness Types

```typescript
export type ColorBlindnessType =
  | "protanopia" // Red-blind (missing L-cones)
  | "deuteranopia" // Green-blind (missing M-cones)
  | "tritanopia" // Blue-blind (missing S-cones)
  | "achromatopsia" // Total color blindness (no cones)
  | "protanomaly" // Weak red (weak L-cones)
  | "deuteranomaly" // Weak green (weak M-cones)
  | "tritanomaly"; // Weak blue (weak S-cones)
```

**Config Format**:

```typescript
// Simple severity-based config
{ type: 'deuteranomaly', severity: 0.6 }  // 0.0 - 1.0
```

---

#### Visual Field Defect Configs

```typescript
export interface CentralVisionLossConfig {
  radius: number; // 50 - 300 (pixels)
  severity: number; // 0.0 - 1.0
}

export interface PeripheralVisionLossConfig {
  tunnelRadius: number; // 30 - 200 (pixels)
  severity: number; // 0.0 - 1.0
}
```

**Example**:

```json
{
  "type": "central-vision-loss",
  "config": {
    "radius": 150,
    "severity": 0.8
  }
}
```

---

#### Other Visual Impairment Configs

```typescript
export interface BlurConfig {
  radius: number; // 1 - 20 (pixels)
  iterations: number; // 1 - 5 (blur passes)
}

export interface GhostingConfig {
  offset: {
    x: number; // -20 to +20 (pixels)
    y: number; // -20 to +20 (pixels)
  };
  opacity: number; // 0.0 - 1.0
}

export interface YellowingConfig {
  intensity: number; // 0.0 - 1.0
  temperature: number; // 2000 - 3500 (Kelvin)
}

export interface ContrastLossConfig {
  reduction: number; // 0.0 - 1.0
}

export interface BrightLightConfig {
  intensity: number; // 0.0 - 1.0
  washout: number; // 0.0 - 1.0 (desaturation)
}
```

---

### 4. Plugin Settings

```typescript
export interface PluginSettings {
  theme: "light" | "dark" | "auto";
  version: string;
}
```

**Example**:

```json
{
  "theme": "dark",
  "version": "1.0.0"
}
```

---

### 5. Selected State

```typescript
export interface SelectedState {
  presetId: string | null; // Currently selected preset ID (or null)
  filterId: string | null; // Currently selected filter ID (or null)
}
```

**Note**: Preset and filter are mutually exclusive. When a preset is selected, filterId is null, and vice versa.

---

## Storage Keys

**File**: `src/constants/storage.constants.ts`

```typescript
export const STORAGE_KEYS = {
  // Custom presets (array of FilterPreset)
  VISION_SIMULATOR_PRESETS: "vision-simulator-presets",

  // Selected preset ID (string | null)
  VISION_SIMULATOR_SELECTED_PRESET: "vision-simulator-selected-preset",

  // Plugin settings
  SETTINGS: "vision-simulator-settings",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
```

### Storage Key Usage

| Key                                | Data Type        | Purpose                         | Example                               |
| ---------------------------------- | ---------------- | ------------------------------- | ------------------------------------- |
| `vision-simulator-presets`         | `FilterPreset[]` | Custom presets created by user  | Array of preset objects               |
| `vision-simulator-selected-preset` | `string \| null` | ID of currently selected preset | `"advanced-cataracts"` or `null`      |
| `vision-simulator-settings`        | `PluginSettings` | Global plugin settings          | `{ theme: "dark", version: "1.0.0" }` |

---

## Data Versioning

### Version Strategy

All stored data includes a version field for future migrations:

```typescript
interface VersionedData<T> {
  version: string; // Semantic version (e.g., "1.0.0")
  data: T;
}
```

### Migration Example

```typescript
function migratePresets(stored: any): FilterPreset[] {
  // Check version
  if (stored.version === "1.0.0") {
    // Current version, no migration needed
    return stored.data;
  }

  // Future migrations
  if (stored.version === "0.9.0") {
    // Migrate from 0.9.0 to 1.0.0
    return migrateFrom_0_9_0_to_1_0_0(stored.data);
  }

  // Default: return as-is
  return stored.data || [];
}
```

### Current Version

**Plugin Version**: `1.0.0`

**Data Schema Version**: `1.0.0`

---

## Export Formats

### JSON Export (Presets)

**File Format**: `.json`

**Structure**:

```json
[
  {
    "id": "my-custom-preset",
    "name": "My Custom Preset",
    "description": "Custom combination of filters",
    "filters": [
      {
        "type": "deuteranomaly",
        "severity": 0.6
      },
      {
        "type": "blurred",
        "config": {
          "radius": 8,
          "iterations": 2
        }
      }
    ],
    "createdAt": 1702234567890,
    "updatedAt": 1702234567890
  }
]
```

### Import Validation

```typescript
function validatePresetImport(data: any): FilterPreset[] | null {
  try {
    // Parse JSON
    const parsed = typeof data === "string" ? JSON.parse(data) : data;

    // Must be array
    if (!Array.isArray(parsed)) {
      return null;
    }

    // Validate each preset
    for (const preset of parsed) {
      // Required fields
      if (!preset.id || typeof preset.id !== "string") return null;
      if (!preset.name || typeof preset.name !== "string") return null;
      if (!Array.isArray(preset.filters)) return null;

      // Validate filters array
      for (const filter of preset.filters) {
        if (!filter.type || typeof filter.type !== "string") return null;
        // Additional validation based on filter type...
      }
    }

    return parsed;
  } catch (error) {
    console.error("Preset import validation failed:", error);
    return null;
  }
}
```

---

## Best Practices

### 1. Data Consistency

Always use the StorageService for data operations:

```typescript
// ✅ Good
const storageService = new StorageService();
await storageService.setPluginData(
  STORAGE_KEYS.VISION_SIMULATOR_PRESETS,
  presets
);

// ❌ Bad - Direct API usage bypasses error handling
figma.root.setPluginData("vision-simulator-presets", JSON.stringify(presets));
```

### 2. Error Handling

Always handle potential errors:

```typescript
try {
  const presets = await storageService.getPluginData<FilterPreset[]>(
    STORAGE_KEYS.VISION_SIMULATOR_PRESETS
  );

  if (!presets) {
    // Handle missing data
    console.log("No presets found, using defaults");
    return DEFAULT_PRESETS;
  }

  return presets;
} catch (error) {
  console.error("Failed to load presets:", error);
  return DEFAULT_PRESETS;
}
```

### 3. Default Values

Always provide sensible defaults:

```typescript
const presets = (await loadPresets()) || DEFAULT_PRESETS;
const selectedPresetId = (await loadSelectedPreset()) || null;
const settings = (await loadSettings()) || DEFAULT_SETTINGS;
```

### 4. Data Validation

Validate data before using it:

```typescript
function isValidPreset(preset: any): preset is FilterPreset {
  return (
    typeof preset === "object" &&
    typeof preset.id === "string" &&
    typeof preset.name === "string" &&
    Array.isArray(preset.filters) &&
    preset.filters.every(isValidFilter)
  );
}
```

### 5. Atomic Updates

Update related data together:

```typescript
// ✅ Good - Update both preset list and selection together
async function deletePreset(presetId: string) {
  // Remove from list
  const updatedPresets = customPresets.filter((p) => p.id !== presetId);
  await storageService.setPluginData(
    STORAGE_KEYS.VISION_SIMULATOR_PRESETS,
    updatedPresets
  );

  // Clear selection if deleted preset was selected
  if (selectedPresetId === presetId) {
    await storageService.setPluginData(
      STORAGE_KEYS.VISION_SIMULATOR_SELECTED_PRESET,
      null
    );
  }
}
```

---

## Performance Optimization

### 1. Batch Operations

Minimize storage API calls:

```typescript
// ✅ Good - Single save operation
const batchUpdate = async (presets: FilterPreset[], selectedId: string) => {
  await Promise.all([
    storageService.setPluginData(
      STORAGE_KEYS.VISION_SIMULATOR_PRESETS,
      presets
    ),
    storageService.setPluginData(
      STORAGE_KEYS.VISION_SIMULATOR_SELECTED_PRESET,
      selectedId
    ),
  ]);
};

// ❌ Bad - Multiple sequential saves
await storageService.setPluginData(
  STORAGE_KEYS.VISION_SIMULATOR_PRESETS,
  presets
);
await storageService.setPluginData(
  STORAGE_KEYS.VISION_SIMULATOR_SELECTED_PRESET,
  selectedId
);
```

### 2. Caching

Cache frequently accessed data in memory:

```typescript
class PresetCache {
  private cache: FilterPreset[] | null = null;
  private storageService: StorageService;

  async getPresets(): Promise<FilterPreset[]> {
    if (this.cache) {
      return this.cache;
    }

    const presets = await this.storageService.getPluginData<FilterPreset[]>(
      STORAGE_KEYS.VISION_SIMULATOR_PRESETS
    );

    this.cache = presets || DEFAULT_PRESETS;
    return this.cache;
  }

  async updatePresets(presets: FilterPreset[]): Promise<void> {
    await this.storageService.setPluginData(
      STORAGE_KEYS.VISION_SIMULATOR_PRESETS,
      presets
    );
    this.cache = presets; // Update cache
  }

  clearCache(): void {
    this.cache = null;
  }
}
```

### 3. Lazy Loading

Load data only when needed:

```typescript
// ✅ Good - Load presets only when preset manager opens
const openPresetManager = async () => {
  setIsLoading(true);
  const presets = await loadPresets();
  setCustomPresets(presets);
  setIsLoading(false);
  setIsManagerOpen(true);
};

// ❌ Bad - Load presets on plugin mount even if never used
useEffect(() => {
  loadPresets().then(setCustomPresets);
}, []);
```

### 4. Debouncing

Debounce frequent updates:

```typescript
import { debounce } from "lodash";

const debouncedSave = debounce(async (preset: FilterPreset) => {
  await storageService.setPluginData(
    STORAGE_KEYS.VISION_SIMULATOR_SELECTED_PRESET,
    preset.id
  );
}, 500);

// Call multiple times, but only saves once after 500ms
debouncedSave(preset);
```

---

## Storage Limits

### Figma Plugin Data API Limits

- **Per-key limit**: ~1 MB (recommended: keep under 500 KB)
- **Total limit**: Plugin data is stored in Figma file
- **Performance**: Large data affects file load time

### Best Practices for Large Data

1. **Compress data**: Use shorter keys and compact JSON
2. **Split data**: Use multiple keys for large datasets
3. **Clean up**: Remove unused data periodically

---

## Message Protocol for Storage

### Save Presets Flow

```
UI → Plugin Code
Message: VISION_SIMULATOR_SAVE_PRESETS
Data: { presets: FilterPreset[] }

Plugin Code → Storage
figma.root.setPluginData('vision-simulator-presets', JSON.stringify(presets))

Plugin Code → UI
Message: VISION_SIMULATOR_PRESETS_SAVED
Data: { success: true, count: 3 }
```

### Load Presets Flow

```
UI → Plugin Code
Message: VISION_SIMULATOR_LOAD_PRESETS

Plugin Code → Storage
const data = figma.root.getPluginData('vision-simulator-presets')
const presets = JSON.parse(data)

Plugin Code → UI
Message: VISION_SIMULATOR_PRESETS_LOADED
Data: { presets: FilterPreset[] }
```

---

## References

For complete implementation details, see:

- **[implementation.md](./implementation.md)** - Complete storage implementation
- **[plugin-architecture.md](./plugin-architecture.md)** - System architecture
- **[component-structure.md](./component-structure.md)** - UI components

---

**Document Status**: ✅ Complete
**Last Review**: 2025-12-09
**Next Review**: After storage updates
