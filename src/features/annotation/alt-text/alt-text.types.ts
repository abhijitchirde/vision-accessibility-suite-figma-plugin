/**
 * Alt-Text Types
 */

export interface AltTextData {
  nodeId: string;
  nodeName: string;
  altText: string;
  isDecorative: boolean;
  status: AltTextStatus;
  validationErrors: string[];
  validationWarnings: string[];
  lastModified: string;
  annotationId?: string; // ID of the canvas annotation
}

export type AltTextStatus = 'complete' | 'incomplete' | 'decorative' | 'needs-review';

export interface AltTextValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface ImageNodeInfo {
  nodeId: string;
  nodeName: string;
  type: string; // 'RECTANGLE', 'FRAME', 'COMPONENT', etc.
  hasImageFill: boolean;
  thumbnail?: Uint8Array; // Preview image
  width: number;
  height: number;
}

export interface AltTextFilter {
  status: 'all' | 'complete' | 'incomplete' | 'decorative' | 'needs-review';
  searchQuery?: string;
}

export interface AltTextStats {
  total: number;
  complete: number;
  incomplete: number;
  decorative: number;
  needsReview: number;
  percentageComplete: number;
}
