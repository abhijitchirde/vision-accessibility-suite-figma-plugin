/**
 * Focus Order Types
 */

export interface FocusOrderItem {
  nodeId: string;
  nodeName: string;
  order: number; // 1-based index in focus order
  annotationId?: string; // ID of the canvas annotation badge
  annotationMissing?: boolean; // True if annotation was deleted from canvas
  lastModified: string;
}

export interface FocusableNodeInfo {
  nodeId: string;
  nodeName: string;
  nodeType: string; // 'FRAME', 'COMPONENT', 'INSTANCE', etc.
  isInteractive: boolean; // Has reactions/interactions
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface FocusOrderFilter {
  searchQuery?: string;
}

export interface FocusOrderStats {
  total: number;
  percentageComplete: number;
}

/**
 * Message types for UI ↔ Plugin communication
 */
export interface GetFocusOrderMessage {
  type: 'GET_FOCUS_ORDER';
}

export interface AddFocusOrderItemMessage {
  type: 'ADD_FOCUS_ORDER_ITEM';
}

export interface RemoveFocusOrderItemMessage {
  type: 'REMOVE_FOCUS_ORDER_ITEM';
  payload: {
    nodeId: string;
  };
}

export interface ReorderFocusItemsMessage {
  type: 'REORDER_FOCUS_ITEMS';
  payload: {
    items: FocusOrderItem[];
  };
}

export interface ToggleFocusAnnotationsMessage {
  type: 'TOGGLE_FOCUS_ANNOTATIONS';
  payload: {
    visible: boolean;
  };
}

export interface ZoomToFocusItemMessage {
  type: 'ZOOM_TO_FOCUS_ITEM';
  payload: {
    nodeId: string;
  };
}

export type FocusOrderMessage =
  | GetFocusOrderMessage
  | AddFocusOrderItemMessage
  | RemoveFocusOrderItemMessage
  | ReorderFocusItemsMessage
  | ToggleFocusAnnotationsMessage
  | ZoomToFocusItemMessage;
