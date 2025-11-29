/**
 * Add/Edit Note Panel Component
 * 
 * Panel for adding or editing accessibility notes (replaces modal)
 */

import React, { useState, useEffect, useRef } from 'react';
import './AddEditNotePanel.css';
import { Icon } from '../../../../components/ui/Icon/Icon';
import { Button } from '../../../../components/ui/Button/Button';
import { PlatformType } from '../notes.types';
import { PLATFORM_METADATA } from '../notes.constants';

interface AddEditNotePanelProps {
  platform: PlatformType;
  nodeId: string;
  nodeName: string;
  onBack: () => void;
  onSave: (accessibleName: string, note: string) => void;
  existingAccessibleName?: string;
  existingNote?: string;
  isEditing?: boolean;
}

// Platform display names mapping
const PLATFORM_DISPLAY_NAMES: Record<PlatformType, string> = {
  web: 'Generic voice experiences',
  aria: 'Web',
  ios: 'iOS',
  android: 'Android',
  windows: 'Windows',
  'react-native': 'React Native',
  tv: 'TV platforms',
  general: 'Platform-agnostic',
};

export const AddEditNotePanel: React.FC<AddEditNotePanelProps> = ({
  platform,
  nodeId,
  nodeName,
  onBack,
  onSave,
  existingAccessibleName = '',
  existingNote = '',
  isEditing = false,
}) => {
  // Use refs instead of state for uncontrolled inputs
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const metadata = PLATFORM_METADATA[platform];
  const platformDisplayName = PLATFORM_DISPLAY_NAMES[platform];

  // Focus the input when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleSave = () => {
    const accessibleName = inputRef.current?.value || '';
    const note = textareaRef.current?.value || '';
    onSave(accessibleName, note);
  };

  return (
    <div className="add-edit-note-panel">
      <div className="add-edit-note-panel__header">
        <Button variant="ghost" size="small" onClick={onBack}>
          <Icon name="chevron-left" size={20} />
        </Button>
        <h2>{isEditing ? 'Edit Note' : 'Add Note'}</h2>
      </div>

      <div className="add-edit-note-panel__content">
        <div className="add-edit-note-panel__info">
          <div className="info-row">
            <span className="info-label">Platform:</span>
            <span className="info-value">{platformDisplayName}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Element:</span>
            <span className="info-value">{nodeName}</span>
          </div>
        </div>

        <div className="add-edit-note-panel__form">
          <div className="form-field">
            <label htmlFor="accessibleName">Accessible Name</label>
            <input
              ref={inputRef}
              id="accessibleName"
              type="text"
              defaultValue={existingAccessibleName}
              placeholder={`e.g., ${metadata.label}`}
            />
          </div>

          <div className="form-field">
            <label htmlFor="note">Note</label>
            <textarea
              ref={textareaRef}
              id="note"
              defaultValue={existingNote}
              placeholder="Additional notes..."
              rows={6}
            />
          </div>
        </div>
      </div>

      <div className="add-edit-note-panel__footer">
        <Button variant="primary" fullWidth onClick={handleSave}>
          Done
        </Button>
      </div>
    </div>
  );
};

