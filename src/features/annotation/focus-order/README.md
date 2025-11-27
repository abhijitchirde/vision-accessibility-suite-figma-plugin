# Focus Order Manager

## Tool Overview

The Focus Order Manager helps designers define keyboard navigation order for interactive elements in their designs. This tool addresses WCAG 2.4.3 Focus Order by allowing designers to explicitly specify the sequence in which elements should receive keyboard focus.

**Addresses**: WCAG 2.1 Success Criterion 2.4.3 (Focus Order)

**Why It's Needed**:
- Keyboard-only users navigate through interactive elements using the Tab key
- Visual layout doesn't always match logical navigation order
- Proper focus order ensures keyboard users can navigate efficiently
- Helps communicate navigation intent to developers during handoff

## How It Works

1. User selects an interactive element in Figma (button, input, link, etc.)
2. User clicks "Add item" in the Focus Order panel
3. Plugin adds the element to the focus order list and creates a numbered badge on canvas
4. User can reorder items via drag-and-drop to adjust focus sequence
5. Focus order data is stored in plugin data (persists with Figma file)
6. Numbered badges on canvas visually indicate tab order

### Focus Order Workflow

```
User selects interactive element
    ↓
User clicks "Add item"
    ↓
Plugin adds element to focus order list
    ↓
Plugin creates numbered circular badge on canvas
    ↓
User can drag-and-drop to reorder items
    ↓
Plugin updates badge numbers on reorder
    ↓
Developer can reference focus order during implementation
```

## Data Flow Diagram

```
User clicks "Add item"
    ↓
UI sends ADD_FOCUS_ORDER_ITEM message
    ↓
Plugin code: FocusOrderManager.addSelectedToFocusOrder()
    ↓
Check if node already in focus order
    ↓
Create FocusOrderItem with order index
    ↓
Store in plugin data (page-specific key)
    ↓
Create circular badge with number on canvas
    ↓
Return updated items list to UI
    ↓
UI displays updated focus order list
```

### Reorder Flow

```
User drags item to new position
    ↓
UI updates local order
    ↓
UI sends REORDER_FOCUS_ITEMS message with new order
    ↓
Plugin code: FocusOrderManager.reorderFocusItems()
    ↓
Renumber all items (1, 2, 3...)
    ↓
Delete old annotations
    ↓
Create new annotations with updated numbers
    ↓
Save to plugin data
    ↓
UI displays reordered list
```

## User Interaction Flow

1. User opens plugin → sees main tool list
2. User clicks "Focus Order" card → FocusOrderPanel opens
3. **Empty state**: "Select your first focusable element and click 'Add item'"
4. User selects an interactive element in Figma canvas
5. User clicks "Add item" button
6. **List view appears** with:
   - Circular purple badge with number (1, 2, 3...)
   - Element name
   - Delete button (trash icon)
7. **Canvas shows** numbered badge at top-left of element
8. User can:
   - Click element name → Figma zooms to that element
   - Drag item up/down → Reorders focus sequence
   - Click delete → Removes from focus order
   - Click eye icon → Toggle visibility of all badges
9. User continues adding elements to build complete focus order

## Technical Implementation

### Storage Strategy

Focus order data is stored per-page using plugin data:
- **Storage key**: `focusOrder_{pageId}`
- **Format**: `FocusOrderItem[]` (JSON serialized)
- **Persists**: With Figma file (no external database needed)

### Annotation System

**Circular Numbered Badges**:
- Size: 32×32px circular frame
- Background: Purple (#8B5CF6)
- Text: White, bold, 16px
- Position: Top-left corner of target element (-16px offset to center badge)
- Container: `__A11y Annotations__` frame on canvas

**Badge Creation Process**:
```typescript
1. Create 32×32px frame with circular corner radius
2. Apply purple background fill
3. Create text node with order number
4. Position at target node's bounds + offset
5. Store targetNodeId in plugin data
6. Add to annotations container
```

### Drag-and-Drop Implementation

Uses `@dnd-kit` library for accessibility-friendly drag-and-drop:
- **Sensors**: PointerSensor, KeyboardSensor
- **Strategy**: verticalListSortingStrategy
- **Collision**: closestCenter
- **Keyboard support**: Arrow keys + Space/Enter to grab

### Key Algorithms

**1. Add Item to Focus Order**
```typescript
async addSelectedToFocusOrder() {
  // Get current selection
  const selection = figma.currentPage.selection;

  // Get existing focus order
  const existingItems = await this.getFocusOrder();

  // Calculate next order number
  const nextOrder = existingItems.length + 1;

  // Create FocusOrderItem
  const item = {
    nodeId: node.id,
    nodeName: node.name,
    order: nextOrder,
    lastModified: new Date().toISOString()
  };

  // Save to plugin data
  await this.storage.setPluginData(
    `focusOrder_${currentPage.id}`,
    [...existingItems, item]
  );

  // Create annotation badge
  await this.createCircularBadge(node, nextOrder);
}
```

**2. Reorder Items (After Drag-and-Drop)**
```typescript
async reorderFocusItems(items: FocusOrderItem[]) {
  // Renumber based on new array order
  const reorderedItems = items.map((item, index) => ({
    ...item,
    order: index + 1,
    lastModified: new Date().toISOString()
  }));

  // Save to plugin data
  await this.storage.setPluginData(
    `focusOrder_${currentPage.id}`,
    reorderedItems
  );

  // Delete all old annotations
  for (const item of reorderedItems) {
    if (item.annotationId) {
      await this.deleteAnnotation(item.annotationId);
    }
  }

  // Create new annotations with updated numbers
  for (const item of reorderedItems) {
    const node = await figma.getNodeByIdAsync(item.nodeId);
    if (node) {
      item.annotationId = await this.createCircularBadge(node, item.order);
    }
  }

  // Save again with new annotation IDs
  await this.storage.setPluginData(
    `focusOrder_${currentPage.id}`,
    reorderedItems
  );
}
```

**3. Create Circular Badge**
```typescript
async createCircularBadge(targetNode: SceneNode, number: number) {
  // Create circular frame (32×32px, corner radius 16)
  const badge = figma.createFrame();
  badge.resize(32, 32);
  badge.cornerRadius = 16;
  badge.fills = [{ type: 'SOLID', color: { r: 0.54, g: 0.36, b: 0.96 } }];

  // Center alignment
  badge.layoutMode = 'HORIZONTAL';
  badge.primaryAxisAlignItems = 'CENTER';
  badge.counterAxisAlignItems = 'CENTER';

  // Create text with number
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
  const text = figma.createText();
  text.fontName = { family: 'Inter', style: 'Bold' };
  text.fontSize = 16;
  text.characters = number.toString();
  text.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];

  badge.appendChild(text);

  // Position at top-left of target node
  const bounds = targetNode.absoluteBoundingBox;
  badge.x = bounds.x - 16;  // Center badge on corner
  badge.y = bounds.y - 16;

  // Add to annotations container
  const container = this.getAnnotationsContainer();
  container.appendChild(badge);

  // Store metadata
  badge.setPluginData('targetNodeId', targetNode.id);
  badge.setPluginData('annotationType', 'focus-order');
  badge.setPluginData('focusOrder', number.toString());

  return badge.id;
}
```

**4. Remove Item from Focus Order**
```typescript
async removeFocusOrderItem(nodeId: string) {
  const existingItems = await this.getFocusOrder();

  // Find and remove item
  const updatedItems = existingItems.filter(item => item.nodeId !== nodeId);

  // Renumber remaining items
  updatedItems.forEach((item, index) => {
    item.order = index + 1;
  });

  // Save to plugin data
  await this.storage.setPluginData(
    `focusOrder_${currentPage.id}`,
    updatedItems
  );

  // Delete annotation
  const removedItem = existingItems.find(item => item.nodeId === nodeId);
  if (removedItem?.annotationId) {
    await this.deleteAnnotation(removedItem.annotationId);
  }

  // Update all remaining annotations with new numbers
  await this.updateAllAnnotations(updatedItems);
}
```

## WCAG Compliance

### WCAG 2.1 Success Criterion 2.4.3: Focus Order

**Level A** (Required)

**Requirement**: If a Web page can be navigated sequentially and the navigation sequences affect meaning or operation, focusable components receive focus in an order that preserves meaning and operability.

**How Focus Order Manager Addresses This**:

1. **Explicit Order Definition**: Designers can specify exact tab order rather than relying on DOM/source order
2. **Visual Feedback**: Numbered badges make focus order visible during design phase
3. **Developer Handoff**: Clear communication of intended navigation flow
4. **Reordering Capability**: Easy to adjust order when meaning/operation requires it

**When Focus Order Matters**:
- Forms with logical data entry sequence
- Multi-step workflows (wizards)
- Navigation menus with submenus
- Modal dialogs with multiple actions
- Complex interactive widgets (tabs, accordions, carousels)

## Scientific/Technical References

- **WCAG 2.1 Focus Order**: https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html
- **WCAG 2.1 Technique G59**: Placing the interactive elements in an order that follows sequences and relationships within the content
- **WAI-ARIA Authoring Practices**: https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/
- **Keyboard Navigation Best Practices**: https://webaim.org/articles/keyboard/
- **Focus Management Guide**: https://www.w3.org/TR/wai-aria-practices-1.1/#kbd_focus_management

## External Resources & Dependencies

### npm Packages

1. **@dnd-kit/core** (v6.x)
   - URL: https://www.npmjs.com/package/@dnd-kit/core
   - Purpose: Core drag-and-drop functionality
   - Features: Accessibility-friendly, keyboard support

2. **@dnd-kit/sortable** (v8.x)
   - URL: https://www.npmjs.com/package/@dnd-kit/sortable
   - Purpose: Sortable list functionality
   - Features: Vertical list sorting strategy

3. **@dnd-kit/utilities** (v3.x)
   - URL: https://www.npmjs.com/package/@dnd-kit/utilities
   - Purpose: CSS transform utilities

### Open Source References

- **dnd kit Documentation**: https://docs.dndkit.com/
- **Figma Plugin API - Selection**: https://www.figma.com/plugin-docs/api/properties/figma-currentsection/
- **Figma Plugin API - Plugin Data**: https://www.figma.com/plugin-docs/api/properties/nodes-setplugindata/

## Testing Approach

### Test Cases

1. **Add Single Item**
   - Select interactive element → Click "Add item"
   - Expected: Item appears in list with order "1"
   - Expected: Circular purple badge with "1" appears on canvas

2. **Add Multiple Items**
   - Select and add 5 elements sequentially
   - Expected: Items numbered 1-5 in list
   - Expected: 5 badges on canvas with correct numbers

3. **Reorder via Drag-and-Drop**
   - Drag item 3 to position 1
   - Expected: New order becomes 3, 1, 2, 4, 5...
   - Expected: Badge numbers update to match new order

4. **Remove Item**
   - Click delete on item 2
   - Expected: Item removed from list
   - Expected: Remaining items renumbered (1, 2, 3...)
   - Expected: Badges update with new numbers

5. **Toggle Annotations Visibility**
   - Click eye icon to hide
   - Expected: All badges hidden
   - Click eye icon to show
   - Expected: All badges visible again

6. **Zoom to Item**
   - Click element name in list
   - Expected: Figma zooms and selects that element

7. **Persist Across Sessions**
   - Add focus order → Close plugin → Reopen plugin
   - Expected: Focus order data still present

8. **Handle Deleted Nodes**
   - Add item to focus order → Delete node from canvas
   - Expected: Item removed from focus order on next load

### Manual Testing Checklist

- [ ] Add single item to empty focus order
- [ ] Add multiple items (5+) to focus order
- [ ] Drag-and-drop to reorder items
- [ ] Verify badge numbers update after reorder
- [ ] Remove item from middle of list (verify renumbering)
- [ ] Click element name to zoom to canvas element
- [ ] Toggle annotations visibility (eye icon)
- [ ] Close and reopen plugin (verify persistence)
- [ ] Delete node from canvas (verify cleanup)
- [ ] Test with nested components
- [ ] Test with multiple pages (verify page-specific storage)
- [ ] Test keyboard navigation with drag-and-drop

## Known Limitations

1. **No Auto-Detection**: Plugin doesn't automatically detect focusable elements - user must manually add each element
2. **No Tab Index Support**: Doesn't generate tabindex values for developers
3. **Visual Position Only**: Badge positioning based on current visual layout, not responsive to node movements
4. **Single Selection**: Can only add one element at a time (no multi-select add)
5. **No Validation**: Doesn't validate if selected element is actually interactive/focusable
6. **No Export**: Focus order data not included in export functionality yet

## Future Enhancements

1. **Auto-Detect Focusable Elements**: Automatically identify buttons, inputs, and interactive components
2. **Spatial Order Detection**: Suggest order based on top-to-bottom, left-to-right layout
3. **Tabindex Generation**: Export tabindex values for developer implementation
4. **Arrow Connectors**: Draw arrows showing focus flow between elements
5. **Preview Mode**: Simulate keyboard navigation through focus order
6. **Multi-Select Add**: Add multiple selected elements at once
7. **Group Support**: Define focus order for component groups
8. **Export Integration**: Include focus order in JSON/CSV export
9. **Developer Code Snippets**: Generate HTML with tabindex or React focus management code
10. **Validation Warnings**: Warn if focus order skips regions or creates unusual patterns
