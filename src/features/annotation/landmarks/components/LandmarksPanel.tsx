import React, { useState, useEffect } from 'react';
import './LandmarksPanel.css';
import { Icon } from '../../../../components/ui/Icon/Icon';
import { Button } from '../../../../components/ui/Button/Button';
import { useFigmaMessage } from '../../../../hooks/useFigmaMessage';
import { LandmarkItem, LandmarkRole, LandmarkStats } from '../landmarks.types';
import { LANDMARK_METADATA, getLandmarkBadgeColor } from '../landmarks.constants';

// Landmark role options for dropdown
const LANDMARK_ROLES: LandmarkRole[] = ['header', 'nav', 'main', 'aside', 'footer', 'form', 'section'];

// Group landmarks by parent frame
interface GroupedLandmarks {
  [frameId: string]: {
    frameName: string;
    landmarks: LandmarkItem[];
  };
}

export const LandmarksPanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [landmarks, setLandmarks] = useState<LandmarkItem[]>([]);
  const [stats, setStats] = useState<LandmarkStats | null>(null);
  const [selectedRole, setSelectedRole] = useState<LandmarkRole>('main');
  const [loading, setLoading] = useState(true);
  const [annotationsVisible, setAnnotationsVisible] = useState(true);
  const { sendMessage } = useFigmaMessage();

  // Load landmarks when component mounts
  useEffect(() => {
    loadLandmarks();
    loadStats();

    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;

      if (msg?.type === 'LANDMARKS_LOADED') {
        setLoading(false);
        if (msg.success) {
          setLandmarks(msg.data.items);
        }
      }

      if (msg?.type === 'LANDMARK_STATS_LOADED') {
        if (msg.success) {
          setStats(msg.data.stats);
        }
      }

      if (msg?.type === 'LANDMARK_ADDED') {
        if (msg.success) {
          setLandmarks(msg.data.items);
          loadStats();
        } else {
          alert(msg.error || 'Failed to add landmark');
        }
      }

      if (msg?.type === 'LANDMARK_REMOVED') {
        if (msg.success) {
          setLandmarks(msg.data.items);
          loadStats();
        }
      }

      if (msg?.type === 'LANDMARK_ROLE_UPDATED') {
        if (msg.success) {
          setLandmarks(msg.data.items);
          loadStats();
        }
      }

      if (msg?.type === 'LANDMARK_LABEL_UPDATED') {
        if (msg.success) {
          setLandmarks(msg.data.items);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const loadLandmarks = () => {
    setLoading(true);
    sendMessage('GET_LANDMARKS');
  };

  const loadStats = () => {
    sendMessage('GET_LANDMARK_STATS');
  };

  const handleAddLandmark = () => {
    sendMessage('ADD_LANDMARK', { role: selectedRole });
  };

  const handleRemoveLandmark = (nodeId: string) => {
    sendMessage('REMOVE_LANDMARK', { nodeId });
  };

  const handleUpdateRole = (nodeId: string, newRole: LandmarkRole) => {
    sendMessage('UPDATE_LANDMARK_ROLE', { nodeId, role: newRole });
  };

  const handleUpdateLabel = (nodeId: string, label: string) => {
    sendMessage('UPDATE_LANDMARK_LABEL', { nodeId, label });
  };

  const handleZoomToLandmark = (nodeId: string) => {
    sendMessage('ZOOM_TO_LANDMARK', { nodeId });
  };

  const handleToggleAnnotations = () => {
    const newVisibility = !annotationsVisible;
    setAnnotationsVisible(newVisibility);
    sendMessage('TOGGLE_LANDMARK_ANNOTATIONS', { visible: newVisibility });
  };

  // Group landmarks by parent frame
  const groupedLandmarks = (): GroupedLandmarks => {
    const groups: GroupedLandmarks = {
      '': {
        frameName: 'Ungrouped',
        landmarks: [],
      },
    };

    for (const landmark of landmarks) {
      const frameId = landmark.parentFrameId || '';
      const frameName = landmark.parentFrameName || 'Ungrouped';

      if (!groups[frameId]) {
        groups[frameId] = {
          frameName,
          landmarks: [],
        };
      }

      groups[frameId].landmarks.push(landmark);
    }

    return groups;
  };

  const groups = groupedLandmarks();

  return (
    <div className="landmarks-panel">
      {/* Header */}
      <div className="landmarks-panel-header">
        <button onClick={onBack} className="back-button">
          <Icon name="chevron-left" size={16} />
        </button>
        <h2>Landmarks</h2>
        <button
          className="icon-button"
          onClick={handleToggleAnnotations}
          title={annotationsVisible ? 'Hide annotations' : 'Show annotations'}
        >
          <Icon name={annotationsVisible ? 'eye' : 'eye-slash'} size={16} />
        </button>
      </div>

      {/* Instructions */}
      <div className="landmarks-instructions">
        <p>Select a section on your design then pick a landmark and click the add button.</p>
      </div>

      {/* Add Landmark Section */}
      <div className="landmarks-add-section">
        <div className="landmarks-role-selector-wrapper">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as LandmarkRole)}
            className="landmarks-role-selector"
          >
            {LANDMARK_ROLES.map((role) => (
              <option key={role} value={role}>
                {LANDMARK_METADATA[role].htmlTag} - {LANDMARK_METADATA[role].label}
              </option>
            ))}
          </select>
        </div>
        <Button variant="primary" onClick={handleAddLandmark}>
          Add
        </Button>
      </div>

      {/* Stats Section */}
      {stats && stats.total > 0 && (
        <div className="landmarks-stats">
          <div className="landmarks-stats-row">
            <span>Total Landmarks:</span>
            <strong>{stats.total}</strong>
          </div>
          <div className="landmarks-role-counts">
            {LANDMARK_ROLES.map((role) => (
              stats.byRole[role] > 0 && (
                <div key={role} className="landmark-role-stat">
                  <span
                    className="landmark-role-badge-small"
                    style={{ backgroundColor: getLandmarkBadgeColor(role) }}
                  >
                    {LANDMARK_METADATA[role].htmlTag}
                  </span>
                  <span>{stats.byRole[role]}</span>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Validation Issues */}
      {stats && stats.validationIssues.length > 0 && (
        <div className="landmarks-validation">
          <h4>
            <Icon name="alert-triangle" size={16} />
            Validation Issues
          </h4>
          <div className="validation-issues-list">
            {stats.validationIssues.map((issue, index) => (
              <div
                key={index}
                className={`validation-issue validation-issue-${issue.severity}`}
              >
                <Icon
                  name={issue.severity === 'error' ? 'x-circle' : 'alert-circle'}
                  size={14}
                />
                <span>{issue.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Landmarks List */}
      <div className="landmarks-list">
        {loading ? (
          <div className="landmarks-loading">Loading...</div>
        ) : landmarks.length === 0 ? (
          <div className="landmarks-empty">
            <Icon name="map" size={32} />
            <p>No landmarks added yet</p>
            <p className="landmarks-empty-hint">
              Select a frame or section and click "Add" to assign a landmark role
            </p>
          </div>
        ) : (
          Object.entries(groups).map(([frameId, group]) =>
            group.landmarks.length > 0 ? (
              <div key={frameId} className="landmarks-group">
                <div className="landmarks-group-header">
                  <Icon name="frame" size={14} />
                  <span>{group.frameName}</span>
                </div>
                {group.landmarks.map((landmark) => (
                  <LandmarkItemRow
                    key={landmark.nodeId}
                    landmark={landmark}
                    onRemove={handleRemoveLandmark}
                    onZoom={handleZoomToLandmark}
                    onUpdateRole={handleUpdateRole}
                    onUpdateLabel={handleUpdateLabel}
                  />
                ))}
              </div>
            ) : null
          )
        )}
      </div>
    </div>
  );
};

// Individual landmark item row
const LandmarkItemRow: React.FC<{
  landmark: LandmarkItem;
  onRemove: (nodeId: string) => void;
  onZoom: (nodeId: string) => void;
  onUpdateRole: (nodeId: string, role: LandmarkRole) => void;
  onUpdateLabel: (nodeId: string, label: string) => void;
}> = ({ landmark, onRemove, onZoom, onUpdateRole, onUpdateLabel }) => {
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(landmark.label || '');

  const bgColor = getLandmarkBadgeColor(landmark.role);
  const metadata = LANDMARK_METADATA[landmark.role];

  const handleLabelBlur = () => {
    setIsEditingLabel(false);
    if (labelValue !== (landmark.label || '')) {
      onUpdateLabel(landmark.nodeId, labelValue);
    }
  };

  const handleLabelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLabelBlur();
    } else if (e.key === 'Escape') {
      setLabelValue(landmark.label || '');
      setIsEditingLabel(false);
    }
  };

  return (
    <div className="landmark-item">
      <div
        className="landmark-item-badge"
        style={{ backgroundColor: bgColor }}
        onClick={() => setIsEditingRole(!isEditingRole)}
      >
        {isEditingRole ? (
          <select
            value={landmark.role}
            onChange={(e) => {
              onUpdateRole(landmark.nodeId, e.target.value as LandmarkRole);
              setIsEditingRole(false);
            }}
            onClick={(e) => e.stopPropagation()}
            className="landmark-item-role-dropdown"
            autoFocus
            onBlur={() => setIsEditingRole(false)}
          >
            {LANDMARK_ROLES.map((role) => (
              <option key={role} value={role}>
                {LANDMARK_METADATA[role].htmlTag}
              </option>
            ))}
          </select>
        ) : (
          <span>{metadata.htmlTag}</span>
        )}
      </div>
      <div className="landmark-item-content" onClick={() => onZoom(landmark.nodeId)}>
        <span className="landmark-item-text" title={landmark.nodeName}>
          {landmark.nodeName}
        </span>
        <div className="landmark-item-metadata">
          <span className="landmark-metadata-item">{metadata.label}</span>
          {metadata.requiresLabel && (
            <>
              <span className="landmark-metadata-separator">•</span>
              {isEditingLabel ? (
                <input
                  type="text"
                  value={labelValue}
                  onChange={(e) => setLabelValue(e.target.value)}
                  onBlur={handleLabelBlur}
                  onKeyDown={handleLabelKeyDown}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="aria-label..."
                  className="landmark-label-input"
                  autoFocus
                />
              ) : (
                <span
                  className="landmark-metadata-label"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingLabel(true);
                  }}
                  title="Click to edit label"
                >
                  {landmark.label ? `"${landmark.label}"` : <em>No label</em>}
                </span>
              )}
            </>
          )}
        </div>
      </div>
      <button
        className="landmark-item-delete"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(landmark.nodeId);
        }}
        title="Remove landmark"
      >
        <Icon name="trash" size={16} />
      </button>
    </div>
  );
};



