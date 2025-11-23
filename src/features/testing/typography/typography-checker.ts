/**
 * Typography Checker
 *
 * Validates typography according to:
 * - WCAG 2.1 Success Criterion 1.4.8 (Visual Presentation) - AAA
 * - WCAG 2.1 Success Criterion 1.4.12 (Text Spacing) - AA
 * - Universal typography best practices
 */

import { isNodeVisible } from '../../../utils/node.utils';
import { Severity } from '../../../types/common.types';
import {
  TypographyResult,
  TypographyIssue,
  TypographyOptions,
  TypographyRuleType,
  BulkFixOptions,
  TypographyStatus
} from './typography.types';
import {
  FONT_SIZE,
  LINE_HEIGHT,
  LINE_LENGTH,
  LETTER_SPACING,
  TEXT_ALIGN,
  FONT_WEIGHT,
  WCAG_REFERENCES
} from './typography.constants';

export class TypographyChecker {
  /**
   * Calculate estimated line length in characters
   * Approximation based on text width and font size
   */
  private estimateLineLength(node: TextNode): number {
    if (!node.characters || node.characters.trim().length === 0) {
      return 0;
    }

    // Handle mixed font sizes
    if (node.fontSize === figma.mixed) {
      return 0; // Cannot calculate for mixed font sizes
    }

    // Get average character width (rough approximation)
    const avgCharWidth = node.fontSize * 0.5; // Approximate character width
    const lineLength = Math.floor(node.width / avgCharWidth);

    return lineLength;
  }

  /**
   * Check if text is likely a heading based on font size and weight
   */
  private isLikelyHeading(fontSize: number, fontWeight: number): boolean {
    return fontSize >= FONT_SIZE.LARGE_TEXT || fontWeight >= 700;
  }

  /**
   * Validate font size
   */
  private validateFontSize(node: TextNode): TypographyIssue | null {
    const fontSize = node.fontSize;

    // Handle mixed font sizes
    if (fontSize === figma.mixed) {
      return {
        ruleType: 'font-size',
        message: 'Font size is mixed. Consider using consistent font size',
        severity: 'low',
        currentValue: 'mixed',
        recommendedValue: FONT_SIZE.RECOMMENDED_MIN
      };
    }

    if (fontSize < FONT_SIZE.CRITICAL_MIN) {
      return {
        ruleType: 'font-size',
        message: `Critical: Font size ${fontSize}px is too small (minimum ${FONT_SIZE.CRITICAL_MIN}px)`,
        severity: 'critical',
        currentValue: fontSize,
        recommendedValue: FONT_SIZE.RECOMMENDED_MIN,
        wcagReference: WCAG_REFERENCES.VISUAL_PRESENTATION
      };
    }

    if (fontSize < FONT_SIZE.WARNING_MIN) {
      return {
        ruleType: 'font-size',
        message: `Font size ${fontSize}px is below recommended minimum (${FONT_SIZE.WARNING_MIN}px)`,
        severity: 'high',
        currentValue: fontSize,
        recommendedValue: FONT_SIZE.RECOMMENDED_MIN,
        wcagReference: WCAG_REFERENCES.VISUAL_PRESENTATION
      };
    }

    if (fontSize < FONT_SIZE.RECOMMENDED_MIN) {
      return {
        ruleType: 'font-size',
        message: `Font size ${fontSize}px is below best practice (recommended ${FONT_SIZE.RECOMMENDED_MIN}px for body text)`,
        severity: 'medium',
        currentValue: fontSize,
        recommendedValue: FONT_SIZE.RECOMMENDED_MIN
      };
    }

    return null;
  }

  /**
   * Validate line height
   */
  private validateLineHeight(node: TextNode): TypographyIssue | null {
    const lineHeightValue = node.lineHeight;

    // Handle AUTO line height
    if (lineHeightValue === figma.mixed || lineHeightValue.unit === 'AUTO') {
      return {
        ruleType: 'line-height',
        message: 'Line height is set to AUTO. Specify explicit line height for better readability (recommended 1.5 for body text)',
        severity: 'medium',
        currentValue: 'AUTO',
        recommendedValue: LINE_HEIGHT.BODY_MIN,
        wcagReference: WCAG_REFERENCES.VISUAL_PRESENTATION
      };
    }

    // Handle mixed font size
    const fontSize = node.fontSize === figma.mixed ? 16 : node.fontSize;
    const fontWeight = node.fontWeight === figma.mixed ? 400 : node.fontWeight;

    // Calculate line height ratio
    let lineHeightRatio: number;
    if (lineHeightValue.unit === 'PIXELS') {
      lineHeightRatio = lineHeightValue.value / fontSize;
    } else if (lineHeightValue.unit === 'PERCENT') {
      lineHeightRatio = lineHeightValue.value / 100;
    } else {
      // For other units, we can't accurately calculate
      return null;
    }

    const isHeading = this.isLikelyHeading(fontSize, fontWeight);
    const minLineHeight = isHeading ? LINE_HEIGHT.HEADING_RECOMMENDED : LINE_HEIGHT.BODY_MIN;

    if (lineHeightRatio < LINE_HEIGHT.CRITICAL_MIN) {
      return {
        ruleType: 'line-height',
        message: `Critical: Line height ${lineHeightRatio.toFixed(2)} is too tight (minimum ${LINE_HEIGHT.CRITICAL_MIN})`,
        severity: 'critical',
        currentValue: lineHeightRatio.toFixed(2),
        recommendedValue: minLineHeight,
        wcagReference: WCAG_REFERENCES.VISUAL_PRESENTATION
      };
    }

    if (lineHeightRatio < minLineHeight) {
      const textType = isHeading ? 'headings' : 'body text';
      return {
        ruleType: 'line-height',
        message: `Line height ${lineHeightRatio.toFixed(2)} is below WCAG AAA recommendation (${minLineHeight} for ${textType})`,
        severity: isHeading ? 'medium' : 'high',
        currentValue: lineHeightRatio.toFixed(2),
        recommendedValue: minLineHeight,
        wcagReference: WCAG_REFERENCES.VISUAL_PRESENTATION
      };
    }

    return null;
  }

  /**
   * Validate line length (characters per line)
   */
  private validateLineLength(node: TextNode): TypographyIssue | null {
    const lineLength = this.estimateLineLength(node);

    // Skip very short text (likely labels, buttons, etc.)
    if (node.characters.length < 20) {
      return null;
    }

    if (lineLength > LINE_LENGTH.CRITICAL_MAX) {
      return {
        ruleType: 'line-length',
        message: `Line length ~${lineLength} characters exceeds critical threshold (max ${LINE_LENGTH.CRITICAL_MAX} for readability)`,
        severity: 'high',
        currentValue: lineLength,
        recommendedValue: LINE_LENGTH.OPTIMAL_MAX,
        wcagReference: WCAG_REFERENCES.VISUAL_PRESENTATION
      };
    }

    if (lineLength > LINE_LENGTH.WCAG_MAX) {
      return {
        ruleType: 'line-length',
        message: `Line length ~${lineLength} characters exceeds WCAG AAA guideline (max ${LINE_LENGTH.WCAG_MAX})`,
        severity: 'medium',
        currentValue: lineLength,
        recommendedValue: LINE_LENGTH.OPTIMAL_MAX,
        wcagReference: WCAG_REFERENCES.VISUAL_PRESENTATION
      };
    }

    if (lineLength > LINE_LENGTH.OPTIMAL_MAX) {
      return {
        ruleType: 'line-length',
        message: `Line length ~${lineLength} characters is above optimal range (${LINE_LENGTH.OPTIMAL_MIN}-${LINE_LENGTH.OPTIMAL_MAX} for best readability)`,
        severity: 'low',
        currentValue: lineLength,
        recommendedValue: LINE_LENGTH.OPTIMAL_MAX
      };
    }

    return null;
  }

  /**
   * Validate letter spacing
   */
  private validateLetterSpacing(node: TextNode): TypographyIssue | null {
    const letterSpacing = node.letterSpacing;

    // Handle mixed letter spacing
    if (letterSpacing === figma.mixed) {
      return {
        ruleType: 'letter-spacing',
        message: 'Letter spacing is mixed. Consider using consistent letter spacing',
        severity: 'low',
        currentValue: 'mixed',
        recommendedValue: LETTER_SPACING.RECOMMENDED_RATIO
      };
    }

    // Handle mixed font size
    const fontSize = node.fontSize === figma.mixed ? 16 : node.fontSize;

    // Calculate letter spacing ratio
    let letterSpacingRatio: number;
    if (letterSpacing.unit === 'PIXELS') {
      letterSpacingRatio = letterSpacing.value / fontSize;
    } else if (letterSpacing.unit === 'PERCENT') {
      letterSpacingRatio = letterSpacing.value / 100;
    } else {
      // For other units, we can't accurately calculate
      return null;
    }

    if (letterSpacingRatio < LETTER_SPACING.MIN_RATIO) {
      return {
        ruleType: 'letter-spacing',
        message: `Letter spacing ratio ${letterSpacingRatio.toFixed(3)} is below WCAG AA minimum (${LETTER_SPACING.MIN_RATIO})`,
        severity: 'medium',
        currentValue: letterSpacingRatio.toFixed(3),
        recommendedValue: LETTER_SPACING.RECOMMENDED_RATIO,
        wcagReference: WCAG_REFERENCES.TEXT_SPACING
      };
    }

    return null;
  }

  /**
   * Validate text alignment
   */
  private validateTextAlign(node: TextNode): TypographyIssue | null {
    const alignment = node.textAlignHorizontal;

    // Check for justified text (avoid for accessibility)
    if (alignment === 'JUSTIFIED') {
      return {
        ruleType: 'text-align',
        message: 'Justified text creates uneven spacing and can be difficult to read. Use left alignment instead',
        severity: 'medium',
        currentValue: alignment,
        recommendedValue: 'LEFT'
      };
    }

    // For body text, recommend left alignment (for LTR languages)
    if (node.characters.length > 50 && alignment !== 'LEFT') {
      return {
        ruleType: 'text-align',
        message: `Text alignment "${alignment}" for long text. Left alignment is recommended for readability`,
        severity: 'low',
        currentValue: alignment,
        recommendedValue: 'LEFT'
      };
    }

    return null;
  }

  /**
   * Validate font weight
   */
  private validateFontWeight(node: TextNode): TypographyIssue | null {
    const fontWeight = node.fontWeight;

    // Handle mixed font weights
    if (fontWeight === figma.mixed) {
      return {
        ruleType: 'font-weight',
        message: 'Font weight is mixed. Consider using consistent font weight',
        severity: 'low',
        currentValue: 'mixed',
        recommendedValue: FONT_WEIGHT.BODY_MIN
      };
    }

    const fontSize = node.fontSize === figma.mixed ? 16 : node.fontSize;
    const isHeading = this.isLikelyHeading(fontSize, fontWeight);

    const minWeight = isHeading ? FONT_WEIGHT.HEADING_MIN : FONT_WEIGHT.BODY_MIN;

    if (fontWeight < FONT_WEIGHT.CRITICAL_MIN) {
      return {
        ruleType: 'font-weight',
        message: `Critical: Font weight ${fontWeight} is too light for legibility`,
        severity: 'critical',
        currentValue: fontWeight,
        recommendedValue: minWeight
      };
    }

    if (fontWeight < minWeight) {
      const textType = isHeading ? 'headings' : 'body text';
      return {
        ruleType: 'font-weight',
        message: `Font weight ${fontWeight} is below recommended minimum (${minWeight} for ${textType})`,
        severity: 'medium',
        currentValue: fontWeight,
        recommendedValue: minWeight
      };
    }

    return null;
  }

  /**
   * Calculate overall severity based on issues
   */
  private calculateOverallSeverity(issues: TypographyIssue[]): Severity {
    if (issues.length === 0) return 'low';

    // Return the highest severity
    if (issues.some(i => i.severity === 'critical')) return 'critical';
    if (issues.some(i => i.severity === 'high')) return 'high';
    if (issues.some(i => i.severity === 'medium')) return 'medium';
    return 'low';
  }

  /**
   * Calculate status based on issues
   * - pass: no issues
   * - fail: has critical or high severity issues
   * - attention: has only medium or low severity issues
   */
  private calculateStatus(issues: TypographyIssue[]): TypographyStatus {
    if (issues.length === 0) return 'pass';

    // Fail if has critical or high severity issues
    if (issues.some(i => i.severity === 'critical' || i.severity === 'high')) {
      return 'fail';
    }

    // Attention for medium or low severity issues
    return 'attention';
  }

  /**
   * Check a single text node for typography issues
   */
  checkNode(node: SceneNode, options: TypographyOptions = {}): TypographyResult | null {
    // Skip if not a text node
    if (node.type !== 'TEXT') {
      return null;
    }

    const textNode = node as TextNode;

    // Skip if node is not visible
    if (!isNodeVisible(textNode)) {
      return null;
    }

    // Skip if text is empty
    if (!textNode.characters || textNode.characters.trim().length === 0) {
      return null;
    }

    const issues: TypographyIssue[] = [];

    // Run validation checks based on options
    if (options.checkFontSize !== false) {
      const fontSizeIssue = this.validateFontSize(textNode);
      if (fontSizeIssue) issues.push(fontSizeIssue);
    }

    if (options.checkLineHeight !== false) {
      const lineHeightIssue = this.validateLineHeight(textNode);
      if (lineHeightIssue) issues.push(lineHeightIssue);
    }

    if (options.checkLineLength !== false) {
      const lineLengthIssue = this.validateLineLength(textNode);
      if (lineLengthIssue) issues.push(lineLengthIssue);
    }

    if (options.checkLetterSpacing !== false) {
      const letterSpacingIssue = this.validateLetterSpacing(textNode);
      if (letterSpacingIssue) issues.push(letterSpacingIssue);
    }

    if (options.checkTextAlign !== false) {
      const textAlignIssue = this.validateTextAlign(textNode);
      if (textAlignIssue) issues.push(textAlignIssue);
    }

    if (options.checkFontWeight !== false) {
      const fontWeightIssue = this.validateFontWeight(textNode);
      if (fontWeightIssue) issues.push(fontWeightIssue);
    }

    const passes = issues.length === 0;
    const severity = this.calculateOverallSeverity(issues);
    const status = this.calculateStatus(issues);

    // Handle mixed values for result
    const fontSize = textNode.fontSize === figma.mixed ? 16 : textNode.fontSize;
    const fontWeight = textNode.fontWeight === figma.mixed ? 400 : textNode.fontWeight;
    const letterSpacing = textNode.letterSpacing === figma.mixed ? 0 : (textNode.letterSpacing.value || 0);

    // Handle line height
    let lineHeight: LineHeight | 'AUTO';
    if (textNode.lineHeight === figma.mixed) {
      lineHeight = 'AUTO';
    } else if (textNode.lineHeight.unit === 'AUTO') {
      lineHeight = 'AUTO';
    } else {
      lineHeight = textNode.lineHeight;
    }

    return {
      nodeId: textNode.id,
      nodeName: textNode.name,
      nodeType: textNode.type,
      fontSize,
      lineHeight,
      letterSpacing,
      textAlignHorizontal: textNode.textAlignHorizontal,
      fontWeight,
      characters: textNode.characters,
      issues,
      passes,
      status,
      severity
    };
  }

  /**
   * Check all text nodes on the current page
   */
  checkPage(options: TypographyOptions = {}): TypographyResult[] {
    const results: TypographyResult[] = [];
    const page = figma.currentPage;

    const traverse = (node: BaseNode) => {
      if (node.type === 'TEXT') {
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
   */
  checkSelection(options: TypographyOptions = {}): TypographyResult[] {
    const results: TypographyResult[] = [];
    const selection = figma.currentPage.selection;

    for (const node of selection) {
      if (node.type === 'TEXT') {
        const result = this.checkNode(node, options);
        if (result) {
          results.push(result);
        }
      }

      // Also check children
      if ('children' in node) {
        const traverse = (child: BaseNode) => {
          if (child.type === 'TEXT') {
            const childResult = this.checkNode(child as SceneNode, options);
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
   * Apply bulk fixes to text nodes
   */
  async applyBulkFixes(nodeIds: string[], options: BulkFixOptions): Promise<number> {
    let fixedCount = 0;

    for (const nodeId of nodeIds) {
      const node = await figma.getNodeByIdAsync(nodeId);
      if (!node || node.type !== 'TEXT') {
        continue;
      }

      const textNode = node as TextNode;

      try {
        // Load all fonts used in the text node
        // Handle mixed fonts by loading the unique fonts
        if (textNode.fontName === figma.mixed) {
          // For mixed fonts, we need to load all unique fonts
          const uniqueFonts = new Set<string>();
          const len = textNode.characters.length;
          for (let i = 0; i < len; i++) {
            const fontName = textNode.getRangeFontName(i, i + 1) as FontName;
            const fontKey = `${fontName.family}-${fontName.style}`;
            if (!uniqueFonts.has(fontKey)) {
              uniqueFonts.add(fontKey);
              await figma.loadFontAsync(fontName);
            }
          }
        } else {
          // Single font, load it normally
          await figma.loadFontAsync(textNode.fontName as FontName);
        }

        let nodeWasFixed = false;

        // Fix font size
        if (options.fixFontSize && options.targetFontSize) {
          const currentFontSize = textNode.fontSize === figma.mixed ? 0 : textNode.fontSize;
          if (currentFontSize < options.targetFontSize) {
            textNode.fontSize = options.targetFontSize;
            nodeWasFixed = true;
          }
        }

        // Fix line height
        if (options.fixLineHeight && options.targetLineHeight) {
          textNode.lineHeight = {
            unit: 'PERCENT',
            value: options.targetLineHeight * 100
          };
          nodeWasFixed = true;
        }

        // Fix letter spacing
        if (options.fixLetterSpacing) {
          const fontSize = textNode.fontSize === figma.mixed ? 16 : textNode.fontSize;
          const minLetterSpacing = fontSize * LETTER_SPACING.RECOMMENDED_RATIO;
          textNode.letterSpacing = {
            unit: 'PIXELS',
            value: minLetterSpacing
          };
          nodeWasFixed = true;
        }

        // Fix alignment
        if (options.fixAlignment) {
          if (textNode.textAlignHorizontal === 'JUSTIFIED') {
            textNode.textAlignHorizontal = 'LEFT';
            nodeWasFixed = true;
          }
        }

        // Fix font weight (more complex, would need to change font)
        // Skipping for now as it requires font family change

        // Count this node as fixed if any fix was applied
        if (nodeWasFixed) {
          fixedCount++;
        }

      } catch (error) {
        console.error(`Failed to fix node ${nodeId}:`, error);
        // Continue with other nodes even if one fails
      }
    }

    return fixedCount;
  }
}
