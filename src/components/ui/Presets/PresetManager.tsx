import React, { useState } from "react";
import "./PresetManager.css";
import { FilterPreset } from "../../../utils/vision-simulator.types";
import {
  validatePreset,
  sanitizePresets,
  PRESET_FILTER_SPEC,
  FilterSettingSpec,
} from "../../../utils/preset-validation";
import { Icon } from "../Icon/Icon";
import { Button } from "../../ui/Button/Button";

/** Example preset file shown (and copied) in the manager */
const EXAMPLE_PRESETS = [
  {
    version: 2,
    id: "my-low-vision-preset",
    name: "My low vision preset",
    description: "Blur, less contrast and a dim centre",
    filters: [
      { type: "blurred", config: { radius: 3, iterations: 2 } },
      { type: "loss-of-contrast", config: { reduction: 0.4 } },
      { type: "central-vision-loss", config: { radiusPercent: 25, severity: 0.6 } },
    ],
  },
];
const EXAMPLE_JSON = JSON.stringify(EXAMPLE_PRESETS, null, 2);

/**
 * Filter reference, built from PRESET_FILTER_SPEC (the same ranges the
 * import check uses). Filters with identical settings (the color
 * blindness types) are grouped into one entry.
 */
const REFERENCE_GROUPS: {
  types: string[];
  about: string;
  settings: FilterSettingSpec[];
}[] = (() => {
  const groups: { types: string[]; about: string; settings: FilterSettingSpec[] }[] = [];
  const colorTypes = Object.keys(PRESET_FILTER_SPEC).filter(
    (type) => PRESET_FILTER_SPEC[type].settings.every((s) => s.path[0] === "severity")
  );
  if (colorTypes.length > 0) {
    groups.push({
      types: colorTypes,
      about: "Color blindness: -opia types are complete, -omaly types partial",
      settings: [
        {
          ...PRESET_FILTER_SPEC[colorTypes[0]].settings[0],
          about: "0 = normal vision, 1 = complete (default 1 for -opia, 0.6 for -omaly)",
        },
      ],
    });
  }
  for (const [type, spec] of Object.entries(PRESET_FILTER_SPEC)) {
    if (colorTypes.indexOf(type) === -1) {
      groups.push({ types: [type], about: spec.about, settings: spec.settings });
    }
  }
  return groups;
})();

function formatRange(setting: FilterSettingSpec): string {
  const unit = setting.unit ?? "";
  return `${setting.min}–${setting.max}${unit}`;
}

/** Minimal JSON syntax highlighting for the example */
function highlightJson(json: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const token = /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?)|([{}\[\],:])/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = token.exec(json))) {
    if (match.index > last) nodes.push(json.slice(last, match.index));
    if (match[1] && match[2]) {
      nodes.push(<span key={key++} className="json-key">{match[1]}</span>);
      nodes.push(<span key={key++} className="json-punct">{match[2]}</span>);
    } else if (match[1]) {
      nodes.push(<span key={key++} className="json-string">{match[1]}</span>);
    } else if (match[3]) {
      nodes.push(<span key={key++} className="json-number">{match[3]}</span>);
    } else {
      const bracket = /[{}\[\]]/.test(match[4]);
      nodes.push(
        <span key={key++} className={bracket ? "json-bracket" : "json-punct"}>{match[4]}</span>
      );
    }
    last = token.lastIndex;
  }
  if (last < json.length) nodes.push(json.slice(last));
  return nodes;
}


interface PresetManagerProps {
  presets: FilterPreset[];
  onClose: () => void;
  onDeletePreset: (presetId: string) => void;
  onImportPresets: (presets: FilterPreset[]) => void;
  onExportPreset: (preset: FilterPreset) => void;
  /** Make an editable custom copy (works for built-in presets too) */
  onDuplicatePreset: (preset: FilterPreset) => void;
  onRenamePreset: (presetId: string, name: string) => void;
}

/**
 * PresetManager modal component
 *
 * Allows users to manage custom presets:
 * - View all custom presets
 * - Delete custom presets
 * - Export presets as JSON
 * - Import presets from JSON
 */
export const PresetManager: React.FC<PresetManagerProps> = ({
  presets,
  onClose,
  onDeletePreset,
  onImportPresets,
  onExportPreset,
  onDuplicatePreset,
  onRenamePreset,
}) => {
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [copied, setCopied] = useState(false);
  // Custom preset being renamed, and the name typed so far
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const startRename = (preset: FilterPreset) => {
    setRenamingId(preset.id);
    setRenameValue(preset.name);
  };
  const finishRename = () => {
    const name = renameValue.trim();
    if (renamingId && name) onRenamePreset(renamingId, name);
    setRenamingId(null);
  };

  // Separate built-in and custom presets
  const builtInPresets = presets.filter((p) => p.isBuiltIn);
  const customPresets = presets.filter((p) => !p.isBuiltIn);


  /**
   * Handle import file selection
   */
  const handleImportFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const text = await file.text();

      const imported = JSON.parse(text);

      // Validate imported data
      if (!Array.isArray(imported)) {
        console.error("Import failed: Not an array");
        setImportError("Invalid file format: Expected an array of presets");
        return;
      }

      // Validate each preset fully (types and value ranges of every filter),
      // so a bad file can't break the preview
      for (const preset of imported) {
        const problem = validatePreset(preset);
        if (problem) {
          console.error("Import failed:", problem, preset);
          setImportError(`Can't import: ${problem}`);
          return;
        }
      }

      onImportPresets(sanitizePresets(imported));

      const count = imported.length;
      setImportSuccess(
        `Successfully imported ${count} preset${count !== 1 ? "s" : ""}`
      );
      setImportError(null);

      // Clear success message after 3 seconds
      setTimeout(() => setImportSuccess(null), 3000);
    } catch (error) {
      console.error("Import error:", error);
      setImportError("Failed to parse JSON file");
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = "";
    }
  };

  /**
   * Export all custom presets
   */
  const handleExportAll = () => {
    const dataStr = JSON.stringify(customPresets, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vision-simulator-presets.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Copy JSON template to clipboard
   */
  const handleCopyTemplate = () => {
    const template = EXAMPLE_JSON;

    // Create a temporary textarea element
    const textarea = document.createElement("textarea");
    textarea.value = template;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);

    try {
      textarea.select();
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy template:", error);
    } finally {
      document.body.removeChild(textarea);
    }
  };

  return (
    <div className="preset-manager-overlay" onClick={onClose}>
      <div className="preset-manager" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="preset-manager__header">
          <h2 className="preset-manager__title">Manage Presets</h2>
          <button className="preset-manager__close" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="preset-manager__content">
          {/* Built-in Presets */}
          <div className="preset-manager__section">
            <h3 className="preset-manager__section-title">
              Built-in Presets ({builtInPresets.length})
            </h3>
            <p className="preset-manager__section-description">
              These presets are provided by default and cannot be deleted.
            </p>
            <div className="preset-manager__list">
              {builtInPresets.map((preset) => (
                <div key={preset.id} className="preset-manager__item">
                  <div className="preset-manager__item-info">
                    <div className="preset-manager__item-name">
                      {preset.name}
                    </div>
                    <div className="preset-manager__item-description">
                      {preset.description}
                    </div>
                    <div className="preset-manager__item-meta">
                      {preset.filters.length} filter
                      {preset.filters.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="preset-manager__item-actions">
                    <button
                      className="preset-manager__export-btn"
                      onClick={() => onDuplicatePreset(preset)}
                      title="Duplicate as a custom preset you can change"
                      aria-label={`Duplicate ${preset.name}`}
                    >
                      <Icon name="duplicate" size={16} />
                    </button>
                    <button
                      className="preset-manager__export-btn"
                      onClick={() => onExportPreset(preset)}
                      title="Export this preset"
                      aria-label={`Export ${preset.name}`}
                    >
                      <Icon name="download" size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Presets */}
          <div className="preset-manager__section">
            <h3 className="preset-manager__section-title">
              Custom Presets ({customPresets.length})
            </h3>
            <p className="preset-manager__section-description">
              {customPresets.length === 0
                ? "No custom presets yet. Import presets from a JSON file."
                : "Rename, duplicate, export or delete your presets. To change a preset's simulations, pick it in Start from, edit, and Save as preset."}
            </p>
            {customPresets.length > 0 ? (
              <div className="preset-manager__list">
                {customPresets.map((preset) => (
                  <div key={preset.id} className="preset-manager__item">
                    <div className="preset-manager__item-info">
                      {renamingId === preset.id ? (
                        <div className="preset-manager__rename" role="group" aria-label="Rename preset">
                          <input
                            className="preset-manager__rename-input"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                finishRename();
                              } else if (e.key === "Escape") {
                                e.stopPropagation();
                                setRenamingId(null);
                              }
                            }}
                            maxLength={100}
                            aria-label="Preset name"
                            autoFocus
                            onFocus={(e) => e.target.select()}
                          />
                          <button
                            type="button"
                            className="preset-manager__rename-btn"
                            disabled={!renameValue.trim()}
                            onClick={finishRename}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="preset-manager__rename-btn"
                            onClick={() => setRenamingId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="preset-manager__item-name">
                          {preset.name}
                        </div>
                      )}
                      <div className="preset-manager__item-description">
                        {preset.description}
                      </div>
                      <div className="preset-manager__item-meta">
                        {preset.filters.length} filter
                        {preset.filters.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="preset-manager__item-actions">
                      <button
                        className="preset-manager__export-btn"
                        onClick={() => startRename(preset)}
                        title="Rename"
                        aria-label={`Rename ${preset.name}`}
                      >
                        <Icon name="edit" size={16} />
                      </button>
                      <button
                        className="preset-manager__export-btn"
                        onClick={() => onDuplicatePreset(preset)}
                        title="Duplicate"
                        aria-label={`Duplicate ${preset.name}`}
                      >
                        <Icon name="duplicate" size={16} />
                      </button>
                      <button
                        className="preset-manager__export-btn"
                        onClick={() => onExportPreset(preset)}
                        title="Export this preset"
                        aria-label={`Export ${preset.name}`}
                      >
                        <Icon name="download" size={16} />
                      </button>
                      <button
                        className="preset-manager__delete-btn"
                        onClick={() => {
                          if (confirm(`Delete preset "${preset.name}"?`)) {
                            onDeletePreset(preset.id);
                          }
                        }}
                        title="Delete this preset"
                        aria-label={`Delete ${preset.name}`}
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Import/Export Actions */}
          <div className="preset-manager__actions">
            <label className="preset-manager__import-btn">
              <Icon name="upload" size={16} />
              Import
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleImportFile}
                disabled={importing}
                style={{ display: "none" }}
              />
            </label>

            {customPresets.length > 0 && (
              <Button
                variant="secondary"
                size="small"
                onClick={handleExportAll}
              >
                <Icon name="download" size={16} />
                Export all
              </Button>
            )}
          </div>

          {importError && (
            <div className="preset-manager__error">{importError}</div>
          )}

          {importSuccess && (
            <div className="preset-manager__success">{importSuccess}</div>
          )}

          {/* Preset file format: example + filter reference */}
          <div className="preset-manager__template">
            <h4 className="preset-manager__template-title">Preset file format</h4>
            <p className="preset-manager__template-description">
              A preset file is a list of presets. Each preset's filters run
              from top to bottom, so order matters.
            </p>
            <div className="preset-manager__template-wrapper">
              <button
                className="preset-manager__copy-btn"
                onClick={handleCopyTemplate}
                title={copied ? "Copied!" : "Copy example"}
                aria-label={copied ? "Copied" : "Copy example"}
              >
                <Icon
                  name={copied ? "clipboard-check" : "clipboard"}
                  size={14}
                />
              </button>
              <pre className="preset-manager__template-code">
                {highlightJson(EXAMPLE_JSON)}
              </pre>
            </div>

            <details className="preset-manager__reference">
              <summary className="preset-manager__reference-summary">
                Filter reference
              </summary>
              <p className="preset-manager__template-description">
                Use these values for <code>"type"</code>. Settings marked
                optional can be left out. Sizes in px are design pixels;
                % is a share of the design's smaller side.
              </p>
              <ul className="preset-manager__reference-list">
                {REFERENCE_GROUPS.map((group) => (
                  <li key={group.types.join(",")} className="preset-manager__reference-item">
                    <div className="preset-manager__reference-types">
                      {group.types.map((type, i) => (
                        <React.Fragment key={type}>
                          {i > 0 && ", "}
                          <code>{type}</code>
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="preset-manager__reference-about">{group.about}</div>
                    <ul className="preset-manager__reference-settings">
                      {group.settings.map((setting) => (
                        <li key={setting.path.join(".")}>
                          <code>{setting.path.join(".")}</code>{" "}
                          {formatRange(setting)}
                          {setting.optional ? " (optional)" : ""} — {setting.about}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </details>

            <p className="preset-manager__template-note">
              Files saved by older versions of the plugin (without
              "version") are converted automatically when imported.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
