import React, { useState } from "react";
import type { ClassData } from "../../services/types";

interface AutoFlashcardFormProps {
  classes: ClassData[];
  resources: any[];
  onCreate: (mode: "auto", data: { classId: string; resourceId?: string }) => Promise<void>;
  isGenerating: boolean;
  onClose: () => void;
}

export const AutoFlashcardForm: React.FC<AutoFlashcardFormProps> = ({
  classes,
  resources,
  onCreate,
  isGenerating,
  onClose,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedResourceId, setSelectedResourceId] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) return;
    await onCreate("auto", { classId: selectedClassId, resourceId: selectedResourceId || undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[60vh] overflow-y-auto">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Select Class *
        </label>
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          required
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
        <label className="block text-sm font-medium text-foreground mb-1">
          Select Resource (Optional)
        </label>
        <select
          value={selectedResourceId}
          onChange={(e) => setSelectedResourceId(e.target.value)}
          className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Use class topics (default)</option>
          {resources
            .filter(r => !selectedClassId || r.class === selectedClassId || !r.class)
            .map((res) => (
              <option key={res._id} value={res._id}>
                {res.urls?.[0] || res.files?.[0]?.originalName || `Resource ${res._id}`}
              </option>
            ))}
        </select>
        <p className="text-xs text-muted-foreground mt-1">
          AI will parse the resource and generate insightful questions using LangChain
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-secondary transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isGenerating || !selectedClassId}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors disabled:opacity-50"
        >
          {isGenerating ? "Generating..." : "Generate with AI"}
        </button>
      </div>
    </form>
  );
};

