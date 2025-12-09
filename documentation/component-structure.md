# Vision Accessibility Suite - Component Structure & UI Specifications

**Version**: 1.0
**Last Updated**: 2025-12-09
**Status**: Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Design System](#design-system)
3. [Component Library](#component-library)
4. [View Components](#view-components)
5. [Filter Components](#filter-components)
6. [Preset Components](#preset-components)
7. [Component Props & APIs](#component-props--apis)

---

## Overview

This document defines the React component structure for Vision Accessibility Suite, including the design system, shared UI components, and feature-specific components.

For complete implementation details, see [implementation.md](./implementation.md).

### Design Goals

- **Consistent**: Unified design language across all features
- **Reusable**: Shared components reduce duplication
- **Accessible**: Plugin itself must be accessible
- **Themeable**: Support light and dark modes
- **Responsive**: Adapt to different panel sizes
- **Professional**: Clean, modern UI design

---

## Design System

### Color Palette

#### Light Theme
```css
:root[data-theme="light"] {
  /* Primary colors */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f5f5f5;
  --color-bg-tertiary: #e8e8e8;
  --color-bg-hover: #f0f0f0;

  /* Text colors */
  --color-text-primary: #1a1a1a;
  --color-text-secondary: #666666;
  --color-text-tertiary: #999999;

  /* Border colors */
  --color-border: #e0e0e0;
  --color-border-strong: #cccccc;

  /* Brand colors */
  --color-brand-primary: #6366f1; /* Indigo */
  --color-brand-hover: #4f46e5;

  /* Semantic colors */
  --color-success: #10b981;
  --color-success-bg: #d1fae5;
  --color-warning: #f59e0b;
  --color-warning-bg: #fef3c7;
  --color-error: #ef4444;
  --color-error-bg: #fee2e2;
  --color-info: #3b82f6;
  --color-info-bg: #dbeafe;
}
```

#### Dark Theme
```css
:root[data-theme="dark"] {
  /* Primary colors */
  --color-bg-primary: #1a1a1a;
  --color-bg-secondary: #2a2a2a;
  --color-bg-tertiary: #3a3a3a;
  --color-bg-hover: #2f2f2f;

  /* Text colors */
  --color-text-primary: #f5f5f5;
  --color-text-secondary: #a8a8a8;
  --color-text-tertiary: #707070;

  /* Border colors */
  --color-border: #404040;
  --color-border-strong: #525252;

  /* Brand colors */
  --color-brand-primary: #818cf8;
  --color-brand-hover: #6366f1;

  /* Semantic colors (adjusted for dark mode) */
  --color-success: #34d399;
  --color-success-bg: #064e3b;
  --color-warning: #fbbf24;
  --color-warning-bg: #78350f;
  --color-error: #f87171;
  --color-error-bg: #7f1d1d;
  --color-info: #60a5fa;
  --color-info-bg: #1e3a8a;
}
```

### Typography

```css
/* Font family */
--font-family-base: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
                     'Roboto', 'Helvetica', 'Arial', sans-serif;
--font-family-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Consolas', monospace;

/* Font sizes */
--font-size-xs: 11px;
--font-size-sm: 12px;
--font-size-base: 14px;
--font-size-lg: 16px;
--font-size-xl: 18px;
--font-size-2xl: 24px;

/* Font weights */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

/* Line heights */
--line-height-tight: 1.2;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;
```

### Spacing

```css
/* Spacing scale (4px base unit) */
--spacing-1: 4px;
--spacing-2: 8px;
--spacing-3: 12px;
--spacing-4: 16px;
--spacing-5: 20px;
--spacing-6: 24px;
--spacing-8: 32px;
--spacing-10: 40px;
--spacing-12: 48px;
```

### Border Radius

```css
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-full: 9999px;
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
```

---

## Component Library

### 1. Button Component

**File**: `src/components/ui/Button/Button.tsx`

#### Variants

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}
```

**Usage in Plugin**:
- Generate button in Generate mode
- Load Preview button in Vision Lab mode
- Export to Canvas button
- Preset Manager actions (Import, Export, Delete)
- Zoom level buttons (25%, 50%, 100%, 200%, 400%)

---

### 2. Card Component

**File**: `src/components/ui/Card/Card.tsx`

```tsx
interface CardProps {
  icon?: string;
  iconColor?: string;
  title: string;
  description?: string;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'error' | 'info';
  };
  onClick?: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
}
```

**Usage in Plugin**:
- Filter preview cards
- Preset display cards
- Information cards in UI

---

### 3. Badge Component

**File**: `src/components/ui/Badge/Badge.tsx`

```tsx
interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
}
```

**Usage in Plugin**:
- Filter type indicators
- Preset filter count badges
- Status indicators (Built-in, Custom)

---

### 4. Checkbox Component

**File**: `src/components/ui/Checkbox/Checkbox.tsx`

```tsx
interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}
```

**Usage in Plugin**:
- Advanced Parameters toggle
- Filter options checkboxes

---

### 5. Icon Component

**File**: `src/components/ui/Icon/Icon.tsx`

```tsx
interface IconProps {
  name: string;
  size?: number;
  color?: string;
}
```

**Icons Used**:
- Filter type icons (eye, blur, color-palette, etc.)
- UI icons (chevron-down, settings, export, import, trash)
- Status icons (check, x, info, warning)

---

### 6. ThemeToggle Component

**File**: `src/components/ui/ThemeToggle.tsx`

```tsx
interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onToggle: (theme: 'light' | 'dark') => void;
}
```

**Usage in Plugin**:
- Bottom section theme switcher
- Toggles between light and dark mode

---

### 7. BottomSection Component

**File**: `src/components/ui/BottomSection.tsx`

```tsx
interface BottomSectionProps {
  // No props - self-contained component
}
```

**Contents**:
- Plugin name and credits
- Theme toggle button
- Version information

---

## View Components

### MainView

**File**: `src/components/views/MainView.tsx`

**Main panel component with two operating modes:**

#### Vision Lab Mode
- Auto-loading preview on selection change
- Filter/Preset selection
- Severity controls
- Advanced parameters panel
- Zoom controls (25%-400%)
- Canvas preview area
- Export to Canvas button

#### Generate Mode
- Filter selection
- Severity controls
- Advanced parameters panel
- Selected node display
- Generate Simulation button

**Key Features**:
- Tab switching between modes
- Real-time filter application
- Preset management integration
- Persistent state (selected filter/preset)
- Auto-loading in Vision Lab mode

---

## Filter Components

Located in `src/components/ui/Filter/`

### FilterDropdown

**File**: `FilterDropdown.tsx`

```tsx
interface FilterDropdownProps {
  value: FilterType | null;
  onChange: (filter: FilterType) => void;
  disabled?: boolean;
}
```

**Features**:
- 14 filter type selection
- Grouped by category (Color Vision, Visual Field, Other)
- Filter icons
- Search/filter functionality

---

### FilterIcon

**File**: `FilterIcon.tsx`

```tsx
interface FilterIconProps {
  filterType: FilterType;
  size?: number;
}
```

**Features**:
- Visual representation of each filter type
- Color-coded icons
- Consistent styling

---

### SeveritySlider

**File**: `SeveritySlider.tsx`

```tsx
interface SeveritySliderProps {
  value: number; // 0-1
  onChange: (value: number) => void;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
}
```

**Usage**:
- Color blindness severity (0-100%)
- Visual field defect intensity
- Other filter intensities

---

### RadiusSlider

**File**: `RadiusSlider.tsx`

```tsx
interface RadiusSliderProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  min: number;
  max: number;
  unit?: string;
}
```

**Usage**:
- Central vision loss radius (50-300px)
- Peripheral vision loss tunnel radius (30-200px)
- Blur radius (1-20px)

---

### FilterParameterSlider

**File**: `FilterParameterSlider.tsx`

```tsx
interface FilterParameterSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}
```

**Generic slider for various filter parameters**:
- Temperature (2000-3500K)
- Opacity (0-1)
- Offset (-20 to +20px)
- Iterations (1-5)

---

## Preset Components

Located in `src/components/ui/Presets/`

### PresetSelector

**File**: `PresetSelector.tsx`

```tsx
interface PresetSelectorProps {
  presets: FilterPreset[];
  selectedPreset: FilterPreset | null;
  onSelect: (preset: FilterPreset | null) => void;
  onManage: () => void;
}
```

**Features**:
- Dropdown for preset selection
- Built-in presets section
- Custom presets section
- Preset Manager button
- Clear selection option

---

### PresetDropdown

**File**: `PresetDropdown.tsx`

```tsx
interface PresetDropdownProps {
  presets: FilterPreset[];
  value: string | null;
  onChange: (presetId: string | null) => void;
  placeholder?: string;
}
```

**Features**:
- Searchable dropdown
- Preset descriptions
- Filter count badges
- Built-in vs Custom indicators

---

### PresetManager

**File**: `PresetManager.tsx`

```tsx
interface PresetManagerProps {
  isOpen: boolean;
  onClose: () => void;
  customPresets: FilterPreset[];
  onImport: (presets: FilterPreset[]) => void;
  onExport: (preset: FilterPreset) => void;
  onExportAll: () => void;
  onDelete: (presetId: string) => void;
}
```

**Features**:
- Modal interface
- Built-in presets list (export only)
- Custom presets list (export/delete)
- Import presets button
- Export all custom presets button
- JSON file handling

**UI Layout**:
```
┌─────────────────────────────────────────────────┐
│  Preset Manager                            [✕]  │
├─────────────────────────────────────────────────┤
│                                                  │
│  Built-in Presets:                              │
│  ┌───────────────────────────────────────────┐ │
│  │ Advanced Cataracts              [Export]  │ │
│  │ Blur + Yellowing + Contrast Loss          │ │
│  │ 3 filters                                 │ │
│  ├───────────────────────────────────────────┤ │
│  │ Aging Vision (65+)              [Export]  │ │
│  │ Mild aging effects                        │ │
│  │ 3 filters                                 │ │
│  └───────────────────────────────────────────┘ │
│                                                  │
│  Custom Presets:                                │
│  ┌───────────────────────────────────────────┐ │
│  │ My Custom Preset      [Export]  [Delete]  │ │
│  │ Custom combination                        │ │
│  │ 4 filters                                 │ │
│  └───────────────────────────────────────────┘ │
│                                                  │
│  [📥 Import Presets]  [📤 Export All Custom]   │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## Component Props & APIs

### Summary Table

| Component | Key Props | Variants | Usage |
|-----------|-----------|----------|-------|
| **Button** | variant, size, disabled, icon | primary, secondary, tertiary, ghost | Actions throughout UI |
| **Card** | icon, title, description, badge, onClick | - | Informational cards |
| **Badge** | variant, size | success, warning, error, info, neutral | Status indicators |
| **Checkbox** | checked, onChange, label | - | Toggle options |
| **Icon** | name, size, color | - | SVG icons throughout |
| **FilterDropdown** | value, onChange, disabled | - | 14 filter types |
| **FilterIcon** | filterType, size | - | Visual filter representation |
| **SeveritySlider** | value, onChange, min, max | - | 0-100% intensity |
| **RadiusSlider** | value, onChange, min, max, unit | - | Pixel radius values |
| **FilterParameterSlider** | label, value, onChange, min, max | - | Generic parameters |
| **PresetSelector** | presets, selectedPreset, onSelect | - | Preset selection |
| **PresetDropdown** | presets, value, onChange | - | Searchable preset dropdown |
| **PresetManager** | isOpen, customPresets, onImport, onExport | - | Preset management modal |
| **ThemeToggle** | theme, onToggle | - | Light/dark mode |
| **BottomSection** | - | - | Credits and theme toggle |

---

## Component Hierarchy

```
App (ui.tsx)
└── MainView
    ├── Header Section
    │   └── Mode Tabs (Generate / Vision Lab)
    │
    ├── Filter Selection Section
    │   ├── PresetSelector (or)
    │   │   ├── PresetDropdown
    │   │   └── Button (Preset Manager)
    │   │       └── PresetManager Modal
    │   │           ├── Built-in Presets List
    │   │           └── Custom Presets List
    │   │
    │   └── FilterDropdown
    │       └── FilterIcon (for each filter)
    │
    ├── Controls Section
    │   ├── SeveritySlider
    │   ├── RadiusSlider (visual field filters)
    │   └── Advanced Parameters (collapsible)
    │       └── FilterParameterSlider (multiple)
    │
    ├── Preview Section (Vision Lab mode)
    │   ├── Zoom Controls
    │   │   └── Button (25%, 50%, 100%, 200%, 400%)
    │   ├── Canvas Preview Area
    │   └── Selected Node Info
    │
    ├── Generate Section (Generate mode)
    │   ├── Selected Node Info
    │   └── Button (Generate Simulation)
    │
    ├── Export Section (Vision Lab mode)
    │   └── Button (Export to Canvas)
    │
    └── BottomSection
        ├── Credits
        └── ThemeToggle
```

---

## Styling Patterns

### CSS Modules

All components use CSS Modules for scoped styling:

```tsx
// Component.tsx
import styles from './Component.module.css';

<div className={styles.container}>
  <button className={styles.button}>Click me</button>
</div>
```

### Responsive Design

```css
/* Adapt to panel width */
.panel {
  width: 100%;
  max-width: 100%;
  padding: var(--spacing-4);
}

@media (min-width: 400px) {
  .panel {
    padding: var(--spacing-6);
  }
}
```

### Theme Support

```css
/* Use CSS variables for theming */
.button {
  background-color: var(--color-brand-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.button:hover {
  background-color: var(--color-brand-hover);
}
```

---

## Accessibility

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Proper focus states
- Tab order follows visual order
- Enter/Space for buttons
- Arrow keys for sliders

### Screen Reader Support

- Semantic HTML elements
- ARIA labels where needed
- ARIA live regions for dynamic content
- Descriptive button labels

### Color Contrast

- All text meets WCAG AA standards
- Focus indicators are visible
- Error states are clearly marked

---

## References

For complete implementation details, see:
- **[implementation.md](./implementation.md)** - Complete feature implementation
- **[plugin-architecture.md](./plugin-architecture.md)** - System architecture
- **[data-models-storage.md](./data-models-storage.md)** - Data models

---

**Document Status**: ✅ Complete
**Last Review**: 2025-12-09
**Next Review**: After UI updates

