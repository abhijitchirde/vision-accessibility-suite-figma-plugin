# Accessibility Notes

## Tool Overview

The Accessibility Notes tool enables designers to annotate Figma elements with platform-specific accessibility requirements. This creates a seamless handoff between design and development, ensuring accessibility requirements are clearly communicated and implemented correctly across different platforms (Web, iOS, Android, Windows, React Native, TV).

**Addresses**: Multiple WCAG 2.1 and platform-specific accessibility guidelines
- WCAG 1.1.1 Non-text Content
- WCAG 1.3.1 Info and Relationships
- WCAG 2.4.6 Headings and Labels
- WCAG 4.1.2 Name, Role, Value

## How It Works

1. Designer selects an element in Figma
2. Opens Accessibility Notes panel
3. Chooses target platform (Web, iOS, Android, etc.)
4. Fills in:
   - **Accessible Name**: The label that screen readers will announce
   - **Note**: Additional context (role, state, hints, or implementation details)
5. Plugin stores annotation data in Figma's plugin data storage
6. Developers can view and export these annotations during handoff

### Technical Process

```
1. User selects element → Opens Notes panel
2. User clicks "Add item"
3. Modal opens with platform selector and form fields
4. User enters:
   - Platform type
   - Accessible name (required)
   - Additional notes (optional)
5. Click "Done" → Data saved to node's plugin data
6. Note appears in list view with platform badge
7. Can be edited/removed at any time
```

## Data Flow Diagram

```
User Action: Select element + Click "Add item"
    ↓
NotesPanel renders AddNoteModal
    ↓
User fills platform-specific form:
  ├─ Platform selector (Web/iOS/Android/etc.)
  ├─ Accessible name field (required)
  └─ Note field (optional context)
    ↓
User clicks "Done" → UI sends SAVE_ACCESSIBILITY_NOTE
    ↓
Plugin Code: NotesManager.saveNote()
  ├─ Create AccessibilityNoteData object
  ├─ Store as JSON in node.setPluginData()
  └─ Persist in Figma file
    ↓
Response: NOTE_SAVED → UI refreshes list
    ↓
NotesPanel displays note card with:
  ├─ Platform badge (color-coded)
  ├─ Element name
  ├─ Accessible name
  └─ Additional notes
```

## User Interaction Flow

### Adding a Note

1. User opens Accessibility Genie plugin
2. User clicks "Accessibility Notes" card
3. User sees two tabs:
   - **Manage - V1**: Grid of platform cards
   - **Accessibility Notes**: List of all notes
4. User selects an element in Figma
5. User clicks "Add item" button (bottom)
6. Modal opens with:
   - Platform dropdown (defaults to "Web")
   - Accessible Name text input (required)
   - Note textarea (optional)
   - Help text for each field
7. User fills form and clicks "Done"
8. Note is saved and appears in list view
9. Can switch to "Manage" tab to see overview by platform

### Editing a Note

1. User navigates to "Accessibility Notes" tab
2. User finds note card in list
3. User clicks edit icon (pencil)
4. Modal opens pre-filled with existing data
5. User modifies fields
6. User clicks "Done"
7. Note is updated

### Removing a Note

1. User navigates to "Accessibility Notes" tab
2. User finds note card in list
3. User clicks remove icon (trash)
4. Confirmation prompt appears
5. User confirms
6. Note is removed from element and list

## Technical Implementation

### Data Structure

```typescript
interface AccessibilityNoteData {
  platform: PlatformType;      // 'web' | 'aria' | 'ios' | 'android' | 'windows' | 'react-native' | 'tv' | 'general'
  accessibleName: string;       // Main accessibility label
  note: string;                 // Additional context
  version: number;              // Data schema version (for migrations)
  createdAt: number;            // Timestamp
  updatedAt: number;            // Timestamp
}
```

### Storage Strategy

- **Figma Plugin Data API**: `node.setPluginData(key, value)`
- **Storage Key**: `'accessibility-notes'`
- **Format**: JSON serialized `AccessibilityNoteData`
- **Persistence**: Data saved directly in Figma file
- **Scope**: Per-node (each element can have one note)

### Platform Templates

Each platform has a template defining:
- **Label**: Display name
- **Description**: Context for designers
- **Icon**: Visual identifier
- **Fields**: Form field configuration
- **Help Text**: Guidance for each field

Example template for Accessible Name (generic):

```typescript
{
  platform: 'web',
  label: 'Accessible Name',
  description: 'Generic voice experiences',
  icon: 'globe',
  fields: [
    {
      id: 'accessibleName',
      label: 'Accessible Name',
      type: 'text',
      placeholder: 'All apps',
      required: true,
      helpText: 'Required when an element has no visible text label...',
    },
    {
      id: 'note',
      label: 'Note',
      type: 'textarea',
      placeholder: '',
      helpText: 'Enter additional information for Engineering...',
    },
  ],
}
```

Example template for ARIA notes (web-specific):

```typescript
{
  platform: 'aria',
  label: 'ARIA notes',
  description: 'Web (ARIA attributes)',
  icon: 'globe',
  fields: [
    {
      id: 'accessibleName',
      label: 'Accessible Name',
      type: 'text',
      placeholder: 'e.g., Submit button',
      required: true,
      helpText: 'ARIA accessible name for web (aria-label, aria-labelledby, etc.)',
    },
    {
      id: 'note',
      label: 'Note',
      type: 'textarea',
      placeholder: 'Additional ARIA attributes (role, state, properties)',
      helpText: 'Enter ARIA-specific information such as role, aria-expanded, aria-hidden, aria-describedby, or other ARIA attributes.',
    },
  ],
}
```

### Key Algorithms

**1. Save Note**

```typescript
static saveNote(
  node: SceneNode,
  platform: PlatformType,
  accessibleName: string,
  note: string
): void {
  const noteData: AccessibilityNoteData = {
    platform,
    accessibleName,
    note,
    version: NOTES_DATA_VERSION,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  node.setPluginData(NOTES_STORAGE_KEY, JSON.stringify(noteData));
}
```

**2. Get All Notes (Page Traversal)**

```typescript
static getAllNotedNodes(page: PageNode): NoteNodeInfo[] {
  const notedNodes: NoteNodeInfo[] = [];
  
  const traverse = (node: BaseNode) => {
    if ('getPluginData' in node) {
      const noteData = this.getNote(node as SceneNode);
      if (noteData) {
        notedNodes.push({
          nodeId: node.id,
          nodeName: node.name,
          nodeType: node.type,
          noteData,
        });
      }
    }
    
    if ('children' in node) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  };
  
  traverse(page);
  return notedNodes;
}
```

**3. Export to Markdown**

```typescript
static exportNotesToMarkdown(page: PageNode): string {
  const notes = this.getAllNotedNodes(page);
  const stats = this.getStats(page);
  
  let markdown = `# Accessibility Notes\n\n`;
  markdown += `**Page**: ${page.name}\n`;
  markdown += `**Total Notes**: ${stats.total}\n\n`;
  
  // ... summary and details
  
  return markdown;
}
```

## Platform-Specific Guidelines

### Accessible Name (Generic)
- **Accessible Name**: Generic voice experiences across all platforms
- **Note**: Additional context for voice control and screen readers
- **Use Case**: Platform-agnostic accessible names for voice experiences

### ARIA Notes (Web)
- **Accessible Name**: Maps to `aria-label` or `aria-labelledby`
- **Note**: Additional ARIA attributes (role, state, properties)
- **Reference**: https://www.w3.org/WAI/ARIA/apg/

### iOS (VoiceOver)
- **Accessible Name**: Maps to `accessibilityLabel`
- **Note**: `accessibilityHint`, `accessibilityTraits`
- **Reference**: https://developer.apple.com/accessibility/

### Android (TalkBack)
- **Accessible Name**: Maps to `contentDescription`
- **Note**: Additional accessibility properties
- **Reference**: https://developer.android.com/guide/topics/ui/accessibility

### Windows (Narrator)
- **Accessible Name**: Maps to `AutomationProperties.Name`
- **Note**: Additional UIA properties
- **Reference**: https://docs.microsoft.com/en-us/windows/uwp/design/accessibility/

### React Native
- **Accessible Name**: Maps to `accessibilityLabel`
- **Note**: `accessibilityHint`, `accessibilityRole`
- **Reference**: https://reactnative.dev/docs/accessibility

### TV Platforms
- **Accessible Name**: Platform-specific screen reader labels
- **Note**: Focus management and navigation context
- **Platforms**: Android TV, tvOS, etc.

### General Notes
- Platform-agnostic accessibility requirements
- Interaction behaviors
- States and transitions

## Scientific/Technical References

### WCAG 2.1 Guidelines

1. **WCAG 1.1.1 Non-text Content**
   - https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html
   - All non-text content must have a text alternative

2. **WCAG 1.3.1 Info and Relationships**
   - https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html
   - Information and relationships must be programmatically determinable

3. **WCAG 2.4.6 Headings and Labels**
   - https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels.html
   - Headings and labels must be descriptive

4. **WCAG 4.1.2 Name, Role, Value**
   - https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html
   - Name and role must be programmatically determinable

### Platform-Specific Documentation

- **ARIA Authoring Practices**: https://www.w3.org/WAI/ARIA/apg/
- **iOS Accessibility**: https://developer.apple.com/accessibility/ios/
- **Android Accessibility**: https://developer.android.com/guide/topics/ui/accessibility
- **Windows UIA**: https://docs.microsoft.com/en-us/windows/win32/winauto/entry-uiauto-win32
- **React Native Accessibility**: https://reactnative.dev/docs/accessibility

## External Resources & Dependencies

### npm Packages
- None (uses native Figma Plugin API and React)

### Referenced Design Patterns
- Modal dialog pattern (ARIA APG)
- Form validation patterns
- Multi-platform design systems

## Testing Approach

### Test Cases

1. **Add Note - Accessible Name (Generic)**
   - Select element
   - Open modal
   - Select "Accessible Name"
   - Enter accessible name: "Submit button"
   - Enter note: "Used by voice control and screen readers"
   - Verify note saved
   - Verify note appears in list with globe icon

2. **Add Note - ARIA Notes (Web)**
   - Select element
   - Open modal
   - Select "ARIA notes"
   - Enter accessible name: "Submit button"
   - Enter note: "role=button, aria-pressed=false"
   - Verify note saved
   - Verify note appears in list with globe icon

3. **Add Note - iOS Platform**
   - Select element
   - Add note with platform="iOS"
   - Verify badge shows smartphone icon
   - Verify platform-specific help text displayed

4. **Edit Existing Note**
   - Click edit icon on existing note
   - Modal opens with pre-filled data
   - Modify accessible name
   - Save changes
   - Verify updated in list

5. **Remove Note**
   - Click remove icon
   - Confirm deletion
   - Verify note removed from list
   - Verify plugin data cleared from node

6. **Multiple Notes on Page**
   - Add notes to 5 different elements
   - Each with different platforms
   - Verify all appear in list
   - Verify correct platform badges

7. **Empty States**
   - No selection → Show instruction
   - No notes on page → Show empty state with icon

8. **Zoom to Element**
   - Click note card
   - Verify Figma zooms to element
   - Verify element selected

9. **Platform Switching**
   - Add note as Accessible Name
   - Edit to change platform to ARIA notes
   - Verify help text updates
   - Verify badge updates

### Manual Testing Checklist

- [ ] Add note to selected element
- [ ] Edit existing note
- [ ] Remove note
- [ ] Zoom to element by clicking card
- [ ] Switch between "Manage" and "List" tabs
- [ ] Test all 8 platform types
- [ ] Verify required field validation
- [ ] Test with no selection (should show error)
- [ ] Test with multiple notes on page
- [ ] Verify data persists after closing plugin
- [ ] Verify data persists after closing Figma
- [ ] Test export to JSON/CSV/Markdown

## Known Limitations

1. **One Note Per Element**
   - Each element can only have one accessibility note
   - If multi-platform support is needed, use "General notes" or separate elements

2. **No Visual Annotations on Canvas**
   - Unlike Alt-Text Manager, notes don't show badges on canvas
   - This is intentional to avoid clutter (notes are metadata-heavy)

3. **No Code Generation Yet**
   - Future enhancement: Generate platform-specific code snippets
   - Currently provides structure, developers write code manually

4. **No Validation Against Actual Implementation**
   - Plugin doesn't validate if notes match actual coded behavior
   - Requires manual QA during development

5. **Limited to Current Page**
   - Notes are scoped to elements on current page
   - Multi-page projects require switching pages to view all notes

## Future Enhancements

1. **Code Snippet Generation**
   - Auto-generate HTML with ARIA attributes
   - Auto-generate Swift code for iOS
   - Auto-generate Kotlin code for Android
   - Copy-paste ready code blocks

2. **Validation Rules**
   - Warn if accessible name is too short (<3 chars)
   - Warn if accessible name contains node name verbatim
   - Suggest improvements based on element type

3. **Multi-Platform Support Per Element**
   - Allow multiple notes per element (one per platform)
   - Tabbed view in modal to switch platforms

4. **Visual Annotations (Optional)**
   - Toggle to show/hide note badges on canvas
   - Small icon indicator showing element has note

5. **Batch Operations**
   - Add same note to multiple elements
   - Find/replace in notes
   - Bulk export selected notes

6. **Templates & Presets**
   - Save common note patterns as templates
   - Quick-apply for common elements (buttons, inputs, etc.)

7. **Integration with Dev Handoff Tools**
   - Export to Zeplin, Figma Dev Mode, etc.
   - Structured JSON for CI/CD pipelines

8. **Accessibility Checklist**
   - Track which elements have notes
   - Show completion percentage
   - Export checklist for QA

9. **Comments & Collaboration**
   - Allow developers to comment on notes
   - Design-dev conversation thread

10. **AI-Powered Suggestions**
    - Analyze element context and suggest accessible names
    - Detect common patterns and recommend notes

---

**Status**: ✅ Complete (Phase 10)
**Version**: 1.0
**Last Updated**: 2025-11-29



