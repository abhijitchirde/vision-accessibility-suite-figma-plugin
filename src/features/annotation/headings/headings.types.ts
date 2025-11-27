/**
 * Headings Types
 */

export type HeadingLevel = 'H1' | 'H2' | 'H3' | 'H4' | 'H5' | 'H6';

export interface HeadingItem {
  nodeId: string;
  nodeName: string;
  level: HeadingLevel;
  text: string; // The actual text content
  fontSize: number; // Font size in pixels
  fontWeight: number; // Numeric font weight (400, 600, 700, etc.)
  fontFamily: string; // Font family name
  annotationId?: string; // ID of the canvas annotation badge
  annotationMissing?: boolean; // True if annotation was deleted from canvas
  parentFrameId?: string; // For organizing by page/frame
  parentFrameName?: string;
  lastModified: string;
}

export interface TextNodeInfo {
  nodeId: string;
  nodeName: string;
  text: string;
  fontSize: number;
  fontWeight: number;
  isLikelyHeading: boolean; // Auto-detected potential heading
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  parentFrameId?: string;
  parentFrameName?: string;
}

export interface HeadingValidationIssue {
  type:
    | 'no_h1'
    | 'multiple_h1'
    | 'skipped_level'
    | 'out_of_order'
    | 'empty_heading';
  severity: 'error' | 'warning';
  message: string;
  nodeId?: string;
  level?: HeadingLevel;
}

export interface HeadingHierarchy {
  level: HeadingLevel;
  text: string;
  nodeId: string;
  children: HeadingHierarchy[];
}

export interface HeadingStats {
  total: number;
  byLevel: Record<HeadingLevel, number>;
  validationIssues: HeadingValidationIssue[];
  isValid: boolean; // True if no errors (warnings ok)
}

/**
 * Message types for UI ↔ Plugin communication
 */
export interface GetHeadingsMessage {
  type: 'GET_HEADINGS';
}

export interface GetTextNodesMessage {
  type: 'GET_TEXT_NODES';
}

export interface AddHeadingMessage {
  type: 'ADD_HEADING';
  payload: {
    nodeId: string;
    level: HeadingLevel;
  };
}

export interface RemoveHeadingMessage {
  type: 'REMOVE_HEADING';
  payload: {
    nodeId: string;
  };
}

export interface UpdateHeadingLevelMessage {
  type: 'UPDATE_HEADING_LEVEL';
  payload: {
    nodeId: string;
    level: HeadingLevel;
  };
}

export interface ToggleHeadingAnnotationsMessage {
  type: 'TOGGLE_HEADING_ANNOTATIONS';
  payload: {
    visible: boolean;
  };
}

export interface ZoomToHeadingMessage {
  type: 'ZOOM_TO_HEADING';
  payload: {
    nodeId: string;
  };
}

export interface GetHeadingStatsMessage {
  type: 'GET_HEADING_STATS';
}

export type HeadingMessage =
  | GetHeadingsMessage
  | GetTextNodesMessage
  | AddHeadingMessage
  | RemoveHeadingMessage
  | UpdateHeadingLevelMessage
  | ToggleHeadingAnnotationsMessage
  | ZoomToHeadingMessage
  | GetHeadingStatsMessage;
