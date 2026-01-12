import React, { useState } from "react";
import type { ClassData } from "../../services/types";
import { apiService } from "../../services/api";

interface AutoFlashcardFormProps {
  classes: ClassData[];
  resources: any[];
  topicsByClass: Record<string, string[]>;
  defaultClassId?: string;
  onCreate: (mode: "auto", data: { classId: string; topic: string; resourceId?: string; count: number }) => Promise<void>;
  isGenerating: boolean;
  onClose: () => void;
}

export const AutoFlashcardForm: React.FC<AutoFlashcardFormProps> = ({
  classes,
  resources,
  topicsByClass,
  defaultClassId,
  onCreate,
  isGenerating,
  onClose,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(defaultClassId || "");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [selectedResourceId, setSelectedResourceId] = useState<string>("");
  const [cardCount, setCardCount] = useState<number>(10);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !selectedTopic) return;
    await onCreate("auto", { 
      classId: selectedClassId, 
      topic: selectedTopic,
      resourceId: selectedResourceId || undefined,
      count: cardCount,
    });
  };

  const handleUploadResource = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const resource = await apiService.smartUploadResource(file, selectedClassId || undefined);
      if (resource?._id) {
        setSelectedResourceId(resource._id);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const topics = selectedClassId ? topicsByClass[selectedClassId] || [] : [];
  const topicOptions = topics.length > 0 ? topics : ["General"];

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
          Select Topic *
        </label>
        <select
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          required
        >
          <option value="">Select a topic</option>
          {topicOptions.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground mt-1">
          Topics are pulled from your class data and uploaded resources.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Number of Cards
        </label>
        <div className="flex flex-wrap gap-2">
          {[5, 10, 20].map((count) => (
            <button
              type="button"
              key={count}
              onClick={() => setCardCount(count)}
              className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                cardCount === count
                  ? "bg-primary text-white border-primary"
                  : "border-border text-foreground hover:bg-secondary"
              }`}
            >
              {count}
            </button>
          ))}
          <input
            type="number"
            min={1}
            max={50}
            value={cardCount}
            onChange={(e) => setCardCount(Number(e.target.value || 1))}
            className="w-20 px-2 py-1.5 rounded-md border border-border bg-background text-sm text-foreground"
          />
        </div>
      </div>

      <details className="rounded-md border border-border bg-background p-4">
        <summary className="cursor-pointer text-sm font-medium text-foreground">
          Advanced: Attach a resource (optional)
        </summary>
        <div className="mt-3 space-y-4">
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
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Upload Resource (Optional)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadResource(file);
              }}
              className="block w-full text-sm text-muted-foreground"
            />
            {isUploading && (
              <p className="text-xs text-muted-foreground mt-1">
                Uploading resource...
              </p>
            )}
          </div>
        </div>
      </details>

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
          disabled={isGenerating || !selectedClassId || !selectedTopic}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md transition-colors disabled:opacity-50"
        >
          {isGenerating ? "Generating..." : "Generate with AI"}
        </button>
      </div>
    </form>
  );
};

