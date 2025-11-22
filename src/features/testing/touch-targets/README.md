# Touch Targets Checker

## Tool Overview

The Touch Targets Checker validates the size of interactive elements against platform-specific accessibility standards. Interactive elements must be large enough for users to easily tap or click, especially on touch-based devices.

**Addresses**:
- WCAG 2.5.5 Target Size (Level AAA)
- iOS Human Interface Guidelines
- Android Material Design Guidelines
- Windows Design Guidelines

## How It Works

1. User selects platform (Web, iOS, Android, Windows) and compliance level (AA/AAA)
2. User triggers check for entire page or current selection
3. Plugin identifies potentially interactive nodes based on:
   - Nodes with reactions (click, hover, drag, etc.)
   - Component instances (often interactive)
   - Nodes with interactive naming patterns (button, btn, link, etc.)
4. For each interactive node:
   - Measure width and height
   - Compare against platform-specific minimum sizes
   - Calculate severity based on how far below minimum
   - Generate result with pass/fail status and message
5. Display results with:
   - Summary statistics (total, pass, fail)
   - Detailed list of each interactive element
   - Current size vs. required size comparison
   - Fix button for auto-resizing to minimum size

## Data Flow Diagram

```
User selects platform and level → User clicks "Check Page"
    ↓
UI sends CHECK_TOUCH_TARGETS_PAGE message
    ↓
Plugin code: TouchTargetsChecker.checkPage(options)
    ↓
For each node on page:
  ├─ Check if node is visible (skip if hidden)
  ├─ Check if node is interactive (reactions, naming, type)
  ├─ Measure width and height
  ├─ Get platform requirements (minWidth, minHeight)
  ├─ Calculate pass/fail
  ├─ Calculate severity (critical/high/medium/low)
  └─ Generate TouchTargetResult
    ↓
Return TouchTargetResult[] to UI
    ↓
UI displays results in TouchTargetsPanel
    ↓
User clicks "Fix" button on failing item
    ↓
UI sends FIX_TOUCH_TARGET message with nodeId and required sizes
    ↓
Plugin code: TouchTargetsChecker.fixNode()
    ↓
Resize node to minimum size
    ↓
Return success status to UI
    ↓
UI refreshes results
```

## User Interaction Flow

1. User opens plugin → sees main tool list
2. User clicks "Touch Targets" card → TouchTargetsPanel opens
3. User selects platform from dropdown (Web/iOS/Android/Windows)
4. User selects compliance level (AA/AAA)
5. User clicks "Check Page" or "Check Selection"
6. Plugin scans for interactive elements
7. Results appear showing:
   - Summary stats (total, pass, fail counts)
   - Filter buttons (All / Pass / Fail)
   - List of interactive elements with:
     - Pass/fail icon (green check / red X)
     - Element name and type
     - Current size vs required size
     - Descriptive message
     - "Fix" button (for failing items)
8. User can filter results by status
9. User clicks "Fix" on an item → node auto-resizes
10. User clicks element in list → Figma zooms to that node (future enhancement)

## Technical Implementation

### Interactive Node Detection

The checker uses multiple heuristics to identify potentially interactive nodes:

1. **Reactions**: Nodes with Figma reactions (CLICK, HOVER, DRAG, etc.) are always considered interactive
2. **Component Instances**: Component instances are likely to be interactive buttons/controls
3. **Naming Patterns**: Nodes with names matching `/button|btn|link|clickable|interactive|touch|tap/i` are considered interactive

This multi-layered approach ensures we catch interactive elements even if they don't have reactions assigned in the design.

### Platform-Specific Requirements

Different platforms have different minimum touch target sizes:

| Platform | AA Level | AAA Level | Unit | Source |
|----------|----------|-----------|------|--------|
| Web | 24×24 | 44×44 | px | WCAG 2.5.5 |
| iOS | 44×44 | 44×44 | pt | HIG |
| Android | 48×48 | 48×48 | dp | Material Design |
| Windows | 44×44 | 44×44 | px | Windows Design |

All sizes are converted to pixels (px) for consistency in Figma.

### Severity Calculation

Severity is calculated based on how far below the minimum size the target is:

```typescript
const widthRatio = actualWidth / requiredWidth;
const heightRatio = actualHeight / requiredHeight;
const minRatio = Math.min(widthRatio, heightRatio);

if (minRatio < 0.5)  → critical  // Less than 50% of required size
if (minRatio < 0.7)  → high      // Less than 70% of required size
if (minRatio < 0.9)  → medium    // Less than 90% of required size
else                 → low       // Meets or exceeds required size
```

This provides graduated feedback rather than just pass/fail.

### Auto-Fix Functionality

The "Fix" button automatically resizes nodes to meet minimum requirements:

1. Check if node width is below minimum → resize width
2. Check if node height is below minimum → resize height
3. Preserve aspect ratio when possible
4. Only resize upward (never shrink nodes)
5. Refresh results after fix to show new status

**Safety**: The fix only makes nodes larger, never smaller, to avoid breaking layouts.

## Scientific/Technical References

### WCAG Guidelines

- **WCAG 2.5.5 Target Size (Level AAA)**: https://www.w3.org/WAI/WCAG21/Understanding/target-size.html
  - Minimum 44×44 CSS pixels for touch targets
  - Exceptions for inline links, essential controls, user-controlled sizes

### Platform Guidelines

- **iOS Human Interface Guidelines - Accessibility**: https://developer.apple.com/design/human-interface-guidelines/accessibility
  - 44×44 points minimum for all tappable controls
  - Based on average fingertip size (approximately 44 pixels)

- **Android Material Design - Accessibility**: https://material.io/design/usability/accessibility.html
  - 48×48 dp minimum touch target size
  - Equivalent to approximately 9mm (physical size)

- **Windows Design - Touch Targets**: https://docs.microsoft.com/en-us/windows/apps/design/input/guidelines-for-targeting
  - 44×44 epx recommended minimum
  - 7.5mm minimum physical size

### Research

- **Human Finger Size Study** (MIT Touch Lab): Average adult index finger pad is 10-14mm wide, supporting 44px minimum recommendation
- **Touch Accuracy Research** (Microsoft Research): Error rates increase significantly below 42px touch targets

## External Resources & Dependencies

### npm Packages

No external npm packages required. Uses native Figma Plugin API and browser APIs.

### Reference Code

Touch target detection approach inspired by:
- **axe-core** accessibility testing engine: https://github.com/dequelabs/axe-core
  - Interactive element detection patterns
- **pa11y** accessibility testing tool: https://github.com/pa11y/pa11y
  - Size measurement techniques

## Testing Approach

### Test Cases

1. **Button components** (44×44px) → Should pass Web AAA, iOS, Android, Windows
2. **Small button** (30×30px) → Should pass Web AA, fail Web AAA
3. **Tiny button** (16×16px) → Should fail all platforms, severity: critical
4. **Link in text** → Should be detected as interactive if has reaction
5. **Component instance** → Should be checked even without explicit reactions
6. **Hidden button** → Should be skipped (not checked)
7. **Non-interactive frame** → Should be skipped (not detected as interactive)
8. **Button with reaction** → Should always be detected as interactive

### Manual Testing Checklist

- [ ] Check entire page with 50+ interactive elements
- [ ] Verify platform switching updates requirements
- [ ] Test AA vs AAA level switching
- [ ] Verify pass/fail indicators accurate
- [ ] Test "Fix" button resizes correctly
- [ ] Verify fixed nodes pass validation
- [ ] Test filtering (All / Pass / Fail)
- [ ] Verify interactive node detection accuracy
- [ ] Test with component instances
- [ ] Test with nodes that have reactions
- [ ] Test with various node types (FRAME, RECTANGLE, ELLIPSE, etc.)

## Known Limitations

1. **Interactive Detection Heuristic**: May miss interactive elements that don't have reactions, aren't components, and don't follow naming patterns
2. **No Physical Size Calculation**: Sizes are in pixels, not converted to physical mm/inches based on device DPI
3. **No Spacing Consideration**: WCAG 2.5.5 allows smaller targets if spacing is adequate (currently not implemented)
4. **Auto-Fix Doesn't Preserve Constraints**: Fixed nodes may break auto-layout or constraints
5. **No Nested Touch Target Analysis**: Doesn't check if touch target overlaps with other interactive elements

## Future Enhancements

1. **Physical Size Calculation**: Convert pixel sizes to mm/inches based on target device DPI
2. **Spacing Analysis**: Implement WCAG 2.5.5 exception for targets with adequate spacing
3. **Constraint Preservation**: Preserve auto-layout and constraints when auto-fixing
4. **Click/Zoom to Node**: Click on result to select and zoom to that node in Figma
5. **Batch Fix**: "Fix All" button to resize all failing targets at once
6. **Custom Platform Requirements**: Allow users to define custom minimum sizes
7. **Visual Annotations**: Show size badges on canvas for all interactive elements
8. **Export Report**: Generate CSV/PDF report of touch target compliance
9. **Better Interactive Detection**: Use machine learning or more sophisticated heuristics
10. **Spacing Visualization**: Show spacing between adjacent touch targets on canvas
