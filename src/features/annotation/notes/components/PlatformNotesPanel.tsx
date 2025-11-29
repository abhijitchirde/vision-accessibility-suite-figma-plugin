/**
 * Platform Notes Panel Component
 * 
 * Generic panel for managing platform-specific accessibility notes
 */

import React, { useState, useEffect } from 'react';
import './PlatformNotesPanel.css';
import { Icon } from '../../../../components/ui/Icon/Icon';
import { Button } from '../../../../components/ui/Button/Button';
import { useFigmaMessage } from '../../../../hooks/useFigmaMessage';
import { NoteNodeInfo, PlatformType } from '../notes.types';
import { PLATFORM_METADATA, PLATFORM_BADGE_COLORS } from '../notes.constants';
import { AddNoteModal } from './AddNoteModal';

interface PlatformNotesPanelProps {
  platform: PlatformType;
  onBack: () => void;
}

export const PlatformNotesPanel: React.FC<PlatformNotesPanelProps> = ({ platform, onBack }) => {
  const [notes, setNotes] = useState<NoteNodeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const { sendMessage } = useFigmaMessage();

  const metadata = PLATFORM_METADATA[platform];
  const badgeColor = PLATFORM_BADGE_COLORS[platform];

  // Load notes when component mounts
  useEffect(() => {
    loadNotes();

    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;

      if (msg?.type === 'NOTES_LOADED') {
        setLoading(false);
        if (msg.success) {
          // Filter notes for this platform only
          const platformNotes = msg.data.notes.filter(
            (note: NoteNodeInfo) => note.noteData?.platform === platform
          );
          setNotes(platformNotes);
        }
      }

      if (msg?.type === 'NOTE_SAVED' || msg?.type === 'NOTE_REMOVED') {
        if (msg.success) {
          loadNotes();
        } else {
          alert(msg.error || 'Operation failed');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [platform]);

  const loadNotes = () => {
    setLoading(true);
    sendMessage('GET_ACCESSIBILITY_NOTES');
  };

  const handleAddNote = () => {
    setEditingNodeId(null);
    setShowModal(true);
  };

  const handleEditNote = (nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingNodeId(nodeId);
    setShowModal(true);
  };

  const handleRemoveNote = (nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (confirm('Remove this accessibility note?')) {
      sendMessage('REMOVE_ACCESSIBILITY_NOTE', { nodeId });
    }
  };

  const handleModalConfirm = (accessibleName: string, note: string) => {
    if (editingNodeId) {
      // Update existing note
      sendMessage('UPDATE_ACCESSIBILITY_NOTE', {
        nodeId: editingNodeId,
        platform,
        accessibleName,
        note,
      });
    } else {
      // Add new note
      sendMessage('SAVE_ACCESSIBILITY_NOTE', {
        platform,
        accessibleName,
        note,
      });
    }
    setEditingNodeId(null);
  };

  const handleCardClick = (nodeId: string) => {
    sendMessage('ZOOM_TO_NOTE_NODE', { nodeId });
  };

  // Get editing note data
  const editingNote = editingNodeId ? notes.find((n) => n.nodeId === editingNodeId) : null;

  return (
    <div className="platform-notes-panel">
      <div className="platform-notes-panel__header">
        <Button variant="ghost" size="small" onClick={onBack}>
          <Icon name="chevron-left" size={20} />
        </Button>
        <h2>{metadata.label}</h2>
      </div>

      {loading && (
        <div className="platform-notes-panel__loading">
          <p>Loading notes...</p>
        </div>
      )}

      {!loading && (
        <div className="platform-notes-panel__content">
          {notes.length === 0 ? (
            <div className="platform-notes-panel__empty">
              <Icon name={metadata.icon} size={48} color="var(--figma-color-text-disabled)" />
              <p>No {metadata.label.toLowerCase()} notes yet</p>
              <p className="platform-notes-panel__empty-hint">
                Select an element and add accessibility notes
              </p>
            </div>
          ) : (
            <div className="platform-notes-panel__list">
              {notes.map((noteItem) => (
                <div
                  key={noteItem.nodeId}
                  className="platform-note-card"
                  onClick={() => handleCardClick(noteItem.nodeId)}
                >
                  <div className="platform-note-card__header">
                    <div className="platform-note-card__badge-wrapper">
                      <span
                        className="platform-note-card__badge"
                        style={{ backgroundColor: badgeColor }}
                      >
                        <Icon name={metadata.icon} size={12} />
                      </span>
                      <span className="platform-note-card__name">{noteItem.nodeName}</span>
                    </div>
                    <div className="platform-note-card__actions">
                      <button
                        className="platform-note-card__action-btn"
                        onClick={(e) => handleEditNote(noteItem.nodeId, e)}
                        title="Edit"
                      >
                        <Icon name="edit" size={16} />
                      </button>
                      <button
                        className="platform-note-card__action-btn"
                        onClick={(e) => handleRemoveNote(noteItem.nodeId, e)}
                        title="Remove"
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="platform-note-card__content">
                    <div className="platform-note-card__row">
                      <span className="platform-note-card__label">Name:</span>
                      <span className="platform-note-card__value">
                        {noteItem.noteData?.accessibleName || 'N/A'}
                      </span>
                    </div>
                    {noteItem.noteData?.note && (
                      <div className="platform-note-card__row">
                        <span className="platform-note-card__label">Note:</span>
                        <span className="platform-note-card__value">{noteItem.noteData.note}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fixed bottom button */}
      {!loading && (
        <div className="platform-notes-panel__footer">
          <Button variant="primary" fullWidth onClick={handleAddNote}>
            Add note
          </Button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <AddNoteModal
          platform={platform}
          nodeId={editingNodeId || ''}
          nodeName={editingNote?.nodeName || 'Selected Element'}
          onClose={() => {
            setShowModal(false);
            setEditingNodeId(null);
          }}
          onConfirm={handleModalConfirm}
          existingAccessibleName={editingNote?.noteData?.accessibleName}
          existingNote={editingNote?.noteData?.note}
        />
      )}
    </div>
  );
};

