import { RGB, Severity } from '../../../types/common.types';

export interface ContrastResult {
  nodeId: string;
  nodeName: string;
  foreground: RGB;
  foregroundHex: string;
  background: RGB;
  backgroundHex: string;
  ratio: number;
  passAA: boolean;
  passAAA: boolean;
  isLargeText: boolean;
  fontSize?: number;
  fontWeight?: number;
  severity: Severity;
}

export interface ContrastCheckOptions {
  scope: 'selection' | 'page';
}
