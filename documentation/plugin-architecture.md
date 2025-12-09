# Vision Accessibility Suite - Plugin Architecture

**Version**: 1.0
**Last Updated**: 2025-12-09
**Status**: Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [High-Level Architecture](#high-level-architecture)
3. [System Components](#system-components)
4. [Technology Stack](#technology-stack)
5. [Data Flow](#data-flow)
6. [Storage Architecture](#storage-architecture)
7. [Module Structure](#module-structure)
8. [Communication Patterns](#communication-patterns)
9. [Performance Considerations](#performance-considerations)
10. [Scalability & Extensibility](#scalability--extensibility)

---

## Overview

**Vision Accessibility Suite** is a Figma plugin designed to help designers test their designs for visual accessibility. The plugin provides real-time simulation of 14 different visual impairments, enabling designers to build more inclusive and accessible interfaces.

### Core Principles

- **Offline-First**: All core features work without internet connection
- **Privacy-Friendly**: All data stored locally in Figma files
- **Standards-Based**: Implements peer-reviewed color vision science
- **Real-Time**: Immediate filter application and preview
- **Client-Side Processing**: All image processing done in UI thread using Canvas API
- **Scientific Accuracy**: Based on Brettel-Viénot-Mollon (1997) research
- **Two Operating Modes**: Vision Lab (live preview) and Generate (canvas artifacts)

### Architecture Goals

1. **Separation of Concerns**: Clear boundaries between UI, business logic, and Figma API
2. **Modularity**: Filter processing is modular and extensible
3. **Performance**: Client-side Canvas API for GPU-accelerated processing
4. **Reusability**: Shared utilities and components
5. **Testability**: Easy to unit test and validate
6. **Scientific Accuracy**: Peer-reviewed transformation matrices

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FIGMA PLUGIN                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌────────────────────────┐    │
│  │   Plugin Code    │◄───────►│      UI Thread         │    │
│  │   (code.ts)      │  Messages│   (VisionSimulator     │    │
│  │                  │         │        Panel)           │    │
│  │  - Node export   │         │  - Canvas API filters  │    │
│  │  - Frame creation│         │  - Real-time preview   │    │
│  │  - Plugin data   │         │  - User controls       │    │
│  │  - Selection mgmt│         │  - Preset management   │    │
│  └──────────────────┘         └────────────────────────┘    │
│           │                              │                   │
│           ▼                              ▼                   │
│  ┌──────────────────┐         ┌────────────────────────┐    │
│  │  Image Export    │         │   Image Processing     │    │
│  │  Service         │         │  - Matrix transforms   │    │
│  │  - exportAsync   │         │  - Blur algorithms     │    │
│  │  - PNG encoding  │         │  - Visual effects      │    │
│  └──────────────────┘         │  - Preset pipeline     │    │
│                                └────────────────────────┘    │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Figma Plugin Data Storage                  │   │
│  │  - Custom presets                                     │   │
│  │  - Selected preset/filter state                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## System Components

### 1. UI Layer (React)

**Responsibility**: User interface and interaction handling

#### Main Components

##### MainView

- Main panel component with two operating modes (tabs)
- **Vision Lab Mode**: Live preview with auto-loading
- **Generate Mode**: Canvas frame generation
- Filter selection dropdown
- Preset selector and manager
- Severity/parameter controls
- Zoom controls (25%-400%)
- Canvas preview area

##### Filter Controls

- **FilterDropdown**: 14 filter type selection
- **SeveritySlider**: Adjustable intensity (0-100%)
- **RadiusSlider**: Visual field radius control
- **FilterParameterSlider**: Generic parameter control
- **Advanced Parameters Panel**: Collapsible fine-tuning controls

##### Preset System

- **PresetSelector**: Dropdown for built-in and custom presets
- **PresetManager**: Modal for import/export/delete operations
- **PresetDropdown**: Preset selection UI

##### Shared UI Components

- `Button`: Primary, secondary actions
- `Card`: Tool cards with icons
- `Badge`: Status indicators
- `Checkbox`: Toggle options
- `Icon`: SVG icon system
- `ThemeToggle`: Light/dark mode switch
- `BottomSection`: Credits and settings

### 2. Plugin Code Layer

**Responsibility**: Figma API interaction and image export

#### Core Services

##### SelectionService

- Track current selection
- Emit selection change events
- Trigger auto-loading in Vision Lab mode

```typescript
interface ISelectionService {
  getCurrentSelection(): SceneNode[];
  onSelectionChange(callback: () => void): void;
  clearListeners(): void;
}
```

##### StorageService

- Read/write plugin data to Figma root
- Manage presets and settings
- Handle selected preset persistence

```typescript
interface IStorageService {
  setPluginData<T>(key: string, value: T): Promise<void>;
  getPluginData<T>(key: string): Promise<T | null>;
}
```

#### Utility Layer

##### ImageUtils (Client-Side)

```typescript
interface IImageUtils {
  applyColorBlindness(
    imageData: Uint8ClampedArray,
    type: ColorBlindnessType,
    severity: number
  ): Uint8ClampedArray;
  applyGaussianBlur(
    imageData: Uint8ClampedArray,
    width: number,
    height: number,
    radius: number,
    iterations: number
  ): Uint8ClampedArray;
  applyCentralVisionLoss(
    imageData: Uint8ClampedArray,
    width: number,
    height: number,
    config: CentralVisionLossConfig
  ): Uint8ClampedArray;
  applyPeripheralVisionLoss(
    imageData: Uint8ClampedArray,
    width: number,
    height: number,
    config: PeripheralVisionLossConfig
  ): Uint8ClampedArray;
  applyYellowing(
    imageData: Uint8ClampedArray,
    config: YellowingConfig
  ): Uint8ClampedArray;
  applyGhosting(
    imageData: Uint8ClampedArray,
    width: number,
    height: number,
    config: GhostingConfig
  ): Uint8ClampedArray;
  applyContrastLoss(
    imageData: Uint8ClampedArray,
    config: ContrastLossConfig
  ): Uint8ClampedArray;
  applyBrightLight(
    imageData: Uint8ClampedArray,
    config: BrightLightConfig
  ): Uint8ClampedArray;
}
```

##### VisionSimulatorConstants

- Transformation matrices (Brettel-Viénot-Mollon)
- Default filter configurations
- Built-in presets (5 professional presets)
- WCAG constants

##### PresetStorage

- Save/load custom presets
- Import/export JSON
- Validate preset structure
- Handle duplicate IDs

---

## Technology Stack

### Core Technologies

| Layer                | Technology      | Purpose                      |
| -------------------- | --------------- | ---------------------------- |
| **UI Framework**     | React 18.3+     | Component-based UI           |
| **Language**         | TypeScript 5.6+ | Type-safe development        |
| **Build Tool**       | Webpack 5       | Bundling and optimization    |
| **Styling**          | CSS Modules     | Scoped component styles      |
| **State Management** | React Hooks     | Lightweight state management |
| **Image Processing** | Canvas API      | Client-side, GPU-accelerated |

### Development Dependencies

```json
{
  "core": ["@figma/plugin-typings", "react", "react-dom", "typescript"],
  "build": [
    "webpack",
    "webpack-cli",
    "ts-loader",
    "css-loader",
    "style-loader",
    "html-webpack-plugin"
  ]
}
```

---

## Data Flow

### 1. Vision Lab Mode - Complete Flow

```
1. User opens plugin → MainView mounts
   ↓
2. UI sends: VISION_SIMULATOR_PANEL_MOUNTED
   ↓
3. code.ts sets visionSimulatorPanelActive = true
   ↓
4. SelectionService detects selection → autoLoadVisionSimulatorPreview()
   ↓
5. code.ts exports selected node as PNG (2x scale)
   ↓
6. code.ts sends: VISION_SIMULATOR_PREVIEW_DATA
   { imageData: Uint8Array, width: 2048, height: 1536, nodeName: "..." }
   ↓
7. UI receives image data → loads into <img> element
   ↓
8. UI draws to canvas → getImageData()
   ↓
9. User selects filter → applyColorBlindness() / applyBlur() / etc.
   ↓
10. UI updates canvas with filtered image
   ↓
11. User adjusts zoom → canvas CSS transform: scale(0.5, 1, 2, 4)
   ↓
12. User changes selection → repeat from step 4
```

### 2. Preset Mode - Sequential Filter Flow

```
1. User selects preset (e.g., "Advanced Cataracts")
   ↓
2. Preset contains: [Blur, Yellowing, Contrast Loss]
   ↓
3. applyFilterPreset() iterates through filters:

   Original Image Data
   ↓
   Pass 1: applyBlur()
   ↓
   Result 1 (blurred)
   ↓
   Pass 2: applyYellowing(Result 1)
   ↓
   Result 2 (blurred + yellow)
   ↓
   Pass 3: applyContrastLoss(Result 2)
   ↓
   Final Result (blurred + yellow + low contrast)
   ↓
4. Display final result in preview
```

### 3. Generate Mode Flow

```
1. User selects element + filter → clicks "Generate"
   ↓
2. UI sends: VISION_SIMULATOR_GENERATE
   { filter: 'deuteranomaly', options: {...} }
   ↓
3. code.ts creates empty frame on canvas
   ↓
4. code.ts exports original node as PNG
   ↓
5. code.ts sends: VISION_SIMULATOR_PROCESS_FILTER
   { frameId: '123', filter: 'deuteranomaly', imageData: {...} }
   ↓
6. UI applies filter using Canvas API
   ↓
7. UI encodes filtered image as PNG
   ↓
8. UI sends: VISION_SIMULATOR_APPLY_FILTERED_IMAGE
   { frameId: '123', imageData: Uint8Array }
   ↓
9. code.ts creates Figma Image from data
   ↓
10. code.ts applies image to frame as fill
   ↓
11. code.ts sends: VISION_SIMULATOR_GENERATE_RESULT
   { success: true, filter: 'deuteranomaly' }
   ↓
12. Figma canvas shows filtered frame next to original
```

---

## Storage Architecture

### Plugin Data Structure

All data is stored in Figma files using the Plugin Data API.

#### Plugin-Level Data

```typescript
interface PluginSettings {
  theme: "light" | "dark" | "auto";
  version: string;
}

interface FilterPreset {
  id: string;
  name: string;
  description: string;
  filters: CompleteFilterConfig[];
  isBuiltIn?: boolean;
  createdAt?: number;
  updatedAt?: number;
}
```

#### Storage Keys Convention

```typescript
const STORAGE_KEYS = {
  VISION_SIMULATOR_PRESETS: "vision-simulator-presets",
  VISION_SIMULATOR_SELECTED_PRESET: "vision-simulator-selected-preset",
  SETTINGS: "vision-simulator-settings",
} as const;
```

### Data Versioning

All stored data includes a version field for future migrations:

```typescript
interface StoredData {
  version: string; // e.g., "1.0.0"
  data: any;
}
```

---

## Module Structure

### File Organization

```
vision-accessibility-suite-figma-plugin/
├── src/
│   ├── code.ts                          # Plugin code entry point
│   ├── ui.tsx                           # UI entry point
│   ├── ui.css                           # Global styles
│   ├── ui.html                          # HTML template
│   │
│   ├── types/                           # TypeScript type definitions
│   │   └── common.types.ts              # Shared types
│   │
│   ├── constants/                       # Constants and configuration
│   │   ├── storage.constants.ts         # Storage keys
│   │   └── wcag.constants.ts            # WCAG thresholds
│   │
│   ├── utils/                           # Utility functions
│   │   ├── image-utils.ts               # Image processing (Canvas API)
│   │   ├── preset-storage.ts            # Preset persistence
│   │   ├── vision-simulator.ts          # Core simulator logic
│   │   ├── vision-simulator.constants.ts # Matrices, configs, presets
│   │   ├── vision-simulator.types.ts    # Type definitions
│   │   ├── vision-simulator-icons.ts    # Filter icons
│   │   └── README.md                    # Utilities documentation
│   │
│   ├── services/                        # Core services
│   │   ├── storage.service.ts           # Data persistence
│   │   └── selection.service.ts         # Selection management
│   │
│   ├── components/                      # React components
│   │   ├── ui/                          # Shared UI components
│   │   │   ├── Badge/
│   │   │   ├── Button/
│   │   │   ├── Card/
│   │   │   ├── Checkbox/
│   │   │   ├── Filter/                  # Filter-specific components
│   │   │   │   ├── FilterDropdown.tsx
│   │   │   │   ├── FilterIcon.tsx
│   │   │   │   ├── FilterParameterSlider.tsx
│   │   │   │   ├── RadiusSlider.tsx
│   │   │   │   └── SeveritySlider.tsx
│   │   │   ├── Icon/
│   │   │   ├── Presets/                 # Preset system components
│   │   │   │   ├── PresetDropdown.tsx
│   │   │   │   ├── PresetManager.tsx
│   │   │   │   └── PresetSelector.tsx
│   │   │   ├── BottomSection.tsx
│   │   │   └── ThemeToggle.tsx
│   │   │
│   │   └── views/                       # Main views
│   │       └── MainView.tsx # Main panel component
│   │
│   ├── hooks/                           # React hooks
│   │   ├── useFigmaMessage.ts           # Message handling
│   │   └── useFigmaTheme.ts             # Theme management
│   │
│   └── contexts/                        # React contexts (if needed)
│
├── documentation/                       # Documentation
├── dist/                                # Build output
├── manifest.json                        # Plugin manifest
├── package.json
├── tsconfig.json
└── webpack.config.js
```

---

## Communication Patterns

### Message Protocol

Communication between UI and plugin code uses a typed message system:

```typescript
// Message types
type MessageType =
  // Vision Lab operations
  | "VISION_SIMULATOR_PANEL_MOUNTED"
  | "VISION_SIMULATOR_PANEL_UNMOUNTED"
  | "VISION_SIMULATOR_REQUEST_PREVIEW"
  | "VISION_SIMULATOR_PREVIEW_DATA"

  // Generate mode operations
  | "VISION_SIMULATOR_GENERATE"
  | "VISION_SIMULATOR_PROCESS_FILTER"
  | "VISION_SIMULATOR_APPLY_FILTERED_IMAGE"
  | "VISION_SIMULATOR_GENERATE_RESULT"

  // Preset management
  | "VISION_SIMULATOR_LOAD_PRESETS"
  | "VISION_SIMULATOR_PRESETS_LOADED"
  | "VISION_SIMULATOR_SAVE_PRESETS"
  | "VISION_SIMULATOR_PRESETS_SAVED"
  | "VISION_SIMULATOR_LOAD_SELECTED_PRESET"
  | "VISION_SIMULATOR_SELECTED_PRESET_LOADED"
  | "VISION_SIMULATOR_SAVE_SELECTED_PRESET"

  // Canvas export
  | "VISION_SIMULATOR_EXPORT_TO_CANVAS"
  | "VISION_SIMULATOR_EXPORT_TO_CANVAS_RESULT";

// Message structure
interface PluginMessage {
  type: MessageType;
  data?: any;
}
```

### UI to Plugin Code

```typescript
// In React component
const loadPreview = () => {
  parent.postMessage(
    {
      pluginMessage: {
        type: "VISION_SIMULATOR_REQUEST_PREVIEW",
        data: {},
      },
    },
    "*"
  );
};
```

### Plugin Code to UI

```typescript
// In plugin code
figma.ui.postMessage({
  type: "VISION_SIMULATOR_PREVIEW_DATA",
  imageData: uint8Array,
  width: 2048,
  height: 1536,
  nodeName: "Button Component",
});
```

---

## Performance Considerations

### 1. Client-Side Processing

**Decision**: All filter processing in UI thread using Canvas API

**Benefits**:

- GPU-accelerated transformations
- No plugin code roundtrips
- Faster for pixel-level operations
- Enables real-time preview

### 2. Separable Gaussian Blur

**Optimization**: Two-pass 1D convolution instead of 2D

**Impact**: O(n×m×k) instead of O(n×m×k²)

**Result**: 10-15x faster for typical radii (8-15px)

### 3. Sequential Preset Processing

**Approach**: Each filter's output → next filter's input

**Trade-off**: Slightly slower than parallel, but more realistic

**Mitigation**: Still <1s for typical images (800×600px)

### 4. Memory Management

- Revoke Blob URLs after use
- Reuse Uint8ClampedArray buffers
- Clear canvas contexts when not needed

---

## Scalability & Extensibility

### Adding New Filters

New filters follow a modular pattern:

1. **Define filter type** in `vision-simulator.types.ts`
2. **Add transformation logic** in `image-utils.ts`
3. **Add default config** in `vision-simulator.constants.ts`
4. **Update filter list** in FilterDropdown
5. **Add to preset system** (CompleteFilterConfig union)
6. **Document filter** in implementation.md

### Adding New Presets

Built-in presets are defined in `vision-simulator.constants.ts`:

```typescript
export const DEFAULT_PRESETS: FilterPreset[] = [
  {
    id: "advanced-cataracts",
    name: "Advanced Cataracts",
    description: "Severe cataracts with blur, yellowing, and contrast loss",
    filters: [
      { type: "blurred", config: { radius: 15, iterations: 3 } },
      { type: "yellowing", config: { intensity: 0.8, temperature: 2000 } },
      { type: "loss-of-contrast", config: { reduction: 0.6 } },
    ],
    isBuiltIn: true,
  },
  // ... more presets
];
```

### Extensibility Points

1. **Custom Filters**: Add new image processing algorithms
2. **Custom Presets**: Import/export JSON presets
3. **Custom Validators**: Add new WCAG/accessibility rules
4. **Plugin Extensions**: Hook into lifecycle events

---

## Security & Privacy

### Data Privacy

- **No external data transmission**
- **All data stored locally** in Figma files
- **No user tracking or analytics**
- **No network access required**

### Network Access

```json
{
  "networkAccess": {
    "allowedDomains": ["none"]
  }
}
```

---

## Next Steps

Refer to:

- **[implementation.md](./implementation.md)**: Complete implementation details
- **[component-structure.md](./component-structure.md)**: UI component specifications
- **[data-models-storage.md](./data-models-storage.md)**: Complete data model definitions

---

**Document Status**: ✅ Complete
**Last Review**: 2025-12-09
**Next Review**: After feature additions
