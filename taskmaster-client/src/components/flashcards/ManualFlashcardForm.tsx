import React, { useState } from "react";
import type { ClassData } from "../../services/types";

interface ManualCard {
  question: string;
  answer: string;
  topic: string;
}

interface ManualFlashcardFormProps {
  classes: ClassData[];
  onCreate: (mode: "manual", data: { classId: string; cards: ManualCard[] }) => Promise<void>;
  isGenerating: boolean;
  onClose: () => void;
}

export const ManualFlashcardForm: React.FC<ManualFlashcardFormProps> = ({
  classes,
  onCreate,
  isGenerating,
  onClose,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [manualCards, setManualCards] = useState<ManualCard[]>([
    { question: "", answer: "", topic: "" }
  ]);

  const addManualCard = () => {
    setManualCards([...manualCards, { question: "", answer: "", topic: "" }]);
  };

  const removeManualCard = (index: number) => {
    setManualCards(manualCards.filter((_, i) => i !== index));
  };

  const updateManualCard = (index: number, field: keyof ManualCard, value: string) => {
    const updated = [...manualCards];
    updated[index][field] = value;
    setManualCards(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) return;
    
    const validCards = manualCards.filter(c => c.question.trim() && c.answer.trim());
    if (validCards.length === 0) {
      return;
    }

    await onCreate("manual", { classId: selectedClassId, cards: validCards });
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

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-foreground">
            Flashcards
          </label>
          <button
            type="button"
            onClick={addManualCard}
            className="px-3 py-1 text-sm bg-secondary hover:bg-secondary/80 text-foreground rounded-md transition-colors"
          >
            + Add Card
          </button>
        </div>
        <div className="space-y-3">
          {manualCards.map((card, index) => (
            <div key={index} className="border border-border rounded-md p-4 bg-background">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-muted-foreground">Card {index + 1}</span>
                {manualCards.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeManualCard(index)}
                    className="text-destructive hover:text-destructive/80 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Topic (Optional)</label>
                  <input
                    type="text"
                    value={card.topic}
                    onChange={(e) => updateManualCard(index, "topic", e.target.value)}
                    placeholder="e.g., Chapter 1"
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Question *</label>
                  <textarea
                    value={card.question}
                    onChange={(e) => updateManualCard(index, "question", e.target.value)}
                    placeholder="Enter question..."
                    rows={2}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Answer *</label>
                  <textarea
                    value={card.answer}
                    onChange={(e) => updateManualCard(index, "answer", e.target.value)}
                    placeholder="Enter answer..."
                    rows={2}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
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
          disabled={isGenerating || !selectedClassId || manualCards.filter(c => c.question.trim() && c.answer.trim()).length === 0}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors disabled:opacity-50"
        >
          {isGenerating ? "Creating..." : "Create Deck"}
        </button>
      </div>
    </form>
  );
};

