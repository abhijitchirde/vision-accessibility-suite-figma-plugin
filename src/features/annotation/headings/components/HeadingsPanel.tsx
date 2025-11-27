import React, { useState, useEffect } from 'react';
import './HeadingsPanel.css';
import { Icon } from '../../../../components/ui/Icon/Icon';
import { Button } from '../../../../components/ui/Button/Button';
import { useFigmaMessage } from '../../../../hooks/useFigmaMessage';
import { HeadingItem, HeadingLevel, HeadingStats } from '../headings.types';
import { getHeadingBadgeColor } from '../headings.constants';

// Heading level options for dropdown
const HEADING_LEVELS: HeadingLevel[] = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];

// Group headings by parent frame
interface GroupedHeadings {
  [frameId: string]: {
    frameName: string;
    headings: HeadingItem[];
  };
}

export const HeadingsPanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [stats, setStats] = useState<HeadingStats | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<HeadingLevel>('H1');
  const [loading, setLoading] = useState(true);
  const [annotationsVisible, setAnnotationsVisible] = useState(true);
  const [showOutline, setShowOutline] = useState(false);
  const { sendMessage } = useFigmaMessage();

  // Load headings when component mounts
  useEffect(() => {
    loadHeadings();
    loadStats();

    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;

      if (msg?.type === 'HEADINGS_LOADED') {
        setLoading(false);
        if (msg.success) {
          setHeadings(msg.data.items);
        }
      }

      if (msg?.type === 'HEADING_STATS_LOADED') {
        if (msg.success) {
          setStats(msg.data.stats);
        }
      }

      if (msg?.type === 'HEADING_ADDED') {
        if (msg.success) {
          setHeadings(msg.data.items);
          loadStats();
        } else {
          alert(msg.error || 'Failed to add heading');
        }
      }

      if (msg?.type === 'HEADING_REMOVED') {
        if (msg.success) {
          setHeadings(msg.data.items);
          loadStats();
        }
      }

      if (msg?.type === 'HEADING_LEVEL_UPDATED') {
        if (msg.success) {
          setHeadings(msg.data.items);
          loadStats();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const loadHeadings = () => {
    setLoading(true);
    sendMessage('GET_HEADINGS');
  };

  const loadStats = () => {
    sendMessage('GET_HEADING_STATS');
  };

  const handleAddHeading = () => {
    sendMessage('ADD_HEADING', { level: selectedLevel });
  };

  const handleRemoveHeading = (nodeId: string) => {
    sendMessage('REMOVE_HEADING', { nodeId });
  };

  const handleUpdateLevel = (nodeId: string, newLevel: HeadingLevel) => {
    sendMessage('UPDATE_HEADING_LEVEL', { nodeId, level: newLevel });
  };

  const handleZoomToHeading = (nodeId: string) => {
    sendMessage('ZOOM_TO_HEADING', { nodeId });
  };

  const handleToggleAnnotations = () => {
    const newVisibility = !annotationsVisible;
    setAnnotationsVisible(newVisibility);
    sendMessage('TOGGLE_HEADING_ANNOTATIONS', { visible: newVisibility });
  };

  // Group headings by parent frame
  const groupedHeadings = (): GroupedHeadings => {
    const groups: GroupedHeadings = {
      '': {
        frameName: 'Ungrouped',
        headings: [],
      },
    };

    for (const heading of headings) {
      const frameId = heading.parentFrameId || '';
      const frameName = heading.parentFrameName || 'Ungrouped';

      if (!groups[frameId]) {
        groups[frameId] = {
          frameName,
          headings: [],
        };
      }

      groups[frameId].headings.push(heading);
    }

    return groups;
  };

  const groups = groupedHeadings();

  return (
    <div className="headings-panel">
      {/* Header */}
      <div className="headings-panel-header">
        <button onClick={onBack} className="back-button">
          <Icon name="chevron-left" size={16} />
        </button>
        <h2>Headings</h2>
        <button
          className="icon-button"
          onClick={handleToggleAnnotations}
          title={annotationsVisible ? 'Hide annotations' : 'Show annotations'}
        >
          <Icon name={annotationsVisible ? 'eye' : 'eye-slash'} size={16} />
        </button>
      </div>

      {/* Instructions */}
      <div className="headings-instructions">
        <p>Select any text layer to indicate its hierarchy and click add</p>
      </div>

      {/* Add Heading Section */}
      <div className="headings-add-section">
        <div className="headings-level-selector-wrapper">
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value as HeadingLevel)}
            className="headings-level-selector"
          >
            {HEADING_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
        <Button variant="primary" onClick={handleAddHeading}>
          Add
        </Button>
      </div>

      {/* Stats Section */}
      {stats && stats.total > 0 && (
        <div className="headings-stats">
          <div className="headings-stats-row">
            <span>Total Headings:</span>
            <strong>{stats.total}</strong>
          </div>
          <div className="headings-level-counts">
            {HEADING_LEVELS.map((level) => (
              <div key={level} className="heading-level-stat">
                <span
                  className="heading-level-badge-small"
                  style={{ backgroundColor: getHeadingBadgeColor(level) }}
                >
                  {level}
                </span>
                <span>{stats.byLevel[level]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validation Issues */}
      {stats && stats.validationIssues.length > 0 && (
        <div className="headings-validation">
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

      {/* Headings List */}
      <div className="headings-list">
        {loading ? (
          <div className="headings-loading">Loading...</div>
        ) : headings.length === 0 ? (
          <div className="headings-empty">
            <Icon name="heading" size={32} />
            <p>No headings added yet</p>
            <p className="headings-empty-hint">
              Select a text layer and click "Add" to assign a heading level
            </p>
          </div>
        ) : (
          Object.entries(groups).map(([frameId, group]) =>
            group.headings.length > 0 ? (
              <div key={frameId} className="headings-group">
                <div className="headings-group-header">
                  <Icon name="frame" size={14} />
                  <span>{group.frameName}</span>
                </div>
                {group.headings.map((heading) => (
                  <HeadingItemRow
                    key={heading.nodeId}
                    heading={heading}
                    onRemove={handleRemoveHeading}
                    onZoom={handleZoomToHeading}
                    onUpdateLevel={handleUpdateLevel}
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

// Individual heading item row
const HeadingItemRow: React.FC<{
  heading: HeadingItem;
  onRemove: (nodeId: string) => void;
  onZoom: (nodeId: string) => void;
  onUpdateLevel: (nodeId: string, level: HeadingLevel) => void;
}> = ({ heading, onRemove, onZoom, onUpdateLevel }) => {
  const [isEditing, setIsEditing] = useState(false);

  const bgColor = getHeadingBadgeColor(heading.level);

  return (
    <div className="heading-item">
      <div
        className="heading-item-badge"
        style={{ backgroundColor: bgColor }}
        onClick={() => setIsEditing(!isEditing)}
      >
        {isEditing ? (
          <select
            value={heading.level}
            onChange={(e) => {
              onUpdateLevel(heading.nodeId, e.target.value as HeadingLevel);
              setIsEditing(false);
            }}
            onClick={(e) => e.stopPropagation()}
            className="heading-item-level-dropdown"
            autoFocus
            onBlur={() => setIsEditing(false)}
          >
            {HEADING_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        ) : (
          <span>{heading.level}</span>
        )}
      </div>
      <div className="heading-item-content" onClick={() => onZoom(heading.nodeId)}>
        <span className="heading-item-text" title={heading.text}>
          {heading.text || <em>Empty heading</em>}
        </span>
        <div className="heading-item-metadata">
          <span className="heading-metadata-item">{heading.fontFamily}</span>
          <span className="heading-metadata-separator">•</span>
          <span className="heading-metadata-item">{Math.round(heading.fontSize)}px</span>
          <span className="heading-metadata-separator">•</span>
          <span className="heading-metadata-item">{heading.fontWeight}</span>
        </div>
      </div>
      <button
        className="heading-item-delete"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(heading.nodeId);
        }}
        title="Remove heading"
      >
        <Icon name="trash" size={16} />
      </button>
    </div>
  );
};
