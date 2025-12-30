import React from "react";
import { X } from "lucide-react";

interface MyEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  source?: "app" | "task" | "google";
}

interface AddEventModalProps {
  isOpen: boolean;
  isEditing: boolean;
  eventData: MyEvent;
  setEventData: (data: MyEvent) => void;
  onClose: () => void;
  onSave: (event: MyEvent) => void;
  onDelete: () => void;
}

const toLocalInputValue = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  isEditing,
  eventData,
  setEventData,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!isOpen) return null;

  const isGoogleEvent = eventData.source === "google";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGoogleEvent) return;
    if (!eventData.title.trim()) return;
    onSave(eventData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-5 shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-foreground">
            {isEditing ? "Edit Event" : "New Event"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {isGoogleEvent && (
          <p className="text-xs text-muted-foreground mb-3">
            This event is synced from Google Calendar and can’t be edited here.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <input
            type="text"
            disabled={isGoogleEvent}
            value={eventData.title}
            onChange={(e) =>
              setEventData({ ...eventData, title: e.target.value })
            }
            placeholder="Event title"
            autoFocus
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground text-lg disabled:opacity-60"
          />

          {/* Date/Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Start</label>
              <input
                type="datetime-local"
                disabled={isGoogleEvent}
                value={toLocalInputValue(eventData.start)}
                onChange={(e) =>
                  setEventData({ ...eventData, start: new Date(e.target.value) })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">End</label>
              <input
                type="datetime-local"
                disabled={isGoogleEvent}
                value={toLocalInputValue(eventData.end)}
                onChange={(e) =>
                  setEventData({ ...eventData, end: new Date(e.target.value) })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground disabled:opacity-60"
              />
            </div>
          </div>

          {/* Location */}
          <input
            type="text"
            disabled={isGoogleEvent}
            value={eventData.location || ""}
            onChange={(e) =>
              setEventData({ ...eventData, location: e.target.value })
            }
            placeholder="Location (optional)"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground disabled:opacity-60"
          />

          {/* Notes */}
          <textarea
            disabled={isGoogleEvent}
            value={eventData.description || ""}
            onChange={(e) =>
              setEventData({ ...eventData, description: e.target.value })
            }
            placeholder="Notes (optional)"
            rows={2}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground resize-none disabled:opacity-60"
          />

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {isEditing && !isGoogleEvent && (
              <button
                type="button"
                onClick={onDelete}
                className="px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            )}

            <div className="flex-1" />

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-border rounded-lg text-foreground hover:bg-secondary"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isGoogleEvent || !eventData.title.trim()}
              className={`px-4 py-2.5 rounded-lg font-medium
                ${
                  isGoogleEvent
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-white hover:bg-primary/90"
                }`}
            >
              {isEditing ? "Update" : "Add Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEventModal;
