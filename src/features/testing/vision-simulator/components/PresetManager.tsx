import React, { useState } from 'react';
import './PresetManager.css';
import { FilterPreset } from '../vision-simulator.types';
import { Icon } from '../../../../components/ui/Icon/Icon';
import { Button } from '../../../../components/ui/Button/Button';

interface PresetManagerProps {
  presets: FilterPreset[];
  onClose: () => void;
  onDeletePreset: (presetId: string) => void;
  onImportPresets: (presets: FilterPreset[]) => void;
  onExportPreset: (preset: FilterPreset) => void;
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
}) => {
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Separate built-in and custom presets
  const builtInPresets = presets.filter((p) => p.isBuiltIn);
  const customPresets = presets.filter((p) => !p.isBuiltIn);

  console.log('PresetManager rendered - Total presets:', presets.length, 'Custom:', customPresets.length);

  /**
   * Handle import file selection
   */
  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const text = await file.text();
      console.log('Importing file:', file.name);
      console.log('File content:', text);

      const imported = JSON.parse(text);
      console.log('Parsed JSON:', imported);

      // Validate imported data
      if (!Array.isArray(imported)) {
        console.error('Import failed: Not an array');
        setImportError('Invalid file format: Expected an array of presets');
        return;
      }

      // Validate each preset
      for (const preset of imported) {
        if (!preset.id || !preset.name || !Array.isArray(preset.filters)) {
          console.error('Import failed: Invalid preset format', preset);
          setImportError('Invalid preset format in imported file');
          return;
        }
      }

      console.log('Calling onImportPresets with:', imported);
      onImportPresets(imported as FilterPreset[]);

      const count = imported.length;
      setImportSuccess(`Successfully imported ${count} preset${count !== 1 ? 's' : ''}`);
      setImportError(null);

      // Clear success message after 3 seconds
      setTimeout(() => setImportSuccess(null), 3000);
    } catch (error) {
      console.error('Import error:', error);
      setImportError('Failed to parse JSON file');
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  /**
   * Export all custom presets
   */
  const handleExportAll = () => {
    const dataStr = JSON.stringify(customPresets, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vision-simulator-presets.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Copy JSON template to clipboard
   */
  const handleCopyTemplate = () => {
    const template = `[
  {
    "id": "custom-preset-1",
    "name": "My Custom Preset",
    "description": "Description of what this preset simulates",
    "filters": [
      {
        "type": "blurred",
        "config": {
          "radius": 8,
          "iterations": 2
        }
      },
      {
        "type": "yellowing",
        "config": {
          "intensity": 0.6,
          "temperature": 2500
        }
      }
    ]
  }
]`;

    // Create a temporary textarea element
    const textarea = document.createElement('textarea');
    textarea.value = template;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);

    try {
      textarea.select();
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy template:', error);
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
                    <div className="preset-manager__item-name">{preset.name}</div>
                    <div className="preset-manager__item-description">
                      {preset.description}
                    </div>
                    <div className="preset-manager__item-meta">
                      {preset.filters.length} filter{preset.filters.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <button
                    className="preset-manager__export-btn"
                    onClick={() => onExportPreset(preset)}
                    title="Export this preset"
                  >
                    <Icon name="download" size={16} />
                  </button>
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
                ? 'No custom presets yet. Import presets from a JSON file.'
                : 'Your custom presets can be edited or deleted.'}
            </p>
            {customPresets.length > 0 ? (
              <div className="preset-manager__list">
                {customPresets.map((preset) => (
                  <div key={preset.id} className="preset-manager__item">
                    <div className="preset-manager__item-info">
                      <div className="preset-manager__item-name">{preset.name}</div>
                      <div className="preset-manager__item-description">
                        {preset.description}
                      </div>
                      <div className="preset-manager__item-meta">
                        {preset.filters.length} filter{preset.filters.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="preset-manager__item-actions">
                      <button
                        className="preset-manager__export-btn"
                        onClick={() => onExportPreset(preset)}
                        title="Export this preset"
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
                style={{ display: 'none' }}
              />
            </label>

            {customPresets.length > 0 && (
              <Button variant="secondary" size="small" onClick={handleExportAll}>
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

          {/* JSON Template */}
          <div className="preset-manager__template">
            <h4 className="preset-manager__template-title">JSON format</h4>
            <p className="preset-manager__template-description">
              Use this format to create custom preset files:
            </p>
            <div className="preset-manager__template-wrapper">
              <button
                className="preset-manager__copy-btn"
                onClick={handleCopyTemplate}
                title={copied ? 'Copied!' : 'Copy template'}
              >
                <Icon name={copied ? 'clipboard-check' : 'clipboard'} size={14} />
              </button>
              <pre className="preset-manager__template-code">
                <span className="json-bracket">[</span>{'\n'}
                {'  '}<span className="json-bracket">{'{'}</span>{'\n'}
                {'    '}<span className="json-key">"id"</span><span className="json-punct">:</span> <span className="json-string">"custom-preset-1"</span><span className="json-punct">,</span>{'\n'}
                {'    '}<span className="json-key">"name"</span><span className="json-punct">:</span> <span className="json-string">"My Custom Preset"</span><span className="json-punct">,</span>{'\n'}
                {'    '}<span className="json-key">"description"</span><span className="json-punct">:</span> <span className="json-string">"Description of what this preset simulates"</span><span className="json-punct">,</span>{'\n'}
                {'    '}<span className="json-key">"filters"</span><span className="json-punct">:</span> <span className="json-bracket">[</span>{'\n'}
                {'      '}<span className="json-bracket">{'{'}</span>{'\n'}
                {'        '}<span className="json-key">"type"</span><span className="json-punct">:</span> <span className="json-string">"blurred"</span><span className="json-punct">,</span>{'\n'}
                {'        '}<span className="json-key">"config"</span><span className="json-punct">:</span> <span className="json-bracket">{'{'}</span>{'\n'}
                {'          '}<span className="json-key">"radius"</span><span className="json-punct">:</span> <span className="json-number">8</span><span className="json-punct">,</span>{'\n'}
                {'          '}<span className="json-key">"iterations"</span><span className="json-punct">:</span> <span className="json-number">2</span>{'\n'}
                {'        '}<span className="json-bracket">{'}'}</span>{'\n'}
                {'      '}<span className="json-bracket">{'}'}</span><span className="json-punct">,</span>{'\n'}
                {'      '}<span className="json-bracket">{'{'}</span>{'\n'}
                {'        '}<span className="json-key">"type"</span><span className="json-punct">:</span> <span className="json-string">"yellowing"</span><span className="json-punct">,</span>{'\n'}
                {'        '}<span className="json-key">"config"</span><span className="json-punct">:</span> <span className="json-bracket">{'{'}</span>{'\n'}
                {'          '}<span className="json-key">"intensity"</span><span className="json-punct">:</span> <span className="json-number">0.6</span><span className="json-punct">,</span>{'\n'}
                {'          '}<span className="json-key">"temperature"</span><span className="json-punct">:</span> <span className="json-number">2500</span>{'\n'}
                {'        '}<span className="json-bracket">{'}'}</span>{'\n'}
                {'      '}<span className="json-bracket">{'}'}</span>{'\n'}
                {'    '}<span className="json-bracket">]</span>{'\n'}
                {'  '}<span className="json-bracket">{'}'}</span>{'\n'}
                <span className="json-bracket">]</span>
              </pre>
            </div>
            <p className="preset-manager__template-note">
              Available filter types: protanopia, deuteranopia, tritanopia, achromatopsia,
              protanomaly, deuteranomaly, tritanomaly, central-vision-loss,
              peripheral-vision-loss, blurred, ghosting, yellowing, loss-of-contrast, bright-light
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
