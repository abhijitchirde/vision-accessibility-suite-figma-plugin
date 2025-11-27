import React, { useState, useEffect } from 'react';
import './AddAltTextModal.css';
import { Button } from '../../../../components/ui/Button/Button';
import { useFigmaMessage } from '../../../../hooks/useFigmaMessage';
import { ALT_TEXT_GUIDELINES } from '../alt-text.constants';

interface AddAltTextModalProps {
  nodeId: string;
  onClose: () => void;
  onConfirm: (altText: string, isDecorative: boolean) => void;
  existingAltText?: string;
  existingIsDecorative?: boolean;
}

export const AddAltTextModal: React.FC<AddAltTextModalProps> = ({
  nodeId,
  onClose,
  onConfirm,
  existingAltText = '',
  existingIsDecorative = false
}) => {
  const [altText, setAltText] = useState(existingAltText);
  const [isDecorative, setIsDecorative] = useState(existingIsDecorative);
  const { sendMessage } = useFigmaMessage();

  const handleConfirm = () => {
    onConfirm(altText, isDecorative);
    onClose();
  };

  const charCount = altText.length;
  const isInRecommendedRange = charCount >= ALT_TEXT_GUIDELINES.MIN_LENGTH &&
                                charCount <= ALT_TEXT_GUIDELINES.OPTIMAL_LENGTH;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Alt Text</h3>
        </div>

        <div className="modal-body">
          <textarea
            className="alt-text-input"
            placeholder={isDecorative ? "Decorative elements do not require alt text" : "Enter alt text..."}
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            rows={6}
            autoFocus
            disabled={isDecorative}
          />
          <div className={`char-counter ${isInRecommendedRange ? 'in-range' : 'out-of-range'}`}>
            {charCount}/{ALT_TEXT_GUIDELINES.OPTIMAL_LENGTH} characters (recommended)
          </div>
        </div>

        <div className="modal-footer">
          <label className="decorative-checkbox">
            <input
              type="checkbox"
              checked={isDecorative}
              onChange={(e) => setIsDecorative(e.target.checked)}
            />
            <span>Decorative element</span>
          </label>
          <Button variant="primary" onClick={handleConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};
