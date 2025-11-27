# Headings Manager

## Tool Overview

The Headings Manager allows designers to annotate text layers with semantic heading levels (H1-H6), creating a proper document structure that will be essential for screen reader users and SEO. This tool helps ensure that designs follow HTML5 heading hierarchy best practices before handoff to developers.

**Addresses**:
- WCAG 2.1 Success Criterion 1.3.1 (Info and Relationships)
- HTML5 heading structure requirements
- Screen reader navigation patterns

**Why It's Needed**:
- Screen readers use headings as primary navigation method (93% of users navigate by headings)
- Proper heading hierarchy creates logical document structure
- Improves SEO and content organization
- Prevents common accessibility violations in production code

## How It Works

### Manual Heading Assignment

1. User selects a text layer in Figma
2. User chooses heading level (H1-H6) from dropdown
3. User clicks "Add" button
4. Plugin stores heading level in plugin data (persisted in Figma file)
5. Plugin creates color-coded badge annotation on canvas
6. Plugin validates hierarchy and displays any issues

### Hierarchy Validation

The tool automatically validates:
- **Exactly one H1** per page (most important rule)
- **No skipped levels** (e.g., H1 → H3 without H2)
- **Sequential order** (headings follow logical progression)
- **Empty headings** (text content exists)

Validation runs automatically after every change and displays:
- ❌ **Errors**: Critical issues that must be fixed (e.g., no H1, multiple H1s)
- ⚠️ **Warnings**: Issues that should be addressed (e.g., skipped levels, empty headings)

## Data Flow Diagram

```
User selects text layer + chooses H1-H6 + clicks "Add"
    ↓
UI sends ADD_HEADING message
    ↓
Plugin: HeadingsManager.addSelectedAsHeading(level)
    ↓
For selected text node:
  ├─ Validate node type (TEXT)
  ├─ Check if already has heading
  ├─ Get parent frame info
  ├─ Create HeadingItem object
  ├─ Store in plugin data (persisted)
  └─ Create color-coded badge on canvas
    ↓
Plugin: HeadingsManager.getStats()
    ↓
Validate heading hierarchy:
  ├─ Check for exactly one H1
  ├─ Check for skipped levels
  ├─ Check for empty headings
  └─ Generate validation issues
    ↓
Return { items, stats } to UI
    ↓
UI displays:
  ├─ Grouped heading list (by frame)
  ├─ Level statistics (count by H1-H6)
  └─ Validation issues panel
```

## User Interaction Flow

1. **User opens plugin** → sees main tool list
2. **User clicks "Headings" card** → HeadingsPanel opens
3. **User reads instructions**: "Select any text layer to indicate its hierarchy and click add"
4. **User selects text layer in canvas** (e.g., page title)
5. **User selects level from dropdown** (default: H1)
6. **User clicks "Add" button**
7. **Plugin creates colored badge** next to text layer:
   - 🟣 H1 (Purple)
   - 🔵 H2 (Blue)
   - 🔵 H3 (Teal)
   - 🟢 H4 (Green)
   - 🟡 H5 (Yellow)
   - 🟠 H6 (Orange)
8. **Heading appears in list** organized by parent frame
9. **Validation runs** → shows issues if any
10. **User can**:
    - Click badge to change level (inline dropdown)
    - Click heading text to zoom to it in canvas
    - Click trash icon to remove heading
    - Toggle eye icon to show/hide all badges

## Technical Implementation

### Data Structure

```typescript
interface HeadingItem {
  nodeId: string;              // Figma node ID
  nodeName: string;            // Node name in Figma
  level: 'H1' | 'H2' | 'H3' | 'H4' | 'H5' | 'H6';
  text: string;                // Actual text content
  annotationId?: string;       // Canvas badge ID
  parentFrameId?: string;      // For grouping by frame
  parentFrameName?: string;    // Frame name
  lastModified: string;        // ISO timestamp
}
```

### Storage Strategy

- **Per-page storage**: `headings_<pageId>`
- **Plugin data API**: `figma.setPluginData(key, JSON.stringify(data))`
- **Persistent**: Data saved in Figma file, travels with file
- **Versioned**: Each update includes `lastModified` timestamp

### Badge Annotations

Each heading gets a color-coded badge (36×24px) positioned 8px to the left of the text layer:

```typescript
// Badge colors by level
H1: '#9747FF' (Purple)   - Most important
H2: '#1E88E5' (Blue)
H3: '#00897B' (Teal)
H4: '#43A047' (Green)
H5: '#FDD835' (Yellow)   - Black text for contrast
H6: '#FB8C00' (Orange)
```

Badges are created as Figma frames with:
- Rounded corners (4px radius)
- Bold white text (12px Inter)
- Stored in `__A11y Annotations__` container
- Metadata: `targetNodeId`, `annotationType`, `headingLevel`

### Validation Algorithm

```typescript
function validateHeadings(headings: HeadingItem[]): ValidationIssue[] {
  const issues = [];

  // Rule 1: Require exactly one H1
  const h1Count = headings.filter(h => h.level === 'H1').length;
  if (h1Count === 0) {
    issues.push({
      type: 'no_h1',
      severity: 'error',
      message: 'Page should have at least one H1 heading.'
    });
  }
  if (h1Count > 1) {
    issues.push({
      type: 'multiple_h1',
      severity: 'error',
      message: `Page has ${h1Count} H1 headings. Should have only one.`
    });
  }

  // Rule 2: No skipped levels (H1 → H3)
  const levels = headings.map(h => parseInt(h.level.charAt(1))).sort();
  const uniqueLevels = [...new Set(levels)];

  for (let i = 1; i < uniqueLevels.length; i++) {
    if (uniqueLevels[i] - uniqueLevels[i-1] > 1) {
      const skipped = uniqueLevels[i-1] + 1;
      issues.push({
        type: 'skipped_level',
        severity: 'warning',
        message: `Heading level H${skipped} is skipped.`
      });
    }
  }

  // Rule 3: Empty headings
  headings.forEach(h => {
    if (!h.text || h.text.trim().length === 0) {
      issues.push({
        type: 'empty_heading',
        severity: 'warning',
        message: `Heading ${h.level} is empty.`,
        nodeId: h.nodeId
      });
    }
  });

  return issues;
}
```

### Automatic Detection (Heuristic)

While not used for auto-assignment, the tool can detect potential headings:

```typescript
function isPotentialHeading(textNode: TextNode): boolean {
  const fontSize = textNode.fontSize as number;
  const fontWeight = getFontWeight(textNode);

  // Large font (≥20px) OR bold/semi-bold (≥600)
  return fontSize >= 20 || fontWeight >= 600;
}
```

This could be used in future for:
- Highlighting suggested text layers
- Auto-complete in search
- Bulk suggestions

## Scientific/Technical References

### WCAG 2.1 Guidelines

- **SC 1.3.1 Info and Relationships (Level A)**
  - https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html
  - Information, structure, and relationships can be programmatically determined

### HTML5 Heading Structure

- **HTML5 Heading and Section Elements**
  - https://www.w3.org/TR/html52/sections.html#headings-and-sections
  - `<h1>` through `<h6>` semantic hierarchy

- **MDN: Using HTML sections and outlines**
  - https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements
  - Best practices for heading hierarchy

### Accessibility Research

- **WebAIM Screen Reader Survey #9 (2021)**
  - https://webaim.org/projects/screenreadersurvey9/#finding
  - 67.7% of users navigate by headings as primary method
  - Proper heading structure rated as most important for finding information

- **W3C ARIA Authoring Practices**
  - https://www.w3.org/WAI/ARIA/apg/patterns/
  - Heading structure for document landmarks

## External Resources & Dependencies

### npm Packages

None required - uses native Figma Plugin API

### Figma Plugin API

- **Plugin Data Storage**
  - https://www.figma.com/plugin-docs/api/properties/nodes-setplugindata/
  - `setPluginData(key, value)`, `getPluginData(key)`

- **Text Node Properties**
  - https://www.figma.com/plugin-docs/api/TextNode/
  - `characters`, `fontSize`, `fontName`, `fontWeight`

- **Frame Creation for Badges**
  - https://www.figma.com/plugin-docs/api/figma-createframe/
  - `figma.createFrame()`, layout properties

### Design Inspiration

- **Figma A11y Plugin**
  - Inspiration for badge-based annotations

- **Stark Plugin**
  - Inspiration for hierarchy validation UI

## Testing Approach

### Manual Test Cases

1. **Happy Path: Single page with proper hierarchy**
   - Add H1 (page title)
   - Add H2 (section heading)
   - Add H3 (subsection)
   - ✅ Verify no validation errors
   - ✅ Verify badges appear with correct colors
   - ✅ Verify headings grouped by frame

2. **Error: No H1**
   - Add H2, H3, H4
   - ❌ Should show error: "Page should have at least one H1 heading"

3. **Error: Multiple H1s**
   - Add two H1 headings
   - ❌ Should show error: "Page has 2 H1 headings. Should have only one"

4. **Warning: Skipped level (H1 → H3)**
   - Add H1, then H3 (skip H2)
   - ⚠️ Should show warning: "Heading level H2 is skipped"

5. **Warning: Empty heading**
   - Select text layer with no content
   - Add as H2
   - ⚠️ Should show warning: "Heading H2 is empty"

6. **Change level**
   - Click heading badge
   - Select new level from dropdown
   - ✅ Verify badge color changes
   - ✅ Verify validation re-runs

7. **Remove heading**
   - Click trash icon
   - ✅ Verify heading removed from list
   - ✅ Verify badge removed from canvas
   - ✅ Verify validation re-runs

8. **Toggle visibility**
   - Click eye icon in header
   - ✅ Verify all badges hidden
   - Click again
   - ✅ Verify all badges visible

9. **Zoom to heading**
   - Click heading text in list
   - ✅ Verify canvas zooms to text layer
   - ✅ Verify text layer selected

10. **Grouped by frame**
    - Create multiple frames with text
    - Add headings in different frames
    - ✅ Verify headings grouped by parent frame
    - ✅ Verify frame names displayed

### Edge Cases

- **Text layer in nested frames**: Should show deepest frame name
- **Text layer not in frame**: Should show "Ungrouped"
- **Very long text (>100 chars)**: Should truncate with ellipsis
- **Empty text layer**: Should allow but show warning
- **Deleted text layer**: Should skip when loading (node no longer exists)
- **Deleted badge**: Should detect and allow re-creation

### Performance Testing

- **100 headings**: Should load in <1s
- **1000 text nodes scan**: Should complete in <2s
- **Real-time validation**: Should run in <100ms

## Known Limitations

1. **No automatic assignment**: Headings must be manually assigned
   - Could add in future: "Suggest headings" based on font size/weight

2. **No document outline export**: Currently just stores data
   - Could add: Export as HTML outline, Markdown TOC, JSON schema

3. **No multi-page validation**: Only validates current page
   - Multi-page designs might have multiple H1s across pages (which is fine)

4. **No heading labels/descriptions**: WCAG allows `aria-label` for headings
   - Could add: Optional label for duplicate heading text

5. **No nested heading detection**: Doesn't detect structural nesting
   - Could analyze frame hierarchy to suggest levels

6. **No integration with Focus Order**: Headings should align with tab order
   - Future: Show warning if heading order doesn't match focus order

## Future Enhancements

1. **Document outline view**: Hierarchical tree visualization with indentation
2. **Export heading structure**: Generate HTML, Markdown, or JSON outline
3. **Smart suggestions**: Auto-detect potential headings based on font properties
4. **Bulk operations**: "Suggest all headings" button
5. **Heading labels**: Add optional `aria-label` for context
6. **Multi-page summary**: Dashboard showing heading structure across all pages
7. **Integration with dev handoff**: Generate code snippets with heading tags
8. **Accessibility score**: Rate heading structure quality (0-100)
9. **Templates**: Common patterns (Article, Landing Page, Dashboard)
10. **Keyboard shortcuts**: Quickly assign H1-H6 with Cmd+1 through Cmd+6
11. **Find & replace**: Bulk update heading levels
12. **History**: Undo/redo heading changes
13. **Comments**: Add notes explaining heading choices
14. **Style detection**: Auto-detect text styles used as headings (e.g., "Heading 1" style → H1)
15. **WCAG audit report**: PDF/HTML report with heading structure analysis
