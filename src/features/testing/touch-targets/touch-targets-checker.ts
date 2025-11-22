/**
 * Touch Targets Checker
 *
 * Validates touch target sizes according to WCAG 2.5.5
 * and platform-specific guidelines (iOS, Android, Windows)
 */

import { isNodeVisible } from '../../../utils/node.utils';
import {
  TouchTargetResult,
  TouchTargetOptions,
  Platform,
  ComplianceLevel
} from './touch-targets.types';
import {
  PLATFORM_REQUIREMENTS,
  INTERACTIVE_NODE_TYPES,
  SEVERITY_THRESHOLDS
} from './touch-targets.constants';

export class TouchTargetsChecker {
  /**
   * Check if a node is potentially interactive
   * Interactive nodes include:
   * - Nodes with reactions (click, hover, etc.)
   * - Component instances (likely interactive)
   * - Nodes with specific naming patterns (button, link, etc.)
   */
  private isInteractiveNode(node: SceneNode): boolean {
    // Check if node has reactions (click, hover, etc.)
    if ('reactions' in node && node.reactions && node.reactions.length > 0) {
      return true;
    }

    // Component instances are often interactive
    if (node.type === 'INSTANCE') {
      return true;
    }

    // Check naming patterns (button, btn, link, etc.)
    const interactivePatterns = /button|btn|link|clickable|interactive|touch|tap/i;
    if (interactivePatterns.test(node.name.toLowerCase())) {
      return true;
    }

    return false;
  }

  /**
   * Calculate severity based on how far below minimum size the target is
   */
  private calculateSeverity(
    width: number,
    height: number,
    minWidth: number,
    minHeight: number
  ): 'critical' | 'high' | 'medium' | 'low' {
    const widthRatio = width / minWidth;
    const heightRatio = height / minHeight;
    const minRatio = Math.min(widthRatio, heightRatio);

    if (minRatio < SEVERITY_THRESHOLDS.critical) return 'critical';
    if (minRatio < SEVERITY_THRESHOLDS.high) return 'high';
    if (minRatio < SEVERITY_THRESHOLDS.medium) return 'medium';
    return 'low';
  }

  /**
   * Check a single node for touch target size compliance
   * @param skipInteractiveDetection - If true, check all nodes regardless of interactive detection
   */
  checkNode(node: SceneNode, options: TouchTargetOptions, skipInteractiveDetection: boolean = false): TouchTargetResult | null {
    // Skip if node is not visible
    if (!isNodeVisible(node)) {
      return null;
    }

    // Skip if node is not potentially interactive (unless we're checking user selection)
    if (!skipInteractiveDetection && !this.isInteractiveNode(node)) {
      return null;
    }

    // Skip if node doesn't have width/height
    if (!('width' in node) || !('height' in node)) {
      return null;
    }

    const platform = options.platform;
    const level: ComplianceLevel = options.level || 'AA';
    const requirementKey = `${platform}-${level}`;
    const requirement = PLATFORM_REQUIREMENTS[requirementKey];

    if (!requirement) {
      return null;
    }

    const width = Math.round(node.width);
    const height = Math.round(node.height);
    const passes = width >= requirement.minWidth && height >= requirement.minHeight;

    const severity = passes
      ? 'low'
      : this.calculateSeverity(width, height, requirement.minWidth, requirement.minHeight);

    let message = '';
    if (passes) {
      message = `Touch target meets ${requirement.description}`;
    } else {
      const widthDiff = requirement.minWidth - width;
      const heightDiff = requirement.minHeight - height;
      if (widthDiff > 0 && heightDiff > 0) {
        message = `Touch target too small: ${width}×${height}${requirement.unit}. Needs ${widthDiff}${requirement.unit} more width and ${heightDiff}${requirement.unit} more height.`;
      } else if (widthDiff > 0) {
        message = `Touch target too narrow: ${width}${requirement.unit} wide. Needs ${widthDiff}${requirement.unit} more width.`;
      } else {
        message = `Touch target too short: ${height}${requirement.unit} tall. Needs ${heightDiff}${requirement.unit} more height.`;
      }
    }

    return {
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      width,
      height,
      requiredWidth: requirement.minWidth,
      requiredHeight: requirement.minHeight,
      passes,
      severity,
      message,
      platform,
      level
    };
  }

  /**
   * Check all interactive nodes on the current page
   */
  checkPage(options: TouchTargetOptions): TouchTargetResult[] {
    const results: TouchTargetResult[] = [];
    const page = figma.currentPage;

    const traverse = (node: BaseNode) => {
      if ('type' in node && INTERACTIVE_NODE_TYPES.includes(node.type as any)) {
        const result = this.checkNode(node as SceneNode, options);
        if (result) {
          results.push(result);
        }
      }

      if ('children' in node) {
        for (const child of node.children) {
          traverse(child);
        }
      }
    };

    traverse(page);
    return results;
  }

  /**
   * Check currently selected nodes
   * @param skipInteractiveDetection - If true, check all selected nodes regardless of interactive detection
   */
  checkSelection(options: TouchTargetOptions, skipInteractiveDetection: boolean = false): TouchTargetResult[] {
    const results: TouchTargetResult[] = [];
    const selection = figma.currentPage.selection;

    for (const node of selection) {
      const result = this.checkNode(node, options, skipInteractiveDetection);
      if (result) {
        results.push(result);
      }

      // Also check children
      if ('children' in node) {
        const traverse = (child: BaseNode) => {
          if ('type' in child && INTERACTIVE_NODE_TYPES.includes(child.type as any)) {
            const childResult = this.checkNode(child as SceneNode, options, skipInteractiveDetection);
            if (childResult) {
              results.push(childResult);
            }
          }

          if ('children' in child) {
            for (const grandchild of child.children) {
              traverse(grandchild);
            }
          }
        };

        for (const child of node.children) {
          traverse(child);
        }
      }
    }

    return results;
  }

  /**
   * Auto-fix a node by resizing it to minimum size
   * Only resizes if the node is smaller than required
   */
  async fixNode(nodeId: string, requiredWidth: number, requiredHeight: number): Promise<boolean> {
    const node = figma.getNodeById(nodeId);

    if (!node || !('width' in node) || !('height' in node)) {
      return false;
    }

    // Check if node supports resizing
    if (!('resize' in node) || typeof node.resize !== 'function') {
      return false;
    }

    const needsWidthFix = node.width < requiredWidth;
    const needsHeightFix = node.height < requiredHeight;

    if (needsWidthFix || needsHeightFix) {
      try {
        if (needsWidthFix) {
          node.resize(requiredWidth, node.height);
        }
        if (needsHeightFix) {
          node.resize(node.width, requiredHeight);
        }
        return true;
      } catch (error) {
        console.error('Failed to resize node:', error);
        return false;
      }
    }

    return false;
  }
}
