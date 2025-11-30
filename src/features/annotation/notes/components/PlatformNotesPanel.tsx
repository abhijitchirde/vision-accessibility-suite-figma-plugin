/**
 * Platform Notes Panel Component
 *
 * Generic panel for managing platform-specific accessibility notes
 */

import React, { useState, useEffect } from "react";
import "./PlatformNotesPanel.css";
import { Icon } from "../../../../components/ui/Icon/Icon";
import { Button } from "../../../../components/ui/Button/Button";
import { useFigmaMessage } from "../../../../hooks/useFigmaMessage";
import { NoteNodeInfo, PlatformType } from "../notes.types";
import { PLATFORM_METADATA, PLATFORM_BADGE_COLORS } from "../notes.constants";
import { AddEditNotePanel } from "./AddEditNotePanel";

interface PlatformNotesPanelProps {
  platform: PlatformType;
  onBack: () => void;
}

export const PlatformNotesPanel: React.FC<PlatformNotesPanelProps> = ({
  platform,
  onBack,
}) => {
  const [notes, setNotes] = useState<NoteNodeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [selectedNodeName, setSelectedNodeName] = useState<string>("");
  const { sendMessage } = useFigmaMessage();

  const metadata = PLATFORM_METADATA[platform];
  const badgeColor = PLATFORM_BADGE_COLORS[platform];

  // Load notes when component mounts
  useEffect(() => {
    loadNotes();

    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;

      if (msg?.type === "NOTES_LOADED") {
        setLoading(false);
        if (msg.success) {
          // Filter notes for this platform only
          const platformNotes = msg.data.notes.filter(
            (note: NoteNodeInfo) => note.platform === platform
          );
          setNotes(platformNotes);
        }
      }

      if (msg?.type === "CURRENT_SELECTION_RESULT") {
        if (msg.hasSelection) {
          setSelectedNodeName(msg.nodeName || "");
        } else {
          setSelectedNodeName("");
        }
      }

      if (msg?.type === "NOTE_SAVED" || msg?.type === "NOTE_REMOVED") {
        if (msg.success) {
          setShowForm(false);
          setEditingNodeId(null);
          loadNotes();
        }
        // Removed alert for errors - errors are already handled
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [platform]);

  // Update selection name periodically when form is open (for new notes only)
  useEffect(() => {
    if (showForm && !editingNodeId) {
      // Get selection immediately
      sendMessage("GET_CURRENT_SELECTION");

      // Poll for selection changes every 500ms while form is open
      const interval = setInterval(() => {
        sendMessage("GET_CURRENT_SELECTION");
      }, 500);

      return () => clearInterval(interval);
    }
  }, [showForm, editingNodeId, sendMessage]);

  const loadNotes = () => {
    setLoading(true);
    sendMessage("GET_ACCESSIBILITY_NOTES");
  };

  const handleAddNote = () => {
    // Reset editing state and show form immediately
    setEditingNodeId(null);
    setShowForm(true);
    // Get current selection name for display
    sendMessage("GET_CURRENT_SELECTION");
  };

  const handleEditNote = (nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    console.log("PlatformNotesPanel - handleEditNote - nodeId:", nodeId);
    // Set the node to edit and show form directly (we know node exists)
    setEditingNodeId(nodeId);
    setShowForm(true);
  };

  const handleRemoveNote = (nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    console.log("PlatformNotesPanel - handleRemoveNote - nodeId:", nodeId);
    if (confirm("Remove this accessibility note?")) {
      sendMessage("REMOVE_ACCESSIBILITY_NOTE", { nodeId, platform });
    }
  };

  const handleSaveNote = (accessibleName: string, note: string) => {
    if (editingNodeId) {
      // Update existing note
      console.log("PlatformNotesPanel - UPDATE - nodeId:", editingNodeId);
      sendMessage("UPDATE_ACCESSIBILITY_NOTE", {
        nodeId: editingNodeId,
        platform,
        accessibleName,
        note,
      });
    } else {
      // Add new note - selection check happens in plugin code
      console.log("PlatformNotesPanel - SAVE - no nodeId (new note)");
      sendMessage("SAVE_ACCESSIBILITY_NOTE", {
        platform,
        accessibleName,
        note,
      });
      // Note: Form stays open if there's an error (no selection)
      // User can then select a node and click Done again
    }
  };

  const handleBackFromForm = () => {
    // Hide form and reset editing state
    setShowForm(false);
    setEditingNodeId(null);
  };

  const handleCardClick = (nodeId: string) => {
    sendMessage("ZOOM_TO_NOTE_NODE", { nodeId });
  };

  // Get editing note data
  const editingNote = editingNodeId
    ? notes.find((n) => n.nodeId === editingNodeId)
    : null;

  // If showing form, render the form panel instead
  if (showForm) {
    // Use a unique key to force re-mount when switching between add/edit
    const formKey = editingNodeId || "new";

    // For editing, use the note's node name; for new notes, use selected node name
    const displayNodeName =
      editingNote?.nodeName || selectedNodeName || "No node selected";

    return (
      <AddEditNotePanel
        key={formKey}
        platform={platform}
        nodeId={editingNodeId || ""}
        nodeName={displayNodeName}
        onBack={handleBackFromForm}
        onSave={handleSaveNote}
        existingAccessibleName={editingNote?.noteData?.accessibleName || ""}
        existingNote={editingNote?.noteData?.note || ""}
        isEditing={!!editingNodeId}
      />
    );
  }

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
              <Icon
                name={metadata.icon}
                size={48}
                color="var(--figma-color-text-disabled)"
              />
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
                      <span className="platform-note-card__name">
                        {noteItem.nodeName}
                      </span>
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
                    {/* Warning if accessible name is missing */}
                    {!noteItem.noteData?.accessibleName && (
                      <div className="platform-note-card__warning">
                        <Icon name="alert-circle" size={14} />
                        <span>Missing accessible name - please add one</span>
                      </div>
                    )}

                    <div className="platform-note-card__row">
                      <span className="platform-note-card__label">Name:</span>
                      <span
                        className={`platform-note-card__value ${
                          !noteItem.noteData?.accessibleName
                            ? "platform-note-card__value--missing"
                            : ""
                        }`}
                      >
                        {noteItem.noteData?.accessibleName ||
                          "(Empty - needs accessible name)"}
                      </span>
                    </div>
                    {noteItem.noteData?.note && (
                      <div className="platform-note-card__row">
                        <span className="platform-note-card__label">Note:</span>
                        <span className="platform-note-card__value">
                          {noteItem.noteData.note}
                        </span>
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
    </div>
  );
};
