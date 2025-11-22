// Common types used across the plugin

export interface RGB {
  r: number; // 0-1
  g: number; // 0-1
  b: number; // 0-1
}

export type WCAGLevel = 'AA' | 'AAA';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface PluginMessage {
  type: string;
  data?: any;
}

export interface PluginResponse {
  type: string;
  success: boolean;
  data?: any;
  error?: string;
}
