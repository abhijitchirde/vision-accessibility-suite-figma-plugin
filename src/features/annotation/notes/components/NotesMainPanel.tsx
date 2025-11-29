/**
 * Notes Main Panel - Platform Selection
 * 
 * Shows all platform options for accessibility notes
 */

import React from 'react';
import './NotesMainPanel.css';
import { Icon } from '../../../../components/ui/Icon/Icon';
import { Button } from '../../../../components/ui/Button/Button';
import { PlatformType } from '../notes.types';
import { PLATFORM_METADATA, PLATFORM_ORDER } from '../notes.constants';

interface NotesMainPanelProps {
  onBack: () => void;
  onPlatformSelect: (platform: PlatformType) => void;
}

export const NotesMainPanel: React.FC<NotesMainPanelProps> = ({ onBack, onPlatformSelect }) => {
  return (
    <div className="notes-main-panel">
      <div className="notes-main-panel__header">
        <Button variant="ghost" size="small" onClick={onBack}>
          <Icon name="chevron-left" size={20} />
        </Button>
        <h2>Accessibility Notes</h2>
        <button className="notes-main-panel__help" title="Help">
          <Icon name="help-circle" size={20} />
        </button>
      </div>

      <div className="notes-main-panel__content">
        <div className="notes-main-panel__platform-grid">
          {PLATFORM_ORDER.map((platform) => {
            const metadata = PLATFORM_METADATA[platform];

            return (
              <div
                key={platform}
                className="notes-main-panel__platform-card"
                onClick={() => onPlatformSelect(platform)}
              >
                <div className="platform-card__icon">
                  <Icon name={metadata.icon} size={24} />
                </div>
                <div className="platform-card__content">
                  <div className="platform-card__title">{metadata.label}</div>
                  <div className="platform-card__description">{metadata.description}</div>
                </div>
                <div className="platform-card__arrow">
                  <Icon name="chevron-right" size={20} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

