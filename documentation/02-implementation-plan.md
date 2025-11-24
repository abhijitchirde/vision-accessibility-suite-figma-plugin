# Accessibility Genie - Phase-Wise Implementation Plan

**Version**: 2.1
**Last Updated**: 2025-11-23
**Status**: Active Development

---

## ⚠️ CRITICAL: Implementation Protocols

**These protocols MUST be followed when implementing any phase in this project.**

### Protocol 1: Phase Start Confirmation

**Before starting any phase:**
- ✋ **MUST explicitly ask**: "Are you ready to start Phase [X]: [Tool Name]?"
- ⏸️ Wait for user confirmation before proceeding
- 📋 Review previous phase completion status
- 🚫 Confirm no blocking issues from previous phases

**Example:**
```
"Are you ready to start Phase 2: Touch Targets Checker?
This phase will build upon the infrastructure from Phase 1 (Contrast Checker)."
```

### Protocol 2: Git Commit Recommendations

**After completing each phase/feature:**

Provide recommended git commit using conventional commits format:

```
Commit Message: feat(tool-name): brief description

Description:
- Detailed change 1
- Detailed change 2
- Technical implementation notes
- Files added/modified
```

**⛔ CRITICAL RULES**:
1. **NO mention of Claude, AI, AI-assisted development, or any AI tools in commit messages or descriptions.**
2. **ONLY provide the recommended git message - DO NOT execute git commands yourself.**
   - Provide the message in a code block for the user to use
   - Let the user handle staging files and committing
   - The user will decide when and how to commit

**Good Example:**
```
feat(contrast): implement contrast checker tool

- Add WCAG 2.1 contrast ratio validation for text nodes
- Create ContrastPanel component with AA/AAA level filtering
- Implement StorageService for persisting settings
- Add color utilities for RGB/luminance calculations
- Create reusable Button, Card, and Badge components

Files:
- src/features/testing/contrast/
- src/services/storage.service.ts
- src/components/ui/
```

**Bad Example (DON'T DO THIS):**
```
feat(contrast): implement contrast checker

- Built with Claude's help
- AI-generated contrast calculations
```

### Protocol 3: Tool-Specific Documentation Requirements

**For each tool implemented, create `README.md` inside the tool folder.**

**Location**: `src/features/[category]/[tool-name]/README.md`

**Required Sections:**

1. **Tool Overview**
   - What the tool does
   - Why it's needed for accessibility
   - WCAG/ARIA standards it addresses

2. **How It Works**
   - Detailed technical explanation
   - Algorithm descriptions
   - Step-by-step process flow

3. **Data Flow Diagram**
   - Visual representation (ASCII art or Mermaid syntax)
   - Shows data movement through the system
   - User action → Plugin code → Figma API → Response

4. **User Interaction Flow**
   - Step-by-step user interaction diagram
   - What the user sees and clicks
   - UI states and transitions

5. **Technical Implementation**
   - Key algorithms used
   - Technical approaches
   - Performance considerations
   - Edge cases handled

6. **Scientific/Technical References**
   - Links to WCAG guidelines
   - Research papers or articles
   - Technical specifications
   - Standards documentation (with URLs)

7. **External Resources & Dependencies**
   - npm packages used (with versions and package URLs)
   - Open source projects referenced (with URLs)
   - Code snippets adapted from external sources (with attribution)
   - All with proper URLs and attribution

8. **Testing Approach**
   - How to test this specific tool
   - Test cases covered
   - Manual testing checklist

9. **Known Limitations**
   - Current limitations
   - Edge cases not handled
   - Browser/environment constraints

10. **Future Enhancements**
    - Potential improvements
    - Feature ideas for later phases

**Example Tool Documentation Template:**

````markdown
# Contrast Checker

## Tool Overview

The Contrast Checker validates color contrast ratios between text and background colors against WCAG 2.1 Level AA and AAA standards.

**Addresses**: WCAG 2.1 Success Criterion 1.4.3 (Contrast Minimum)

## How It Works

1. User selects text nodes or runs check on entire page
2. Plugin extracts foreground color (text fill) and background color (node fill or parent fill)
3. Calculate relative luminance for each color using WCAG formula
4. Compute contrast ratio: (L1 + 0.05) / (L2 + 0.05)
5. Compare against WCAG thresholds:
   - AA Normal Text: 4.5:1
   - AA Large Text: 3:1
   - AAA Normal Text: 7:1
   - AAA Large Text: 4.5:1

## Data Flow Diagram

```
User clicks "Check Contrast"
    ↓
UI sends RUN_CONTRAST_CHECK message
    ↓
Plugin code: ContrastChecker.checkPage()
    ↓
For each text node:
  ├─ Extract foreground RGB
  ├─ Extract background RGB
  ├─ Calculate luminance (WCAG formula)
  ├─ Calculate contrast ratio
  └─ Compare against thresholds
    ↓
Return ContrastResult[] to UI
    ↓
UI displays results in ContrastPanel
```

## User Interaction Flow

1. User opens plugin → sees main tool list
2. User clicks "Contrast" card → ContrastPanel opens
3. User selects WCAG level (AA/AAA) from dropdown
4. User clicks "Check Page" button
5. Plugin scans all text nodes on current page
6. Results list appears showing:
   - Color swatches (foreground/background)
   - Contrast ratio (e.g., "4.5:1")
   - Pass/Fail badge
7. User can filter: All / Pass / Fail
8. User clicks result → Figma zooms to that node

## Technical Implementation

**Algorithm**: WCAG 2.1 Relative Luminance Formula

```
L = 0.2126 * R + 0.7152 * G + 0.0722 * B

Where R, G, B are calculated as:
if (channel <= 0.03928):
    channel = channel / 12.92
else:
    channel = ((channel + 0.055) / 1.055) ^ 2.4
```

**Performance Optimization**:
- Batch process nodes (50 at a time)
- Cache color calculations
- Skip hidden/locked layers

## Scientific/Technical References

- **WCAG 2.1 Contrast Minimum**: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
- **Relative Luminance Formula**: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
- **Contrast Ratio Formula**: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
- **WebAIM Contrast Checker** (reference implementation): https://webaim.org/resources/contrastchecker/

## External Resources & Dependencies

**npm Packages**: None (using native calculations)

**Reference Code**:
- WCAG formula implementation inspired by: https://github.com/tmcw/wcag-contrast

## Testing Approach

**Test Cases**:
1. Black text on white background → Should pass AAA (21:1)
2. #666 text on white → Should fail AA (3.2:1)
3. Large text with 3.5:1 ratio → Should pass AA Large, fail Normal
4. Gradients → Should use average or fallback color
5. Transparent backgrounds → Should flatten against parent

**Manual Testing**:
- [ ] Check entire page with multiple text nodes
- [ ] Verify AA vs AAA filtering works
- [ ] Test with nested frames (background color detection)
- [ ] Verify zoom-to-node on result click

## Known Limitations

- Does not handle complex gradients (uses simple average)
- Cannot detect text over images (requires manual checking)
- Assumes opaque backgrounds (transparency flattened to white)

## Future Enhancements

- Support for text over images (using image sampling)
- Gradient analysis with multiple sample points
- Real-time contrast checking as colors change
- Color suggestions to achieve AA/AAA compliance
````

### Protocol 4: Phase Implementation Documentation

**After completing each phase, create comprehensive implementation documentation.**

**Location**: `documentation/implementation/phase-[X]-[tool-name].md`

**Examples:**
- `documentation/implementation/phase-1-contrast-checker.md`
- `documentation/implementation/phase-2-touch-targets.md`
- `documentation/implementation/phase-3-typography.md`

**Required Sections:**

1. **Header Information**
   - Implementation Date
   - Status (✅ Completed, 🚧 In Progress, ⏸️ Deferred)
   - Version number

2. **Overview**
   - High-level description of the phase
   - What was implemented
   - Why this phase is important

3. **Features Implemented**
   - Detailed list of all features (6-10 major features)
   - Organized by category
   - Each feature with clear description

4. **Technical Architecture**
   - File structure (before/after)
   - System components added/modified
   - Integration points

5. **Key Algorithms**
   - Code examples with TypeScript
   - Algorithm explanations
   - 4-6 major algorithms documented

6. **WCAG Compliance Thresholds**
   - Specific WCAG guidelines followed
   - Threshold values
   - Compliance levels (AA/AAA)

7. **Message Protocol**
   - All plugin → UI messages
   - All UI → plugin messages
   - TypeScript interface definitions
   - Example message payloads

8. **Key Implementation Decisions**
   - 5-10 major decisions documented
   - Each with: Decision, Rationale
   - Technical trade-offs explained

9. **Known Limitations**
   - Current constraints
   - What's not supported
   - Future considerations

10. **Testing Scenarios Verified**
    - Checkmarked list (✅)
    - All major test cases
    - Edge cases covered

11. **Debug Support**
    - Debugging approaches
    - Console log strategies
    - Troubleshooting tips

12. **Performance Considerations**
    - Optimization strategies
    - Performance metrics
    - Efficiency improvements

13. **UX Enhancements** *(if applicable)*
    - Visual design improvements
    - Interaction design patterns
    - Information architecture

14. **Future Enhancements**
    - Post-phase improvements
    - 5-10 potential features
    - Numbered list format

15. **Dependencies**
    - Runtime dependencies
    - Development dependencies
    - Reused from previous phases
    - New components added

16. **Build Configuration**
    - Build commands
    - Build output details
    - Compilation notes

17. **Conclusion**
    - Summary of achievements
    - Key accomplishments (checkmarked ✅)
    - Production readiness notes

**Format Requirements:**
- Use markdown formatting
- Include code blocks with syntax highlighting
- Use checkmarks (✅) for completed items
- Include TypeScript type definitions
- Reference URLs to WCAG guidelines
- Use clear section headings with ##

**Purpose:**
This documentation serves as:
- Historical record of implementation decisions
- Reference for future development
- Onboarding material for new contributors
- Technical specification for the phase
- Knowledge base for troubleshooting

---

## Table of Contents

1. [Overview](#overview)
2. [Development Philosophy](#development-philosophy)
3. [Phase Structure Overview](#phase-structure-overview)
4. [Phase 0: Project Setup](#phase-0-project-setup)
5. [Phase 1: Contrast Checker](#phase-1-contrast-checker)
6. [Phase 2: Touch Targets Checker](#phase-2-touch-targets-checker)
7. [Phase 3: Typography Checker](#phase-3-typography-checker)
8. [Phase 4: Vision Simulator](#phase-4-vision-simulator)
9. [Phase 5: Automatic Monitoring](#phase-5-automatic-monitoring)
10. [Phase 6: Alt-Text Manager](#phase-6-alt-text-manager)
11. [Phase 7: Focus Order Manager](#phase-7-focus-order-manager)
12. [Phase 8: Headings Manager](#phase-8-headings-manager)
13. [Phase 9: Landmarks Manager](#phase-9-landmarks-manager)
14. [Phase 10: Accessibility Notes](#phase-10-accessibility-notes)
15. [Phase 11: Integration & Polish](#phase-11-integration--polish)
16. [Phase 12: Auto Scan & Fix](#phase-12-auto-scan--fix)
17. [Timeline Summary](#timeline-summary)
18. [Git Commit Strategy](#git-commit-strategy)

---

## Overview

### Project Goals

Build **Accessibility Genie**, a comprehensive Figma plugin that helps designers create accessible designs through:
- Real-time accessibility testing tools
- Annotation tools for documenting accessibility requirements
- Standards-based guidance (WCAG 2.1, ARIA, platform guidelines)
- Developer handoff capabilities

### Development Approach

- **Pragmatic & Incremental**: Build only what's needed, when it's needed
- **Modular from Start**: Components, services, and utilities built as proper reusable modules
- **No Speculation**: Don't create infrastructure for hypothetical future needs
- **One Tool Per Phase**: Each phase implements one complete, testable tool
- **Git-Friendly**: Each phase completion is a natural commit point
- **Comprehensive Documentation**: Each tool includes detailed README with diagrams and references

---

## Development Philosophy

### Build When Needed, Not When Speculated

**Core Principle**: Only build infrastructure when a specific tool needs it.

**Example**:
- ❌ **Don't**: Create AnnotationService in Phase 1 because "annotation tools will need it later"
- ✅ **Do**: Create AnnotationService in Phase 6 when Alt-Text Manager (first annotation tool) actually needs it

### Modular From First Use

**Core Principle**: When you build something, make it a proper reusable module (not inline code).

**Example**:
- ❌ **Don't**: Write button HTML/styles inline in ContrastPanel
- ✅ **Do**: Create `src/components/ui/Button/Button.tsx` as a proper component when Contrast Checker needs a button

### Natural Extraction Over Premature Abstraction

**Core Principle**: Extract common patterns when you see duplication, not before.

**Example**:
- Phase 1: Build color utilities for Contrast Checker
- Phase 2: Touch Targets Checker doesn't need color utilities, so don't force it
- Phase 3: If Typography Checker also needs color utilities, great! They're already there
- If pattern emerges across 3 tools, consider extracting to shared utility

### Each Phase = One Tool = One Commit

**Core Principle**: Each phase implements one complete, tested, documented tool.

**Result**:
- Clean git history
- Easy to review changes
- Easy to roll back if needed
- Clear progress tracking

---

## Phase Structure Overview

```
Phase 0: Project Setup (Verification)
    ↓
Phase 1: Contrast Checker (First Tool + Initial Infrastructure)
├─ Build: Button, Card, Badge, List, Input, Dropdown components
├─ Build: StorageService, SelectionService
├─ Build: color.utils, wcag.utils, node.utils
└─ Deliver: Working Contrast Checker + Tool Documentation
    ↓
Phase 2: Touch Targets Checker
├─ Reuse: UI components, StorageService, SelectionService
├─ Add: Touch target validation utilities
└─ Deliver: Working Touch Targets Checker + Tool Documentation
    ↓
Phase 3: Typography Checker
├─ Reuse: Existing infrastructure
├─ Add: Typography validation utilities
└─ Deliver: Working Typography Checker + Tool Documentation
    ↓
Phase 4: Vision Simulator
├─ Reuse: Existing infrastructure
├─ Add: Image processing utilities, filter algorithms
└─ Deliver: Working Vision Simulator + Tool Documentation
    ↓
Phase 5: Automatic Monitoring
├─ Reuse: All testing tools built so far
├─ Add: EventService (document change listening)
└─ Deliver: Working Automatic Monitoring + Tool Documentation
    ↓
Phase 6: Alt-Text Manager (First Annotation Tool)
├─ Reuse: Existing infrastructure
├─ Add: AnnotationService (canvas badges/overlays) ← NEW
└─ Deliver: Working Alt-Text Manager + Tool Documentation
    ↓
Phase 7: Focus Order Manager
├─ Reuse: Existing infrastructure + AnnotationService
├─ Add: Drag-and-drop utilities, arrow drawing
└─ Deliver: Working Focus Order Manager + Tool Documentation
    ↓
Phase 8: Headings Manager
├─ Reuse: Existing infrastructure + AnnotationService
├─ Add: Hierarchy validation utilities
└─ Deliver: Working Headings Manager + Tool Documentation
    ↓
Phase 9: Landmarks Manager
├─ Reuse: Existing infrastructure + AnnotationService
├─ Add: Landmark validation utilities
└─ Deliver: Working Landmarks Manager + Tool Documentation
    ↓
Phase 10: Accessibility Notes
├─ Reuse: Existing infrastructure
├─ Add: Platform templates, code generation utilities
└─ Deliver: Working Accessibility Notes + Tool Documentation
    ↓
Phase 11: Integration & Polish
├─ Test all 10 tools working together
├─ Performance optimization
├─ Bug fixes
├─ Add: ExportService (comprehensive export across all tools)
└─ Deliver: Production-ready plugin
    ↓
Phase 12: Auto Scan & Fix (Deferred Final Phase)
├─ Orchestrate all testing tools
├─ Build unified results dashboard
└─ Deliver: One-click accessibility scan
```

---

## Phase 0: Project Setup

**Duration**: Already complete (verification only)
**Goal**: Verify development environment is ready

### Verification Checklist

#### 1. Dependencies Installed ✓

```bash
# Verify these are in package.json
- react (^18.3.0)
- react-dom (^18.3.0)
- typescript (^5.6.0)
- @figma/plugin-typings (latest)
- webpack (^5.x)
- webpack-cli
- ts-loader
- css-loader
- html-webpack-plugin
```

#### 2. Configuration Files ✓

- [x] `webpack.config.js` exists and properly configured
  - Entry points: `code.ts` (plugin code), `ui.tsx` (UI)
  - Output: `dist/` folder
  - Loaders: TypeScript, CSS
- [x] `tsconfig.json` exists and properly configured
  - Target: ES6+
  - JSX: react
  - Strict mode enabled
- [x] `manifest.json` exists with correct plugin metadata

#### 3. Existing Infrastructure ✓

- [x] `src/hooks/useFigmaMessage.ts` - Message protocol for UI ↔ Plugin communication
- [x] `src/hooks/useFigmaTheme.ts` - Theme system for light/dark mode

#### 4. Build System ✓

```bash
# Verify these commands work
npm run dev     # Development build with watch
npm run build   # Production build
```

#### 5. Plugin Loading ✓

- [ ] Plugin loads in Figma without errors
- [ ] UI renders (even if empty)
- [ ] Console shows no errors

### Success Criteria

- ✅ All dependencies installed
- ✅ Build commands work
- ✅ Plugin loads in Figma
- ✅ Existing hooks functional (useFigmaMessage, useFigmaTheme)

### No Git Commit

Phase 0 is verification only. First commit happens after Phase 1.

---

## Phase 1: Contrast Checker

**Duration**: 1-2 weeks
**Goal**: Implement first complete tool + build initial reusable infrastructure

### Rationale

Contrast Checker is the perfect first tool because:
- **High Priority**: Most common accessibility issue
- **Relatively Simple**: Clear algorithm (WCAG contrast formula)
- **Establishes Patterns**: Sets up UI components, services, and utilities that other tools will reuse
- **Immediate Value**: Delivers working functionality quickly

### What This Phase Builds

#### 1. First UI Components (Reusable)

Create these in `src/components/ui/`:

- **Button** (`Button/Button.tsx`)
  - Variants: primary, secondary, tertiary, ghost, destructive
  - Sizes: small, medium, large
  - States: disabled, loading
  - Icon support (left/right positioning)

- **Card** (`Card/Card.tsx`)
  - Tool card for navigation
  - Icon, title, description, badge
  - Clickable with hover states

- **Badge** (`Badge/Badge.tsx`)
  - Status indicators (success, warning, error, info, neutral)
  - Sizes: small, medium, large
  - Used for pass/fail indicators

- **List** (`List/List.tsx`)
  - Scrollable list container
  - List item component
  - Empty state support

- **Input** (`Input/Input.tsx`)
  - Text input with label
  - Error state
  - Helper text

- **Dropdown** (`Dropdown/Dropdown.tsx`)
  - Select dropdown
  - Option list
  - Searchable (future enhancement)

- **Icon** (`Icon/Icon.tsx`)
  - SVG icon system
  - Size prop
  - Color customization

#### 2. First Services (Reusable)

Create these in `src/services/`:

- **StorageService** (`storage.service.ts`)
  - `setNodeData<T>(node, key, value)` - Store data on node
  - `getNodeData<T>(node, key)` - Retrieve data from node
  - `setPluginData<T>(key, value)` - Store plugin-wide settings
  - `getPluginData<T>(key)` - Retrieve plugin-wide settings
  - `deleteNodeData(node, key)` - Delete data from node
  - JSON serialization with versioning

- **SelectionService** (`selection.service.ts`)
  - `getCurrentSelection()` - Get current Figma selection
  - `onSelectionChange(callback)` - Listen for selection changes
  - `findNodesOfType(type)` - Filter nodes by type
  - `traverseNode(node, callback)` - Tree traversal

#### 3. First Utilities (Reusable)

Create these in `src/utils/`:

- **color.utils.ts**
  - `rgbToHex(rgb)` - Convert RGB to hex
  - `getRelativeLuminance(rgb)` - WCAG luminance formula
  - `getContrastRatio(color1, color2)` - WCAG contrast formula
  - `isLightColor(rgb)` - Determine if color is light/dark

- **wcag.utils.ts**
  - `getWCAGLevel(ratio, isLarge)` - Determine AAA/AA/Fail
  - `isLargeText(fontSize, fontWeight)` - Check if text is "large"
  - `getMinimumContrast(isLarge, level)` - Get threshold for AA/AAA

- **node.utils.ts**
  - `isTextNode(node)` - Type guard for text nodes
  - `getNodeFills(node)` - Extract fill colors
  - `getBackgroundColor(node)` - Get background (node or parent)
  - `getTextColor(node)` - Get foreground color

#### 4. Contrast Checker Implementation

Create in `src/features/testing/contrast/`:

**File Structure**:
```
src/features/testing/contrast/
├── README.md                           ⭐ Comprehensive tool documentation
├── contrast-checker.ts                 Core logic
├── contrast.types.ts                   TypeScript types
├── contrast.constants.ts               WCAG thresholds
└── components/
    ├── ContrastPanel.tsx               Main UI panel
    └── ContrastPanel.module.css        Styles
```

**contrast.types.ts**:
```typescript
export interface ContrastResult {
  nodeId: string;
  nodeName: string;
  foreground: RGB;
  background: RGB;
  ratio: number;
  passAA: boolean;
  passAAA: boolean;
  isLargeText: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface RGB {
  r: number; // 0-1
  g: number; // 0-1
  b: number; // 0-1
}
```

**contrast-checker.ts**:
```typescript
export class ContrastChecker {
  constructor(
    private storage: StorageService,
    private selection: SelectionService
  ) {}

  async checkSelection(): Promise<ContrastResult[]> {
    // Check currently selected nodes
  }

  async checkPage(): Promise<ContrastResult[]> {
    // Check all text nodes on page
  }

  checkNode(node: TextNode): ContrastResult {
    // Check single node
    // 1. Extract foreground color
    // 2. Extract background color
    // 3. Calculate contrast ratio
    // 4. Compare against WCAG thresholds
  }
}
```

**ContrastPanel.tsx**:
```typescript
export const ContrastPanel: React.FC = () => {
  const [results, setResults] = useState<ContrastResult[]>([]);
  const [filter, setFilter] = useState<'all' | 'pass' | 'fail'>('all');
  const [level, setLevel] = useState<'AA' | 'AAA'>('AA');
  const { sendMessage } = useFigmaMessage();

  // UI for checking contrast, filtering results, displaying list
}
```

#### 5. App Shell & Navigation

Create in `src/`:

- **App.tsx** - Main app container
  - Theme provider
  - Router/view switching
  - Main tool list view

- **MainView.tsx** - Tool list view
  - Card for each tool (initially just Contrast)
  - Navigation to tool panels

### Implementation Tasks (Day-by-Day)

#### Day 1-2: Base UI Components

- [ ] Create `src/components/ui/` folder structure
- [ ] Implement Button component with all variants
- [ ] Implement Card component
- [ ] Implement Badge component
- [ ] Implement List component
- [ ] Implement Input component
- [ ] Implement Dropdown component
- [ ] Implement Icon component (basic SVG icons)
- [ ] Create CSS modules for each component
- [ ] Test components in isolation

#### Day 2-3: Core Services & Utilities

- [ ] Create `src/services/` folder
- [ ] Implement StorageService with async methods
- [ ] Implement SelectionService with node traversal
- [ ] Create `src/utils/` folder
- [ ] Implement color.utils.ts (luminance, contrast formulas)
- [ ] Implement wcag.utils.ts (WCAG thresholds)
- [ ] Implement node.utils.ts (type guards, color extraction)
- [ ] Test utilities with sample data

#### Day 3-4: Contrast Checker Logic

- [ ] Create `src/features/testing/contrast/` folder
- [ ] Define TypeScript types (contrast.types.ts)
- [ ] Define constants (WCAG thresholds)
- [ ] Implement ContrastChecker class
  - [ ] `checkNode()` method
  - [ ] `checkSelection()` method
  - [ ] `checkPage()` method
- [ ] Test contrast calculations against known values
- [ ] Handle edge cases (gradients, transparency, nested frames)

#### Day 4-5: Contrast Panel UI

- [ ] Create ContrastPanel component
- [ ] Implement WCAG level selector (AA/AAA dropdown)
- [ ] Implement "Check Page" button
- [ ] Implement results list with:
  - Color swatches (foreground/background)
  - Contrast ratio display
  - Pass/fail badges
  - Node name
- [ ] Implement filter buttons (All/Pass/Fail)
- [ ] Implement click-to-zoom (select node in Figma)
- [ ] Style panel with CSS modules

#### Day 5-6: App Shell & Integration

- [ ] Create App.tsx with theme provider
- [ ] Create MainView.tsx with tool list
- [ ] Add Contrast Checker card to tool list
- [ ] Implement navigation (MainView ↔ ContrastPanel)
- [ ] Set up message protocol in code.ts:
  - Handle `RUN_CONTRAST_CHECK` message
  - Return results to UI
- [ ] Test end-to-end flow

#### Day 6-7: Tool Documentation

- [ ] Create `src/features/testing/contrast/README.md`
- [ ] Write comprehensive tool documentation:
  - [ ] Tool overview
  - [ ] How it works (technical explanation)
  - [ ] Data flow diagram
  - [ ] User interaction flow
  - [ ] Technical implementation details
  - [ ] WCAG references with URLs
  - [ ] Testing approach
  - [ ] Known limitations
  - [ ] Future enhancements

#### Day 7: Testing & Polish

- [ ] Test with various color combinations
- [ ] Test with large files (100+ text nodes)
- [ ] Test edge cases (gradients, transparency)
- [ ] Performance optimization (if needed)
- [ ] Fix bugs
- [ ] Code cleanup
- [ ] Verify documentation is complete

### Deliverables

- ✅ Working Contrast Checker tool
- ✅ 7 reusable UI components (Button, Card, Badge, List, Input, Dropdown, Icon)
- ✅ 2 core services (StorageService, SelectionService)
- ✅ 3 utility modules (color, wcag, node)
- ✅ App shell with navigation
- ✅ Comprehensive tool documentation (README.md)
- ✅ Tested and functional end-to-end

### Testing Checklist

- [ ] Contrast Checker works on selected text node
- [ ] Contrast Checker works on entire page (100+ nodes)
- [ ] AA/AAA filtering works correctly
- [ ] Pass/Fail filtering works correctly
- [ ] Color swatches display accurately
- [ ] Contrast ratios calculated correctly (verified against WebAIM)
- [ ] Large text detection works (18pt+ or 14pt+ bold)
- [ ] Click on result zooms to node in Figma
- [ ] UI components are reusable and work correctly
- [ ] StorageService persists settings correctly
- [ ] SelectionService detects selection changes
- [ ] Documentation is complete and accurate

### Git Commit Template

```
feat(contrast): implement contrast checker tool

- Add WCAG 2.1 contrast ratio validation for text nodes
- Create ContrastPanel with AA/AAA level filtering
- Implement StorageService for persisting plugin settings
- Implement SelectionService for node selection management
- Add color utilities (luminance, contrast ratio calculations)
- Add WCAG utilities (threshold validation, large text detection)
- Add node utilities (type guards, color extraction)
- Create reusable UI components (Button, Card, Badge, List, Input, Dropdown, Icon)
- Add comprehensive tool documentation with data flow diagrams
- Handle edge cases: gradients, transparency, nested backgrounds

Tested with:
- Various color combinations (black/white, grays, colors)
- Large files (100+ text nodes)
- Different WCAG levels (AA, AAA)
- Large text detection (18pt+, 14pt+ bold)

WCAG Reference: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
```

---

## Phase 2: Touch Targets Checker

**Duration**: 1 week
**Goal**: Implement touch target size validation

**📢 Start Protocol**: Ask user "Are you ready to start Phase 2: Touch Targets Checker?"

### Rationale

Touch Targets is a straightforward checker focusing on size validation, perfect as the second tool.

### Infrastructure from Previous Phases

**Reuse from Phase 1**:
- ✅ UI components (Button, Card, Badge, List, Dropdown)
- ✅ StorageService
- ✅ SelectionService
- ✅ node.utils.ts (partially)
- ✅ App shell and navigation

### New Infrastructure Needed

**Add in this phase**:
- Touch target validation utilities (may extend node.utils.ts)
- Touch target specific constants (platform sizes)

### Implementation Tasks

#### Day 1-2: Touch Targets Logic

- [ ] Create `src/features/testing/touch-targets/` folder
- [ ] Define TypeScript types (touch-targets.types.ts)
- [ ] Define constants (platform-specific minimum sizes)
  - Web: 24×24px (AA), 44×44px (AAA)
  - iOS: 44×44pt
  - Android: 48×48dp
- [ ] Implement TouchTargetsChecker class
  - [ ] Identify interactive nodes (buttons, with reactions)
  - [ ] Measure width and height
  - [ ] Validate against platform standards
  - [ ] Generate results with severity

#### Day 2-3: Touch Targets Panel UI

- [ ] Create TouchTargetsPanel component
- [ ] Implement platform selector (Web/iOS/Android dropdown)
- [ ] Implement "Check Page" button
- [ ] Implement results list:
  - Node name
  - Current size (e.g., "32×28px")
  - Required size
  - Pass/fail badge
- [ ] Implement "Fix" button (auto-resize to minimum, if safe)
- [ ] Style panel

#### Day 3-4: Integration & Testing

- [ ] Add Touch Targets card to MainView
- [ ] Set up message handler in code.ts
- [ ] Test with various node sizes
- [ ] Test platform switching
- [ ] Test "Fix" functionality

#### Day 4-5: Tool Documentation

- [ ] Create `src/features/testing/touch-targets/README.md`
- [ ] Document WCAG 2.5.5 (Target Size)
- [ ] Add platform-specific guidelines:
  - iOS Human Interface Guidelines
  - Android Material Design
  - Web (WCAG 2.5.5)
- [ ] Data flow diagram
- [ ] User interaction flow
- [ ] Testing approach

#### Day 5: Testing & Polish

- [ ] Test with nested components
- [ ] Test with groups
- [ ] Performance testing
- [ ] Bug fixes
- [ ] Documentation review

### Deliverables

- ✅ Working Touch Targets Checker
- ✅ Platform-specific validation (Web, iOS, Android)
- ✅ "Fix" functionality (auto-resize)
- ✅ Comprehensive tool documentation
- ✅ Tested and functional

### Testing Checklist

- [ ] Touch targets checked on entire page
- [ ] Platform switching works (Web/iOS/Android)
- [ ] Pass/fail indicators accurate
- [ ] "Fix" button resizes nodes safely
- [ ] Interactive node detection accurate (reactions, component instances)
- [ ] Works with nested components and groups

### Git Commit Template

```
feat(touch-targets): implement touch targets checker

- Add WCAG 2.5.5 target size validation
- Support platform-specific standards (Web, iOS, Android)
- Create TouchTargetsPanel with platform selector
- Implement auto-resize "Fix" functionality
- Detect interactive nodes (reactions, buttons, components)
- Add comprehensive tool documentation

Platform Standards:
- Web: 24×24px (AA), 44×44px (AAA)
- iOS: 44×44pt (HIG)
- Android: 48×48dp (Material Design)

WCAG Reference: https://www.w3.org/WAI/WCAG21/Understanding/target-size.html
```

---

## Phase 3: Typography Checker

**Duration**: 1 week
**Goal**: Implement typography validation (font size, line height, alignment, etc.)

**📢 Start Protocol**: Ask user "Are you ready to start Phase 3: Typography Checker?"

### Rationale

Typography Checker validates multiple text properties, expanding validation capabilities.

### Infrastructure from Previous Phases

**Reuse**:
- ✅ All UI components
- ✅ StorageService, SelectionService
- ✅ node.utils.ts

### New Infrastructure Needed

**Add in this phase**:
- Typography validation utilities
- Bulk text modification utilities (optional)

### Implementation Tasks

#### Day 1-2: Typography Rules & Logic

- [ ] Create `src/features/testing/typography/` folder
- [ ] Define TypeScript types (typography.types.ts)
- [ ] Define typography rules:
  - Minimum font size (11px warning, 16px recommended)
  - Line height (1.5 for body, 1.2 for headings)
  - Line length (50-75 characters optimal)
  - Text alignment (left preferred for LTR)
  - Font weight (minimum 400 for body)
- [ ] Implement TypographyChecker class
- [ ] Implement rule engine with severity levels (error, warning, info)

#### Day 2-3: Typography Panel UI

- [ ] Create TypographyPanel component
- [ ] Display list of text nodes with issues
- [ ] Show specific rule violations per node
- [ ] Implement bulk actions:
  - Set minimum font size
  - Apply recommended line height
  - Fix alignment
- [ ] Before/after preview (optional)

#### Day 3-4: Integration & Testing

- [ ] Add Typography card to MainView
- [ ] Set up message handler
- [ ] Test with various text styles
- [ ] Test multilingual text (RTL)
- [ ] Test bulk actions

#### Day 4-5: Tool Documentation & Polish

- [ ] Create README.md with typography best practices
- [ ] Reference typography accessibility guidelines
- [ ] Data flow and user interaction diagrams
- [ ] Testing and bug fixes

### Deliverables

- ✅ Working Typography Checker
- ✅ Multiple validation rules
- ✅ Bulk fix capabilities
- ✅ Comprehensive tool documentation

### Git Commit Template

```
feat(typography): implement typography checker

- Add font size validation (min 11px, recommend 16px)
- Add line height validation (1.5 body, 1.2 headings)
- Add line length validation (50-75 characters)
- Add text alignment checking
- Add font weight validation
- Create TypographyPanel with rule violations list
- Implement bulk fix actions
- Add comprehensive tool documentation

Typography Guidelines:
- WCAG 1.4.8 Visual Presentation
- Best practices for readability

Reference: https://www.w3.org/WAI/WCAG21/Understanding/visual-presentation.html
```

---

## Phase 4: Vision Simulator

**Duration**: 1-2 weeks
**Goal**: Simulate vision impairments (color blindness, blur, etc.)

**📢 Start Protocol**: Ask user "Are you ready to start Phase 4: Vision Simulator?"

### Rationale

Vision Simulator provides visual feedback on accessibility issues, higher complexity with image processing.

### Infrastructure from Previous Phases

**Reuse**:
- ✅ All UI components
- ✅ StorageService

### New Infrastructure Needed

**Add in this phase**:
- Image processing utilities
- Color blindness filter algorithms
- Blur filter algorithms
- Image export/rendering utilities

### Implementation Tasks

#### Day 1-3: Filter Algorithms

- [ ] Create `src/features/testing/vision-simulator/` folder
- [ ] Research and implement color blindness filters:
  - Protanopia (red-blind)
  - Deuteranopia (green-blind)
  - Tritanopia (blue-blind)
  - Achromatopsia (total color blindness)
  - Use Brettel-Viénot-Mollon transformation matrices
- [ ] Implement Gaussian blur filter
- [ ] Set up Canvas API for image processing

#### Day 3-5: Image Processing Pipeline

- [ ] Export selected nodes as images (figma.exportAsync)
- [ ] Apply transformation matrices to image data
- [ ] Render processed images
- [ ] Optimize for performance (downsample large images)

#### Day 5-7: Vision Simulator Panel UI

- [ ] Create VisionSimulatorPanel component
- [ ] Filter selection dropdown
- [ ] Preview area (original vs filtered)
- [ ] Side-by-side comparison
- [ ] Intensity slider (optional)
- [ ] Export filtered images

#### Day 7-8: Integration, Testing & Documentation

- [ ] Add Vision Simulator card to MainView
- [ ] Message handler setup
- [ ] Test all filter types
- [ ] Performance optimization (caching, progressive rendering)
- [ ] Create README.md with vision science references
- [ ] Document filter algorithms and transformation matrices

### Deliverables

- ✅ Working Vision Simulator
- ✅ 4+ color blindness filters
- ✅ Blur filter
- ✅ Side-by-side comparison
- ✅ Export capability
- ✅ Comprehensive tool documentation with scientific references

### Git Commit Template

```
feat(vision-simulator): implement vision impairment simulator

- Add color blindness filters (protanopia, deuteranopia, tritanopia, achromatopsia)
- Implement Gaussian blur filter
- Create image processing pipeline using Canvas API
- Create VisionSimulatorPanel with filter preview
- Add side-by-side comparison view
- Export filtered images functionality
- Optimize for performance (image downsampling)
- Add comprehensive documentation with vision science references

Filter Algorithms:
- Brettel-Viénot-Mollon transformation matrices
- Gaussian blur convolution

Scientific References:
- Color blindness simulation: [Research paper URL]
- Brettel et al. method: [URL]
```

---

## Phase 5: Automatic Monitoring

**Duration**: 1 week
**Goal**: Real-time monitoring of accessibility issues as design changes

**📢 Start Protocol**: Ask user "Are you ready to start Phase 5: Automatic Monitoring?"

### Rationale

Automatic Monitoring provides proactive accessibility checking, reuses all existing testing tools.

### Infrastructure from Previous Phases

**Reuse**:
- ✅ All testing tools (Contrast, Touch Targets, Typography)
- ✅ All UI components
- ✅ StorageService

### New Infrastructure Needed

**Add in this phase**:
- **EventService** (`src/services/event.service.ts`) ← NEW
  - Document change listening
  - Debouncing/throttling
  - Change detection

### Implementation Tasks

#### Day 1-2: EventService

- [ ] Create `src/services/event.service.ts`
- [ ] Implement document change listener (figma.on('documentchange'))
- [ ] Implement debounce utility (500ms delay)
- [ ] Implement change detection (identify changed nodes)
- [ ] Determine which checks to re-run based on change type

#### Day 2-3: Monitoring Engine

- [ ] Create `src/features/testing/auto-monitoring/` folder
- [ ] Implement AutoMonitoring class
- [ ] Toggle monitoring on/off
- [ ] Queue check operations
- [ ] Run checks automatically on document changes
- [ ] Incremental checking (only changed nodes)

#### Day 3-4: Monitoring Dashboard UI

- [ ] Create AutoMonitoringPanel component
- [ ] Toggle monitoring on/off
- [ ] Select which checks to run (Contrast/Touch/Typography)
- [ ] Live issue dashboard
- [ ] Issue counts by severity
- [ ] Performance metrics (checks/second)

#### Day 4-5: Integration, Testing & Documentation

- [ ] Add Automatic Monitoring card to MainView
- [ ] Message handler setup
- [ ] Test with live document changes
- [ ] Performance testing (ensure no UI lag)
- [ ] Memory leak testing
- [ ] Create README.md with monitoring architecture

### Deliverables

- ✅ Working Automatic Monitoring
- ✅ EventService for document change detection
- ✅ Real-time issue detection
- ✅ Live dashboard
- ✅ Comprehensive tool documentation

### Git Commit Template

```
feat(monitoring): implement automatic accessibility monitoring

- Add EventService for document change detection
- Implement debounced change listener (500ms)
- Create AutoMonitoring orchestration system
- Run accessibility checks automatically on design changes
- Create AutoMonitoringPanel with live dashboard
- Toggle monitoring on/off
- Select which checks to run (Contrast, Touch Targets, Typography)
- Display real-time issue counts and severity
- Performance optimized (no UI lag)

Monitors:
- Contrast ratio violations
- Touch target size issues
- Typography problems

Reference: Real-time accessibility checking approach
```

---

## Phase 6: Alt-Text Manager

**Duration**: 1 week
**Goal**: Annotate images with alternative text (first annotation tool)

**📢 Start Protocol**: Ask user "Are you ready to start Phase 6: Alt-Text Manager?"

### Rationale

Alt-Text Manager is the first annotation tool, introduces canvas annotations/badges.

### Infrastructure from Previous Phases

**Reuse**:
- ✅ All UI components
- ✅ StorageService, SelectionService

### New Infrastructure Needed

**Add in this phase**:
- **AnnotationService** (`src/services/annotation.service.ts`) ← NEW
  - Create badges/overlays on canvas
  - Position badges relative to nodes
  - Show/hide annotations
  - Delete annotations

### Implementation Tasks

#### Day 1-2: AnnotationService

- [ ] Create `src/services/annotation.service.ts`
- [ ] Implement badge creation (text label in rectangle)
- [ ] Implement badge positioning (top-left of node)
- [ ] Implement badge styling (color, size)
- [ ] Implement show/hide functionality
- [ ] Implement delete annotations
- [ ] Badge namespace management (group annotations)

#### Day 2-3: Alt-Text Logic

- [ ] Create `src/features/annotation/alt-text/` folder
- [ ] Define types (AltTextData)
- [ ] Identify image nodes (rectangles with image fills)
- [ ] Store alt text in plugin data (StorageService)
- [ ] Mark images as decorative
- [ ] Character counter (200 char limit)
- [ ] Validation rules:
  - Not too short (<10 chars warning)
  - Not too long (>200 chars error)
  - Not filename-like ("image_123.png" warning)

#### Day 3-4: Alt-Text Panel UI

- [ ] Create AltTextPanel component
- [ ] List all images on page with thumbnails
- [ ] Text input for alt text
- [ ] "Decorative" checkbox
- [ ] Character counter
- [ ] Validation feedback
- [ ] Progress indicator (X/Y images completed)
- [ ] Filter: All / Complete / Incomplete

#### Day 4-5: Visual Annotations

- [ ] Create status badges on canvas:
  - Green: Has alt text
  - Red: Missing alt text
  - Gray: Marked decorative
- [ ] Update badges when alt text changes
- [ ] Show completion percentage overlay

#### Day 5-6: Integration, Testing & Documentation

- [ ] Add Alt-Text card to MainView
- [ ] Message handler setup
- [ ] Test with various image types
- [ ] Test validation rules
- [ ] Create README.md with WCAG alt text guidelines

### Deliverables

- ✅ Working Alt-Text Manager
- ✅ AnnotationService for canvas badges
- ✅ Visual status badges on images
- ✅ Validation system
- ✅ Comprehensive tool documentation

### Git Commit Template

```
feat(alt-text): implement alt-text annotation manager

- Add AnnotationService for canvas badge creation
- Identify image nodes (rectangles with image fills)
- Create AltTextPanel with image list and text input
- Store alt text in plugin data (persisted in Figma file)
- Mark images as decorative
- Validate alt text (length, content quality)
- Character counter (200 char limit)
- Visual status badges (green=complete, red=missing, gray=decorative)
- Progress tracking (X/Y images completed)
- Filter incomplete images

WCAG Guidelines:
- WCAG 1.1.1 Non-text Content
- Alt text best practices

Reference: https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html
```

---

## Phase 7: Focus Order Manager

**Duration**: 1 week
**Goal**: Define keyboard navigation order

**📢 Start Protocol**: Ask user "Are you ready to start Phase 7: Focus Order Manager?"

### Infrastructure from Previous Phases

**Reuse**:
- ✅ AnnotationService (for numbered badges and arrows)
- ✅ All UI components
- ✅ StorageService, SelectionService

### New Infrastructure Needed

**Add in this phase**:
- Drag-and-drop utilities (sortablejs or react-beautiful-dnd)
- Arrow drawing utilities (extend AnnotationService)

### Implementation Tasks

#### Day 1-2: Focus Order Logic

- [ ] Create `src/features/annotation/focus-order/` folder
- [ ] Identify focusable elements (buttons, inputs, interactive nodes)
- [ ] Store focus order index in plugin data
- [ ] Auto-detect spatial order (top-to-bottom, left-to-right)
- [ ] Reorder functionality (move up/down, insert at position)

#### Day 2-3: Drag-and-Drop Implementation

- [ ] Install drag-and-drop library (sortablejs or react-beautiful-dnd)
- [ ] Create sortable list of elements
- [ ] Implement reorder on drag
- [ ] Update focus order indices

#### Day 3-4: Focus Order Panel UI

- [ ] Create FocusOrderPanel component
- [ ] Sortable list with drag handles
- [ ] Element name/type display
- [ ] Move up/down buttons
- [ ] Remove from order button
- [ ] Auto-detect button (spatial order)
- [ ] Show/hide flow arrows toggle

#### Day 4-5: Visual Annotations

- [ ] Create numbered badges (1, 2, 3, ...)
- [ ] Create arrow connectors between elements
- [ ] Highlight focus path on hover
- [ ] Update on reorder

#### Day 5-6: Integration, Testing & Documentation

- [ ] Add Focus Order card to MainView
- [ ] Message handler setup
- [ ] Test drag-and-drop
- [ ] Test arrow rendering
- [ ] Create README.md with keyboard navigation guidelines

### Deliverables

- ✅ Working Focus Order Manager
- ✅ Drag-and-drop reordering
- ✅ Numbered badges and flow arrows
- ✅ Auto-detect spatial order
- ✅ Comprehensive tool documentation

### Git Commit Template

```
feat(focus-order): implement focus order annotation manager

- Identify focusable elements (interactive nodes)
- Create FocusOrderPanel with drag-and-drop reordering
- Store focus order indices in plugin data
- Auto-detect spatial focus order (top-to-bottom, left-to-right)
- Create numbered badges on canvas (1, 2, 3, ...)
- Draw arrow connectors showing focus flow
- Highlight focus path on hover
- Manual reordering (drag-and-drop, move up/down buttons)

Dependencies:
- [sortablejs or react-beautiful-dnd]: Drag-and-drop functionality

WCAG Guidelines:
- WCAG 2.4.3 Focus Order
- Keyboard navigation best practices

Reference: https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html
```

---

## Phase 8: Headings Manager

**Duration**: 1 week
**Goal**: Annotate heading structure (H1-H6)

**📢 Start Protocol**: Ask user "Are you ready to start Phase 8: Headings Manager?"

### Infrastructure from Previous Phases

**Reuse**:
- ✅ AnnotationService (for heading badges)
- ✅ All UI components
- ✅ StorageService, SelectionService

### New Infrastructure Needed

**Add in this phase**:
- Hierarchy validation utilities

### Implementation Tasks

#### Day 1-2: Headings Logic

- [ ] Create `src/features/annotation/headings/` folder
- [ ] Detect potential headings (large font, bold weight, top position)
- [ ] Store heading level (H1-H6) in plugin data
- [ ] Validate hierarchy:
  - Exactly one H1 per page
  - No skipped levels (H2 → H4)
  - Sequential order
- [ ] Auto-suggest levels based on structure

#### Day 2-3: Headings Panel UI

- [ ] Create HeadingsPanel component
- [ ] List all text nodes on page
- [ ] Dropdown to assign heading level (H1-H6, None)
- [ ] Document outline view (hierarchical tree)
- [ ] Validation warnings display
- [ ] Quick fix suggestions

#### Day 3-4: Visual Annotations

- [ ] Create color-coded heading badges:
  - H1: Purple
  - H2: Blue
  - H3: Teal
  - H4: Green
  - H5: Yellow
  - H6: Orange
- [ ] Badge positioning (top-left)
- [ ] Update on level change

#### Day 4-5: Integration, Testing & Documentation

- [ ] Add Headings card to MainView
- [ ] Message handler setup
- [ ] Test hierarchy validation
- [ ] Test with complex documents
- [ ] Create README.md with HTML5 heading structure guidelines

### Deliverables

- ✅ Working Headings Manager
- ✅ Hierarchy validation
- ✅ Color-coded heading badges
- ✅ Document outline view
- ✅ Comprehensive tool documentation

### Git Commit Template

```
feat(headings): implement headings annotation manager

- Detect potential headings (font size, weight, position)
- Create HeadingsPanel with level assignment dropdown
- Store heading levels (H1-H6) in plugin data
- Validate heading hierarchy:
  - One H1 per page
  - No skipped levels
  - Sequential order
- Generate validation warnings
- Auto-suggest levels based on document structure
- Create color-coded heading badges (H1=purple, H2=blue, etc.)
- Document outline view (hierarchical tree)

WCAG Guidelines:
- WCAG 1.3.1 Info and Relationships
- HTML5 heading structure
- Heading hierarchy best practices

Reference: https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html
```

---

## Phase 9: Landmarks Manager

**Duration**: 1 week
**Goal**: Define page landmarks (header, nav, main, footer, etc.)

**📢 Start Protocol**: Ask user "Are you ready to start Phase 9: Landmarks Manager?"

### Infrastructure from Previous Phases

**Reuse**:
- ✅ AnnotationService (for landmark badges)
- ✅ All UI components
- ✅ StorageService, SelectionService

### New Infrastructure Needed

**Add in this phase**:
- Landmark validation utilities

### Implementation Tasks

#### Day 1-2: Landmarks Logic

- [ ] Create `src/features/annotation/landmarks/` folder
- [ ] Identify potential landmarks (frames, sections)
- [ ] Define landmark roles (header, nav, main, aside, footer, form, section)
- [ ] Store landmark role in plugin data
- [ ] Validate landmark structure:
  - Exactly one <main> per page
  - Label multiple <nav> landmarks
  - No overlapping landmarks
- [ ] Auto-suggest roles based on frame names and position

#### Day 2-3: Landmarks Panel UI

- [ ] Create LandmarksPanel component
- [ ] List all frames on page
- [ ] Dropdown to assign landmark role
- [ ] Optional label input (for multiple <nav>)
- [ ] Validation warnings display
- [ ] Quick access to landmark reference guide

#### Day 3-4: Visual Annotations

- [ ] Create role-specific badges with icons:
  - Different colors per role
  - Role label (e.g., "<nav>", "<main>")
- [ ] Badge positioning (top-left of frame)
- [ ] Handle nested landmarks

#### Day 4-5: Integration, Testing & Documentation

- [ ] Add Landmarks card to MainView
- [ ] Message handler setup
- [ ] Test validation rules
- [ ] Test auto-suggestions
- [ ] Create README.md with ARIA landmarks guidelines

### Deliverables

- ✅ Working Landmarks Manager
- ✅ Validation system
- ✅ Role-specific badges
- ✅ Auto-suggestions
- ✅ Comprehensive tool documentation

### Git Commit Template

```
feat(landmarks): implement landmarks annotation manager

- Identify potential landmark containers (frames, sections)
- Create LandmarksPanel with role assignment dropdown
- Store landmark roles in plugin data (header, nav, main, aside, footer, form, section)
- Validate landmark structure:
  - One <main> per page
  - Label multiple <nav> landmarks
  - No overlapping landmarks
- Auto-suggest roles based on frame names and position
- Create role-specific badges with icons
- Optional label input for accessibility

ARIA Guidelines:
- ARIA landmark roles
- Landmark best practices
- Required landmarks per page

Reference: https://www.w3.org/TR/wai-aria-practices-1.1/examples/landmarks/
```

---

## Phase 10: Accessibility Notes

**Duration**: 1 week
**Goal**: Platform-specific accessibility annotations and code generation

**📢 Start Protocol**: Ask user "Are you ready to start Phase 10: Accessibility Notes?"

### Infrastructure from Previous Phases

**Reuse**:
- ✅ All UI components
- ✅ StorageService, SelectionService

### New Infrastructure Needed

**Add in this phase**:
- Platform templates (Web, iOS, Android, Windows, React Native, TV)
- Code generation utilities (HTML, Swift, Kotlin, XAML, JSX)

### Implementation Tasks

#### Day 1-2: Platform Templates

- [ ] Create `src/features/annotation/notes/` folder
- [ ] Define platform-specific templates:
  - Web (ARIA attributes)
  - iOS (VoiceOver properties)
  - Android (TalkBack properties)
  - Windows (Narrator properties)
  - React Native (accessibility props)
  - TV platforms
- [ ] Store notes in plugin data

#### Day 2-3: Code Generation

- [ ] Implement code snippet generation for each platform:
  - HTML with ARIA attributes
  - Swift (iOS)
  - Kotlin (Android)
  - XAML (Windows)
  - React Native JSX
- [ ] Syntax highlighting (optional)
- [ ] Copy to clipboard functionality

#### Day 3-4: Notes Panel UI

- [ ] Create NotesPanel component
- [ ] Platform selector dropdown
- [ ] Template-based form fields (dynamic based on platform)
- [ ] Rich text editor for general notes
- [ ] Code preview panel with syntax highlighting
- [ ] Copy code button

#### Day 4-5: Integration, Testing & Documentation

- [ ] Add Accessibility Notes card to MainView
- [ ] Message handler setup
- [ ] Test all platform templates
- [ ] Verify code generation accuracy
- [ ] Create README.md with platform-specific guidelines

### Deliverables

- ✅ Working Accessibility Notes system
- ✅ 6 platform templates
- ✅ Code snippet generation
- ✅ Code preview with copy functionality
- ✅ Comprehensive tool documentation

### Git Commit Template

```
feat(notes): implement accessibility notes and code generation

- Create platform-specific annotation templates:
  - Web (ARIA attributes)
  - iOS (VoiceOver properties)
  - Android (TalkBack properties)
  - Windows (Narrator properties)
  - React Native (accessibility props)
  - TV platforms
- Store accessibility notes in plugin data
- Generate platform-specific code snippets:
  - HTML with ARIA
  - Swift (iOS)
  - Kotlin (Android)
  - XAML (Windows)
  - React Native JSX
- Create NotesPanel with platform selector
- Code preview panel with syntax highlighting
- Copy to clipboard functionality

Platform References:
- ARIA Authoring Practices: https://www.w3.org/TR/wai-aria-practices-1.1/
- iOS Accessibility: https://developer.apple.com/accessibility/
- Android Accessibility: https://developer.android.com/guide/topics/ui/accessibility
```

---

## Phase 11: Integration & Polish

**Duration**: 2 weeks
**Goal**: System integration, performance optimization, final polish

**📢 Start Protocol**: Ask user "Are you ready to start Phase 11: Integration & Polish?"

### Rationale

All 10 tools are now complete. This phase ensures they work well together and the plugin is production-ready.

### Infrastructure from Previous Phases

**Reuse**:
- ✅ All 10 tools
- ✅ All infrastructure

### New Infrastructure Needed

**Add in this phase**:
- **ExportService** (`src/services/export.service.ts`) ← NEW
  - Export all data to JSON
  - Export all data to CSV
  - Export all data to Markdown
  - Generate comprehensive reports

### Implementation Tasks

#### Week 1: Integration Testing

##### Day 1-2: Cross-Tool Testing

- [ ] Test all tools working together
- [ ] Verify data isolation (tools don't interfere)
- [ ] Test navigation between tools
- [ ] Test with large files (1000+ nodes)
- [ ] Test with complex nested structures
- [ ] Identify and fix integration bugs

##### Day 2-3: ExportService

- [ ] Create `src/services/export.service.ts`
- [ ] Implement JSON export:
  - All tool data
  - All annotations
  - Structured for developers
- [ ] Implement CSV export:
  - Flat structure for spreadsheets
  - Issue tracking format
- [ ] Implement Markdown export:
  - Human-readable report
  - Sections for each tool
  - Code examples
  - Recommendations

##### Day 3-4: Export Integration

- [ ] Add "Export All" button to main view
- [ ] Format selection (JSON/CSV/Markdown)
- [ ] Preview export before download
- [ ] Test exports with real data

##### Day 4-5: Performance Optimization

- [ ] Profile all tools with large files
- [ ] Identify bottlenecks
- [ ] Optimize:
  - Pagination for long lists (50 items/page)
  - Virtual scrolling for results
  - Debouncing/throttling
  - Caching frequently accessed data
  - Lazy loading panels
- [ ] Memory leak testing
- [ ] Verify no UI lag

#### Week 2: Polish & Documentation

##### Day 6-7: UI Polish

- [ ] Consistent spacing and alignment
- [ ] Smooth transitions and animations
- [ ] Loading states for all async operations
- [ ] Error states with user-friendly messages
- [ ] Empty states for all lists
- [ ] Tooltips and help text
- [ ] Accessibility of the plugin itself:
  - Keyboard navigation
  - Focus management
  - Screen reader support (ARIA labels)

##### Day 7-8: Bug Fixes

- [ ] Fix all known bugs
- [ ] Handle edge cases:
  - Empty selections
  - Nested components
  - Hidden/locked layers
  - Complex layer structures
  - Very large/small nodes
- [ ] Error handling improvements
- [ ] Graceful degradation

##### Day 8-9: Documentation

- [ ] Update all README files
- [ ] Create user guide (how to use each tool)
- [ ] Update architecture documentation
- [ ] Update data models documentation
- [ ] Create changelog
- [ ] Screenshots for documentation

##### Day 9-10: Final Testing

- [ ] Complete system test (all tools)
- [ ] Cross-browser testing (Figma Desktop, Figma Browser)
- [ ] Theme switching verification
- [ ] Export functionality verification
- [ ] User acceptance testing (if possible)
- [ ] Final bug fixes

### Deliverables

- ✅ All 10 tools working together seamlessly
- ✅ ExportService with JSON/CSV/Markdown export
- ✅ Performance optimized
- ✅ All bugs fixed
- ✅ UI polished and consistent
- ✅ Comprehensive documentation
- ✅ Production-ready plugin

### Testing Checklist

- [ ] All tools load without errors
- [ ] All tools work independently
- [ ] All tools work together without conflicts
- [ ] Navigation works smoothly
- [ ] Export includes all tool data correctly
- [ ] Performance benchmarks met (<2s plugin load, <5s scans)
- [ ] No memory leaks
- [ ] No UI lag
- [ ] Theme switching works
- [ ] Keyboard navigation works
- [ ] No critical bugs

### Git Commit Template

```
feat(integration): system integration, performance optimization, and polish

- Add ExportService for comprehensive data export
- Export all tool data to JSON/CSV/Markdown formats
- Generate human-readable accessibility report
- Performance optimization:
  - Pagination for long lists (50 items/page)
  - Virtual scrolling for results
  - Debounced event handlers
  - Cached frequently accessed data
  - Lazy loaded panels
- UI polish:
  - Consistent spacing and alignment
  - Loading states for all async operations
  - Error states with user-friendly messages
  - Empty states for lists
  - Tooltips and help text
- Accessibility improvements:
  - Keyboard navigation
  - Focus management
  - Screen reader support (ARIA labels)
- Bug fixes:
  - Handle edge cases (empty selections, nested components, hidden layers)
  - Improved error handling
  - Graceful degradation
- Documentation updates:
  - User guide
  - Updated architecture docs
  - Changelog

Performance Benchmarks Achieved:
- Plugin load: <2 seconds
- Page scan (1000 nodes): <5 seconds
- No UI lag during operations
- No memory leaks

System is production-ready.
```

---

## Phase 12: Auto Scan & Fix

**Duration**: 1 week
**Goal**: Implement one-click comprehensive accessibility scan

**📢 Start Protocol**: Ask user "Are you ready to start Phase 12: Auto Scan & Fix?"

**Status**: ⏸️ DEFERRED - Final Phase (after Phase 11)

### Rationale

Auto Scan orchestrates all testing tools into a unified one-click experience. Deferred until all individual tools are complete and working together.

### Infrastructure from Previous Phases

**Reuse**:
- ✅ All testing tools (Contrast, Touch Targets, Typography)
- ✅ All UI components
- ✅ All services (Storage, Selection, Event)

### New Infrastructure Needed

**Add in this phase**:
- Auto Scan orchestration system
- Unified results dashboard
- Aggregated issue tracking

### Implementation Tasks

#### Day 1-2: Auto Scan Orchestration

- [ ] Create `src/features/testing/auto-scan/` folder
- [ ] Implement AutoScan class that orchestrates existing checkers:
  1. Run Contrast Checker on all text nodes
  2. Run Touch Targets Checker on interactive nodes
  3. Run Typography Checker on all text nodes
- [ ] Aggregate results from all checkers
- [ ] Calculate issue counts by severity (critical, high, medium, low)
- [ ] Generate comprehensive summary report

#### Day 2-3: Results Dashboard

- [ ] Create AutoScanPanel component
- [ ] Issue summary cards:
  - Total issues count
  - Critical/High/Medium/Low breakdown
  - Issues by category (contrast, touch, typography)
- [ ] Unified issue list with filtering:
  - Filter by tool type
  - Filter by severity
  - Search by node name
- [ ] Quick actions per issue:
  - Navigate to node
  - Show on canvas
  - Fix (if auto-fixable)

#### Day 3-4: Canvas Visualization

- [ ] Unified annotation system for all issue types
- [ ] Color-coded by severity:
  - Red: Critical (WCAG fails)
  - Orange: High (accessibility barriers)
  - Yellow: Medium (improvements needed)
  - Blue: Low (best practice suggestions)
- [ ] Issue count badges per node
- [ ] Toggle annotations on/off
- [ ] Filter visible annotations by type

#### Day 4-5: "Auto Scan & Fix" Button

- [ ] Add prominent "Auto Scan & Fix" button to MainView header
- [ ] Implement one-click scan:
  - Show progress indicator
  - Run all testing tools
  - Display results dashboard
- [ ] Implement "Fix All" functionality (for auto-fixable issues)
- [ ] Cancel scan capability

#### Day 5-6: Integration, Testing & Documentation

- [ ] Message handler setup
- [ ] Test with large files (1000+ nodes)
- [ ] Verify all checkers are called correctly
- [ ] Performance optimization:
  - Progress indicators
  - Cancelable scans
  - Parallel execution where possible
- [ ] Error handling for individual check failures
- [ ] Create README.md documenting Auto Scan system

### Deliverables

- ✅ One-click "Auto Scan & Fix" button
- ✅ Comprehensive results dashboard
- ✅ Unified visual annotations
- ✅ Auto-fix capabilities
- ✅ Comprehensive tool documentation

### Testing Checklist

- [ ] Auto Scan runs all testing tools correctly
- [ ] Results are aggregated accurately
- [ ] Issue counts are correct
- [ ] Severity levels are accurate
- [ ] Filtering works (by type, by severity)
- [ ] Quick actions work (navigate, fix)
- [ ] Auto-fix functionality works safely
- [ ] Performance is acceptable (<5s for 1000 nodes)
- [ ] Cancelable during execution
- [ ] Error handling for individual tool failures

### Git Commit Template

```
feat(auto-scan): implement one-click auto scan & fix

- Create AutoScan orchestration system
- Orchestrate all testing tools (Contrast, Touch Targets, Typography)
- Aggregate results from all checkers
- Calculate issue counts by severity (critical, high, medium, low)
- Create AutoScanPanel with unified results dashboard
- Issue summary cards (total, by severity, by category)
- Unified issue list with filtering and search
- Quick actions (navigate to node, fix if auto-fixable)
- Unified canvas annotations (color-coded by severity)
- Add prominent "Auto Scan & Fix" button to main view
- Implement "Fix All" functionality
- Progress indicators and cancelable scans
- Performance optimized (<5s for 1000 nodes)

Features:
- One-click comprehensive accessibility scan
- All testing tools in one operation
- Prioritized issue list by severity
- Visual issue indicators on canvas
- Auto-fix for fixable issues

Final feature completing Accessibility Genie v1.0.
```

---

## Timeline Summary

| Phase | Tool/Feature | Duration | Cumulative |
|-------|-------------|----------|------------|
| **Phase 0** | Project Setup (Verification) | Already complete | - |
| **Phase 1** | Contrast Checker + Initial Infrastructure | 1-2 weeks | 1-2 weeks |
| **Phase 2** | Touch Targets Checker | 1 week | 2-3 weeks |
| **Phase 3** | Typography Checker | 1 week | 3-4 weeks |
| **Phase 4** | Vision Simulator | 1-2 weeks | 4-6 weeks |
| **Phase 5** | Automatic Monitoring | 1 week | 5-7 weeks |
| **Phase 6** | Alt-Text Manager | 1 week | 6-8 weeks |
| **Phase 7** | Focus Order Manager | 1 week | 7-9 weeks |
| **Phase 8** | Headings Manager | 1 week | 8-10 weeks |
| **Phase 9** | Landmarks Manager | 1 week | 9-11 weeks |
| **Phase 10** | Accessibility Notes | 1 week | 10-12 weeks |
| **Phase 11** | Integration & Polish | 2 weeks | 12-14 weeks |
| **Phase 12** | Auto Scan & Fix (Deferred) | 1 week | 13-15 weeks |
| **Total** | **All 10 tools + Auto Scan** | **13-15 weeks** | **~3.5 months** |

### Milestone Breakdown

- **End of Phase 1**: First working tool (Contrast Checker) + reusable infrastructure
- **End of Phase 5**: All 5 testing tools complete
- **End of Phase 10**: All 10 tools complete (5 testing + 5 annotation)
- **End of Phase 11**: Production-ready plugin
- **End of Phase 12**: Complete with Auto Scan feature

---

## Git Commit Strategy

### Conventional Commits Format

Use conventional commits format for all git commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring (no feature change)
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Build process, dependencies, etc.

**Scopes**:
- Tool names: `contrast`, `touch-targets`, `typography`, `vision-simulator`, `monitoring`, `alt-text`, `focus-order`, `headings`, `landmarks`, `notes`
- Infrastructure: `ui`, `services`, `utils`, `export`, `storage`, `annotation`
- General: `integration`, `polish`, `setup`

### ⛔ Critical Rule: No AI Mentions

**NEVER mention Claude, AI, AI-assisted development, or any AI tools in commit messages or descriptions.**

### Example Commits

**Good Examples**:

```
feat(contrast): implement contrast checker tool

- Add WCAG 2.1 contrast ratio validation for text nodes
- Create ContrastPanel with AA/AAA level filtering
- Implement color utilities (luminance, contrast ratio calculations)
- Add comprehensive tool documentation

WCAG Reference: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
```

```
feat(ui): add reusable UI component library

- Create Button component with 5 variants
- Create Card component for tool navigation
- Create Badge component for status indicators
- Create List component for scrollable results
- All components follow design system
```

```
fix(contrast): handle gradient backgrounds correctly

- Use average color for simple gradients
- Fallback to solid color for complex gradients
- Add warning when gradient detected
```

**Bad Examples (DON'T DO THIS)**:

```
feat(contrast): add contrast checker

- Built with Claude's help
```

```
feat(ui): create components

- AI-generated UI components
- Used Claude Code for implementation
```

### Commit Frequency

- **One commit per phase completion**: After each tool is fully implemented, tested, and documented
- **Additional commits for bug fixes**: If critical bugs found, separate fix commits
- **Final commit for integration**: After Phase 11 (Integration & Polish)

---

## Tool Module Template

Every tool follows this structure:

```
src/features/[category]/[tool-name]/
├── README.md                           ⭐ REQUIRED: Comprehensive tool documentation
│   ├── Tool Overview
│   ├── How It Works
│   ├── Data Flow Diagram
│   ├── User Interaction Flow
│   ├── Technical Implementation
│   ├── Scientific/Technical References (with URLs)
│   ├── External Resources & Dependencies (with URLs)
│   ├── Testing Approach
│   ├── Known Limitations
│   └── Future Enhancements
│
├── [tool-name]-[type].ts              # Core logic (e.g., contrast-checker.ts)
├── [tool-name].types.ts               # TypeScript types
├── [tool-name].constants.ts           # Constants
│
├── components/                         # Tool-specific components
│   ├── [Tool]Panel.tsx                # Main panel (e.g., ContrastPanel.tsx)
│   ├── [Tool]Panel.module.css         # Styles
│   └── [Other components as needed]
│
├── utils/                              # Tool-specific utilities (if needed)
│   └── [tool-specific].utils.ts
│
└── __tests__/                          # Tool-specific tests
    └── [tool-name].test.ts
```

**Example**: Contrast Checker
```
src/features/testing/contrast/
├── README.md                           ⭐ Comprehensive documentation
├── contrast-checker.ts                 Core logic
├── contrast.types.ts                   TypeScript types
├── contrast.constants.ts               WCAG thresholds
└── components/
    ├── ContrastPanel.tsx               Main UI panel
    └── ContrastPanel.module.css        Styles
```

---

## Success Metrics

### Phase 1 (Contrast Checker)
- [ ] Contrast Checker works on 1000+ node files in <2s
- [ ] 95%+ accuracy on WCAG checks (verified against WebAIM)
- [ ] All reusable components documented
- [ ] Comprehensive tool documentation (README.md)

### Phase 5 (All Testing Tools)
- [ ] All 5 testing tools functional independently
- [ ] Each tool works on 1000+ node files efficiently
- [ ] 90%+ accuracy on WCAG checks
- [ ] All tools documented

### Phase 10 (All Tools)
- [ ] All 10 tools functional (5 testing + 5 annotation)
- [ ] Data persists correctly in Figma files
- [ ] Visual annotations render without performance issues
- [ ] All tools documented

### Phase 11 (Production)
- [ ] Zero critical bugs
- [ ] Performance benchmarks met:
  - Plugin loads in <2s
  - Scans complete in <5s (1000 nodes, all 3 checks)
  - UI remains responsive during operations
- [ ] Comprehensive export works
- [ ] All documentation complete
- [ ] Ready for Figma Community publication

### Phase 12 (Complete)
- [ ] Auto Scan completes in <5s (1000 nodes, all 3 checks)
- [ ] All 10 features work together without conflicts
- [ ] One-click accessibility scan functional
- [ ] Plugin fully production-ready

---

## Next Steps

1. **Verify Phase 0**: Confirm project setup is complete
2. **Start Phase 1**: Begin Contrast Checker implementation
3. **Follow Protocols**: Always ask before starting each phase (Protocol 1-4)
4. **Document Thoroughly**:
   - Create tool README in `src/features/[category]/[tool-name]/README.md` (Protocol 3)
   - Create phase implementation doc in `documentation/implementation/phase-[X]-[tool-name].md` (Protocol 4)
5. **Commit Properly**: Use conventional commits with no AI mentions (Protocol 2)
6. **Test Continuously**: Each tool tested independently before moving on
7. **Iterate**: Gather feedback and improve

---

**Document Status**: ✅ Complete
**Version**: 2.1
**Last Review**: 2025-11-23
**Next Review**: After Phase 3 completion
