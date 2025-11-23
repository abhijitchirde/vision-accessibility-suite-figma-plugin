import React, { useState, useEffect } from "react";
import "./TypographyPanel.css";
import { Icon } from "../../../../components/ui/Icon/Icon";
import { Button } from "../../../../components/ui/Button/Button";
import { useFigmaMessage } from "../../../../hooks/useFigmaMessage";
import { TypographyResult, TypographyRuleType } from "../typography.types";

export const TypographyPanel: React.FC<{ onBack: () => void }> = ({
  onBack,
}) => {
  const [results, setResults] = useState<TypographyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pass" | "fail" | "attention">(
    "all"
  );
  const [checkMode, setCheckMode] = useState<"page" | "selection" | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [selectedRules, setSelectedRules] = useState<Set<TypographyRuleType>>(
    new Set(["font-size", "line-height"])
  );
  const [showBulkFix, setShowBulkFix] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [applyingFixes, setApplyingFixes] = useState(false);
  const [bulkFixOptions, setBulkFixOptions] = useState({
    fixFontSize: false,
    targetFontSize: 16,
    fixLineHeight: false,
    targetLineHeight: 1.5,
    fixLetterSpacing: false,
    fixAlignment: false,
  });

  const { sendMessage } = useFigmaMessage();

  // Notify plugin code when Typography panel mounts/unmounts
  useEffect(() => {
    const options = {
      checkFontSize: selectedRules.has("font-size"),
      checkLineHeight: selectedRules.has("line-height"),
      checkLineLength: selectedRules.has("line-length"),
      checkLetterSpacing: selectedRules.has("letter-spacing"),
      checkTextAlign: selectedRules.has("text-align"),
      checkFontWeight: selectedRules.has("font-weight"),
    };

    // Notify plugin that Typography panel is mounted
    sendMessage("TYPOGRAPHY_PANEL_MOUNTED", { options });

    // Cleanup: Notify plugin when panel unmounts
    return () => {
      sendMessage("TYPOGRAPHY_PANEL_UNMOUNTED", {});
    };
  }, []); // Run only on mount/unmount

  // Update options when selected rules change
  useEffect(() => {
    const options = {
      checkFontSize: selectedRules.has("font-size"),
      checkLineHeight: selectedRules.has("line-height"),
      checkLineLength: selectedRules.has("line-length"),
      checkLetterSpacing: selectedRules.has("letter-spacing"),
      checkTextAlign: selectedRules.has("text-align"),
      checkFontWeight: selectedRules.has("font-weight"),
    };

    sendMessage("TYPOGRAPHY_UPDATE_OPTIONS", { options });
  }, [selectedRules, sendMessage]);

  // Collapse bulk fix panel when selection changes (track node IDs)
  const nodeIds = results.map((r) => r.nodeId).join(",");
  useEffect(() => {
    setShowBulkFix(false);
  }, [nodeIds]);

  // Listen for messages from plugin code
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;

      if (msg?.type === "TYPOGRAPHY_RESULT") {
        setLoading(false);
        if (msg.success) {
          setResults(msg.data);
          setError(null);
          // Set check mode to selection for auto-checked results
          if (msg.data.length > 0 && checkMode === null) {
            setCheckMode("selection");
          }
        } else {
          setError(msg.error || "Failed to check typography");
          setResults([]);
        }
      } else if (msg?.type === "TYPOGRAPHY_BULK_FIXED") {
        setApplyingFixes(false);
        if (msg.success) {
          // Show success message
          console.log(`Successfully fixed ${msg.fixedCount} text nodes`);
          // Refresh results after bulk fix - use the same check mode as before
          setLoading(true);
          const options = {
            checkFontSize: selectedRules.has("font-size"),
            checkLineHeight: selectedRules.has("line-height"),
            checkLineLength: selectedRules.has("line-length"),
            checkLetterSpacing: selectedRules.has("letter-spacing"),
            checkTextAlign: selectedRules.has("text-align"),
            checkFontWeight: selectedRules.has("font-weight"),
          };
          // Use the appropriate check based on mode
          if (checkMode === "selection") {
            sendMessage("CHECK_TYPOGRAPHY_SELECTION", options);
          } else {
            sendMessage("CHECK_TYPOGRAPHY_PAGE", options);
          }
          setShowBulkFix(false);
        } else {
          setError("Failed to apply bulk fixes");
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [selectedRules, sendMessage, checkMode]);

  const requestCheckPage = () => {
    setLoading(true);
    setError(null);
    setCheckMode("page");
    setIsMonitoring(true);
    const options = {
      checkFontSize: selectedRules.has("font-size"),
      checkLineHeight: selectedRules.has("line-height"),
      checkLineLength: selectedRules.has("line-length"),
      checkLetterSpacing: selectedRules.has("letter-spacing"),
      checkTextAlign: selectedRules.has("text-align"),
      checkFontWeight: selectedRules.has("font-weight"),
    };
    sendMessage("START_TYPOGRAPHY_MONITORING", options);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    setCheckMode(null);
    sendMessage("STOP_TYPOGRAPHY_MONITORING", {});
  };

  const requestCheckSelection = () => {
    setLoading(true);
    setError(null);
    setCheckMode("selection");
    const options = {
      checkFontSize: selectedRules.has("font-size"),
      checkLineHeight: selectedRules.has("line-height"),
      checkLineLength: selectedRules.has("line-length"),
      checkLetterSpacing: selectedRules.has("letter-spacing"),
      checkTextAlign: selectedRules.has("text-align"),
      checkFontWeight: selectedRules.has("font-weight"),
    };
    sendMessage("CHECK_TYPOGRAPHY_SELECTION", options);
  };

  const requestBulkFix = () => {
    const nodesToFix = results
      .filter((r) => r.status === "fail" || r.status === "attention")
      .map((r) => r.nodeId);
    console.log(
      `Requesting bulk fix for ${nodesToFix.length} nodes`,
      bulkFixOptions
    );
    setApplyingFixes(true);
    setError(null);
    sendMessage("TYPOGRAPHY_BULK_FIX", {
      nodeIds: nodesToFix,
      options: bulkFixOptions,
    });
  };

  const handleZoomToNode = (nodeId: string) => {
    sendMessage("ZOOM_TO_NODE", { nodeId });
  };

  const toggleRule = (rule: TypographyRuleType) => {
    const newRules = new Set(selectedRules);
    if (newRules.has(rule)) {
      newRules.delete(rule);
    } else {
      newRules.add(rule);
    }
    setSelectedRules(newRules);
  };

  const filteredResults = results
    .filter((result) => {
      if (filter === "pass") return result.status === "pass";
      if (filter === "fail") return result.status === "fail";
      if (filter === "attention") return result.status === "attention";
      return true;
    })
    .sort((a, b) => {
      // Sort order: fail, attention, pass
      const statusOrder = { fail: 0, attention: 1, pass: 2 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];

      // If same status, sort by severity: critical, high, medium, low
      if (statusDiff === 0) {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }

      return statusDiff;
    });

  const passCount = results.filter((r) => r.status === "pass").length;
  const failCount = results.filter((r) => r.status === "fail").length;
  const attentionCount = results.filter((r) => r.status === "attention").length;

  return (
    <div className="typography-panel">
      <div className="typography-panel__header">
        <Button variant="ghost" size="small" onClick={onBack}>
          <Icon name="chevron-left" size={20} />
        </Button>
        <h2>Typography</h2>
      </div>

      <div className="typography-panel__content">
        {/* Validation Rules Selector */}
        <div className="typography-rules">
          <button
            className="rules-accordion-button"
            onClick={() => setShowRules(!showRules)}
          >
            <span>Validation Rules</span>
            <div className="rules-accordion-right">
              <span className="rules-count">{selectedRules.size} rules selected</span>
              <Icon
                name={showRules ? "chevron-up" : "chevron-down"}
                size={16}
                color="#666"
              />
            </div>
          </button>

          {showRules && (
            <div className="rules-grid">
              {(
                [
                  "font-size",
                  "line-height",
                  "line-length",
                  "letter-spacing",
                  "text-align",
                  "font-weight",
                ] as TypographyRuleType[]
              ).map((rule) => (
                <label key={rule} className="rule-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedRules.has(rule)}
                    onChange={() => toggleRule(rule)}
                  />
                  <span className="rule-label">
                    {rule
                      .replace("-", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Check Buttons */}
        <div className="typography-actions">
          {!isMonitoring ? (
            <Button
              variant="primary"
              onClick={requestCheckPage}
              disabled={loading || selectedRules.size === 0}
            >
              Monitor entire page
            </Button>
          ) : (
            <>
              <Button variant="primary" disabled>
                <span className="spin-icon">
                  <Icon name="refresh-cw" size={16} />
                </span>
                Monitoring...
              </Button>
              <Button
                variant="secondary"
                onClick={stopMonitoring}
                className="stop-button"
              >
                Stop
              </Button>
            </>
          )}
        </div>

        {/* Monitoring Helper Text */}
        {isMonitoring && (
          <div className="monitoring-helper">
            <Icon name="alert-circle" size={16} color="#18a0fb" />
            <span>
              You can do the text updates while I monitor the page for you
            </span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="typography-panel__loading">
            <p>Checking typography...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="typography-panel__error">
            <p>{error}</p>
          </div>
        )}

        {/* Results */}
        {!loading && !error && results.length > 0 && (
          <>
            {/* Summary Stats - Clickable Filters */}
            <div className="typography-summary">
              <div
                className={`summary-stat summary-stat--pass ${
                  filter === "pass" ? "active" : ""
                }`}
                onClick={() => setFilter(filter === "pass" ? "all" : "pass")}
              >
                <span className="summary-stat__value">{passCount}</span>
                <span className="summary-stat__label">Pass</span>
              </div>
              <div
                className={`summary-stat summary-stat--fail ${
                  filter === "fail" ? "active" : ""
                }`}
                onClick={() => setFilter(filter === "fail" ? "all" : "fail")}
              >
                <span className="summary-stat__value">{failCount}</span>
                <span className="summary-stat__label">Fail</span>
              </div>
              <div
                className={`summary-stat summary-stat--attention ${
                  filter === "attention" ? "active" : ""
                }`}
                onClick={() =>
                  setFilter(filter === "attention" ? "all" : "attention")
                }
              >
                <span className="summary-stat__value">{attentionCount}</span>
                <span className="summary-stat__label">Attention</span>
              </div>
            </div>

            {/* Bulk Fix Actions */}
            {(failCount > 0 || attentionCount > 0) && (
              <div className="typography-bulk-fix">
                <button
                  className="bulk-fix-accordion-button"
                  onClick={() => setShowBulkFix(!showBulkFix)}
                >
                  <span>
                    {checkMode === "selection"
                      ? "Fix Selected Text"
                      : "Bulk Fix Options"}
                  </span>
                  <Icon
                    name={showBulkFix ? "chevron-up" : "chevron-down"}
                    size={16}
                    color="#666"
                  />
                </button>

                {showBulkFix && (
                  <div className="bulk-fix-panel">
                    <label className="bulk-fix-option">
                      <input
                        type="checkbox"
                        checked={bulkFixOptions.fixFontSize}
                        onChange={(e) =>
                          setBulkFixOptions({
                            ...bulkFixOptions,
                            fixFontSize: e.target.checked,
                          })
                        }
                      />
                      <span>Set minimum font size to</span>
                      <input
                        type="number"
                        className="bulk-fix-input"
                        value={bulkFixOptions.targetFontSize}
                        onChange={(e) =>
                          setBulkFixOptions({
                            ...bulkFixOptions,
                            targetFontSize: parseInt(e.target.value),
                          })
                        }
                        min="11"
                        max="72"
                      />
                      <span>px</span>
                    </label>

                    <label className="bulk-fix-option">
                      <input
                        type="checkbox"
                        checked={bulkFixOptions.fixLineHeight}
                        onChange={(e) =>
                          setBulkFixOptions({
                            ...bulkFixOptions,
                            fixLineHeight: e.target.checked,
                          })
                        }
                      />
                      <span>Set line height to</span>
                      <input
                        type="number"
                        className="bulk-fix-input"
                        value={bulkFixOptions.targetLineHeight}
                        onChange={(e) =>
                          setBulkFixOptions({
                            ...bulkFixOptions,
                            targetLineHeight: parseFloat(e.target.value),
                          })
                        }
                        min="1.0"
                        max="3.0"
                        step="0.1"
                      />
                    </label>

                    <label className="bulk-fix-option">
                      <input
                        type="checkbox"
                        checked={bulkFixOptions.fixLetterSpacing}
                        onChange={(e) =>
                          setBulkFixOptions({
                            ...bulkFixOptions,
                            fixLetterSpacing: e.target.checked,
                          })
                        }
                      />
                      <span>Fix letter spacing (WCAG minimum)</span>
                    </label>

                    <label className="bulk-fix-option">
                      <input
                        type="checkbox"
                        checked={bulkFixOptions.fixAlignment}
                        onChange={(e) =>
                          setBulkFixOptions({
                            ...bulkFixOptions,
                            fixAlignment: e.target.checked,
                          })
                        }
                      />
                      <span>Fix text alignment (justified → left)</span>
                    </label>

                    <Button
                      variant="primary"
                      onClick={requestBulkFix}
                      disabled={
                        !Object.values(bulkFixOptions)
                          .slice(0, 4)
                          .some(Boolean) || applyingFixes
                      }
                    >
                      {applyingFixes
                        ? "Applying fixes..."
                        : checkMode === "selection"
                        ? "Apply Fixes to Selected Text"
                        : `Apply Fixes to ${
                            failCount + attentionCount
                          } Text Nodes`}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Results List */}
            <div className="typography-results">
              {filteredResults.map((result) => (
                <div
                  key={result.nodeId}
                  className={`typography-item ${result.status} severity-${result.severity}`}
                  onClick={() => handleZoomToNode(result.nodeId)}
                >
                  <div className="typography-item__header">
                    {result.status === "pass" ? (
                      <Icon name="check" size={20} color="#10b981" />
                    ) : result.status === "fail" ? (
                      <Icon name="close" size={20} color="#ef4444" />
                    ) : (
                      <Icon name="alert-triangle" size={20} color="#f59e0b" />
                    )}
                    <div className="typography-item__info">
                      <div className="typography-item__name">
                        {result.nodeName}
                      </div>
                      <div className="typography-item__meta">
                        {result.fontSize}px • LH:{" "}
                        {typeof result.lineHeight === "object" &&
                        result.lineHeight !== null &&
                        result.lineHeight.unit !== "AUTO"
                          ? `${(result.lineHeight.value / 100).toFixed(1)}`
                          : "AUTO"}
                      </div>
                    </div>
                  </div>

                  {/* Preview Text */}
                  <div className="typography-item__preview">
                    {result.characters.substring(0, 80)}
                    {result.characters.length > 80 && "..."}
                  </div>

                  {/* Issues List */}
                  {result.issues.length > 0 && (
                    <div className="typography-item__issues">
                      {result.issues.map((issue, index) => (
                        <div
                          key={index}
                          className={`issue-badge issue-badge--${issue.severity}`}
                        >
                          <div className="issue-badge__type">
                            {issue.ruleType}
                          </div>
                          <div className="issue-badge__message">
                            {issue.message}
                          </div>
                          {issue.wcagReference && (
                            <a
                              href={issue.wcagReference}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="issue-badge__link"
                              onClick={(e) => e.stopPropagation()}
                            >
                              WCAG Reference
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && !error && results.length === 0 && (
          <div className="typography-panel__empty">
            {checkMode === "page" ? (
              <>
                <p>No text nodes found on this page.</p>
                <p className="empty-hint">
                  Add some text to the canvas to check typography.
                </p>
              </>
            ) : (
              <>
                <div className="empty-divider">Or</div>
                <p className="empty-main-hint">
                  Select any text layers to automatically check typography
                </p>
                <div className="empty-divider"></div>
                <p className="empty-secondary">No text layers selected.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
