# Typography Checker

## Tool Overview

The Typography Checker validates text typography properties against WCAG 2.1 accessibility standards and universal typography best practices. It helps designers ensure readable, accessible text throughout their designs.

**Addresses**:
- WCAG 2.1 Success Criterion 1.4.8 (Visual Presentation) - AAA Level
- WCAG 2.1 Success Criterion 1.4.12 (Text Spacing) - AA Level
- WCAG 2.1 Success Criterion 1.4.4 (Resize Text) - AA Level
- Universal typography readability best practices

**Why it's needed for accessibility**:
- Poor typography can make content difficult or impossible to read for users with visual impairments, dyslexia, or cognitive disabilities
- Proper font sizing, line height, and spacing improves readability for all users
- Following WCAG guidelines ensures content remains accessible when users resize text or adjust browser settings

---

## How It Works

The Typography Checker performs comprehensive validation on text nodes:

### 1. Font Size Validation
- **Critical minimum**: Text below 9px (too small to read)
- **Warning threshold**: Text below 11px (legibility concerns)
- **Recommended minimum**: 16px for body text (browser default)
- **Large text classification**: 18px+ or 18.66px+ when bold

### 2. Line Height Validation
- **Body text minimum**: 1.5 (WCAG AAA requirement)
- **Heading recommended**: 1.2-1.3
- **Critical minimum**: 1.1 (below this is unreadable)
- **AUTO detection**: Warns when line height is set to AUTO (unpredictable across devices)

### 3. Line Length Validation
- **Optimal range**: 50-75 characters per line
- **WCAG AAA maximum**: 80 characters
- **Critical threshold**: 100 characters (readability severely impacted)
- **Note**: Skips very short text (< 20 characters) likely to be labels/buttons

### 4. Letter Spacing Validation
- **WCAG AA minimum**: 0.12 × font size (letter-spacing / font-size ratio)
- **Recommended ratio**: 0.15 for better readability
- Validates that letter spacing doesn't impair readability

### 5. Text Alignment Validation
- **Preferred**: Left alignment for LTR languages (easier eye tracking)
- **Avoid**: Justified text (creates uneven spacing, reading difficulties)
- **Warning for long text**: Center/right alignment for body text (50+ characters)

### 6. Font Weight Validation
- **Body text minimum**: 400 (normal weight)
- **Heading minimum**: 300 (acceptable for large text)
- **Critical minimum**: 200 (too light, legibility issues)

---

## Data Flow Diagram

```
User clicks "Check Page" or "Check Selection"
    ↓
UI sends CHECK_TYPOGRAPHY_PAGE/SELECTION message with validation options
    ↓
Plugin code: TypographyChecker.checkPage() or checkSelection()
    ↓
For each text node:
  ├─ Skip if not visible or empty
  ├─ Validate font size → Check against thresholds
  ├─ Validate line height → Calculate ratio, check WCAG minimum
  ├─ Validate line length → Estimate characters, check optimal range
  ├─ Validate letter spacing → Calculate ratio, check WCAG AA
  ├─ Validate text alignment → Check for justified, check body text
  └─ Validate font weight → Check minimum for body/headings
    ↓
Generate TypographyIssue[] for each validation failure
  ├─ Assign severity (critical, high, medium, low)
  ├─ Generate descriptive message
  └─ Include WCAG reference (if applicable)
    ↓
Calculate overall severity (highest issue severity)
    ↓
Return TypographyResult[] to UI
    ↓
UI displays results in TypographyPanel
  ├─ Summary statistics (total, pass, fail)
  ├─ Severity breakdown (critical, high, medium)
  ├─ Filterable results list
  └─ Bulk fix options
```

---

## User Interaction Flow

### Checking Typography

1. **User opens plugin** → sees main tool list
2. **User clicks "Typography" card** → TypographyPanel opens
3. **User selects validation rules** (checkboxes)
   - Font Size ✓
   - Line Height ✓
   - Line Length ✓
   - Letter Spacing ✓
   - Text Align ✓
   - Font Weight ✓
4. **User clicks "Check Page"** → scans all text nodes
5. **Results appear showing**:
   - Summary: Total / Pass / Fail counts
   - Severity breakdown: Critical / High / Medium counts
   - Results list with:
     - Node name and text preview
     - Pass/Fail icon (green check / red X)
     - Font metadata (size, line height)
     - Issue badges with detailed messages
     - WCAG reference links
6. **User can**:
   - Filter: All / Pass / Fail
   - Click result → Figma zooms to that text node
   - View detailed issues per node
   - Access WCAG reference links

### Bulk Fixing Issues

1. **User clicks "Bulk Fix Options"** → panel expands
2. **User selects fixes to apply**:
   - ☑ Set minimum font size to [16]px
   - ☑ Set line height to [1.5]
   - ☑ Fix letter spacing (WCAG minimum)
   - ☑ Fix text alignment (justified → left)
3. **User clicks "Apply Fixes"** → plugin applies changes
4. **Plugin reloads fonts** → modifies text properties
5. **Results automatically refresh** → shows updated status

---

## Technical Implementation

### Algorithm: Line Length Estimation

```typescript
// Approximate character count based on text width and font size
const avgCharWidth = fontSize * 0.5; // Rough approximation
const lineLength = Math.floor(textWidth / avgCharWidth);
```

**Limitations**:
- Approximation based on average character width
- Doesn't account for font family variations (monospace vs proportional)
- Assumes single-line wrapping behavior

### Algorithm: Line Height Calculation

```typescript
// Convert Figma line height to ratio
if (lineHeight.unit === 'PIXELS') {
  ratio = lineHeight.value / fontSize;
} else if (lineHeight.unit === 'PERCENT') {
  ratio = lineHeight.value / 100;
}
```

### Algorithm: Letter Spacing Ratio

```typescript
// WCAG 2.1 Text Spacing (1.4.12)
// Letter spacing ≥ 0.12 × font size
if (letterSpacing.unit === 'PIXELS') {
  ratio = letterSpacing.value / fontSize;
} else if (letterSpacing.unit === 'PERCENT') {
  ratio = letterSpacing.value / 100;
}
```

### Performance Optimization

- **Skip hidden nodes**: Uses `isNodeVisible()` utility
- **Skip empty text**: Checks for empty or whitespace-only content
- **Selective validation**: Only runs checks selected by user
- **Batch processing**: Processes all text nodes efficiently
- **Font loading**: Loads fonts asynchronously before modifications

---

## Scientific/Technical References

### WCAG 2.1 Guidelines

- **[1.4.8 Visual Presentation (AAA)](https://www.w3.org/WAI/WCAG21/Understanding/visual-presentation.html)**
  - Line spacing: ≥1.5 within paragraphs
  - Paragraph spacing: ≥1.5× line spacing
  - Line length: ≤80 characters
  - Text can be resized up to 200% without loss of content

- **[1.4.12 Text Spacing (AA)](https://www.w3.org/WAI/WCAG21/Understanding/text-spacing.html)**
  - Letter spacing: ≥0.12× font size
  - Word spacing: ≥0.16× font size
  - Line height: ≥1.5× font size
  - Paragraph spacing: ≥2× font size

- **[1.4.4 Resize Text (AA)](https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html)**
  - Text can be resized up to 200% without assistive technology

### Typography Best Practices

- **[Butterick's Practical Typography](https://practicaltypography.com/)**
  - Line length: 45-90 characters optimal
  - Line spacing: 120-145% of font size for body text
  - Font size: 15-25px for web body text

- **[WebAIM: Typefaces and Fonts](https://webaim.org/articles/visual/fonts)**
  - Minimum 16px font size recommendation
  - Sans-serif fonts for digital readability
  - Avoid justified text for accessibility

- **[Material Design Typography](https://material.io/design/typography/)**
  - Body text: 16sp (scalable pixels)
  - Line height: 1.5 for body, 1.2-1.3 for headings
  - Letter spacing: 0.5px for body text

---

## External Resources & Dependencies

### npm Packages

**None** - Typography checker uses native Figma API and TypeScript standard library.

### Reference Implementations

- **WCAG Techniques**: [Understanding WCAG Success Criteria](https://www.w3.org/WAI/WCAG21/Understanding/)
- **Butterick's Typography Rules**: Informed line length and spacing recommendations
- **Material Design Guidelines**: Platform-specific typography standards

### Tools & Utilities

- **Figma Plugin API**: `TextNode` properties (fontSize, lineHeight, letterSpacing)
- **TypeScript**: Type-safe validation logic
- **React**: UI component framework

---

## Testing Approach

### Test Cases

1. **Font Size**
   - Text < 9px → Critical severity
   - Text 9-11px → High severity
   - Text 11-16px → Medium severity
   - Text ≥ 16px → Pass

2. **Line Height**
   - AUTO line height → Medium warning
   - Ratio < 1.1 → Critical
   - Ratio 1.1-1.5 (body) → High/Medium (depends on text type)
   - Ratio ≥ 1.5 (body) or ≥ 1.2 (heading) → Pass

3. **Line Length**
   - > 100 characters → High severity
   - 80-100 characters → Medium severity
   - 75-80 characters → Low severity
   - 50-75 characters → Pass (optimal)
   - < 20 characters → Skipped (likely label/button)

4. **Letter Spacing**
   - Ratio < 0.12 → Medium severity (WCAG AA fail)
   - Ratio ≥ 0.12 → Pass

5. **Text Alignment**
   - Justified → Medium severity
   - Center/right for long text (50+ chars) → Low severity
   - Left aligned → Pass

6. **Font Weight**
   - Weight < 200 → Critical
   - Weight 200-400 (body) → Medium
   - Weight ≥ 400 (body) or ≥ 300 (heading) → Pass

### Manual Testing Checklist

- [ ] Check entire page with 100+ text nodes (performance)
- [ ] Verify all validation rules work independently
- [ ] Test with various text styles (headings, body, labels)
- [ ] Test with mixed text (multiple fonts, sizes)
- [ ] Verify severity levels are accurate
- [ ] Test bulk fix functionality:
  - [ ] Font size bulk fix
  - [ ] Line height bulk fix
  - [ ] Letter spacing bulk fix
  - [ ] Alignment bulk fix
- [ ] Verify zoom-to-node on result click
- [ ] Test with AUTO line height
- [ ] Test with very long lines (100+ characters)
- [ ] Test with very short text (labels, buttons)
- [ ] Verify WCAG reference links work

---

## Known Limitations

### 1. Line Length Estimation
- **Issue**: Approximation based on average character width
- **Impact**: May be slightly inaccurate for very wide/narrow fonts (e.g., monospace vs condensed)
- **Workaround**: Treat as rough guidance; verify actual character count if critical

### 2. Font Weight Detection
- **Issue**: Cannot automatically change font weight (requires font family change)
- **Impact**: Bulk fix does not include font weight corrections
- **Workaround**: Manual font weight adjustment required

### 3. AUTO Line Height
- **Issue**: Cannot calculate exact ratio for AUTO line height
- **Impact**: Shows warning but can't validate against WCAG minimum
- **Workaround**: Recommend setting explicit line height values

### 4. Mixed Text Styles
- **Issue**: Figma supports mixed styles within single text node
- **Impact**: Checker validates primary style only (first character)
- **Workaround**: Split mixed-style text into separate nodes if needed

### 5. Dynamic Text
- **Issue**: Validation is snapshot at check time
- **Impact**: Text content changes won't automatically re-trigger validation
- **Workaround**: Re-run check after text content changes

### 6. Non-English Languages
- **Issue**: Line length recommendations based on English character widths
- **Impact**: May be less accurate for languages with wider/narrower character sets
- **Workaround**: Adjust optimal range based on language

---

## Future Enhancements

### Phase 3 Enhancements (Nice-to-Have)
- [ ] **Real-time validation**: Auto-check typography as text changes
- [ ] **Custom thresholds**: Allow designers to set project-specific rules
- [ ] **Font family suggestions**: Recommend more accessible font pairings
- [ ] **Responsive typography**: Validate text scaling across device sizes

### Post-Phase 3 Enhancements
- [ ] **Advanced line length**: Parse actual character count instead of estimation
- [ ] **Font weight auto-fix**: Suggest font family variants with appropriate weights
- [ ] **Paragraph spacing**: Validate paragraph spacing (WCAG 1.4.8)
- [ ] **Word spacing**: Validate word spacing (WCAG 1.4.12)
- [ ] **Text scaling preview**: Show how text looks at 200% zoom
- [ ] **Multilingual support**: Language-specific typography rules
- [ ] **Style library integration**: Check against design system typography tokens
- [ ] **Batch export**: Export typography audit report for handoff
- [ ] **Historical tracking**: Track typography improvements over time

---

## Usage Tips

### For Designers

1. **Start with body text**: Ensure all body text passes before fine-tuning headings
2. **Use bulk fix cautiously**: Review changes before applying to avoid unintended modifications
3. **Check early and often**: Validate typography during design, not just at end
4. **Document exceptions**: Note why certain violations are acceptable (e.g., logos)

### For Developers

1. **Export results**: Use results to inform CSS/style implementation
2. **WCAG references**: Click reference links to understand requirements
3. **Severity prioritization**: Fix critical/high issues first
4. **Custom validation**: Disable unnecessary rules for project-specific needs

### Best Practices

- **16px minimum**: Use 16px or larger for body text (matches browser default)
- **1.5 line height**: Body text should have 1.5 line height minimum
- **50-75 characters**: Aim for optimal line length range
- **Left align**: Use left alignment for body text (LTR languages)
- **Explicit values**: Avoid AUTO line height; set explicit values

---

## Troubleshooting

### "No text nodes found"
- **Cause**: Current page has no text nodes or all text is hidden
- **Solution**: Ensure text nodes exist and are visible

### "Line height is AUTO" warning
- **Cause**: Figma's AUTO line height is unpredictable across devices
- **Solution**: Set explicit line height (e.g., 150% or 1.5)

### Bulk fix doesn't work
- **Cause**: Text nodes may be locked or have restricted editing permissions
- **Solution**: Unlock nodes before applying bulk fixes

### Font loading error
- **Cause**: Required font not available in Figma
- **Solution**: Ensure all fonts used in design are installed or available in Figma

---

**Tool Status**: ✅ Complete
**Version**: 1.0
**Last Updated**: 2025-11-22
**WCAG Compliance**: AA + AAA (Visual Presentation)
