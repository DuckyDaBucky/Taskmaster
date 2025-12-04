import React from "react";
import { X } from "lucide-react";
import type { TasksData, ClassData } from "../../services/types";

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
  resources,
  isSubmitting,
  onClose,
  onSubmit,
  onFormChange,
  onPersonalToggle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="w-full max-w-xl bg-card border border-border rounded-md p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-foreground">
            {isEditing ? "Edit Task" : "Create New Task"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Class</label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => onPersonalToggle(true)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isPersonal
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                Personal
              </button>
            </div>
            <select
              value={formData.classId}
              onChange={(e) => {
                onPersonalToggle(false);
                onFormChange({ classId: e.target.value });
              }}
              disabled={isPersonal}
              className={`w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                isPersonal ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <option value="">Select a class</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => onFormChange({ title: e.target.value })}
              required
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Deadline</label>
              <input
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => onFormChange({ deadline: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  onFormChange({
                    status: e.target.value as "pending" | "completed" | "overdue",
                  })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Topic</label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => onFormChange({ topic: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Points</label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) => onFormChange({ points: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Textbook</label>
            <input
              type="text"
              value={formData.textbook}
              onChange={(e) => onFormChange({ textbook: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Resources (Select multiple)
            </label>
            <select
              multiple
              value={formData.selectedResources}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                onFormChange({ selectedResources: selected });
              }}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
              size={5}
            >
              {resources
                .filter((r) => !formData.classId || r.class === formData.classId || !r.class)
                .flatMap((r) =>
                  (r.urls || []).map((url: string, idx: number) => ({
                    url,
                    resourceId: r._id,
                    idx,
                  }))
                )
                .map((item) => (
                  <option key={`${item.resourceId}-${item.idx}`} value={item.url}>
                    {item.url.length > 60 ? item.url.substring(0, 60) + "..." : item.url}
                  </option>
                ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Hold Ctrl/Cmd to select multiple resources. Resources are filtered by selected class.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors disabled:opacity-50"
            >
              {isSubmitting
                ? isEditing
                  ? "Updating..."
                  : "Creating..."
                : isEditing
                ? "Update Task"
                : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

