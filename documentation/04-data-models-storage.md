# Accessibility Genie - Data Models & Storage Strategy

**Version**: 2.0
**Last Updated**: 2025-11-21
**Status**: Design Specification

---

## Table of Contents

1. [Overview](#overview)
2. [Data Model Introduction Timeline](#data-model-introduction-timeline)
3. [Storage Architecture](#storage-architecture)
4. [Data Models](#data-models)
5. [Storage Keys](#storage-keys)
6. [Data Versioning & Migration](#data-versioning--migration)
7. [Export Formats](#export-formats)
8. [Best Practices](#best-practices)

---

## Overview

### Storage Strategy

Accessibility Genie stores all data locally in Figma files using the Plugin Data API. This ensures:
- **Privacy**: No external data transmission
- **Persistence**: Data survives file close/reopen
- **Sync**: Automatic with Figma's file sync
- **Portability**: Data travels with the file

**Development Approach**: Data models and storage services are introduced incrementally during phased development. The StorageService is built in Phase 1 when first needed by the Contrast Checker. Each subsequent phase adds its data models when first required.

### Storage Layers

```
┌─────────────────────────────────────────┐
│        Plugin-Level Storage              │
│  - Global settings                       │
│  - Auto-monitoring configuration         │
│  - User preferences                      │
└─────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────┐
│        Page-Level Storage                │
│  - Page-specific settings                │
│  - Scan results cache                    │
└─────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────┐
│        Node-Level Storage                │
│  - Alt-text data                         │
│  - Heading levels                        │
│  - Landmark roles                        │
│  - Focus order                           │
│  - Accessibility notes                   │
└─────────────────────────────────────────┘
```

---

## Data Model Introduction Timeline

This section shows when each data model and storage service is introduced during phased development. Data models are built only when first required by a tool.

### Phase 0: Verification Only
**No storage needed** - This phase only verifies existing hooks

### Phase 1: Contrast Checker (+ Initial Infrastructure)
**Introduced**:
- ✅ **StorageService** - Core storage service for plugin data API operations
- ✅ **PluginSettings** data model - Global settings (theme, WCAG level, etc.)
- ✅ Storage keys constants (`STORAGE_KEYS`)

**Note**: The Contrast Checker may not need persistent storage for results (results can be ephemeral). StorageService is built as proper reusable module for settings and future tool needs.

### Phase 2-4: Touch Targets, Typography, Vision Simulator
**No new data models** - These testing tools produce ephemeral results (not persisted)
- Results are displayed in UI but not saved to Figma file
- Reuses PluginSettings for user preferences

### Phase 5: Automatic Monitoring
**Introduced**:
- ✅ **MonitoringResults** data model - Cached scan results for monitoring dashboard
- ✅ **ContrastResult**, **TypographyResult**, **TouchTargetResult** type definitions
- ✅ `STORAGE_KEYS.MONITORING_RESULTS` storage key

### Phase 6: Alt-Text Manager (First Annotation Tool)
**Introduced**:
- ✅ **AnnotationService** - Visual annotations on canvas
- ✅ **AltTextData** data model - Alt-text annotations stored on image nodes
- ✅ `STORAGE_KEYS.ALT_TEXT` storage key

**Key Milestone**: First tool that persists node-level data in Figma files

### Phase 7: Focus Order Manager
**Introduced**:
- ✅ **FocusOrderData** data model - Focus/tab order stored on interactive nodes
- ✅ `STORAGE_KEYS.FOCUS_ORDER` storage key

### Phase 8: Headings Manager
**Introduced**:
- ✅ **HeadingData** data model - Heading level annotations stored on text nodes
- ✅ `STORAGE_KEYS.HEADING` storage key

### Phase 9: Landmarks Manager
**Introduced**:
- ✅ **LandmarkData** data model - Landmark role annotations stored on frame nodes
- ✅ `STORAGE_KEYS.LANDMARK` storage key

### Phase 10: Accessibility Notes
**Introduced**:
- ✅ **AccessibilityNoteData** data model - Platform-specific accessibility annotations (most complex data model)
- ✅ `STORAGE_KEYS.NOTES` storage key
- ✅ Platform-specific type definitions (Web, iOS, Android, Windows, React Native, TV)

### Phase 11: Integration & Polish
**Introduced**:
- ✅ **ExportService** - JSON/CSV/Markdown export functionality
- ✅ Export format type definitions
- ✅ Data aggregation and reporting utilities

### Phase 12: Auto Scan & Fix (Deferred)
**Future data models** as needed

---

### Data Model Reuse Strategy

Once introduced, data models and storage services are reused across all subsequent phases:
- **StorageService**: Used by all phases that need persistent storage (Phase 1+)
- **PluginSettings**: Extended by each phase to add tool-specific preferences
- **AnnotationService**: Shared across all annotation tools (Phase 6-10)
- **ExportService**: Can export data from all tools (Phase 11+)

---

## Storage Architecture

### Figma Plugin Data API

```typescript
// Node-level storage
interface SceneNode {
  setPluginData(key: string, value: string): void;
  getPluginData(key: string): string;
  setPluginDataAsync(key: string, value: string): Promise<void>;
  getPluginDataAsync(key: string): Promise<string>;
}

// Document-level storage
interface DocumentNode {
  setPluginData(key: string, value: string): void;
  getPluginData(key: string): string;
}
```

### StorageService Implementation

**Introduced in**: Phase 1 (Contrast Checker - initial infrastructure)
**File**: `src/services/storage.service.ts`

```typescript
// src/services/storage.service.ts

export class StorageService {
  /**
   * Store data on a specific node
   */
  async setNodeData<T>(
    node: SceneNode,
    key: string,
    value: T
  ): Promise<void> {
    try {
      const serialized = JSON.stringify({
        version: '1.0.0',
        data: value,
        timestamp: new Date().toISOString(),
      });
      await node.setPluginDataAsync(key, serialized);
    } catch (error) {
      console.error('Failed to set node data:', error);
      throw new Error(`Storage error: ${error.message}`);
    }
  }

  /**
   * Retrieve data from a specific node
   */
  async getNodeData<T>(
    node: SceneNode,
    key: string
  ): Promise<T | null> {
    try {
      const raw = await node.getPluginDataAsync(key);
      if (!raw) return null;

      const parsed = JSON.parse(raw);

      // Apply migrations if needed
      const migrated = this.migrateData(parsed);

      return migrated.data as T;
    } catch (error) {
      console.error('Failed to get node data:', error);
      return null;
    }
  }

  /**
   * Delete data from a specific node
   */
  async deleteNodeData(node: SceneNode, key: string): Promise<void> {
    await node.setPluginDataAsync(key, '');
  }

  /**
   * Store plugin-wide settings
   */
  async setPluginData<T>(key: string, value: T): Promise<void> {
    const serialized = JSON.stringify({
      version: '1.0.0',
      data: value,
      timestamp: new Date().toISOString(),
    });
    figma.root.setPluginData(key, serialized);
  }

  /**
   * Retrieve plugin-wide settings
   */
  getPluginData<T>(key: string): T | null {
    try {
      const raw = figma.root.getPluginData(key);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      const migrated = this.migrateData(parsed);

      return migrated.data as T;
    } catch (error) {
      console.error('Failed to get plugin data:', error);
      return null;
    }
  }

  /**
   * Check if node has data for a specific key
   */
  async hasNodeData(node: SceneNode, key: string): Promise<boolean> {
    const data = await node.getPluginDataAsync(key);
    return data !== '';
  }

  /**
   * Get all nodes with specific data key
   */
  async getNodesWithData(key: string): Promise<SceneNode[]> {
    const nodes: SceneNode[] = [];

    const traverse = (node: SceneNode) => {
      if ('getPluginDataAsync' in node) {
        const data = node.getPluginData(key);
        if (data) {
          nodes.push(node);
        }
      }

      if ('children' in node) {
        for (const child of node.children) {
          traverse(child);
        }
      }
    };

    traverse(figma.currentPage);
    return nodes;
  }

  /**
   * Migrate data from old versions
   */
  private migrateData(stored: any): any {
    const version = stored.version || '0.0.0';

    // Current version, no migration needed
    if (version === '1.0.0') {
      return stored;
    }

    // Future migrations would go here
    // if (version === '0.9.0') {
    //   return this.migrateFrom_0_9_to_1_0(stored);
    // }

    return stored;
  }
}
```

---

## Data Models

### 1. Alt-Text Data

**Introduced in**: Phase 6 (Alt-Text Manager)
**Storage Key**: `a11y-genie:alt-text`
**Stored On**: Image nodes (rectangles with image fills)

```typescript
interface AltTextData {
  /** Alternative text description */
  altText: string;

  /** Is this a decorative image? */
  isDecorative: boolean;

  /** Source of alt text */
  source: 'manual' | 'ai-generated' | 'auto-suggested';

  /** AI-generated suggestions (if any) */
  suggestions?: string[];

  /** Character count (for validation) */
  charCount: number;

  /** Last modified timestamp */
  lastModified: string;

  /** User who last modified (future: team feature) */
  modifiedBy?: string;

  /** Validation status */
  validation: {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  };
}

// Example stored data
const altTextExample: AltTextData = {
  altText: "A person using a laptop while sitting at a wooden desk near a window",
  isDecorative: false,
  source: 'manual',
  charCount: 69,
  lastModified: '2025-11-15T10:30:00Z',
  validation: {
    isValid: true,
    warnings: [],
    errors: []
  }
};
```

---

### 2. Heading Data

**Introduced in**: Phase 8 (Headings Manager)
**Storage Key**: `a11y-genie:heading`
**Stored On**: Text nodes

```typescript
interface HeadingData {
  /** Heading level (1-6) */
  level: 1 | 2 | 3 | 4 | 5 | 6;

  /** Custom label (optional, for documentation) */
  customLabel?: string;

  /** Auto-suggested by plugin? */
  autoSuggested: boolean;

  /** Position in document hierarchy */
  hierarchyPath: number[];

  /** Last modified timestamp */
  lastModified: string;
}

// Example stored data
const headingExample: HeadingData = {
  level: 2,
  customLabel: 'Product Features Section',
  autoSuggested: false,
  hierarchyPath: [1, 2], // First H1, second H2
  lastModified: '2025-11-15T10:30:00Z'
};
```

---

### 3. Landmark Data

**Introduced in**: Phase 9 (Landmarks Manager)
**Storage Key**: `a11y-genie:landmark`
**Stored On**: Frame nodes, section nodes

```typescript
type LandmarkRole =
  | 'header'
  | 'nav'
  | 'main'
  | 'aside'
  | 'footer'
  | 'form'
  | 'section'
  | 'search'
  | 'complementary'
  | 'contentinfo'
  | 'banner';

interface LandmarkData {
  /** ARIA landmark role */
  role: LandmarkRole;

  /** Label for the landmark (required for multiple nav/sections) */
  label?: string;

  /** ARIA label attribute value */
  ariaLabel?: string;

  /** Auto-suggested by plugin? */
  autoSuggested: boolean;

  /** Validation status */
  validation: {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  };

  /** Last modified timestamp */
  lastModified: string;
}

// Example stored data
const landmarkExample: LandmarkData = {
  role: 'nav',
  label: 'Main Navigation',
  ariaLabel: 'Main site navigation',
  autoSuggested: true,
  validation: {
    isValid: true,
    warnings: [],
    errors: []
  },
  lastModified: '2025-11-15T10:30:00Z'
};
```

---

### 4. Focus Order Data

**Introduced in**: Phase 7 (Focus Order Manager)
**Storage Key**: `a11y-genie:focus-order`
**Stored On**: Interactive nodes (buttons, inputs, links)

```typescript
interface FocusOrderData {
  /** Focus order index (tab order) */
  index: number;

  /** Group ID for managing multiple focus groups */
  groupId?: string;

  /** Group name (for documentation) */
  groupName?: string;

  /** Is this element focusable? */
  isFocusable: boolean;

  /** Custom tab index value (if specified) */
  customTabIndex?: number;

  /** Auto-detected by plugin? */
  autoDetected: boolean;

  /** Last modified timestamp */
  lastModified: string;
}

// Example stored data
const focusOrderExample: FocusOrderData = {
  index: 3,
  groupId: 'header-nav',
  groupName: 'Header Navigation',
  isFocusable: true,
  autoDetected: false,
  lastModified: '2025-11-15T10:30:00Z'
};
```

---

### 5. Accessibility Notes Data

**Introduced in**: Phase 10 (Accessibility Notes)
**Storage Key**: `a11y-genie:notes`
**Stored On**: Any node

```typescript
type Platform =
  | 'web'
  | 'ios'
  | 'android'
  | 'windows'
  | 'react-native'
  | 'tv'
  | 'general';

interface AccessibilityNoteData {
  /** Target platform */
  platform: Platform;

  /** Platform-agnostic accessible name */
  accessibleName?: string;

  /** Web-specific ARIA attributes */
  web?: {
    role?: string;
    ariaLabel?: string;
    ariaDescribedBy?: string;
    ariaLabelledBy?: string;
    ariaHidden?: boolean;
    ariaLive?: 'off' | 'polite' | 'assertive';
    ariaAtomic?: boolean;
    ariaControls?: string;
    ariaExpanded?: boolean;
    [key: string]: any; // Other ARIA attributes
  };

  /** iOS-specific VoiceOver properties */
  ios?: {
    accessibilityLabel?: string;
    accessibilityHint?: string;
    accessibilityTraits?: string[];
    isAccessibilityElement?: boolean;
    accessibilityValue?: string;
  };

  /** Android-specific TalkBack properties */
  android?: {
    contentDescription?: string;
    hint?: string;
    role?: string;
    importantForAccessibility?: 'yes' | 'no' | 'auto' | 'no-hide-descendants';
    accessibilityLiveRegion?: 'none' | 'polite' | 'assertive';
  };

  /** Windows-specific Narrator properties */
  windows?: {
    automationName?: string;
    automationHelpText?: string;
    automationRole?: string;
    automationLiveRegion?: string;
  };

  /** React Native accessibility props */
  reactNative?: {
    accessible?: boolean;
    accessibilityLabel?: string;
    accessibilityHint?: string;
    accessibilityRole?: string;
    accessibilityState?: object;
  };

  /** TV-specific properties */
  tv?: {
    focusable?: boolean;
    nextFocusDown?: string;
    nextFocusUp?: string;
    nextFocusLeft?: string;
    nextFocusRight?: string;
  };

  /** General notes (markdown supported) */
  generalNotes?: string;

  /** Generated code snippets */
  codeSnippets?: {
    html?: string;
    swift?: string;
    kotlin?: string;
    xaml?: string;
    jsx?: string;
  };

  /** Last modified timestamp */
  lastModified: string;
}

// Example stored data
const accessibilityNoteExample: AccessibilityNoteData = {
  platform: 'web',
  accessibleName: 'Submit feedback form',
  web: {
    role: 'button',
    ariaLabel: 'Submit feedback form',
    ariaDescribedBy: 'form-help-text',
  },
  generalNotes: 'This button submits the feedback form and shows a success message.',
  codeSnippets: {
    html: '<button role="button" aria-label="Submit feedback form">Submit</button>',
  },
  lastModified: '2025-11-15T10:30:00Z'
};
```

---

### 6. Plugin Settings

**Introduced in**: Phase 1 (Contrast Checker - initial infrastructure)
**Storage Key**: `a11y-genie:settings`
**Stored On**: Plugin root (document-level)

```typescript
interface PluginSettings {
  /** UI theme */
  theme: 'light' | 'dark' | 'auto';

  /** Auto-monitoring configuration */
  autoMonitoring: {
    enabled: boolean;
    testTypes: ('contrast' | 'typography' | 'touchTargets')[];
    debounceDelay: number; // milliseconds
  };

  /** Default WCAG level */
  wcagLevel: 'AA' | 'AAA';

  /** Default platform for accessibility notes */
  defaultPlatform: Platform;

  /** Target platform for touch targets */
  touchTargetPlatform: 'web' | 'ios' | 'android';

  /** Show annotations by default */
  showAnnotations: boolean;

  /** Export preferences */
  export: {
    defaultFormat: 'json' | 'csv' | 'markdown';
    includeTimestamps: boolean;
    includeCodeSnippets: boolean;
  };

  /** Feature flags */
  features: {
    aiAltText: boolean;
    teamCollaboration: boolean;
    advancedReporting: boolean;
  };

  /** Last used version */
  pluginVersion: string;

  /** User preferences */
  preferences: {
    onboardingCompleted: boolean;
    dismissedWarnings: string[];
  };
}

// Example stored data
const settingsExample: PluginSettings = {
  theme: 'auto',
  autoMonitoring: {
    enabled: false,
    testTypes: ['contrast', 'typography', 'touchTargets'],
    debounceDelay: 500
  },
  wcagLevel: 'AA',
  defaultPlatform: 'web',
  touchTargetPlatform: 'web',
  showAnnotations: true,
  export: {
    defaultFormat: 'json',
    includeTimestamps: true,
    includeCodeSnippets: true
  },
  features: {
    aiAltText: false,
    teamCollaboration: false,
    advancedReporting: false
  },
  pluginVersion: '1.0.0',
  preferences: {
    onboardingCompleted: true,
    dismissedWarnings: []
  }
};
```

---

### 7. Auto-Monitoring Results

**Introduced in**: Phase 5 (Automatic Monitoring)
**Storage Key**: `a11y-genie:monitoring-results`
**Stored On**: Plugin root (document-level)

```typescript
interface ContrastResult {
  nodeId: string;
  nodeName: string;
  foreground: string;
  background: string;
  ratio: number;
  passAA: boolean;
  passAAA: boolean;
  isLargeText: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface TypographyResult {
  nodeId: string;
  nodeName: string;
  fontSize: number;
  lineHeight: number;
  alignment: string;
  issues: {
    type: 'size' | 'lineHeight' | 'alignment' | 'weight';
    message: string;
    severity: 'error' | 'warning' | 'info';
  }[];
}

interface TouchTargetResult {
  nodeId: string;
  nodeName: string;
  width: number;
  height: number;
  passAA: boolean;
  passAAA: boolean;
  platform: 'web' | 'ios' | 'android';
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface MonitoringResults {
  /** Last scan timestamp */
  lastRun: string;

  /** Total issue count */
  totalIssues: number;

  /** Issues by severity */
  issuesBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };

  /** Contrast check results */
  contrast: ContrastResult[];

  /** Typography check results */
  typography: TypographyResult[];

  /** Touch targets check results */
  touchTargets: TouchTargetResult[];

  /** Scan statistics */
  statistics: {
    nodesScanned: number;
    scanDuration: number; // milliseconds
  };
}

// Example stored data
const monitoringResultsExample: MonitoringResults = {
  lastRun: '2025-11-15T10:30:00Z',
  totalIssues: 15,
  issuesBySeverity: {
    critical: 3,
    high: 5,
    medium: 4,
    low: 3
  },
  contrast: [
    {
      nodeId: '123:456',
      nodeName: 'Button Label',
      foreground: '#666666',
      background: '#ffffff',
      ratio: 3.2,
      passAA: false,
      passAAA: false,
      isLargeText: false,
      severity: 'critical'
    }
  ],
  typography: [],
  touchTargets: [],
  statistics: {
    nodesScanned: 247,
    scanDuration: 1234
  }
};
```

---

## Storage Keys

### Naming Convention

All storage keys follow the pattern: `a11y-genie:<feature>`

```typescript
export const STORAGE_KEYS = {
  // Node-level data
  ALT_TEXT: 'a11y-genie:alt-text',
  HEADING: 'a11y-genie:heading',
  LANDMARK: 'a11y-genie:landmark',
  FOCUS_ORDER: 'a11y-genie:focus-order',
  NOTES: 'a11y-genie:notes',

  // Plugin-level data
  SETTINGS: 'a11y-genie:settings',
  MONITORING_RESULTS: 'a11y-genie:monitoring-results',

  // Annotation metadata
  ANNOTATION_VISIBILITY: 'a11y-genie:annotation-visibility',
  ANNOTATION_GROUPS: 'a11y-genie:annotation-groups',

  // Cache
  CACHE_SCAN_RESULTS: 'a11y-genie:cache:scan-results',
  CACHE_NODE_LOOKUP: 'a11y-genie:cache:node-lookup',
} as const;
```

---

## Data Versioning & Migration

### Version Strategy

All stored data includes a version field for future compatibility:

```typescript
interface StoredData<T> {
  version: string; // Semantic versioning: "1.0.0"
  data: T;
  timestamp: string; // ISO 8601 format
}
```

### Migration System

```typescript
type MigrationFunction = (oldData: any) => any;

const MIGRATIONS: Record<string, MigrationFunction> = {
  // Example: Migration from 0.9.0 to 1.0.0
  '0.9.0': (oldData) => {
    // Transform old data format to new format
    return {
      ...oldData,
      // Add new fields with defaults
      validation: {
        isValid: true,
        warnings: [],
        errors: []
      }
    };
  },

  // Future migrations...
};

export class MigrationService {
  migrate(stored: StoredData<any>): any {
    let currentVersion = stored.version || '0.0.0';
    let data = stored.data;

    // Apply migrations in order
    const versions = Object.keys(MIGRATIONS).sort();
    for (const version of versions) {
      if (this.compareVersions(currentVersion, version) < 0) {
        data = MIGRATIONS[version](data);
        currentVersion = version;
      }
    }

    return data;
  }

  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if (parts1[i] > parts2[i]) return 1;
      if (parts1[i] < parts2[i]) return -1;
    }
    return 0;
  }
}
```

---

## Export Formats

### 1. JSON Export

**Use Case**: Developer handoff, API integration

```json
{
  "metadata": {
    "pluginName": "Accessibility Genie",
    "pluginVersion": "1.0.0",
    "exportDate": "2025-11-15T10:30:00Z",
    "fileName": "Design System - Homepage",
    "pageName": "Home - Desktop"
  },
  "summary": {
    "totalNodes": 247,
    "annotatedNodes": 42,
    "issues": {
      "critical": 3,
      "high": 5,
      "medium": 4,
      "low": 3
    }
  },
  "altText": [
    {
      "nodeId": "123:456",
      "nodeName": "Hero Image",
      "altText": "A person using a laptop",
      "isDecorative": false
    }
  ],
  "headings": [
    {
      "nodeId": "123:457",
      "nodeName": "Page Title",
      "text": "Welcome to Our Product",
      "level": 1,
      "hierarchyPath": [1]
    }
  ],
  "landmarks": [
    {
      "nodeId": "123:458",
      "nodeName": "Header Frame",
      "role": "header",
      "label": "Site Header"
    }
  ],
  "focusOrder": [
    {
      "index": 1,
      "nodeId": "123:459",
      "nodeName": "Logo Link",
      "groupName": "Header Navigation"
    }
  ],
  "notes": [
    {
      "nodeId": "123:460",
      "nodeName": "Submit Button",
      "platform": "web",
      "ariaLabel": "Submit feedback form"
    }
  ],
  "issues": [
    {
      "type": "contrast",
      "severity": "critical",
      "nodeId": "123:461",
      "nodeName": "Button Label",
      "message": "Contrast ratio 3.2:1 fails WCAG AA (requires 4.5:1)",
      "recommendation": "Increase contrast to at least 4.5:1"
    }
  ]
}
```

---

### 2. CSV Export

**Use Case**: Spreadsheet tracking, project management

```csv
Type,Node ID,Node Name,Value,Status,Severity,Notes
Alt-Text,123:456,Hero Image,"A person using a laptop",Complete,N/A,Manual entry
Heading,123:457,Page Title,H1,Complete,N/A,
Landmark,123:458,Header Frame,header,Complete,N/A,
Issue,123:461,Button Label,Contrast 3.2:1,Fail,Critical,Requires 4.5:1
```

---

### 3. Markdown Export

**Use Case**: Documentation, developer handoff

```markdown
# Accessibility Report

**File**: Design System - Homepage
**Page**: Home - Desktop
**Generated**: 2025-11-15 10:30 AM

---

## Summary

- **Total Nodes**: 247
- **Annotated Nodes**: 42
- **Total Issues**: 15
  - Critical: 3
  - High: 5
  - Medium: 4
  - Low: 3

---

## Headings Structure

1. Welcome to Our Product (H1)
   1. Product Features (H2)
      1. Feature One (H3)
      2. Feature Two (H3)
   2. Pricing (H2)

---

## Landmarks

- **header**: Site Header
- **nav**: Main Navigation
- **main**: Main Content
- **aside**: Related Articles
- **footer**: Site Footer

---

## Alt-Text

### Hero Image
```
A person using a laptop while sitting at a wooden desk near a window
```

---

## Issues

### Critical Issues

#### Button Label (Contrast)
- **Node**: Button Label
- **Issue**: Contrast ratio 3.2:1 fails WCAG AA
- **Required**: 4.5:1
- **Recommendation**: Increase contrast

---

## Code Snippets

### Submit Button (Web)
```html
<button
  role="button"
  aria-label="Submit feedback form"
  aria-describedby="form-help-text"
>
  Submit
</button>
```

---

*Generated by Accessibility Genie v1.0.0*
```

---

## Best Practices

### 1. Data Integrity

```typescript
// Always validate data before storing
function validateAltText(data: AltTextData): boolean {
  if (data.charCount > 200) return false;
  if (!data.isDecorative && data.altText.trim() === '') return false;
  return true;
}

// Use try-catch for storage operations
async function safeStore<T>(
  node: SceneNode,
  key: string,
  data: T
): Promise<boolean> {
  try {
    if (!validateData(data)) {
      throw new Error('Invalid data');
    }
    await storageService.setNodeData(node, key, data);
    return true;
  } catch (error) {
    console.error('Storage failed:', error);
    return false;
  }
}
```

---

### 2. Performance Optimization

```typescript
// Batch reads for multiple nodes
async function batchGetNodeData<T>(
  nodes: SceneNode[],
  key: string
): Promise<Map<string, T>> {
  const results = new Map<string, T>();

  // Use Promise.all for parallel reads
  const promises = nodes.map(async (node) => {
    const data = await storageService.getNodeData<T>(node, key);
    if (data) {
      results.set(node.id, data);
    }
  });

  await Promise.all(promises);
  return results;
}

// Cache frequently accessed data
class DataCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5 minutes

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}
```

---

### 3. Error Handling

```typescript
// Handle missing or corrupted data gracefully
async function getNodeDataSafe<T>(
  node: SceneNode,
  key: string,
  defaultValue: T
): Promise<T> {
  try {
    const data = await storageService.getNodeData<T>(node, key);
    return data ?? defaultValue;
  } catch (error) {
    console.warn('Failed to read data, using default:', error);
    return defaultValue;
  }
}

// Validate data structure before using
function isValidAltTextData(data: any): data is AltTextData {
  return (
    typeof data === 'object' &&
    typeof data.altText === 'string' &&
    typeof data.isDecorative === 'boolean' &&
    typeof data.charCount === 'number'
  );
}
```

---

### 4. Data Cleanup

```typescript
// Remove orphaned data (nodes that no longer exist)
async function cleanupOrphanedData(): Promise<number> {
  let cleaned = 0;

  // Get all nodes with stored data
  const nodesWithData = await storageService.getNodesWithData(
    STORAGE_KEYS.ALT_TEXT
  );

  for (const node of nodesWithData) {
    try {
      // Check if node still exists in document
      figma.getNodeById(node.id);
    } catch {
      // Node no longer exists, remove data
      await storageService.deleteNodeData(node, STORAGE_KEYS.ALT_TEXT);
      cleaned++;
    }
  }

  return cleaned;
}
```

---

### 5. Large Dataset Handling

```typescript
// Paginate large datasets
interface PaginatedData<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
}

function paginateResults<T>(
  items: T[],
  page: number,
  pageSize: number = 50
): PaginatedData<T> {
  const startIndex = page * pageSize;
  const endIndex = startIndex + pageSize;

  return {
    items: items.slice(startIndex, endIndex),
    page,
    pageSize,
    totalCount: items.length,
    hasMore: endIndex < items.length,
  };
}
```

---

## Storage Limitations

### Figma Plugin Data Limits

- **Max key length**: 256 characters
- **Max value size**: ~1MB per key (approximate)
- **Max keys per node**: No hard limit, but keep reasonable
- **Performance**: Async operations are recommended for large data

### Recommendations

1. **Keep data compact**: Avoid storing unnecessary fields
2. **Use compression**: For large datasets (future enhancement)
3. **Limit nesting**: Keep data structures flat when possible
4. **Clean up regularly**: Remove unused or orphaned data
5. **Monitor size**: Track total storage usage

---

**Document Status**: ✅ Complete
**Last Review**: 2025-11-21
**Next Review**: After Phase 1 implementation

---

**Key Points**:
- StorageService built in Phase 1 as reusable infrastructure
- Data models introduced incrementally as each tool needs them
- Phase 6 (Alt-Text) is first tool to persist node-level data
- All annotation tools (Phase 6-10) use the same StorageService
- PluginSettings extended by each phase for tool-specific preferences
