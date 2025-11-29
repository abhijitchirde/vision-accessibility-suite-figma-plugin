/**
 * Add Note Modal Component
 * 
 * Simple modal for adding or editing accessibility notes (platform-specific)
 */

import React, { useState, useEffect, useRef } from 'react';
import './AddNoteModal.css';
import { Button } from '../../../../components/ui/Button/Button';
import { PlatformType } from '../notes.types';
import { PLATFORM_METADATA } from '../notes.constants';

interface AddNoteModalProps {
  platform: PlatformType;
  nodeId: string;
  nodeName: string;
  onClose: () => void;
  onConfirm: (accessibleName: string, note: string) => void;
  existingAccessibleName?: string;
  existingNote?: string;
}

export const AddNoteModal: React.FC<AddNoteModalProps> = ({
  platform,
  nodeId,
  nodeName,
  onClose,
  onConfirm,
  existingAccessibleName = '',
  existingNote = '',
}) => {
  const [accessibleName, setAccessibleName] = useState(existingAccessibleName);
  const [note, setNote] = useState(existingNote);
  const inputRef = useRef<HTMLInputElement>(null);

  const metadata = PLATFORM_METADATA[platform];

  // Focus the input when modal mounts
  useEffect(() => {
    // Small delay to ensure modal is rendered
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleConfirm = () => {
    onConfirm(accessibleName, note);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Note</h3>
        </div>

        <div className="modal-body">
          <div className="modal-field">
            <label>Name</label>
            <input
              ref={inputRef}
              type="text"
              value={accessibleName}
              onChange={(e) => setAccessibleName(e.target.value)}
              placeholder={`e.g., ${metadata.label}`}
              disabled={false}
              readOnly={false}
              tabIndex={0}
            />
          </div>

          <div className="modal-field">
            <label>Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Additional notes..."
              rows={4}
              disabled={false}
              readOnly={false}
              tabIndex={0}
            />
          </div>
        </div>

        <div className="modal-footer">
          <Button variant="primary" onClick={handleConfirm}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};

