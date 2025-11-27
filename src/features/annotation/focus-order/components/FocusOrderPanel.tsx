import React, { useState, useEffect } from 'react';
import './FocusOrderPanel.css';
import { Icon } from '../../../../components/ui/Icon/Icon';
import { Button } from '../../../../components/ui/Button/Button';
import { useFigmaMessage } from '../../../../hooks/useFigmaMessage';
import { FocusOrderItem } from '../focus-order.types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable item component
const SortableItem: React.FC<{
  item: FocusOrderItem;
  onRemove: (nodeId: string) => void;
  onZoom: (nodeId: string) => void;
}> = ({ item, onRemove, onZoom }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.nodeId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="focus-order-item"
    >
      <div className="focus-order-item-drag-handle" {...attributes} {...listeners}>
        <Icon name="grip-vertical" size={16} />
      </div>
      <div className="focus-order-item-badge">{item.order}</div>
      <div className="focus-order-item-content" onClick={() => onZoom(item.nodeId)}>
        <span className="focus-order-item-name">{item.nodeName}</span>
      </div>
      <button
        className="focus-order-item-delete"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(item.nodeId);
        }}
        title="Remove from focus order"
      >
        <Icon name="trash" size={16} />
      </button>
    </div>
  );
};

export const FocusOrderPanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [items, setItems] = useState<FocusOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [annotationsVisible, setAnnotationsVisible] = useState(true);
  const { sendMessage } = useFigmaMessage();

  // Set up drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load focus order when component mounts
  useEffect(() => {
    loadFocusOrder();

    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;

      if (msg?.type === 'FOCUS_ORDER_LOADED') {
        setLoading(false);
        if (msg.success) {
          setItems(msg.data.items);
        }
      }

      if (msg?.type === 'FOCUS_ORDER_ITEM_ADDED') {
        if (msg.success) {
          setItems(msg.data.items);
        } else {
          // Show error
          alert(msg.error || 'Failed to add item');
        }
      }

      if (msg?.type === 'FOCUS_ORDER_ITEM_REMOVED') {
        if (msg.success) {
          setItems(msg.data.items);
        }
      }

      if (msg?.type === 'FOCUS_ORDER_REORDERED') {
        if (msg.success) {
          setItems(msg.data.items);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const loadFocusOrder = () => {
    setLoading(true);
    sendMessage('GET_FOCUS_ORDER');
  };

  const handleAddItem = () => {
    sendMessage('ADD_FOCUS_ORDER_ITEM');
  };

  const handleRemoveItem = (nodeId: string) => {
    sendMessage('REMOVE_FOCUS_ORDER_ITEM', { nodeId });
  };

  const handleZoomToItem = (nodeId: string) => {
    sendMessage('ZOOM_TO_FOCUS_ITEM', { nodeId });
  };

  const handleToggleAnnotations = () => {
    const newVisibility = !annotationsVisible;
    setAnnotationsVisible(newVisibility);
    sendMessage('TOGGLE_FOCUS_ANNOTATIONS', { visible: newVisibility });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.nodeId === active.id);
        const newIndex = items.findIndex((item) => item.nodeId === over.id);

        const reorderedItems = arrayMove(items, oldIndex, newIndex);

        // Send reordered items to plugin
        sendMessage('REORDER_FOCUS_ITEMS', { items: reorderedItems });

        return reorderedItems;
      });
    }
  };

  return (
    <div className="focus-order-panel">
      <div className="focus-order-header">
        <button className="back-button" onClick={onBack}>
          <Icon name="chevron-left" size={20} />
        </button>
        <h2 className="focus-order-title">Focus Order</h2>
        <button
          className="icon-button"
          onClick={handleToggleAnnotations}
          title={annotationsVisible ? 'Hide annotations' : 'Show annotations'}
        >
          <Icon name={annotationsVisible ? 'eye' : 'eye-off'} size={20} />
        </button>
      </div>

      <div className="focus-order-content">
        {loading ? (
          <div className="focus-order-loading">Loading...</div>
        ) : items.length === 0 ? (
          <div className="focus-order-empty">
            <div className="focus-order-empty-icon">
              <Icon name="focus" size={48} />
            </div>
            <p className="focus-order-empty-text">
              Select your first focusable element and click "Add item".
            </p>
          </div>
        ) : (
          <div className="focus-order-list">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((item) => item.nodeId)}
                strategy={verticalListSortingStrategy}
              >
                {items.map((item) => (
                  <SortableItem
                    key={item.nodeId}
                    item={item}
                    onRemove={handleRemoveItem}
                    onZoom={handleZoomToItem}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>

      <div className="focus-order-footer">
        <Button
          variant="primary"
          fullWidth
          onClick={handleAddItem}
        >
          Add item
        </Button>
      </div>
    </div>
  );
};
