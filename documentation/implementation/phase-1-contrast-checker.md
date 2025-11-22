# Phase 1: Contrast Checker Implementation

**Implementation Date:** November 22, 2025
**Status:** ✅ Completed
**Version:** 1.0.0

## Overview

Phase 1 implements the core Contrast Checker feature for the Accessibility Genie Figma plugin. This feature analyzes the color contrast between foreground and background elements according to WCAG 2.1 guidelines, supporting both AA and AAA compliance levels.

## Features Implemented

### 1. Core Contrast Checking
- **Real-time contrast analysis** on selection change
- **WCAG 2.1 compliance checking** (AA and AAA levels)
- **Contrast ratio calculation** using relative luminance
- **Support for any element type** (text, frames, shapes, etc.)
- **Intelligent background detection** (walks up parent hierarchy)
- **Page background color support**

### 2. Color Detection
- **Foreground color extraction**
  - Priority: Fill color first, then stroke color
  - Handles mixed values (figma.mixed symbol)
  - Skips invisible paints

- **Background color extraction**
  - Walks up parent hierarchy to find backgrounds
  - Skips node's own color (gets actual background behind)
  - Supports page backgrounds (special 'backgrounds' property)
  - Defaults to white if no background found

### 3. Visibility Detection
- **Hierarchical visibility checking**
  - Checks node itself and all parent visibility
  - Handles special cases (PageNode, DocumentNode have no visible property)
  - Skips hidden nodes automatically

### 4. Text-Specific Features
- **Large text detection**
  - 18pt+ or 14pt+ bold = large text
  - Different WCAG thresholds for large vs normal text
- **Font size and weight extraction**
  - Handles mixed font properties
  - Provides defaults when mixed

### 5. User Interface
- **Card-based navigation** in MainView
- **Contrast Panel** displays:
  - Foreground and background color swatches
  - Hex color codes
  - Contrast ratio (e.g., "4.52:1")
  - WCAG compliance badges (AA/AAA)
  - Severity indicator (critical, medium, low)
  - Font size (for text elements)
- **Fixed bottom section** with theme toggle
- **Auto-refresh on selection change**

## Technical Architecture

### File Structure

```
src/
├── code.ts                           # Plugin entry point
├── components/
│   ├── ui/
│   │   ├── App.tsx                   # Main app shell
│   │   ├── Badge.tsx                 # Badge component
│   │   ├── BottomSection.tsx         # Fixed bottom bar
│   │   ├── Button.tsx                # Button component
│   │   ├── Card.tsx                  # Navigation card
│   │   ├── Icon.tsx                  # Icon component
│   │   └── ThemeToggle.tsx           # Theme switcher
│   └── views/
│       ├── ContrastPanel.tsx         # Contrast results view
│       └── MainView.tsx              # Main navigation
├── features/
│   └── testing/
│       └── contrast/
│           ├── contrast-checker.ts   # Core contrast logic
│           └── contrast.types.ts     # Type definitions
├── services/
│   ├── selection.service.ts          # Selection management
│   └── storage.service.ts            # Plugin data storage
├── types/
│   └── common.types.ts               # Shared types
└── utils/
    ├── color.utils.ts                # Color calculations
    ├── node.utils.ts                 # Node operations
    └── wcag.utils.ts                 # WCAG validation
```

### Key Algorithms

#### 1. Contrast Ratio Calculation
```typescript
// Based on WCAG 2.1 relative luminance formula
function getContrastRatio(fg: RGB, bg: RGB): number {
  const l1 = getRelativeLuminance(fg);
  const l2 = getRelativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
```

#### 2. Background Color Detection
```typescript
function getBackgroundColor(node: SceneNode): RGB | null {
  // Start from parent (never use node's own color as background)
  let currentNode = node.parent;

  while (currentNode && 'type' in currentNode) {
    // Special handling for PAGE nodes
    if (currentNode.type === 'PAGE') {
      return getPageBackground(currentNode);
    }

    // Try to get fill color from current ancestor
    const fill = getNodeFills(currentNode);
    if (fill) return fill;

    // Move up to next parent
    currentNode = currentNode.parent;
  }

  // Default to white
  return { r: 1, g: 1, b: 1 };
}
```

#### 3. Visibility Detection
```typescript
function isNodeVisible(node: SceneNode): boolean {
  if (!node.visible) return false;

  let currentNode: SceneNode | null = node;
  while (currentNode) {
    // PageNode and DocumentNode don't have visible property
    if ('visible' in currentNode && currentNode.visible === false) {
      return false;
    }
    currentNode = currentNode.parent as SceneNode;
  }

  return true;
}
```

## WCAG Compliance Thresholds

### Normal Text
- **WCAG AA:** 4.5:1 minimum
- **WCAG AAA:** 7:1 minimum

### Large Text (18pt+ or 14pt+ bold)
- **WCAG AA:** 3:1 minimum
- **WCAG AAA:** 4.5:1 minimum

## Message Protocol

### Plugin → UI

#### `CONTRAST_RESULT`
```typescript
{
  type: 'CONTRAST_RESULT',
  success: true,
  data: {
    nodeId: string,
    nodeName: string,
    foreground: RGB,
    foregroundHex: string,
    background: RGB,
    backgroundHex: string,
    ratio: number,
    passAA: boolean,
    passAAA: boolean,
    isLargeText: boolean,
    fontSize?: number,
    fontWeight?: number,
    severity: 'critical' | 'high' | 'medium' | 'low'
  }
}
```

### UI → Plugin

#### `CHECK_CONTRAST_SELECTION`
```typescript
{
  type: 'CHECK_CONTRAST_SELECTION'
}
```

#### `CHECK_CONTRAST_PAGE`
```typescript
{
  type: 'CHECK_CONTRAST_PAGE'
}
```

## Key Implementation Decisions

### 1. Foreground Color Priority
**Decision:** Check fill first, then fallback to stroke
**Rationale:** Most elements use fills for their primary color. Strokes are typically decorative borders.

### 2. Background Detection
**Decision:** Always walk up parent hierarchy, never use node's own color
**Rationale:** A node's fill is its foreground, not its background. True background is what's behind it.

### 3. Page Background Handling
**Decision:** Use page's `backgrounds` property instead of `fills`
**Rationale:** Figma pages use a special `backgrounds` property, not the standard `fills` array.

### 4. Visibility Check for PageNode
**Decision:** Use `'visible' in currentNode` check before accessing
**Rationale:** PageNode and DocumentNode don't have a `visible` property (undefined). We only check visibility on nodes that have this property.

### 5. Mixed Values Handling
**Decision:** Use defaults for mixed font sizes/weights
**Rationale:** When text has mixed formatting, we provide reasonable defaults (14pt, 400 weight) to still show results.

## Known Limitations

1. **Gradient backgrounds not supported** - Only solid colors are analyzed
2. **Image backgrounds ignored** - Requires pixel-by-pixel analysis (future enhancement)
3. **Opacity not fully considered** - Currently uses solid color values
4. **Single selection only** - Only checks first selected node (page scan for multiple)

## Testing Scenarios Verified

✅ Text on solid background
✅ Text on frame with fill
✅ Text in nested frames
✅ Frame with stroke only (no fill)
✅ Element directly on page
✅ Page with custom background color
✅ Hidden nodes (correctly skipped)
✅ Mixed font sizes/weights
✅ Selection change auto-refresh

## Debug Support

All debug console logs are commented out but preserved for troubleshooting:

```typescript
// Uncomment these lines for debugging:
// console.log('Checking node:', node.type, node.name);
// console.log('Foreground color =', foreground);
// console.log('Background color =', background);
```

## Performance Considerations

- **Lightweight calculations** - All operations are synchronous
- **Minimal traversal** - Background detection stops at first fill found
- **No deep copies** - RGB objects are created inline
- **Efficient visibility checks** - Short-circuit evaluation

## Future Enhancements (Post-Phase 1)

1. **Gradient support** - Analyze gradient stops
2. **Image background analysis** - Extract dominant colors
3. **Batch checking** - Analyze multiple selections
4. **Contrast fixing** - Suggest color adjustments
5. **Export reports** - Generate contrast audit reports
6. **Color blindness simulation** - Preview in different vision modes

## Dependencies

### Runtime
- `react: ^18.3.1`
- `react-dom: ^18.3.1`

### Development
- `@figma/plugin-typings: *`
- `typescript: ^5.6.3`
- `webpack: ^5.95.0`
- `ts-loader: ^9.5.1`

## Build Configuration

**Production build:** `npm run build`
**Development build:** `npm run build -- --mode=development`
**Watch mode:** `npm run dev`

## Conclusion

Phase 1 successfully implements a robust, WCAG-compliant contrast checker that works with any Figma element. The implementation handles edge cases gracefully (mixed values, page backgrounds, visibility) and provides clear, actionable feedback to users.

The foundation is solid for future phases, with clean separation of concerns, comprehensive type safety, and extensible architecture.
