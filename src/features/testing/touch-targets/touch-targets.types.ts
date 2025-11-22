/**
 * Touch Targets Type Definitions
 *
 * Defines interfaces for touch target size validation
 * according to WCAG 2.5.5 and platform-specific guidelines
 */

export type Platform = 'web' | 'ios' | 'android' | 'windows';

export type ComplianceLevel = 'AA' | 'AAA';

export interface TouchTargetResult {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  width: number;
  height: number;
  requiredWidth: number;
  requiredHeight: number;
  passes: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  platform: Platform;
  level: ComplianceLevel;
}

export interface PlatformRequirement {
  platform: Platform;
  minWidth: number;
  minHeight: number;
  unit: string;
  description: string;
  reference: string;
}

export interface TouchTargetOptions {
  platform: Platform;
  level?: ComplianceLevel;
}
