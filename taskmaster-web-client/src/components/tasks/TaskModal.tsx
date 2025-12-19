import React, { useState } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import type { ClassData } from "../../services/types";

interface TaskModalProps {
  isOpen: boolean;
  isEditing: boolean;
  formData: {
    title: string;
    deadline: string;
    topic: string;
    status: "pending" | "completed" | "overdue";
    points: string;
    textbook: string;
    classId: string;
    selectedResources: string[];
  };
  isPersonal: boolean;
  classes: ClassData[];
  resources: any[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormChange: (updates: Partial<TaskModalProps["formData"]>) => void;
  onPersonalToggle: (isPersonal: boolean) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  isEditing,
  formData,
  isPersonal,
  classes,
  isSubmitting,
  onClose,
  onSubmit,
  onFormChange,
  onPersonalToggle,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-5 shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-foreground">
            {isEditing ? "Edit Task" : "New Task"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Title - REQUIRED */}
          <div>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => onFormChange({ title: e.target.value })}
              placeholder="What do you need to do?"
              autoFocus
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground text-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Quick Options Row */}
          <div className="flex gap-2 flex-wrap">
            {/* Personal Toggle */}
            <button
              type="button"
              onClick={() => onPersonalToggle(!isPersonal)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isPersonal
                  ? "bg-primary text-white"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
            >
              {isPersonal ? "Personal (selected)" : "Personal"}
            </button>

            {/* Class Selector */}
            {!isPersonal && classes.length > 0 && (
              <select
                value={formData.classId}
                onChange={(e) => onFormChange({ classId: e.target.value })}
                className="px-3 py-1.5 bg-secondary border-0 rounded-full text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select class...</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>{cls.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Due Date - OPTIONAL */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Due date (optional)</label>
            <input
              type="datetime-local"
              value={formData.deadline}
              onChange={(e) => onFormChange({ deadline: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {showAdvanced ? "Less options" : "More options"}
          </button>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Topic</label>
                  <input
                    type="text"
                    value={formData.topic}
                    onChange={(e) => onFormChange({ topic: e.target.value })}
                    placeholder="e.g. Chapter 5"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Points</label>
                  <input
                    type="number"
                    value={formData.points}
                    onChange={(e) => onFormChange({ points: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => onFormChange({ status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Textbook</label>
                <input
                  type="text"
                  value={formData.textbook}
                  onChange={(e) => onFormChange({ textbook: e.target.value })}
                  placeholder="e.g. Calculus 8th Edition"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title.trim()}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : isEditing ? "Update" : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
