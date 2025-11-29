/**
 * Landmarks Types
 * 
 * ARIA landmark roles for page structure annotation
 * Reference: https://www.w3.org/TR/wai-aria-practices-1.1/examples/landmarks/
 */

export type LandmarkRole = 
  | 'header' 
  | 'nav' 
  | 'main' 
  | 'aside' 
  | 'footer' 
  | 'form' 
  | 'section';

export interface LandmarkItem {
  nodeId: string;
  nodeName: string;
  role: LandmarkRole;
  label?: string; // Optional aria-label for multiple landmarks of same type
  annotationId?: string; // ID of the canvas annotation badge
  annotationMissing?: boolean; // True if annotation was deleted from canvas
  parentFrameId?: string; // For organizing
  parentFrameName?: string;
  lastModified: string;
}

export interface FrameNodeInfo {
  nodeId: string;
  nodeName: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  parentFrameId?: string;
  parentFrameName?: string;
}

export interface LandmarkValidationIssue {
  type:
    | 'no_main'
    | 'multiple_main'
    | 'unlabeled_nav'
    | 'unlabeled_section'
    | 'overlapping_landmarks';
  severity: 'error' | 'warning';
  message: string;
  nodeId?: string;
  role?: LandmarkRole;
}

export interface LandmarkStats {
  total: number;
  byRole: Record<LandmarkRole, number>;
  validationIssues: LandmarkValidationIssue[];
  isValid: boolean; // True if no errors (warnings ok)
}

/**
 * Message types for UI ↔ Plugin communication
 */
export interface GetLandmarksMessage {
  type: 'GET_LANDMARKS';
}

export interface AddLandmarkMessage {
  type: 'ADD_LANDMARK';
  payload: {
    role: LandmarkRole;
    label?: string;
  };
}

export interface RemoveLandmarkMessage {
  type: 'REMOVE_LANDMARK';
  payload: {
    nodeId: string;
  };
}

export interface UpdateLandmarkRoleMessage {
  type: 'UPDATE_LANDMARK_ROLE';
  payload: {
    nodeId: string;
    role: LandmarkRole;
  };
}

export interface UpdateLandmarkLabelMessage {
  type: 'UPDATE_LANDMARK_LABEL';
  payload: {
    nodeId: string;
    label: string;
  };
}

export interface ToggleLandmarkAnnotationsMessage {
  type: 'TOGGLE_LANDMARK_ANNOTATIONS';
  payload: {
    visible: boolean;
  };
}

export interface ZoomToLandmarkMessage {
  type: 'ZOOM_TO_LANDMARK';
  payload: {
    nodeId: string;
  };
}

export interface GetLandmarkStatsMessage {
  type: 'GET_LANDMARK_STATS';
}

export type LandmarkMessage =
  | GetLandmarksMessage
  | AddLandmarkMessage
  | RemoveLandmarkMessage
  | UpdateLandmarkRoleMessage
  | UpdateLandmarkLabelMessage
  | ToggleLandmarkAnnotationsMessage
  | ZoomToLandmarkMessage
  | GetLandmarkStatsMessage;

