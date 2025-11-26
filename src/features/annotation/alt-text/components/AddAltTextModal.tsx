import React, { useState, useEffect } from 'react';
import './AddAltTextModal.css';
import { Icon } from '../../../../components/ui/Icon/Icon';
import { Button } from '../../../../components/ui/Button/Button';
import { useFigmaMessage } from '../../../../hooks/useFigmaMessage';
import { AltTextData, AltTextValidationResult } from '../alt-text.types';
import { ALT_TEXT_GUIDELINES, HELP_TEXT } from '../alt-text.constants';

interface AddAltTextModalProps {
  nodeId: string;
  onClose: () => void;
}

export const AddAltTextModal: React.FC<AddAltTextModalProps> = ({ nodeId, onClose }) => {
  const [altText, setAltText] = useState('');
  const [isDecorative, setIsDecorative] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<AltTextValidationResult | null>(null);
  const [nodeName, setNodeName] = useState('');
  const { sendMessage } = useFigmaMessage();

  // Load existing alt text data
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;

      if (msg?.type === 'ALT_TEXT_DATA') {
        if (msg.success && msg.data) {
          const data = msg.data as AltTextData;
          setAltText(data.altText || '');
          setIsDecorative(data.isDecorative || false);
          setNodeName(data.nodeName || '');
        } else if (msg.nodeName) {
          setNodeName(msg.nodeName);
        }
      }

      if (msg?.type === 'ALT_TEXT_VALIDATED') {
        if (msg.success) {
          setValidation(msg.validation);
        }
      }

      if (msg?.type === 'ALT_TEXT_SAVED') {
        setLoading(false);
        if (msg.success) {
          onClose();
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Request existing data
    sendMessage('GET_ALT_TEXT_DATA', { nodeId });

    return () => window.removeEventListener('message', handleMessage);
  }, [nodeId]);

  // Validate alt text as user types
  useEffect(() => {
    if (altText || !isDecorative) {
      sendMessage('VALIDATE_ALT_TEXT', { altText, isDecorative });
    }
  }, [altText, isDecorative]);

  const handleSave = () => {
    setLoading(true);
    sendMessage('SAVE_ALT_TEXT', {
      nodeId,
      altText: isDecorative ? '' : altText.trim(),
      isDecorative,
    });
  };

  const handleDecorativeChange = (checked: boolean) => {
    setIsDecorative(checked);
    if (checked) {
      setAltText('');
    }
  };

  const charCount = altText.length;
  const charLimit = ALT_TEXT_GUIDELINES.MAX_LENGTH;
  const isOverLimit = charCount > charLimit;
  const isNearLimit = charCount > ALT_TEXT_GUIDELINES.OPTIMAL_LENGTH;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <Button variant="ghost" size="small" onClick={onClose}>
            <Icon name="chevron-left" size={20} />
          </Button>
          <h3>Add Alt-text</h3>
          <div className="modal-header__actions">
            <Button variant="ghost" size="small" onClick={() => {/* TODO: Show help */}}>
              <Icon name="help-circle" size={20} />
            </Button>
          </div>
        </div>

        <div className="modal-body">
          {/* Node name */}
          <div className="node-info">
            <Icon name="image" size={16} />
            <span className="node-name">{nodeName}</span>
          </div>

          {/* Decorative checkbox */}
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isDecorative}
              onChange={(e) => handleDecorativeChange(e.target.checked)}
            />
            <span>Decorative element, no alt text required</span>
          </label>

          {/* Alt text input */}
          {!isDecorative && (
            <>
              <div className="input-container">
                <textarea
                  className={`alt-text-input ${isOverLimit ? 'error' : isNearLimit ? 'warning' : ''}`}
                  placeholder="Describe what this image conveys..."
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  rows={6}
                  disabled={loading}
                />
                <div className="char-counter">
                  <span className={`char-count ${isOverLimit ? 'error' : isNearLimit ? 'warning' : ''}`}>
                    {charCount}/{charLimit}
                  </span>
                </div>
              </div>

              {/* Validation feedback */}
              {validation && (
                <div className="validation-feedback">
                  {validation.errors.length > 0 && (
                    <div className="validation-errors">
                      {validation.errors.map((error, i) => (
                        <div key={i} className="validation-message error">
                          <Icon name="alert-circle" size={14} color="#ef4444" />
                          <span>{error}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {validation.warnings.length > 0 && (
                    <div className="validation-warnings">
                      {validation.warnings.map((warning, i) => (
                        <div key={i} className="validation-message warning">
                          <Icon name="alert-triangle" size={14} color="#f59e0b" />
                          <span>{warning}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {validation.suggestions.length > 0 && (
                    <div className="validation-suggestions">
                      {validation.suggestions.map((suggestion, i) => (
                        <div key={i} className="validation-message info">
                          <Icon name="info" size={14} color="#3b82f6" />
                          <span>{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Help text */}
              <div className="help-section">
                <div className="help-item">
                  <Icon name="info" size={14} color="var(--figma-color-text-secondary)" />
                  <span className="help-text">{HELP_TEXT.qualityGuideline}</span>
                </div>
              </div>
            </>
          )}

          {isDecorative && (
            <div className="decorative-info">
              <Icon name="info" size={16} color="var(--figma-color-text-secondary)" />
              <p className="help-text">{HELP_TEXT.decorativeGuideline}</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={loading || (!isDecorative && validation && !validation.isValid)}
          >
            {loading ? 'Saving...' : 'Done'}
          </Button>
        </div>
      </div>
    </div>
  );
};
