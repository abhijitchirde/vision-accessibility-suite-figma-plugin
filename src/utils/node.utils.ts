import { RGB } from '../types/common.types';

/**
 * Type guard to check if node is a text node
 */
export function isTextNode(node: SceneNode): node is TextNode {
  return node.type === 'TEXT';
}

/**
 * Extract fill color from a node
 * Returns the first solid fill color, or null if none exists
 */
export function getNodeFills(node: SceneNode): RGB | null {
  if (!('fills' in node)) {
    // console.log('getNodeFills: No fills property');
    return null;
  }

  const fills = node.fills;
  // console.log('getNodeFills: fills =', fills, 'isArray:', Array.isArray(fills));

  // Check if fills is an array (not figma.mixed symbol)
  if (!Array.isArray(fills)) {
    // console.log('getNodeFills: fills is not an array');
    return null;
  }
  if (fills.length === 0) {
    // console.log('getNodeFills: fills array is empty');
    return null;
  }

  // console.log('getNodeFills: fills array has', fills.length, 'items');

  // Find first solid paint
  const solidFill = fills.find((fill) => fill.type === 'SOLID' && fill.visible !== false);
  // console.log('getNodeFills: solidFill =', solidFill);

  if (solidFill && solidFill.type === 'SOLID') {
    const color = {
      r: solidFill.color.r,
      g: solidFill.color.g,
      b: solidFill.color.b,
    };
    // console.log('getNodeFills: returning color', color);
    return color;
  }

  // console.log('getNodeFills: no solid fill found');
  return null;
}

/**
 * Extract stroke color from a node
 * Returns the first solid stroke color, or null if none exists
 */
export function getNodeStrokes(node: SceneNode): RGB | null {
  if (!('strokes' in node)) return null;

  const strokes = node.strokes;

  // Check if strokes is an array (not figma.mixed symbol)
  if (!Array.isArray(strokes)) return null;
  if (strokes.length === 0) return null;

  // Find first visible solid stroke
  const solidStroke = strokes.find((stroke) => stroke.type === 'SOLID' && stroke.visible !== false);

  if (solidStroke && solidStroke.type === 'SOLID') {
    return {
      r: solidStroke.color.r,
      g: solidStroke.color.g,
      b: solidStroke.color.b,
    };
  }

  return null;
}

/**
 * Get foreground color from any node (fill first, then stroke)
 */
export function getForegroundColor(node: SceneNode): RGB | null {
  // Try fill first
  const fill = getNodeFills(node);
  if (fill) return fill;

  // Fallback to stroke
  return getNodeStrokes(node);
}

/**
 * Get text color from a text node
 */
export function getTextColor(node: TextNode): RGB | null {
  return getNodeFills(node);
}

/**
 * Get background color from a node or its parent
 * Walks up the tree to find the first background color
 * Always looks at parent nodes, never uses the node's own color as background
 */
export function getBackgroundColor(node: SceneNode): RGB | null {
  // Start from the parent (we want background BEHIND the node, not the node itself)
  let currentNode = node.parent;

  while (currentNode && 'type' in currentNode) {
    // Check if current ancestor is a PageNode
    if (currentNode.type === 'PAGE') {
      const pageNode = currentNode as PageNode;

      // Pages use 'backgrounds' property instead of 'fills'
      if ('backgrounds' in pageNode && Array.isArray(pageNode.backgrounds)) {
        const backgrounds = pageNode.backgrounds;

        if (backgrounds.length > 0) {
          // Find first solid background
          const solidBg = backgrounds.find((bg) => bg.type === 'SOLID' && bg.visible !== false);

          if (solidBg && solidBg.type === 'SOLID') {
            return {
              r: solidBg.color.r,
              g: solidBg.color.g,
              b: solidBg.color.b,
            };
          }
        }
      }

      // If page has no background, default to white
      return { r: 1, g: 1, b: 1 };
    }

    // For other nodes, try to get their fill color
    const fill = getNodeFills(currentNode as SceneNode);
    if (fill) {
      return fill;
    }

    // No fill found, move up to the next parent
    currentNode = currentNode.parent;
  }

  // Default to white background if no background found
  return { r: 1, g: 1, b: 1 };
}

/**
 * Check if a node is visible (not hidden or in a hidden parent)
 */
export function isNodeVisible(node: SceneNode): boolean {
  // console.log('isNodeVisible: Checking node', node.type, node.name);
  // console.log('isNodeVisible: node.visible =', node.visible);

  if (!node.visible) {
    // console.log('isNodeVisible: Node itself is not visible');
    return false;
  }

  let currentNode: SceneNode | null = node;
  // let depth = 0;
  while (currentNode) {
    // console.log(`isNodeVisible: Depth ${depth}, checking`, currentNode.type, currentNode.name, 'visible =', currentNode.visible);

    // Only check visibility if the node has the visible property
    // PageNode and DocumentNode don't have visible property (always visible)
    if ('visible' in currentNode && currentNode.visible === false) {
      // console.log('isNodeVisible: Parent is not visible at depth', depth);
      return false;
    }

    currentNode = currentNode.parent && 'type' in currentNode.parent ? currentNode.parent as SceneNode : null;
    // depth++;
  }

  // console.log('isNodeVisible: All nodes in chain are visible, returning true');
  return true;
}

/**
 * Traverse node tree and execute callback for each node
 */
export function traverseNode(node: BaseNode, callback: (node: SceneNode) => void): void {
  if ('type' in node) {
    callback(node as SceneNode);
  }

  if ('children' in node) {
    for (const child of node.children) {
      traverseNode(child, callback);
    }
  }
}
