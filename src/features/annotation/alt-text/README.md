# Alt-Text Manager

## Tool Overview

The Alt-Text Manager enables designers to annotate images with alternative text descriptions for accessibility. Alternative text (alt text) is essential for making visual content accessible to screen reader users and serves as fallback content when images fail to load.

**Addresses**: WCAG 2.1 Success Criterion 1.1.1 (Non-text Content - Level A)

**Why it's needed**:
- Screen reader users rely on alt text to understand image content
- Alt text appears when images fail to load
- Search engines use alt text for image indexing
- Provides context for developers during handoff

## How It Works

### Workflow

1. **Image Detection**: Plugin scans the current page for all nodes with image fills
2. **Alt Text Input**: Designer adds descriptive text or marks image as decorative
3. **Validation**: System validates alt text quality (length, content, clarity)
4. **Storage**: Alt text is stored in Figma's plugin data (persists with the file)
5. **Visual Annotation**: Canvas badge appears showing completion status
6. **Developer Handoff**: Alt text can be exported for implementation

### Alt Text Types

- **Informative Images**: Convey information or concepts (require descriptive alt text)
- **Decorative Images**: Purely visual design elements (marked as decorative, no alt text needed)
- **Functional Images**: Interactive elements like buttons (describe function)
- **Complex Images**: Charts, diagrams, infographics (require detailed descriptions)

## Data Flow Diagram

```
User opens Alt-Text Manager
    ↓
UI sends LOAD_ALT_TEXT_IMAGES message
    ↓
Plugin code: AltTextManager.getAllImageNodesWithAltText()
    ↓
For each node on page:
  ├─ Check if node has image fill
  ├─ Load existing alt text from plugin data
  └─ Calculate completion stats
    ↓
Return { nodes[], stats } to UI
    ↓
UI displays list with status indicators
    ↓
User clicks image node
    ↓
AddAltTextModal opens
    ↓
User enters alt text or marks as decorative
    ↓
Real-time validation (as user types)
  ├─ Check length (min 10, max 200 chars)
  ├─ Check for bad patterns (filenames, generic)
  ├─ Check for redundant phrases ("image of")
  └─ Return validation result
    ↓
User clicks "Done"
    ↓
UI sends SAVE_ALT_TEXT message
    ↓
Plugin code: AltTextManager.setAltText()
  ├─ Validate alt text
  ├─ Store in node plugin data
  ├─ Create/update canvas annotation badge
  └─ Return saved data
    ↓
UI refreshes list
Canvas annotation appears
```

## User Interaction Flow

1. **Open Plugin** → User sees main tool list
2. **Click "Alt-Text"** → AltTextPanel opens showing all images on page
3. **View Stats** → Progress bar and completion statistics displayed
4. **Filter Images** → User can filter by All / Incomplete / Complete / Decorative
5. **Click Image** → AddAltTextModal opens for that specific image
6. **Mark Decorative** (Optional) → Check "Decorative element" checkbox
7. **Enter Alt Text** → Type description in text area
8. **Real-time Validation** → See errors/warnings as you type
9. **Character Counter** → Track length (0/200 characters)
10. **Click "Done"** → Alt text saves and modal closes
11. **Canvas Annotation** → Badge appears on canvas showing status:
    - ✓ Green badge: Complete
    - ! Red badge: Incomplete
    - Gray badge: Decorative
    - ⚠ Orange badge: Needs review (warnings)

## Technical Implementation

### Key Components

#### 1. AltTextManager (Core Logic)
```typescript
class AltTextManager {
  findImageNodes(): Promise<ImageNodeInfo[]>
  getAltTextForNode(nodeId: string): AltTextData | null
  setAltText(nodeId, altText, isDecorative): Promise<AltTextData | null>
  validateAltText(altText, isDecorative): AltTextValidationResult
  getStats(): Promise<AltTextStats>
}
```

#### 2. AnnotationService (Canvas Badges)
```typescript
class AnnotationService {
  createAnnotation(config): Promise<AnnotationData | null>
  updateArrow(annotationGroupId): boolean
  deleteAnnotation(annotationGroupId): boolean
  setAnnotationsVisible(visible): void
}
```

**Annotation System**:
- Annotations are actual Figma nodes (frames, text, vectors)
- Stored in a dedicated layer: `__A11y Annotations__`
- Each annotation is a group containing:
  - **Badge**: Frame with label text and background color
  - **Arrow**: Vector line connecting badge to target element
  - **Metadata**: Plugin data linking annotation to target node

**Movable Annotations**:
- Users can drag annotation badges around the canvas
- Arrow automatically updates to stay connected to target
- Arrow update triggered by document change events

### Validation Algorithm

```typescript
function validateAltText(altText: string, isDecorative: boolean) {
  const errors = [];
  const warnings = [];
  const suggestions = [];

  // Decorative validation
  if (isDecorative) {
    if (altText.trim() !== '') {
      warnings.push('Decorative images should have empty alt text');
    }
    return { isValid: true, errors, warnings, suggestions };
  }

  // Required field
  if (altText.trim() === '') {
    errors.push('Alt text is required for non-decorative images');
    return { isValid: false, errors, warnings, suggestions };
  }

  // Length validation
  if (altText.length < 10) {
    warnings.push('Alt text too short (minimum 10 characters)');
  }
  if (altText.length > 200) {
    errors.push('Alt text too long (maximum 200 characters)');
  }

  // Quality validation
  const badPatterns = [/^image[_-]?\d+/i, /\.png$/i, /\.jpg$/i];
  for (const pattern of badPatterns) {
    if (pattern.test(altText)) {
      warnings.push('Alt text appears to be a filename');
      break;
    }
  }

  // Redundancy check
  const redundant = ['image of', 'picture of', 'photo of'];
  for (const phrase of redundant) {
    if (altText.toLowerCase().includes(phrase)) {
      suggestions.push(`Avoid "${phrase}" - screen readers announce it's an image`);
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  };
}
```

### Storage Strategy

**Plugin Data Structure**:
```json
{
  "version": "1.0.0",
  "data": {
    "nodeId": "123:456",
    "nodeName": "Hero Image",
    "altText": "Dashboard showing monthly sales increase",
    "isDecorative": false,
    "status": "complete",
    "validationErrors": [],
    "validationWarnings": [],
    "lastModified": "2025-11-26T10:30:00Z",
    "annotationId": "789:012"
  },
  "timestamp": "2025-11-26T10:30:00Z"
}
```

**Storage Key**: `accessibility-alt-text`

**Data Persistence**:
- Stored using Figma's `setPluginData()` API on each image node
- Data persists with the Figma file
- Survives file saves, closes, and reopens
- Accessible across plugin sessions

## Scientific/Technical References

### WCAG 2.1 Guidelines

- **Success Criterion 1.1.1 Non-text Content** (Level A):
  https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html

- **Alt Text Decision Tree**:
  https://www.w3.org/WAI/tutorials/images/decision-tree/

- **Images Tutorial**:
  https://www.w3.org/WAI/tutorials/images/

### Alt Text Best Practices

- **WebAIM Alternative Text Guide**:
  https://webaim.org/techniques/alttext/

- **Harvard Digital Accessibility Alt Text Guidelines**:
  https://accessibility.huit.harvard.edu/describe-content-images

- **Nielsen Norman Group - Alt Text UX**:
  https://www.nngroup.com/articles/alt-text/

## External Resources & Dependencies

### npm Packages

None - This tool uses native Figma Plugin API and does not require external packages.

### Reference Implementations

- **WCAG formula implementation** (general reference for accessibility patterns):
  https://github.com/tmcw/wcag-contrast

- **Figma Plugin API Documentation**:
  https://www.figma.com/plugin-docs/

## Testing Approach

### Test Cases

1. **Image Detection**
   - Page with 0 images → Should show "No images found"
   - Page with 10 images → Should list all 10
   - Images with various types (rectangle fills, frame fills, component instances)

2. **Alt Text Input**
   - Empty alt text → Should show error
   - Short alt text (<10 chars) → Should show warning
   - Long alt text (>200 chars) → Should show error
   - Valid alt text (10-200 chars) → Should pass validation

3. **Decorative Images**
   - Mark as decorative with empty alt text → Should pass
   - Mark as decorative with alt text → Should show warning
   - Unmark decorative → Should validate alt text normally

4. **Validation Patterns**
   - Alt text "image_123.png" → Should warn (filename-like)
   - Alt text "image of a dog" → Should suggest removing "image of"
   - Alt text "User dashboard view" → Should pass

5. **Canvas Annotations**
   - Add alt text → Green badge should appear
   - No alt text → Red badge should appear
   - Mark decorative → Gray badge should appear
   - Alt text with warnings → Orange badge should appear

6. **Persistence**
   - Save alt text → Close plugin → Reopen → Alt text should persist
   - Save file → Close Figma → Reopen file → Alt text should persist

### Manual Testing Checklist

- [ ] Alt-Text Manager loads all images on page
- [ ] Clicking an image opens the modal
- [ ] Alt text validation shows real-time feedback
- [ ] Character counter works correctly (0/200)
- [ ] Decorative checkbox toggles validation
- [ ] "Done" button saves alt text
- [ ] Canvas annotations appear with correct colors
- [ ] Stats update after saving alt text
- [ ] Filter buttons work (All/Incomplete/Complete/Decorative)
- [ ] Alt text persists after closing and reopening plugin
- [ ] Multiple images can be annotated in sequence
- [ ] Annotations are visible on canvas
- [ ] Users can move annotation badges on canvas

## Known Limitations

1. **Image Detection**:
   - Only detects nodes with image fills (type: 'IMAGE')
   - Does not detect images embedded in text or vector nodes
   - Requires image fill to be visible (hidden fills ignored)

2. **Annotation Arrows**:
   - Arrow positioning is fixed after creation
   - Moving annotation badge does not currently auto-update arrow (future enhancement)
   - Arrows are simple lines (no arrowheads in current version)

3. **Export**:
   - Alt text export to code not yet implemented (Phase 10)
   - Manual copy-paste required for developer handoff

4. **Complex Images**:
   - No automatic detection of charts/diagrams requiring long descriptions
   - No support for structured long descriptions (future enhancement)

5. **Localization**:
   - No support for multiple languages (alt text in one language only)
   - No translation workflow

## Future Enhancements

1. **AI-Powered Suggestions**:
   - Use AI/ML to suggest alt text based on image content
   - Auto-detect decorative vs. informative images

2. **Long Descriptions**:
   - Support for extended descriptions (>200 characters)
   - Link to external detailed descriptions

3. **Auto-Update Arrows**:
   - Implement document change listener to update arrows when badges move
   - Real-time arrow repositioning on drag

4. **Export to Code**:
   - Generate HTML with alt attributes
   - Generate React/Vue/Angular image components
   - Copy-to-clipboard for quick handoff

5. **Bulk Operations**:
   - Apply same alt text to multiple similar images
   - Batch mark as decorative
   - Find-and-replace for alt text

6. **Alt Text Library**:
   - Save frequently used alt text snippets
   - Reuse descriptions across projects

7. **Image Context Detection**:
   - Detect if image is in button/link (functional image)
   - Auto-suggest functional descriptions

8. **Accessibility Scoring**:
   - Calculate overall alt text coverage score
   - Dashboard showing progress toward 100% coverage

9. **Collaboration**:
   - Comments/feedback on alt text quality
   - Approvals workflow for content reviewers

10. **Integration**:
    - Export to design tokens/documentation
    - Integration with design systems
