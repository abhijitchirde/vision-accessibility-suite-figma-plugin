/**
 * Typography Type Definitions
 *
 * Defines interfaces for typography validation
 * according to WCAG 2.1 (1.4.8 Visual Presentation, 1.4.12 Text Spacing)
 * and universal typography best practices
 */

import { Severity, WCAGLevel } from '../../../types/common.types';

export type TypographyRuleType =
  | 'font-size'
  | 'line-height'
  | 'line-length'
  | 'letter-spacing'
  | 'text-align'
  | 'font-weight';

export interface TypographyIssue {
  ruleType: TypographyRuleType;
  message: string;
  severity: Severity;
  currentValue: string | number;
  recommendedValue: string | number;
  wcagReference?: string;
}

export type TypographyStatus = 'pass' | 'fail' | 'attention';

export interface TypographyResult {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  // Text properties
  fontSize: number;
  lineHeight: LineHeight | 'AUTO'; // Figma uses 'AUTO' or LineHeight object
  letterSpacing: number;
  textAlignHorizontal: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  fontWeight: number;
  characters: string;
  // Validation results
  issues: TypographyIssue[];
  passes: boolean;
  status: TypographyStatus;
  severity: Severity;
}

export interface TypographyOptions {
  level?: WCAGLevel;
  checkFontSize?: boolean;
  checkLineHeight?: boolean;
  checkLineLength?: boolean;
  checkLetterSpacing?: boolean;
  checkTextAlign?: boolean;
  checkFontWeight?: boolean;
}

export interface TypographyFixAction {
  nodeId: string;
  action: 'fix-font-size' | 'fix-line-height' | 'fix-letter-spacing' | 'fix-alignment' | 'fix-font-weight';
  value: number | string;
}

export interface BulkFixOptions {
  fixFontSize?: boolean;
  targetFontSize?: number;
  fixLineHeight?: boolean;
  targetLineHeight?: number;
  fixLetterSpacing?: boolean;
  fixAlignment?: boolean;
  fixFontWeight?: boolean;
}
