import { ContrastResult } from './contrast.types';
import { SelectionService } from '../../../services/selection.service';
import { getContrastRatio, rgbToHex } from '../../../utils/color.utils';
import { isLargeText, passesWCAG } from '../../../utils/wcag.utils';
import { getForegroundColor, getBackgroundColor, isNodeVisible } from '../../../utils/node.utils';

export class ContrastChecker {
  constructor(private selectionService: SelectionService) {}

  /**
   * Check contrast for currently selected text nodes
   */
  async checkSelection(): Promise<ContrastResult[]> {
    const textNodes = this.selectionService.getTextNodes(true);
    return this.checkNodes(textNodes);
  }

  /**
   * Check contrast for all text nodes on the current page
   */
  async checkPage(): Promise<ContrastResult[]> {
    const textNodes = this.selectionService.getTextNodes(false);
    return this.checkNodes(textNodes);
  }

  /**
   * Check any node for contrast (works with any element that has fills or strokes)
   */
  checkAnyNode(node: SceneNode): ContrastResult | null {
    // Skip hidden nodes
    // console.log('checkAnyNode: Checking visibility');
    if (!isNodeVisible(node)) {
      // console.log('checkAnyNode: Node is not visible');
      return null;
    }
    // console.log('checkAnyNode: Node is visible');

    // Get foreground color (fill first, then stroke)
    // console.log('checkAnyNode: Getting foreground color');
    const foreground = getForegroundColor(node);
    // console.log('checkAnyNode: Foreground color =', foreground);
    if (!foreground) {
      // console.log('checkAnyNode: No foreground color, returning null');
      return null;
    }

    // Get background color
    // console.log('checkAnyNode: Getting background color');
    const background = getBackgroundColor(node);
    // console.log('checkAnyNode: Background color =', background);
    if (!background) {
      // console.log('checkAnyNode: No background color, returning null');
      return null;
    }

    // Calculate contrast ratio
    const ratio = getContrastRatio(foreground, background);

    // Get font properties (if text node)
    let fontSize: number | undefined;
    let fontWeight: number | undefined;
    let isLarge = false;

    if (node.type === 'TEXT') {
      const textNode = node as TextNode;
      // Handle mixed font sizes/weights (use defaults)
      fontSize = typeof textNode.fontSize === 'number' ? textNode.fontSize : 14;
      fontWeight = typeof textNode.fontWeight === 'number' ? textNode.fontWeight : 400;
      isLarge = isLargeText(fontSize, fontWeight);
    }

    // Check WCAG compliance (use normal text threshold if not text)
    const passAA = passesWCAG(ratio, 'AA', isLarge);
    const passAAA = passesWCAG(ratio, 'AAA', isLarge);

    // Determine severity
    let severity: 'critical' | 'high' | 'medium' | 'low';
    if (!passAA) {
      severity = 'critical';
    } else if (!passAAA) {
      severity = 'medium';
    } else {
      severity = 'low';
    }

    return {
      nodeId: node.id,
      nodeName: node.name,
      foreground,
      foregroundHex: rgbToHex(foreground),
      background,
      backgroundHex: rgbToHex(background),
      ratio,
      passAA,
      passAAA,
      isLargeText: isLarge,
      fontSize,
      fontWeight,
      severity,
    };
  }

  /**
   * Check a single text node for contrast issues (legacy method)
   */
  checkNode(node: TextNode): ContrastResult | null {
    return this.checkAnyNode(node);
  }

  /**
   * Check multiple nodes
   */
  private checkNodes(nodes: TextNode[]): ContrastResult[] {
    const results: ContrastResult[] = [];

    for (const node of nodes) {
      const result = this.checkNode(node);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }
}
