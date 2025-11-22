import React, { useState, useEffect } from 'react';
import './TouchTargetsPanel.css';
import { Icon } from '../../../../components/ui/Icon/Icon';
import { Button } from '../../../../components/ui/Button/Button';
import { useFigmaMessage } from '../../../../hooks/useFigmaMessage';
import { TouchTargetResult, Platform, ComplianceLevel } from '../touch-targets.types';

export const TouchTargetsPanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [results, setResults] = useState<TouchTargetResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [platform, setPlatform] = useState<Platform>('web');
  const [level, setLevel] = useState<ComplianceLevel>('AA');
  const [filter, setFilter] = useState<'all' | 'pass' | 'fail'>('all');
  const { sendMessage } = useFigmaMessage();

  // Listen for messages from plugin code
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;

      if (msg?.type === 'TOUCH_TARGETS_RESULT') {
        setLoading(false);
        if (msg.success) {
          setResults(msg.data);
          setError(null);
        } else {
          setError(msg.error || 'Failed to check touch targets');
          setResults([]);
        }
      } else if (msg?.type === 'TOUCH_TARGET_FIXED') {
        if (msg.success) {
          // Refresh results after fix
          requestCheckPage();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const requestCheckPage = () => {
    setLoading(true);
    setError(null);
    sendMessage('CHECK_TOUCH_TARGETS_PAGE', { platform, level });
  };

  const requestCheckSelection = () => {
    setLoading(true);
    setError(null);
    sendMessage('CHECK_TOUCH_TARGETS_SELECTION', { platform, level });
  };

  const requestFix = (nodeId: string, requiredWidth: number, requiredHeight: number) => {
    sendMessage('FIX_TOUCH_TARGET', { nodeId, requiredWidth, requiredHeight });
  };

  const filteredResults = results.filter((result) => {
    if (filter === 'pass') return result.passes;
    if (filter === 'fail') return !result.passes;
    return true;
  });

  const passCount = results.filter((r) => r.passes).length;
  const failCount = results.filter((r) => !r.passes).length;

  return (
    <div className="touch-targets-panel">
      <div className="touch-targets-panel__header">
        <Button variant="ghost" size="small" onClick={onBack}>
          <Icon name="chevron-left" size={20} />
        </Button>
        <h2>Touch Targets</h2>
      </div>

      <div className="touch-targets-panel__content">
        {/* Platform and Level Selectors */}
        <div className="touch-targets-controls">
          <div className="control-group">
            <label className="control-label">Platform</label>
            <select
              className="control-select"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
            >
              <option value="web">Web (WCAG)</option>
              <option value="ios">iOS</option>
              <option value="android">Android</option>
              <option value="windows">Windows</option>
            </select>
          </div>

          <div className="control-group">
            <label className="control-label">Level</label>
            <select
              className="control-select"
              value={level}
              onChange={(e) => setLevel(e.target.value as ComplianceLevel)}
            >
              <option value="AA">AA</option>
              <option value="AAA">AAA</option>
            </select>
          </div>
        </div>

        {/* Check Buttons */}
        <div className="touch-targets-actions">
          <Button
            variant="primary"
            onClick={requestCheckPage}
            disabled={loading}
          >
            <Icon name="check" size={16} />
            Check Page
          </Button>
          <Button
            variant="secondary"
            onClick={requestCheckSelection}
            disabled={loading}
          >
            <Icon name="check" size={16} />
            Check Selection
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="touch-targets-panel__loading">
            <p>Checking touch targets...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="touch-targets-panel__error">
            <p>{error}</p>
          </div>
        )}

        {/* Results */}
        {!loading && !error && results.length > 0 && (
          <>
            {/* Summary Stats */}
            <div className="touch-targets-summary">
              <div className="summary-stat">
                <span className="summary-stat__value">{results.length}</span>
                <span className="summary-stat__label">Total</span>
              </div>
              <div className="summary-stat summary-stat--pass">
                <span className="summary-stat__value">{passCount}</span>
                <span className="summary-stat__label">Pass</span>
              </div>
              <div className="summary-stat summary-stat--fail">
                <span className="summary-stat__value">{failCount}</span>
                <span className="summary-stat__label">Fail</span>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="touch-targets-filters">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All ({results.length})
              </button>
              <button
                className={`filter-btn ${filter === 'pass' ? 'active' : ''}`}
                onClick={() => setFilter('pass')}
              >
                Pass ({passCount})
              </button>
              <button
                className={`filter-btn ${filter === 'fail' ? 'active' : ''}`}
                onClick={() => setFilter('fail')}
              >
                Fail ({failCount})
              </button>
            </div>

            {/* Results List */}
            <div className="touch-targets-results">
              {filteredResults.map((result) => (
                <div
                  key={result.nodeId}
                  className={`touch-target-item ${result.passes ? 'pass' : 'fail'}`}
                >
                  <div className="touch-target-item__header">
                    {result.passes ? (
                      <Icon name="check" size={20} color="#10b981" />
                    ) : (
                      <Icon name="close" size={20} color="#ef4444" />
                    )}
                    <div className="touch-target-item__info">
                      <div className="touch-target-item__name">{result.nodeName}</div>
                      <div className="touch-target-item__type">{result.nodeType}</div>
                    </div>
                  </div>

                  <div className="touch-target-item__size">
                    <div className="size-comparison">
                      <span className="size-current">
                        {result.width} × {result.height}
                      </span>
                      <Icon name="arrow-right" size={12} color="var(--figma-color-text-tertiary)" />
                      <span className="size-required">
                        {result.requiredWidth} × {result.requiredHeight}
                      </span>
                    </div>
                  </div>

                  <div className="touch-target-item__message">
                    {result.message}
                  </div>

                  {!result.passes && (
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => requestFix(result.nodeId, result.requiredWidth, result.requiredHeight)}
                    >
                      <Icon name="check" size={14} />
                      Fix
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && !error && results.length === 0 && (
          <div className="touch-targets-panel__empty">
            <p>No interactive elements found.</p>
            <p className="empty-hint">
              Click "Check Page" to scan for interactive elements like buttons and links.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
