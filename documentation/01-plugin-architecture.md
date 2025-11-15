# Accessibility Genie - Plugin Architecture

**Version**: 1.0
**Last Updated**: 2025-11-15
**Status**: Architecture Design

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

**Accessibility Genie** is a Figma plugin designed to help designers and developers enhance the accessibility of their designs. The plugin provides real-time feedback, testing tools, and annotation capabilities based on WCAG 2.1, ARIA, and platform-specific accessibility guidelines.

### Core Principles

- **Offline-First**: All core features work without internet connection
- **Privacy-Friendly**: All data stored locally in Figma files
- **Standards-Based**: Implements WCAG 2.1, ARIA, and platform guidelines
- **Real-Time**: Immediate feedback and validation
- **Extensible**: Modular architecture for easy feature additions

### Architecture Goals

1. **Separation of Concerns**: Clear boundaries between UI, business logic, and Figma API
2. **Modularity**: Each feature is an independent module
3. **Reusability**: Shared utilities and components
4. **Testability**: Easy to unit test and mock
5. **Performance**: Optimized for large Figma files

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FIGMA PLUGIN                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    UI LAYER (React)                        │  │
│  │                                                             │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │  │
│  │  │   Main View  │  │  Tool Panels │  │   Settings   │    │  │
│  │  │  - Auto Scan │  │  - Testing   │  │   - Theme    │    │  │
│  │  │  - Tool List │  │  - Annotation│  │   - Export   │    │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │  │
│  │                                                             │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │         Shared UI Components                         │  │  │
│  │  │  - Button, Card, Badge, Modal, Dropdown, etc.       │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ↕                                   │
│                     Message Bridge (postMessage)                 │
│                              ↕                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   PLUGIN CODE LAYER                        │  │
│  │                                                             │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │              Feature Modules                         │  │  │
│  │  │                                                       │  │  │
│  │  │  ┌──────────────────────────────────────────────┐   │  │  │
│  │  │  │  Testing Tools                                │   │  │  │
│  │  │  │  - ContrastChecker                           │   │  │  │
│  │  │  │  - TypographyChecker                         │   │  │  │
│  │  │  │  - TouchTargetsChecker                       │   │  │  │
│  │  │  │  - VisionSimulator                           │   │  │  │
│  │  │  │  - AutomaticMonitoring                       │   │  │  │
│  │  │  └──────────────────────────────────────────────┘   │  │  │
│  │  │                                                       │  │  │
│  │  │  ┌──────────────────────────────────────────────┐   │  │  │
│  │  │  │  Annotation Tools                             │   │  │  │
│  │  │  │  - AltTextManager                            │   │  │  │
│  │  │  │  - FocusOrderManager                         │   │  │  │
│  │  │  │  - HeadingsManager                           │   │  │  │
│  │  │  │  - LandmarksManager                          │   │  │  │
│  │  │  │  - AccessibilityNotes                        │   │  │  │
│  │  │  └──────────────────────────────────────────────┘   │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                             │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │              Core Services Layer                     │  │  │
│  │  │  - StorageService (Plugin Data API)                 │  │  │
│  │  │  - SelectionService (Node Selection)                │  │  │
│  │  │  - AnnotationService (Canvas Overlays)              │  │  │
│  │  │  - ExportService (JSON/CSV/MD)                      │  │  │
│  │  │  - ValidationService (WCAG Rules)                   │  │  │
│  │  │  - EventService (Document Changes)                  │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                             │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │              Utility Layer                           │  │  │
│  │  │  - ColorUtils (Contrast calculations)               │  │  │
│  │  │  - NodeUtils (Node type detection)                  │  │  │
│  │  │  - WCAGUtils (Standards checking)                   │  │  │
│  │  │  - ImageUtils (Vision simulation)                   │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ↕                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   FIGMA API LAYER                          │  │
│  │  - figma.currentPage                                       │  │
│  │  - figma.getNodeById()                                     │  │
│  │  │  - figma.setPluginData()                               │  │
│  │  - figma.on('selectionchange')                             │  │
│  │  - figma.createRectangle()                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## System Components

### 1. UI Layer (React)

**Responsibility**: User interface and interaction handling

#### Main Components

##### App Container
- Root component managing application state
- Theme management (light/dark mode)
- Tool navigation and routing

##### Main View
- **Auto Scan & Fix Button**: Primary CTA for running all checks
- **Testing Tools Section**: List of 5 testing tools with navigation
- **Annotation Tools Section**: List of 5 annotation tools with navigation
- **Bottom Section**: Credits and settings

##### Tool Panels
Each tool has its own panel component:
- **Contrast Panel**: Color pair selection, ratio display, WCAG level indicators
- **Typography Panel**: Font size checks, alignment validation, bulk actions
- **Touch Targets Panel**: Size measurements, platform recommendations
- **Vision Simulator Panel**: Filter selection, preview area
- **Auto Monitoring Panel**: Toggle monitoring, issue dashboard
- **Alt-Text Panel**: Image list, text input, decorative marker
- **Focus Order Panel**: Element list, drag-to-reorder, visual indicators
- **Headings Panel**: Text layer list, level selector, hierarchy validator
- **Landmarks Panel**: Frame selector, role picker, validation
- **Notes Panel**: Platform template selector, note editor

##### Shared UI Components
- `Button`: Primary, secondary, icon buttons
- `Card`: Tool cards with icons and navigation
- `Badge`: Status indicators (pass/fail, issue count)
- `Modal`: Dialogs for settings and exports
- `Dropdown`: Selection menus
- `Toggle`: On/off switches
- `Input`: Text fields
- `List`: Scrollable item lists
- `Icon`: SVG icon system

### 2. Plugin Code Layer

**Responsibility**: Business logic and Figma API interaction

#### Feature Modules

Each feature is an independent module with:
- **Interface**: Defines public API
- **Implementation**: Core logic
- **Types**: TypeScript type definitions
- **Constants**: Feature-specific constants

**Module Pattern**:
```typescript
// Example: ContrastChecker module
export interface IContrastChecker {
  checkNode(node: SceneNode): ContrastResult;
  checkSelection(): ContrastResult[];
  checkPage(): ContrastResult[];
  annotateIssues(results: ContrastResult[]): void;
}

export class ContrastChecker implements IContrastChecker {
  constructor(
    private storage: StorageService,
    private validation: ValidationService,
    private annotation: AnnotationService
  ) {}

  // Implementation...
}
```

#### Core Services Layer

##### StorageService
- Read/write plugin data to Figma nodes
- Manage plugin-wide settings
- Cache management
- Data versioning

```typescript
interface IStorageService {
  setNodeData<T>(node: SceneNode, key: string, value: T): Promise<void>;
  getNodeData<T>(node: SceneNode, key: string): Promise<T | null>;
  setPluginData<T>(key: string, value: T): Promise<void>;
  getPluginData<T>(key: string): Promise<T | null>;
}
```

##### SelectionService
- Track current selection
- Emit selection change events
- Filter nodes by type
- Traverse node tree

```typescript
interface ISelectionService {
  getCurrentSelection(): SceneNode[];
  onSelectionChange(callback: (nodes: SceneNode[]) => void): void;
  findNodesOfType(type: NodeType): SceneNode[];
  traverseNode(node: SceneNode, callback: (node: SceneNode) => void): void;
}
```

##### AnnotationService
- Create visual annotations on canvas
- Manage annotation lifecycle (show/hide/delete)
- Badge creation (numbered, colored, labeled)
- Arrow drawing for focus order

```typescript
interface IAnnotationService {
  createBadge(node: SceneNode, options: BadgeOptions): SceneNode;
  createArrow(from: SceneNode, to: SceneNode): SceneNode;
  removeAnnotations(nodeId: string): void;
  hideAnnotations(): void;
  showAnnotations(): void;
}
```

##### ExportService
- Export data to JSON, CSV, Markdown
- Generate reports
- Code snippet generation

```typescript
interface IExportService {
  exportToJSON(data: any, filename: string): void;
  exportToCSV(data: any[], filename: string): void;
  exportToMarkdown(data: any, filename: string): void;
  generateReport(results: CheckResult[]): string;
}
```

##### ValidationService
- WCAG rule validation
- ARIA guidelines checking
- Platform-specific validations

```typescript
interface IValidationService {
  validateContrast(ratio: number, level: 'AA' | 'AAA', type: 'normal' | 'large'): boolean;
  validateHeadingHierarchy(headings: Heading[]): ValidationResult;
  validateLandmarks(landmarks: Landmark[]): ValidationResult;
  validateFocusOrder(order: FocusItem[]): ValidationResult;
}
```

##### EventService
- Document change monitoring
- Debouncing and throttling
- Event aggregation

```typescript
interface IEventService {
  onDocumentChange(callback: (changes: DocumentChange) => void): void;
  debounce<T>(fn: (...args: T[]) => void, delay: number): (...args: T[]) => void;
  throttle<T>(fn: (...args: T[]) => void, delay: number): (...args: T[]) => void;
}
```

#### Utility Layer

##### ColorUtils
```typescript
interface IColorUtils {
  rgbToHex(rgb: RGB): string;
  getRelativeLuminance(rgb: RGB): number;
  getContrastRatio(color1: RGB, color2: RGB): number;
  isLightColor(rgb: RGB): boolean;
}
```

##### NodeUtils
```typescript
interface INodeUtils {
  isTextNode(node: SceneNode): boolean;
  isInteractive(node: SceneNode): boolean;
  hasReactions(node: SceneNode): boolean;
  getBackgroundColor(node: SceneNode): RGB | null;
}
```

##### WCAGUtils
```typescript
interface IWCAGUtils {
  getWCAGLevel(ratio: number, isLarge: boolean): 'AAA' | 'AA' | 'Fail';
  getMinimumTouchTarget(platform: 'ios' | 'android' | 'web'): Size;
  isLargeText(fontSize: number, fontWeight: number): boolean;
}
```

##### ImageUtils
```typescript
interface IImageUtils {
  applyColorBlindnessFilter(imageData: ImageData, type: ColorBlindnessType): ImageData;
  applyBlur(imageData: ImageData, radius: number): ImageData;
  exportNodeAsImage(node: SceneNode): Promise<Uint8Array>;
}
```

---

## Technology Stack

### Core Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **UI Framework** | React 18.3+ | Component-based UI |
| **Language** | TypeScript 5.6+ | Type-safe development |
| **Build Tool** | Webpack 5 | Bundling and optimization |
| **Styling** | CSS Modules | Scoped component styles |
| **State Management** | React Context + Hooks | Lightweight state management |

### Development Dependencies

```json
{
  "core": [
    "@figma/plugin-typings",
    "react",
    "react-dom",
    "typescript"
  ],
  "build": [
    "webpack",
    "webpack-cli",
    "ts-loader",
    "css-loader",
    "style-loader",
    "html-webpack-plugin"
  ],
  "optional": [
    "chroma-js",      // Color manipulation (Contrast Checker)
    "sortablejs",      // Drag-and-drop (Focus Order)
    "marked"           // Markdown rendering (Export)
  ]
}
```

### Optional External Services (Future)

- **OpenAI GPT-4 Vision**: Alt-text auto-generation
- **Google Cloud Vision**: Alternative AI vision service
- **Firebase**: Team collaboration features

---

## Data Flow

### 1. User Interaction Flow

```
User Action (UI)
    ↓
React Component Handler
    ↓
postMessage to Plugin Code
    ↓
Message Handler in Plugin Code
    ↓
Feature Module Method Call
    ↓
Core Service Usage
    ↓
Figma API Interaction
    ↓
Result Processing
    ↓
postMessage to UI
    ↓
React State Update
    ↓
UI Re-render
```

### 2. Auto Scan Flow

```
User clicks "Auto Scan & Fix"
    ↓
UI sends "RUN_AUTO_SCAN" message
    ↓
AutomaticMonitoring module receives message
    ↓
┌─ Run ContrastChecker on all text nodes
├─ Run TypographyChecker on all text nodes
├─ Run TouchTargetsChecker on interactive nodes
├─ Aggregate results
└─ Annotate issues on canvas
    ↓
Send results back to UI
    ↓
UI displays issue dashboard
```

### 3. Annotation Flow

```
User opens Headings tool
    ↓
UI requests current headings data
    ↓
HeadingsManager.getHeadings()
    ↓
StorageService.getNodeData() for each text node
    ↓
Return heading data to UI
    ↓
User assigns H1 to a text layer
    ↓
UI sends "SET_HEADING" message
    ↓
HeadingsManager.setHeading(nodeId, level)
    ↓
StorageService.setNodeData()
    ↓
AnnotationService.createBadge()
    ↓
ValidationService.validateHeadingHierarchy()
    ↓
Return validation result to UI
```

---

## Storage Architecture

### Plugin Data Structure

All data is stored in Figma files using the Plugin Data API.

#### Node-Level Data

Each node can store feature-specific data:

```typescript
// Alt-Text Data (stored on image nodes)
interface AltTextData {
  altText: string;
  isDecorative: boolean;
  lastModified: string;
  version: string;
}

// Heading Data (stored on text nodes)
interface HeadingData {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  customLabel?: string;
  version: string;
}

// Landmark Data (stored on frame nodes)
interface LandmarkData {
  role: 'header' | 'nav' | 'main' | 'aside' | 'footer' | 'form' | 'section';
  label?: string;
  version: string;
}

// Accessibility Notes Data (stored on any node)
interface AccessibilityNoteData {
  platform: 'web' | 'ios' | 'android' | 'windows' | 'general';
  accessibleName?: string;
  ariaRole?: string;
  ariaLabel?: string;
  voiceOverLabel?: string;
  contentDescription?: string;
  notes: string;
  version: string;
}

// Focus Order Data (stored on interactive nodes)
interface FocusOrderData {
  index: number;
  groupId?: string;
  version: string;
}
```

#### Plugin-Level Data

Global settings and state:

```typescript
interface PluginSettings {
  theme: 'light' | 'dark' | 'auto';
  autoMonitoring: {
    enabled: boolean;
    testTypes: ('contrast' | 'typography' | 'touchTargets')[];
  };
  contrastLevel: 'AA' | 'AAA';
  platform: 'web' | 'ios' | 'android';
  version: string;
}

interface AutoMonitoringData {
  lastRun: string;
  results: {
    contrast: ContrastResult[];
    typography: TypographyResult[];
    touchTargets: TouchTargetResult[];
  };
  issueCount: number;
}
```

#### Storage Keys Convention

```typescript
const STORAGE_KEYS = {
  ALT_TEXT: 'a11y-genie:alt-text',
  HEADING: 'a11y-genie:heading',
  LANDMARK: 'a11y-genie:landmark',
  FOCUS_ORDER: 'a11y-genie:focus-order',
  NOTES: 'a11y-genie:notes',
  SETTINGS: 'a11y-genie:settings',
  MONITORING: 'a11y-genie:monitoring',
} as const;
```

### Data Versioning

All stored data includes a version field for future migrations:

```typescript
interface StoredData {
  version: string; // e.g., "1.0.0"
  data: any;
}

// Migration helper
function migrateData(stored: StoredData): any {
  if (stored.version === '1.0.0') {
    // Current version, no migration needed
    return stored.data;
  }
  // Future migrations here
}
```

---

## Module Structure

### File Organization

```
accessibility-genie/
├── src/
│   ├── code.ts                          # Plugin code entry point
│   ├── ui.tsx                           # UI entry point
│   ├── ui.css                           # Global styles
│   │
│   ├── types/                           # TypeScript type definitions
│   │   ├── index.ts                     # Exports all types
│   │   ├── storage.types.ts             # Storage-related types
│   │   ├── feature.types.ts             # Feature result types
│   │   ├── wcag.types.ts                # WCAG-related types
│   │   └── ui.types.ts                  # UI prop types
│   │
│   ├── constants/                       # Constants and configuration
│   │   ├── index.ts
│   │   ├── wcag.constants.ts            # WCAG thresholds
│   │   ├── storage.constants.ts         # Storage keys
│   │   └── ui.constants.ts              # UI constants
│   │
│   ├── utils/                           # Utility functions
│   │   ├── color.utils.ts               # Color calculations
│   │   ├── node.utils.ts                # Node operations
│   │   ├── wcag.utils.ts                # WCAG validations
│   │   └── image.utils.ts               # Image processing
│   │
│   ├── services/                        # Core services
│   │   ├── storage.service.ts           # Data persistence
│   │   ├── selection.service.ts         # Selection management
│   │   ├── annotation.service.ts        # Canvas annotations
│   │   ├── export.service.ts            # Data export
│   │   ├── validation.service.ts        # Rule validation
│   │   └── event.service.ts             # Event handling
│   │
│   ├── features/                        # Feature modules
│   │   ├── testing/                     # Testing tools
│   │   │   ├── contrast/
│   │   │   │   ├── contrast-checker.ts
│   │   │   │   ├── contrast.types.ts
│   │   │   │   └── contrast.constants.ts
│   │   │   ├── typography/
│   │   │   │   ├── typography-checker.ts
│   │   │   │   ├── typography.types.ts
│   │   │   │   └── typography.constants.ts
│   │   │   ├── touch-targets/
│   │   │   │   ├── touch-targets-checker.ts
│   │   │   │   ├── touch-targets.types.ts
│   │   │   │   └── touch-targets.constants.ts
│   │   │   ├── vision-simulator/
│   │   │   │   ├── vision-simulator.ts
│   │   │   │   ├── filters/
│   │   │   │   │   ├── colorblind.filter.ts
│   │   │   │   │   ├── blur.filter.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── vision.types.ts
│   │   │   │   └── vision.constants.ts
│   │   │   └── auto-monitoring/
│   │   │       ├── auto-monitoring.ts
│   │   │       ├── monitoring.types.ts
│   │   │       └── monitoring.constants.ts
│   │   │
│   │   └── annotation/                  # Annotation tools
│   │       ├── alt-text/
│   │       │   ├── alt-text-manager.ts
│   │       │   ├── alt-text.types.ts
│   │       │   └── alt-text.constants.ts
│   │       ├── focus-order/
│   │       │   ├── focus-order-manager.ts
│   │       │   ├── focus-order.types.ts
│   │       │   └── focus-order.constants.ts
│   │       ├── headings/
│   │       │   ├── headings-manager.ts
│   │       │   ├── headings.types.ts
│   │       │   └── headings.constants.ts
│   │       ├── landmarks/
│   │       │   ├── landmarks-manager.ts
│   │       │   ├── landmarks.types.ts
│   │       │   └── landmarks.constants.ts
│   │       └── notes/
│   │           ├── notes-manager.ts
│   │           ├── notes.types.ts
│   │           └── notes.constants.ts
│   │
│   ├── components/                      # React components
│   │   ├── ui/                          # Shared UI components
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   └── Button.module.css
│   │   │   ├── Card/
│   │   │   │   ├── Card.tsx
│   │   │   │   └── Card.module.css
│   │   │   ├── Badge/
│   │   │   ├── Modal/
│   │   │   ├── Dropdown/
│   │   │   ├── Toggle/
│   │   │   ├── Input/
│   │   │   ├── List/
│   │   │   ├── Icon/
│   │   │   ├── ThemeToggle/
│   │   │   ├── BottomSection/
│   │   │   └── index.ts
│   │   │
│   │   ├── views/                       # Main views
│   │   │   ├── MainView/
│   │   │   │   ├── MainView.tsx
│   │   │   │   └── MainView.module.css
│   │   │   └── index.ts
│   │   │
│   │   └── panels/                      # Tool panels
│   │       ├── ContrastPanel/
│   │       │   ├── ContrastPanel.tsx
│   │       │   └── ContrastPanel.module.css
│   │       ├── TypographyPanel/
│   │       ├── TouchTargetsPanel/
│   │       ├── VisionSimulatorPanel/
│   │       ├── AutoMonitoringPanel/
│   │       ├── AltTextPanel/
│   │       ├── FocusOrderPanel/
│   │       ├── HeadingsPanel/
│   │       ├── LandmarksPanel/
│   │       ├── NotesPanel/
│   │       └── index.ts
│   │
│   ├── hooks/                           # React hooks
│   │   ├── useFigmaMessage.ts           # Message handling
│   │   ├── useFigmaTheme.ts             # Theme management
│   │   ├── useSelection.ts              # Selection state
│   │   └── useFeature.ts                # Feature state
│   │
│   └── contexts/                        # React contexts
│       ├── AppContext.tsx               # Global app state
│       ├── ThemeContext.tsx             # Theme state
│       └── SelectionContext.tsx         # Selection state
│
├── documentation/                        # Documentation
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
  // Testing tools
  | 'RUN_CONTRAST_CHECK'
  | 'RUN_TYPOGRAPHY_CHECK'
  | 'RUN_TOUCH_TARGETS_CHECK'
  | 'RUN_VISION_SIMULATION'
  | 'RUN_AUTO_SCAN'

  // Annotation tools
  | 'GET_ALT_TEXT'
  | 'SET_ALT_TEXT'
  | 'GET_HEADINGS'
  | 'SET_HEADING'
  | 'GET_LANDMARKS'
  | 'SET_LANDMARK'
  | 'GET_FOCUS_ORDER'
  | 'SET_FOCUS_ORDER'
  | 'GET_NOTES'
  | 'SET_NOTE'

  // Utility
  | 'GET_SELECTION'
  | 'EXPORT_DATA'
  | 'UPDATE_SETTINGS'
  | 'SHOW_ANNOTATIONS'
  | 'HIDE_ANNOTATIONS';

// Message structure
interface PluginMessage {
  type: MessageType;
  payload?: any;
}

// Response structure
interface PluginResponse {
  type: MessageType;
  success: boolean;
  data?: any;
  error?: string;
}
```

### UI to Plugin Code

```typescript
// In React component
const runContrastCheck = () => {
  parent.postMessage({
    pluginMessage: {
      type: 'RUN_CONTRAST_CHECK',
      payload: { scope: 'selection' }
    }
  }, '*');
};
```

### Plugin Code to UI

```typescript
// In plugin code
figma.ui.postMessage({
  type: 'RUN_CONTRAST_CHECK',
  success: true,
  data: {
    results: [
      { nodeId: '123', ratio: 4.5, passes: true, level: 'AA' }
    ]
  }
});
```

### Message Handler Pattern

```typescript
// Plugin code message handler
figma.ui.onmessage = async (msg: PluginMessage) => {
  const { type, payload } = msg;

  try {
    switch (type) {
      case 'RUN_CONTRAST_CHECK': {
        const checker = new ContrastChecker(/* dependencies */);
        const results = await checker.checkSelection();
        figma.ui.postMessage({
          type,
          success: true,
          data: { results }
        });
        break;
      }

      case 'SET_HEADING': {
        const manager = new HeadingsManager(/* dependencies */);
        await manager.setHeading(payload.nodeId, payload.level);
        figma.ui.postMessage({
          type,
          success: true
        });
        break;
      }

      // ... other cases

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    figma.ui.postMessage({
      type,
      success: false,
      error: error.message
    });
  }
};
```

---

## Performance Considerations

### 1. Lazy Loading

- Load feature modules only when needed
- Dynamically import panel components
- Defer non-critical services

```typescript
// Lazy load feature modules
const loadContrastChecker = async () => {
  const { ContrastChecker } = await import('./features/testing/contrast');
  return new ContrastChecker(/* deps */);
};
```

### 2. Debouncing & Throttling

- Debounce document change events (500ms)
- Throttle real-time checks (100ms)
- Queue large operations

```typescript
// Auto monitoring with debouncing
const eventService = new EventService();
eventService.onDocumentChange(
  eventService.debounce(handleDocumentChange, 500)
);
```

### 3. Pagination

- Load large lists in chunks (50 items at a time)
- Virtual scrolling for long lists
- Progressive rendering

```typescript
// Paginated results
interface PaginatedResults<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
}
```

### 4. Caching

- Cache node lookups
- Memoize expensive calculations
- Store processed results

```typescript
// Simple cache implementation
class Cache<T> {
  private cache = new Map<string, T>();

  get(key: string): T | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: T): void {
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}
```

### 5. Web Workers (Future)

- Offload image processing to Web Workers
- Vision Simulator filter calculations
- Large file processing

---

## Scalability & Extensibility

### Adding New Features

New features follow a standard pattern:

1. **Create feature module** in `src/features/`
2. **Define types** in `[feature].types.ts`
3. **Add message types** to message protocol
4. **Create UI panel** in `src/components/panels/`
5. **Register in main handler** in `code.ts`
6. **Add to tool list** in UI

### Plugin Configuration

```typescript
// Feature registry
interface FeatureConfig {
  id: string;
  name: string;
  description: string;
  category: 'testing' | 'annotation';
  enabled: boolean;
  icon: string;
  panel: React.ComponentType;
}

const FEATURES: FeatureConfig[] = [
  {
    id: 'contrast',
    name: 'Contrast',
    description: 'Check color contrast ratios',
    category: 'testing',
    enabled: true,
    icon: 'contrast-icon',
    panel: ContrastPanel
  },
  // ... other features
];
```

### Extensibility Points

1. **Custom Validators**: Add new WCAG rules
2. **Custom Exporters**: Add new export formats
3. **Custom Filters**: Add vision simulation filters
4. **Custom Platforms**: Add platform-specific note templates
5. **Plugin Extensions**: Hook into plugin lifecycle events

---

## Security & Privacy

### Data Privacy

- **No external data transmission** (except optional AI features)
- **All data stored locally** in Figma files
- **No user tracking or analytics** (unless explicitly added)
- **Opt-in for AI features** with clear data usage explanation

### Network Access

```json
{
  "networkAccess": {
    "allowedDomains": ["none"]
  }
}
```

Update to allow AI services (optional):
```json
{
  "networkAccess": {
    "allowedDomains": ["api.openai.com", "vision.googleapis.com"],
    "reason": "Optional AI-powered alt-text generation"
  }
}
```

---

## Next Steps

Refer to:
- **02-implementation-plan.md**: Detailed phase-wise development plan
- **03-component-structure.md**: UI component specifications
- **04-data-models.md**: Complete data model definitions

---

**Document Status**: ✅ Complete
**Last Review**: 2025-11-15
**Next Review**: After Phase 1 implementation