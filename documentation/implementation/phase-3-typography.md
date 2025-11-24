# Phase 3: Typography Checker Implementation

**Implementation Date:** November 23, 2025
**Status:** ✅ Completed
**Version:** 1.0.0

## Overview

Phase 3 implements the Typography Checker feature for the Accessibility Genie Figma plugin. This feature validates typography against WCAG 2.1 guidelines (SC 1.4.8 Visual Presentation and SC 1.4.12 Text Spacing) with automated checking, bulk fixes, and real-time monitoring capabilities.

## Features Implemented

### 1. Core Typography Validation
- **Six validation rules** with configurable options
  - Font size (minimum 11px recommended, 16px ideal)
  - Line height (1.5 for body text, 1.2 for headings)
  - Line length (50-75 characters optimal)
  - Letter spacing (WCAG 1.4.12 minimum 0.12em)
  - Text alignment (left-aligned preferred for readability)
  - Font weight (minimum 400 for body text)
- **Three-tier status system**
  - Fail (critical/high severity) - WCAG violations
  - Attention (medium/low severity) - Recommendations
  - Pass - Meets all criteria
- **Severity-based prioritization**
  - Critical: Major WCAG failures
  - High: Significant accessibility barriers
  - Medium: Improvements recommended
  - Low: Best practice suggestions

### 2. Real-Time Page Monitoring
- **Continuous monitoring mode** with "Monitor entire page" button
- **Automatic updates** on document changes (debounced 500ms)
- **Visual feedback** with rotating refresh icon during monitoring
- **Stop button** to exit monitoring and return to selection mode
- **Informative helper text** guiding users during monitoring

### 3. Auto-Check on Selection
- **Automatic validation** when text nodes are selected
- **Panel lifecycle management** (mount/unmount notifications)
- **Mode tracking** to prevent conflicts between page/selection modes
- **Reset to initial state** when selection is cleared

### 4. Bulk Fix Functionality
- **Collapsible accordion panel** with auto-collapse on selection change
- **Multiple fix options**:
  - Set minimum font size (default: 16px)
  - Apply recommended line height (default: 1.5)
  - Fix letter spacing (WCAG minimum)
  - Fix text alignment (justified → left)
- **Apply to selection** or all failing text nodes
- **Results refresh** after fixes applied

### 5. User Interface Enhancements
- **Validation rules accordion**
  - Collapsible with dynamic count indicator
  - Default selection: 2 critical rules (Font Size, Line Height)
  - Chevron indicator for open/closed state
- **Clickable summary statistics** for filtering
  - Pass/Fail/Attention counts
  - Visual feedback for active filter
- **Priority-based sorting**
  - First by status: fail → attention → pass
  - Then by severity: critical → high → medium → low
- **Enhanced empty states**
  - Clear user guidance with "Or" divider
  - Larger main hint text
  - Context-aware messaging

### 6. Visual Feedback
- **Color-coded status indicators**
  - Green (pass): Meets all requirements
  - Red (fail): Critical/high severity issues
  - Orange (attention): Medium/low severity issues
- **Detailed result cards** showing:
  - Node name and font metrics
  - Text preview (first 80 characters)
  - Issue list with WCAG references
  - Click to zoom to node
- **Monitoring helper banner**
  - Blue gradient background
  - Info icon with explanatory text
  - Subtle shadow for depth

## Technical Architecture

### File Structure

```
src/features/testing/typography/
├── typography-checker.ts              Core validation logic
├── typography.types.ts                TypeScript type definitions
├── typography.constants.ts            WCAG thresholds and rules
└── components/
    ├── TypographyPanel.tsx            Main UI panel
    └── TypographyPanel.css            Panel styles

src/code.ts                            Plugin entry point (updated)
src/components/ui/Icon/Icon.tsx        Icon component (added icons)
```

### Key Algorithms

#### 1. Typography Rule Validation

```typescript
interface TypographyRule {
  type: TypographyRuleType;
  validate: (node: TextNode) => TypographyIssue | null;
  severity: Severity;
  wcagReference?: string;
}

// Font Size Validation
{
  type: 'font-size',
  validate: (node) => {
    const fontSize = this.getFontSize(node);
    if (fontSize < 11) {
      return {
        ruleType: 'font-size',
        message: `Font size ${fontSize}px is too small (minimum 11px recommended)`,
        severity: 'critical',
        wcagReference: 'https://www.w3.org/WAI/WCAG21/Understanding/visual-presentation.html'
      };
    }
    if (fontSize < 16) {
      return {
        ruleType: 'font-size',
        message: `Font size ${fontSize}px is below recommended 16px`,
        severity: 'medium',
        wcagReference: 'https://www.w3.org/WAI/WCAG21/Understanding/visual-presentation.html'
      };
    }
    return null;
  }
}
```

#### 2. Status Calculation

```typescript
function calculateStatus(issues: TypographyIssue[]): TypographyStatus {
  if (issues.length === 0) return 'pass';

  // Fail if has critical or high severity issues
  if (issues.some(i => i.severity === 'critical' || i.severity === 'high')) {
    return 'fail';
  }

  // Attention for medium or low severity issues
  return 'attention';
}
```

#### 3. Line Length Calculation

```typescript
function calculateLineLength(node: TextNode): number {
  const width = node.width;
  const fontSize = this.getFontSize(node);
  const avgCharWidth = fontSize * 0.5; // Approximate character width
  return Math.round(width / avgCharWidth);
}
```

#### 4. Debounced Page Monitoring

```typescript
function debouncedCheckPage() {
  if (!typographyMonitoring) return;

  if (monitoringDebounceTimer) {
    clearTimeout(monitoringDebounceTimer);
  }

  monitoringDebounceTimer = setTimeout(() => {
    const results = typographyChecker.checkPage(typographyCheckOptions);
    figma.ui.postMessage({
      type: 'TYPOGRAPHY_RESULT',
      success: true,
      data: results,
    });
  }, 500);
}
```

#### 5. Two-Level Result Sorting

```typescript
const filteredResults = results
  .filter((result) => {
    if (filter === 'pass') return result.status === 'pass';
    if (filter === 'fail') return result.status === 'fail';
    if (filter === 'attention') return result.status === 'attention';
    return true;
  })
  .sort((a, b) => {
    // Sort order: fail, attention, pass
    const statusOrder = { fail: 0, attention: 1, pass: 2 };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];

    // If same status, sort by severity: critical, high, medium, low
    if (statusDiff === 0) {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    }

    return statusDiff;
  });
```

## WCAG Compliance Thresholds

### WCAG 2.1 SC 1.4.8 (Visual Presentation)

**Font Size:**
- Minimum: 11px (critical if below)
- Recommended: 16px (medium if 11-15px)

**Line Height:**
- Body text: 1.5 minimum (WCAG requirement)
- Headings: 1.2 minimum (acceptable for large text)

**Line Length:**
- Optimal: 50-75 characters
- Warning: <50 or >75 characters
- Critical: <40 or >100 characters

**Text Alignment:**
- Preferred: Left-aligned (for LTR languages)
- Avoid: Justified (can create uneven spacing)

### WCAG 2.1 SC 1.4.12 (Text Spacing)

**Letter Spacing:**
- Minimum: 0.12em (WCAG requirement)
- Critical if below 0.12em

**Font Weight:**
- Minimum: 400 for body text
- 300 acceptable for headings/large text

## Message Protocol

### Plugin → UI

#### `TYPOGRAPHY_RESULT`
```typescript
{
  type: 'TYPOGRAPHY_RESULT',
  success: true,
  data: TypographyResult[] // Array of validation results
}
```

#### `TYPOGRAPHY_BULK_FIXED`
```typescript
{
  type: 'TYPOGRAPHY_BULK_FIXED',
  success: boolean,
  fixedCount: number
}
```

### UI → Plugin

#### `TYPOGRAPHY_PANEL_MOUNTED`
```typescript
{
  type: 'TYPOGRAPHY_PANEL_MOUNTED',
  data: {
    options: {
      checkFontSize: boolean,
      checkLineHeight: boolean,
      checkLineLength: boolean,
      checkLetterSpacing: boolean,
      checkTextAlign: boolean,
      checkFontWeight: boolean
    }
  }
}
```

#### `TYPOGRAPHY_PANEL_UNMOUNTED`
```typescript
{
  type: 'TYPOGRAPHY_PANEL_UNMOUNTED'
}
```

#### `START_TYPOGRAPHY_MONITORING`
```typescript
{
  type: 'START_TYPOGRAPHY_MONITORING',
  data: {
    checkFontSize: boolean,
    checkLineHeight: boolean,
    checkLineLength: boolean,
    checkLetterSpacing: boolean,
    checkTextAlign: boolean,
    checkFontWeight: boolean
  }
}
```

#### `STOP_TYPOGRAPHY_MONITORING`
```typescript
{
  type: 'STOP_TYPOGRAPHY_MONITORING'
}
```

#### `TYPOGRAPHY_UPDATE_OPTIONS`
```typescript
{
  type: 'TYPOGRAPHY_UPDATE_OPTIONS',
  data: {
    options: {
      checkFontSize: boolean,
      checkLineHeight: boolean,
      checkLineLength: boolean,
      checkLetterSpacing: boolean,
      checkTextAlign: boolean,
      checkFontWeight: boolean
    }
  }
}
```

#### `TYPOGRAPHY_BULK_FIX`
```typescript
{
  type: 'TYPOGRAPHY_BULK_FIX',
  data: {
    nodeIds: string[],
    options: {
      fixFontSize: boolean,
      targetFontSize: number,
      fixLineHeight: boolean,
      targetLineHeight: number,
      fixLetterSpacing: boolean,
      fixAlignment: boolean
    }
  }
}
```

## Key Implementation Decisions

### 1. Three-Tier Status System
**Decision:** Replace simple pass/fail with fail/attention/pass
**Rationale:** Distinguishes between critical WCAG violations (fail) and best practice recommendations (attention), helping users prioritize fixes.

### 2. Default Rule Selection
**Decision:** Only Font Size and Line Height selected by default
**Rationale:** These are the most critical typography rules. Users can enable additional rules as needed without overwhelming initial scans.

### 3. Monitoring Mode vs Selection Mode
**Decision:** Track mode separately and prevent auto-check from interfering with monitoring
**Rationale:** Prevents race conditions where selection changes would override monitoring results. Clear mode separation improves UX.

### 4. Debounced Document Changes
**Decision:** 500ms debounce after last document change before re-checking
**Rationale:** Prevents excessive checks during rapid changes (e.g., typing, dragging). Balances responsiveness with performance.

### 5. Auto-Collapse Bulk Fix Panel
**Decision:** Collapse panel when selection changes (tracked by nodeIds)
**Rationale:** Prevents confusion when bulk fix options no longer apply to current selection. Tracking nodeIds instead of results array prevents unnecessary re-renders.

### 6. Validation Rules Accordion
**Decision:** Make validation rules collapsible with dynamic count
**Rationale:** Reduces visual clutter while showing at-a-glance how many rules are active. Follows same accordion pattern as bulk fix options.

### 7. Empty State Reset on Deselection
**Decision:** Reset to initial state when text is deselected in selection mode
**Rationale:** Clear visual feedback that no text is selected. Guides users to either select text or use monitoring mode.

### 8. Clickable Summary Stats
**Decision:** Remove separate filter buttons, make stats clickable
**Rationale:** Reduces UI clutter and follows common pattern where stats are interactive filters.

### 9. Priority-Based Sorting
**Decision:** Two-level sort (status, then severity)
**Rationale:** Most critical issues appear first, helping users prioritize fixes efficiently.

### 10. Panel Lifecycle Management
**Decision:** Notify plugin when panel mounts/unmounts
**Rationale:** Allows plugin to start/stop auto-check behavior and clean up event listeners properly.

## Known Limitations

1. **Line length calculation approximate** - Uses average character width estimation, not actual text measurement
2. **Mixed font styles** - When text has mixed formatting, uses first character's properties
3. **No RTL language support** - Text alignment rules assume LTR languages
4. **Fixed rules** - Cannot customize WCAG thresholds (uses standard values)
5. **No responsive sizing** - Does not consider viewport size or device DPI
6. **Auto-fix constraints** - Does not preserve auto-layout or component constraints when resizing

## Testing Scenarios Verified

✅ Font size validation (11px min, 16px recommended)
✅ Line height validation (1.5 body, 1.2 headings)
✅ Line length validation (50-75 characters)
✅ Letter spacing validation (0.12em minimum)
✅ Text alignment checking (justified flagged)
✅ Font weight validation (400 minimum)
✅ Auto-check on selection
✅ Monitoring mode with document changes
✅ Stop monitoring and return to selection mode
✅ Bulk fix functionality (font size, line height, spacing, alignment)
✅ Results refresh after bulk fix
✅ Clickable filter stats
✅ Priority-based sorting (status → severity)
✅ Validation rules accordion with dynamic count
✅ Empty state reset on deselection
✅ Panel collapse on selection change

## Debug Support

All debug console logs are minimal. Bulk fix operations log to console for verification:
```typescript
console.log(`Successfully fixed ${msg.fixedCount} text nodes`);
console.log(`Requesting bulk fix for ${nodesToFix.length} nodes`, bulkFixOptions);
```

## Performance Considerations

- **Debounced monitoring**: 500ms delay prevents excessive checks during rapid changes
- **Efficient filtering**: Array filter and sort operations optimized
- **Minimal re-renders**: React state updates carefully managed
- **nodeIds tracking**: Prevents unnecessary effect triggers
- **Lazy accordion**: Rules grid only rendered when expanded
- **No deep copies**: Results objects created inline

## UX Enhancements

### Visual Design
- **Gradient monitoring banner** with info icon
- **Color-coded status** (green/red/orange)
- **Spinning refresh icon** during monitoring
- **Compact Stop button** (60px width)
- **Chevron indicators** for accordions
- **Subtle shadows** for depth

### Interaction Design
- **Clickable stats** with hover/active states
- **Auto-collapse** bulk fix panel
- **Reset on deselection** to initial state
- **Clear empty states** with actionable guidance
- **Responsive button states** (disabled, loading)

### Information Architecture
- **Rules accordion first** (configure before check)
- **Monitor button prominent** (primary action)
- **Stats above results** (overview → details)
- **Bulk fix below stats** (fix after review)
- **Priority sorting** (most critical first)

## Future Enhancements (Post-Phase 3)

1. **RTL language support** - Text alignment rules for right-to-left languages
2. **Custom thresholds** - User-configurable WCAG values
3. **Responsive sizing** - Account for viewport and device DPI
4. **Font family validation** - Check for web-safe/accessible fonts
5. **Advanced line length** - Actual text measurement instead of estimation
6. **Constraint preservation** - Maintain auto-layout when fixing
7. **Batch export** - Export typography report (JSON/CSV/PDF)
8. **Typography templates** - Save/load rule configurations
9. **AI suggestions** - Smart recommendations based on content type
10. **Multi-language** - Localized validation rules

## Dependencies

### Runtime
- `react: ^18.3.1`
- `react-dom: ^18.3.1`

### Development
- `@figma/plugin-typings: *`
- `typescript: ^5.6.3`
- `webpack: ^5.95.0`
- `ts-loader: ^9.5.1`

### Reused from Previous Phases
- ✅ Button, Icon, Badge components (Phase 1)
- ✅ useFigmaMessage hook (Phase 1)
- ✅ isNodeVisible utility (Phase 1)
- ✅ SelectionService (Phase 1)
- ✅ MainView navigation infrastructure (Phase 1)
- ✅ App shell and routing (Phase 1)

### New Components Added
- ✅ `refresh-cw` icon (rotating arrows)
- ✅ `alert-circle` icon (info circle)
- ✅ Validation rules accordion
- ✅ Monitoring helper banner
- ✅ Two-level result sorting

## Build Configuration

**Production build:** `npm run build`
**Development build:** `npm run build -- --mode=development`
**Watch mode:** `npm run dev`

**Build Output:**
- code.js: 20.8 KiB (minimized)
- Successful compilation with 0 errors

## Conclusion

Phase 3 successfully implements a comprehensive typography validation system with WCAG 2.1 compliance checking, real-time monitoring, and automated fixes. The implementation handles complex scenarios gracefully (mixed formatting, mode conflicts, selection changes) and provides clear, actionable feedback with priority-based sorting.

The UX enhancements (monitoring mode, accordion rules, clickable filters) make the tool intuitive and efficient. The three-tier status system helps users distinguish between critical violations and best practice recommendations.

**Key Achievements:**
- ✅ 6 validation rules with configurable options
- ✅ Three-tier status system (fail/attention/pass)
- ✅ Real-time monitoring with document change detection
- ✅ Auto-check on selection with lifecycle management
- ✅ Bulk fix functionality with multiple options
- ✅ Priority-based sorting (status → severity)
- ✅ Enhanced UX with accordions and visual feedback
- ✅ Type-safe implementation with proper state management
- ✅ Production-ready build
