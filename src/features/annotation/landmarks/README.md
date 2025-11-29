# Landmarks Manager

## Tool Overview

The Landmarks Manager enables designers to annotate page regions with ARIA landmark roles, helping define the structure and navigation of web interfaces. Landmarks provide screen reader users with a quick way to navigate to important sections of a page.

**Addresses**: 
- WCAG 2.4.1 Bypass Blocks (Level A)
- ARIA Landmark Roles
- HTML5 Semantic Structure

Landmarks create navigational waypoints for assistive technology users, allowing them to skip directly to header, navigation, main content, sidebars, footer, forms, and other key regions.

## How It Works

1. Designer selects a frame, section, or group in Figma representing a page region
2. Designer chooses an appropriate landmark role from the dropdown:
   - **header** (`<header>` / `role="banner"`) - Site header with logo and top navigation
   - **nav** (`<nav>` / `role="navigation"`) - Navigation menus
   - **main** (`<main>` / `role="main"`) - Primary page content (one per page)
   - **aside** (`<aside>` / `role="complementary"`) - Supporting content, sidebars
   - **footer** (`<footer>` / `role="contentinfo"`) - Site footer with copyright and links
   - **form** (`<form>` / `role="form"`) - Form regions
   - **section** (`<section>` / `role="region"`) - Generic content sections
3. For landmarks that may appear multiple times (nav, form, section), designer adds an aria-label
4. Plugin stores landmark data in Figma file's plugin data
5. Color-coded badges appear on canvas showing landmark roles
6. Plugin validates landmark structure (one main, labeled multiple navs/sections)

## Data Flow Diagram

```
User selects frame → Picks landmark role → Clicks "Add"
    ↓
UI sends ADD_LANDMARK message
    ↓
Plugin code: LandmarksManager.addSelectedAsLandmark(role, label?)
    ↓
For selected frame:
  ├─ Validate node type (frame, section, or group)
  ├─ Check if already has landmark assigned
  ├─ Create LandmarkItem with role and optional label
  ├─ Store in plugin data (persisted in Figma file)
  ├─ Create color-coded badge on canvas
  └─ Return success
    ↓
Return updated landmarks list to UI
    ↓
UI displays landmarks in LandmarksPanel
    ↓
Validate landmark structure:
  ├─ Ensure exactly one <main>
  ├─ Check multiple <nav> have labels
  └─ Check multiple <section> have labels
```

## User Interaction Flow

1. User opens plugin → sees main tool list
2. User clicks "Landmarks" card → LandmarksPanel opens
3. User sees instruction: "Select a section on your design then pick a landmark and click the add button."
4. User selects a frame/section in Figma canvas
5. User selects landmark role from dropdown (e.g., "main - Main Content")
6. User clicks "Add" button
7. Colored badge appears on canvas (e.g., blue `<main>` badge)
8. Landmark appears in list grouped by parent frame
9. User can:
   - Click badge to edit role (dropdown appears inline)
   - Click label text to edit aria-label (inline input)
   - Click node name to zoom to it in canvas
   - Click trash icon to remove landmark
10. Validation warnings appear if:
    - No `<main>` landmark exists (error)
    - Multiple `<main>` landmarks exist (error)
    - Multiple `<nav>` without unique labels (warning)
    - Multiple `<section>` without unique labels (warning)
11. User can toggle annotation visibility with eye icon

## Technical Implementation

### Landmark Role Assignment

**Supported Roles**:
- `header` - Purple (#5B21B6)
- `nav` - Teal (#0D9488)
- `main` - Blue (#2563EB) **Most important - one per page**
- `aside` - Purple-Blue (#7C3AED)
- `footer` - Slate (#475569)
- `form` - Green (#059669)
- `section` - Red (#DC2626)

**Data Structure**:
```typescript
interface LandmarkItem {
  nodeId: string;
  nodeName: string;
  role: LandmarkRole;
  label?: string; // Optional aria-label
  annotationId?: string;
  annotationMissing?: boolean;
  parentFrameId?: string;
  parentFrameName?: string;
  lastModified: string;
}
```

### Canvas Annotations

- Color-coded badges positioned above target frames
- Badge width auto-adjusts to text length
- Badge text shows HTML tag (e.g., `<main>`) or tag + label (e.g., `<nav> "Primary"`)
- Badges stored in `__A11y Annotations__` container frame
- Badges linked to target nodes via plugin data

### Validation Rules

1. **Exactly one `<main>` per page** (REQUIRED)
   - Error if zero main landmarks
   - Error if multiple main landmarks

2. **Multiple `<nav>` require unique labels** (RECOMMENDED)
   - Warning if multiple nav landmarks without labels
   - Labels help screen reader users distinguish between primary nav, secondary nav, footer nav, etc.

3. **Multiple `<section>` require unique labels** (RECOMMENDED)
   - Warning if multiple section landmarks without labels
   - Labels clarify purpose of each section

### Performance Optimizations

- Landmarks stored per-page (scoped by page ID)
- Only validate landmarks for current page
- Badge creation uses auto-layout for text centering
- Minimal DOM traversal (direct node lookups by ID)

## Scientific/Technical References

**ARIA Landmarks**:
- W3C ARIA Landmarks Example: https://www.w3.org/TR/wai-aria-practices-1.1/examples/landmarks/
- ARIA Authoring Practices Guide: https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/

**WCAG Guidelines**:
- WCAG 2.4.1 Bypass Blocks: https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html
- Technique ARIA11 (Using ARIA landmarks): https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA11

**HTML5 Semantic Elements**:
- MDN HTML5 Sections: https://developer.mozilla.org/en-US/docs/Web/HTML/Element#content_sectioning
- HTML Living Standard: https://html.spec.whatwg.org/multipage/sections.html

**Screen Reader Support**:
- WebAIM Screen Reader Landmark Navigation: https://webaim.org/articles/screenreader_testing/#landmarks
- NVDA Landmark Navigation: https://www.nvaccess.org/files/nvda/documentation/userGuide.html#Landmarks

## External Resources & Dependencies

**npm Packages**: None (using Figma Plugin API)

**Reference Code**:
- Badge creation inspired by Alt-Text Manager and Headings Manager implementations
- Validation logic follows ARIA landmark best practices

**Design Inspiration**:
- Figma design tokens for consistent UI styling
- Material Design color palette for landmark role colors

## Testing Approach

### Test Cases

1. **Add landmarks to page**
   - Select frame → Choose role → Click Add
   - Badge appears on canvas
   - Landmark appears in list

2. **Exactly one `<main>` validation**
   - Page with zero main → Should show error
   - Page with one main → No error
   - Page with two mains → Should show error

3. **Multiple nav landmarks**
   - Two `<nav>` without labels → Should show warning
   - Two `<nav>` with unique labels → No warning
   - One `<nav>` without label → No warning

4. **Multiple section landmarks**
   - Two `<section>` without labels → Should show warning
   - Two `<section>` with unique labels → No warning

5. **Edit landmark role**
   - Click badge → Dropdown appears
   - Select new role → Badge updates with new color
   - Validation re-runs

6. **Edit landmark label**
   - Click label text → Input appears
   - Type label → Press Enter → Label updates
   - Badge text updates to include label

7. **Remove landmark**
   - Click trash icon → Landmark removed
   - Badge deleted from canvas
   - Validation re-runs

8. **Toggle annotations visibility**
   - Click eye icon → All badges hide
   - Click eye-slash icon → All badges show

9. **Zoom to landmark**
   - Click landmark in list → Figma zooms to that frame
   - Frame selected in canvas

10. **Persistence**
    - Add landmarks → Close plugin → Reopen plugin
    - Landmarks still present with correct roles and labels

### Manual Testing Checklist

- [ ] Add all 7 landmark role types
- [ ] Verify each role has correct color
- [ ] Verify badge text shows HTML tag
- [ ] Add label to nav → Verify badge shows tag + label
- [ ] Add label to section → Verify badge shows tag + label
- [ ] Create page with no main → Verify error
- [ ] Create page with two mains → Verify error
- [ ] Create two navs without labels → Verify warning
- [ ] Create two navs with labels → No warning
- [ ] Edit role inline → Verify badge updates
- [ ] Edit label inline → Verify badge updates
- [ ] Remove landmark → Verify badge deleted
- [ ] Toggle visibility → Verify all badges hide/show
- [ ] Click landmark → Verify zoom works
- [ ] Close and reopen plugin → Verify landmarks persist
- [ ] Test with nested frames
- [ ] Test with groups vs frames vs sections

## Known Limitations

- Only supports frame, section, and group node types (not rectangles, text, etc.)
- Does not validate semantic nesting (e.g., nav inside header)
- Does not auto-suggest landmark roles based on frame names
- Cannot detect overlapping landmarks (multiple landmarks on same frame not prevented)
- Badge positioning assumes standard left-to-right layout
- No support for nested landmarks visualization (e.g., nav inside header)

## Future Enhancements

1. **Auto-detection**: Suggest landmark roles based on frame names
   - Frame named "Header" → Suggest `<header>`
   - Frame named "Navigation" → Suggest `<nav>`
   - Frame named "Main Content" → Suggest `<main>`

2. **Semantic nesting validation**
   - Warn if nav inside main (should be sibling)
   - Validate header/footer as direct children of body-equivalent

3. **Visual hierarchy**
   - Show nested landmark relationships with connecting lines
   - Indent nested landmarks in list view

4. **Code generation**
   - Export landmarks as HTML structure
   - Export landmarks as React components with semantic tags
   - Export landmarks as accessibility annotation document

5. **Templates**
   - Pre-defined landmark templates (e.g., "Blog Post", "Dashboard", "Landing Page")
   - One-click apply common landmark structures

6. **Advanced validation**
   - Check for appropriate heading inside each landmark
   - Ensure interactive elements inside landmarks
   - Validate landmark order (header → nav → main → aside → footer)

7. **Screen reader simulation**
   - Show landmark navigation order as screen reader would announce
   - Preview "Skip to main content" behavior

8. **Multi-page support**
   - Compare landmark structures across pages
   - Ensure consistent landmark patterns site-wide

9. **Developer handoff**
   - Export landmarks with ARIA roles and labels
   - Generate code snippets for HTML/React/Vue
   - Include in accessibility annotation report

10. **Integration with other tools**
    - Ensure headings inside main landmark
    - Validate focus order within landmarks
    - Check alt-text for images within landmarks

