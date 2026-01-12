import React from "react";
import { X } from "lucide-react";

interface MyEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <input
              type="text"
              value={eventData.title}
              onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
              placeholder="Event title"
              autoFocus
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground text-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Date/Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Start</label>
              <input
                type="datetime-local"
                value={toLocalInputValue(eventData.start)}
                onChange={(e) => setEventData({ ...eventData, start: new Date(e.target.value) })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">End</label>
              <input
                type="datetime-local"
                value={toLocalInputValue(eventData.end)}
                onChange={(e) => setEventData({ ...eventData, end: new Date(e.target.value) })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Location (optional)</label>
            <input
              type="text"
              value={eventData.location || ""}
              onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
              placeholder="e.g. Library Room 201"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Notes (optional)</label>
            <textarea
              value={eventData.description || ""}
              onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
              placeholder="Add notes..."
              rows={2}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {isEditing && (
              <button
                type="button"
                onClick={onDelete}
                className="px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!eventData.title.trim()}
              className="px-4 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
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
