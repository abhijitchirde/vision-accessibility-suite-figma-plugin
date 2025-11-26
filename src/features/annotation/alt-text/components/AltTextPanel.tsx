import React, { useState, useEffect } from 'react';
import './AltTextPanel.css';
import { Icon } from '../../../../components/ui/Icon/Icon';
import { Button } from '../../../../components/ui/Button/Button';
import { useFigmaMessage } from '../../../../hooks/useFigmaMessage';
import { ImageNodeInfo, AltTextData, AltTextStats } from '../alt-text.types';
import { AddAltTextModal } from './AddAltTextModal';

export const AltTextPanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [imageNodes, setImageNodes] = useState<Array<ImageNodeInfo & { altTextData: AltTextData | null }>>([]);
  const [stats, setStats] = useState<AltTextStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'incomplete' | 'complete' | 'decorative'>('all');
  const { sendMessage } = useFigmaMessage();

  // Load image nodes when component mounts
  useEffect(() => {
    loadImageNodes();

    // Listen for messages from plugin code
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;

      if (msg?.type === 'ALT_TEXT_IMAGE_NODES') {
        setLoading(false);
        if (msg.success) {
          setImageNodes(msg.data.nodes);
          setStats(msg.data.stats);
          setError(null);
        } else {
          setError(msg.error || 'Failed to load image nodes');
        }
      }

      if (msg?.type === 'ALT_TEXT_UPDATED') {
        // Refresh the list when alt text is updated
        loadImageNodes();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const loadImageNodes = () => {
    setLoading(true);
    setError(null);
    sendMessage('LOAD_ALT_TEXT_IMAGES');
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);
  };

  const handleCloseModal = () => {
    setSelectedNode(null);
  };

  const handleAddClick = () => {
    // Send message to select the first incomplete node
    const incompleteNode = imageNodes.find(
      (node) => !node.altTextData || node.altTextData.status === 'incomplete'
    );
    if (incompleteNode) {
      setSelectedNode(incompleteNode.nodeId);
    }
  };

  // Filter image nodes based on selected filter
  const filteredNodes = imageNodes.filter((node) => {
    if (filter === 'all') return true;
    if (filter === 'incomplete') return !node.altTextData || node.altTextData.status === 'incomplete';
    if (filter === 'complete') return node.altTextData?.status === 'complete';
    if (filter === 'decorative') return node.altTextData?.isDecorative;
    return true;
  });

  return (
    <div className="alt-text-panel">
      <div className="alt-text-panel__header">
        <Button variant="ghost" size="small" onClick={onBack}>
          <Icon name="chevron-left" size={20} />
        </Button>
        <h2>Alt-Text</h2>
      </div>

      {loading && (
        <div className="alt-text-panel__loading">
          <p>Loading image nodes...</p>
        </div>
      )}

      {error && (
        <div className="alt-text-panel__error">
          <p>{error}</p>
          <Button variant="secondary" onClick={loadImageNodes}>
            Retry
          </Button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Stats Section */}
          {stats && (
            <div className="alt-text-panel__stats">
              <div className="progress-bar">
                <div
                  className="progress-bar__fill"
                  style={{ width: `${stats.percentageComplete}%` }}
                />
              </div>
              <div className="stats-grid">
                <div className="stat">
                  <span className="stat__value">{stats.total}</span>
                  <span className="stat__label">Total</span>
                </div>
                <div className="stat">
                  <span className="stat__value">{stats.complete}</span>
                  <span className="stat__label">Complete</span>
                </div>
                <div className="stat">
                  <span className="stat__value">{stats.incomplete}</span>
                  <span className="stat__label">Incomplete</span>
                </div>
                <div className="stat">
                  <span className="stat__value">{stats.decorative}</span>
                  <span className="stat__label">Decorative</span>
                </div>
              </div>
              <div className="completion-text">
                {stats.percentageComplete}% complete
              </div>
            </div>
          )}

          {/* Instructions */}
          {imageNodes.length === 0 && (
            <div className="alt-text-panel__empty">
              <Icon name="image" size={48} color="var(--figma-color-text-disabled)" />
              <p>No images found on this page</p>
              <p className="help-text">
                Images with fills will appear here for alt text annotation
              </p>
            </div>
          )}

          {imageNodes.length > 0 && (
            <>
              <div className="alt-text-panel__instructions">
                <p>
                  Select any layer that will be exported as an image to indicate it requires alt
                  text and click add
                </p>
                <div className="filter-buttons">
                  <button
                    className={`filter-button ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                  >
                    All ({imageNodes.length})
                  </button>
                  <button
                    className={`filter-button ${filter === 'incomplete' ? 'active' : ''}`}
                    onClick={() => setFilter('incomplete')}
                  >
                    Incomplete ({imageNodes.filter((n) => !n.altTextData || n.altTextData.status === 'incomplete').length})
                  </button>
                  <button
                    className={`filter-button ${filter === 'complete' ? 'active' : ''}`}
                    onClick={() => setFilter('complete')}
                  >
                    Complete ({imageNodes.filter((n) => n.altTextData?.status === 'complete').length})
                  </button>
                  <button
                    className={`filter-button ${filter === 'decorative' ? 'active' : ''}`}
                    onClick={() => setFilter('decorative')}
                  >
                    Decorative ({imageNodes.filter((n) => n.altTextData?.isDecorative).length})
                  </button>
                </div>
              </div>

              {/* Image nodes list */}
              <div className="alt-text-panel__list">
                {filteredNodes.map((node) => (
                  <div
                    key={node.nodeId}
                    className="image-node-item"
                    onClick={() => handleNodeClick(node.nodeId)}
                  >
                    <div className="image-node-item__info">
                      <div className="image-node-item__name">{node.nodeName}</div>
                      <div className="image-node-item__details">
                        {node.type} • {Math.round(node.width)} × {Math.round(node.height)}
                      </div>
                      {node.altTextData && (
                        <div className="image-node-item__alt-text">
                          {node.altTextData.isDecorative ? (
                            <span className="decorative-label">Decorative, no alt text required</span>
                          ) : (
                            <span className="alt-text-preview">
                              {node.altTextData.altText || 'No alt text'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="image-node-item__status">
                      {node.altTextData?.status === 'complete' && (
                        <Icon name="check-circle" size={20} color="#10b981" />
                      )}
                      {node.altTextData?.isDecorative && (
                        <Icon name="minus-circle" size={20} color="#6b7280" />
                      )}
                      {(!node.altTextData || node.altTextData.status === 'incomplete') && (
                        <Icon name="alert-circle" size={20} color="#ef4444" />
                      )}
                      {node.altTextData?.status === 'needs-review' && (
                        <Icon name="alert-triangle" size={20} color="#f59e0b" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {filteredNodes.length === 0 && (
                <div className="alt-text-panel__empty-filter">
                  <p>No images match the selected filter</p>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Add Alt-Text Modal */}
      {selectedNode && (
        <AddAltTextModal
          nodeId={selectedNode}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};
