import React, { useState, useEffect, useRef } from 'react';
import './AltTextPanel.css';
import { Icon } from '../../../../components/ui/Icon/Icon';
import { Button } from '../../../../components/ui/Button/Button';
import { useFigmaMessage } from '../../../../hooks/useFigmaMessage';
import { ImageNodeInfo, AltTextData } from '../alt-text.types';
import { AddAltTextModal } from './AddAltTextModal';

type TabType = 'need' | 'added';

export const AltTextPanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [imageNodes, setImageNodes] = useState<Array<ImageNodeInfo & { altTextData: AltTextData | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('need');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isDecorative, setIsDecorative] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { sendMessage } = useFigmaMessage();

  // Use ref to access latest imageNodes in event handler
  const imageNodesRef = useRef(imageNodes);
  useEffect(() => {
    imageNodesRef.current = imageNodes;
  }, [imageNodes]);

  // Load image nodes when component mounts
  useEffect(() => {
    loadImageNodes();

    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;

      if (msg?.type === 'ALT_TEXT_IMAGE_NODES') {
        setLoading(false);
        if (msg.success) {
          setImageNodes(msg.data.nodes);
          // Don't auto-select or scroll - let user click to select
        }
      }

      if (msg?.type === 'ALT_TEXT_UPDATED') {
        loadImageNodes();
      }

      if (msg?.type === 'ALT_TEXT_NODE_SELECTED') {
        // Canvas selection changed - sync to UI
        const nodeId = msg.nodeId;
        setSelectedNodeId(nodeId);

        // Switch to appropriate tab based on whether node has alt text
        // Use ref to get latest imageNodes value
        const node = imageNodesRef.current.find((n) => n.nodeId === nodeId);
        if (node?.altTextData && node.altTextData.status !== 'incomplete') {
          setActiveTab('added');
          // Scroll card into view after tab switch renders
          setTimeout(() => {
            const cardElement = document.querySelector(`[data-node-id="${nodeId}"]`);
            if (cardElement) {
              cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 150);
        } else {
          setActiveTab('need');
          // Scroll card into view after tab switch renders
          setTimeout(() => {
            const cardElement = document.querySelector(`[data-node-id="${nodeId}"]`);
            if (cardElement) {
              cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 150);
        }
      }

      if (msg?.type === 'ALT_TEXT_NODE_DESELECTED') {
        // Canvas selection cleared - deselect in UI
        setSelectedNodeId(null);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      // Notify that panel is closed for annotation detection cleanup
      parent.postMessage({ pluginMessage: { type: 'ALT_TEXT_PANEL_CLOSED' } }, '*');
    };
  }, []);

  const loadImageNodes = () => {
    setLoading(true);
    sendMessage('LOAD_ALT_TEXT_IMAGES');
  };

  // Get nodes that need alt text
  const needAltTextNodes = imageNodes.filter(
    (node) => !node.altTextData || node.altTextData.status === 'incomplete'
  );

  // Get nodes with alt text added
  const addedAltTextNodes = imageNodes.filter(
    (node) => node.altTextData && node.altTextData.status !== 'incomplete'
  );

  // Get selected node
  const selectedNode = imageNodes.find((n) => n.nodeId === selectedNodeId);

  const handleAddAltText = () => {
    if (!selectedNodeId) return;

    if (isDecorative) {
      // Skip - mark as decorative
      sendMessage('SAVE_ALT_TEXT', {
        nodeId: selectedNodeId,
        altText: '',
        isDecorative: true,
      });
      setIsDecorative(false);
      // Don't auto-advance - keep selection on current element
    } else {
      // Show modal to add alt text
      setShowModal(true);
    }
  };

  const handleModalConfirm = (altText: string, isDecorative: boolean) => {
    if (!selectedNodeId) return;

    sendMessage('SAVE_ALT_TEXT', {
      nodeId: selectedNodeId,
      altText: altText,
      isDecorative: isDecorative,
    });

    // Don't auto-advance - keep selection on current element
  };

  const handleCardClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    sendMessage('SCROLL_AND_ZOOM_TO_NODE', { nodeId });
  };

  const handleEditAltText = (nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedNodeId(nodeId);
    setShowModal(true);
  };

  const handleRemoveAltText = (nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    sendMessage('REMOVE_ALT_TEXT', { nodeId });
  };

  const handleRestoreAnnotation = (nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    sendMessage('RESTORE_ANNOTATION', { nodeId });
  };

  return (
    <div className="alt-text-panel">
      <div className="alt-text-panel__header">
        <Button variant="ghost" size="small" onClick={onBack}>
          <Icon name="chevron-left" size={20} />
        </Button>
        <h2>Alt-Text Manager</h2>
      </div>

      {loading && (
        <div className="alt-text-panel__loading">
          <p>Scanning page for images...</p>
        </div>
      )}

      {!loading && imageNodes.length === 0 && (
        <div className="alt-text-panel__empty">
          <Icon name="image" size={48} color="var(--figma-color-text-disabled)" />
          <p>No images found on this page</p>
        </div>
      )}

      {!loading && imageNodes.length > 0 && (
        <>
          {/* Tabs */}
          <div className="alt-text-panel__tabs">
            <button
              className={`tab ${activeTab === 'need' ? 'active' : ''}`}
              onClick={() => setActiveTab('need')}
            >
              Need Alt Text ({needAltTextNodes.length})
            </button>
            <button
              className={`tab ${activeTab === 'added' ? 'active' : ''}`}
              onClick={() => setActiveTab('added')}
            >
              Added ({addedAltTextNodes.length})
            </button>
          </div>

          {/* Cards List */}
          <div className="alt-text-panel__list">
            {activeTab === 'need' && (
              <>
                {needAltTextNodes.length === 0 ? (
                  <div className="alt-text-panel__empty-tab">
                    <Icon name="check-circle" size={48} color="#10b981" />
                    <p>All elements have alt text!</p>
                  </div>
                ) : (
                  needAltTextNodes.map((node) => (
                    <div
                      key={node.nodeId}
                      data-node-id={node.nodeId}
                      className={`alt-text-card ${selectedNodeId === node.nodeId ? 'selected' : ''}`}
                      onClick={() => handleCardClick(node.nodeId)}
                    >
                      <div className="alt-text-card__header">
                        <span className="alt-text-card__name">{node.nodeName}</span>
                        <span className="alt-text-card__tag tag-missing">NOT ADDED</span>
                      </div>
                      <div className="alt-text-card__details">
                        {node.type} • {Math.round(node.width)} × {Math.round(node.height)}
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === 'added' && (
              <>
                {addedAltTextNodes.length === 0 ? (
                  <div className="alt-text-panel__empty-tab">
                    <p>No alt text added yet</p>
                  </div>
                ) : (
                  addedAltTextNodes.map((node) => (
                    <div
                      key={node.nodeId}
                      data-node-id={node.nodeId}
                      className={`alt-text-card completed ${node.altTextData?.isDecorative ? 'decorative-card' : 'alt-text-card-added'} ${selectedNodeId === node.nodeId ? 'selected' : ''}`}
                      onClick={() => handleCardClick(node.nodeId)}
                    >
                      <div className="alt-text-card__header">
                        <span className="alt-text-card__name">{node.nodeName}</span>
                        <div className="alt-text-card__actions">
                          {node.altTextData?.annotationMissing && (
                            <span className="alt-text-card__tag tag-missing">Annotation deleted</span>
                          )}
                          {node.altTextData?.isDecorative ? (
                            <span className="alt-text-card__tag tag-decorative">Decorative</span>
                          ) : (
                            <span className="alt-text-card__tag tag-alt-text">Alt Text</span>
                          )}
                          <button
                            className="alt-text-card__edit"
                            onClick={(e) => handleEditAltText(node.nodeId, e)}
                            title="Edit"
                          >
                            <Icon name="edit" size={16} />
                          </button>
                          <button
                            className="alt-text-card__remove"
                            onClick={(e) => handleRemoveAltText(node.nodeId, e)}
                            title="Remove"
                          >
                            <Icon name="x" size={16} />
                          </button>
                        </div>
                      </div>
                      {node.altTextData?.isDecorative ? (
                        <div className="alt-text-card__text decorative-text">
                          Alt text skipped (decorative element)
                        </div>
                      ) : (
                        <div className="alt-text-card__text">
                          {node.altTextData?.altText || 'No text'}
                        </div>
                      )}
                      {node.altTextData?.annotationMissing && (
                        <div className="alt-text-card__restore">
                          <button
                            className="alt-text-card__restore-btn"
                            onClick={(e) => handleRestoreAnnotation(node.nodeId, e)}
                          >
                            Restore Annotation
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Fixed bottom controls - Selected element */}
      {selectedNode && activeTab === 'need' && !loading && imageNodes.length > 0 && (
        <div className="alt-text-panel__controls-fixed">
          <div className="control-header">
            <span className="control-label">Selected Element</span>
            <span className="control-node-name">{selectedNode.nodeName}</span>
          </div>
          <div className="control-actions">
            <label className="control-checkbox">
              <input
                type="checkbox"
                checked={isDecorative}
                onChange={(e) => setIsDecorative(e.target.checked)}
              />
              <span>Decorative element</span>
            </label>
            <Button
              variant="primary"
              onClick={handleAddAltText}
              size="small"
            >
              {isDecorative ? 'Skip' : 'Add Alt Text'}
            </Button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && selectedNodeId && (
        <AddAltTextModal
          nodeId={selectedNodeId}
          onClose={() => setShowModal(false)}
          onConfirm={handleModalConfirm}
          existingAltText={selectedNode?.altTextData?.altText || ''}
          existingIsDecorative={selectedNode?.altTextData?.isDecorative || false}
        />
      )}
    </div>
  );
};
