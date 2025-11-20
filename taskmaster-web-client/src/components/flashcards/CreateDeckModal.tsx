import React, { useState } from "react";
import { X } from "lucide-react";
import { AutoFlashcardForm } from "./AutoFlashcardForm";
import { ManualFlashcardForm } from "./ManualFlashcardForm";
import type { ClassData } from "../../services/types";

interface CreateDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassData[];
  resources: any[];
  onCreateDeck: (mode: "auto" | "manual", data: any) => Promise<void>;
  isGenerating: boolean;
}

export const CreateDeckModal: React.FC<CreateDeckModalProps> = ({
  isOpen,
  onClose,
  classes,
  resources,
  onCreateDeck,
  isGenerating,
}) => {
  const [createMode, setCreateMode] = useState<"auto" | "manual">("auto");

  if (!isOpen) return null;

  const handleClose = () => {
    setCreateMode("auto");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4 py-8 overflow-y-auto">
      <div className="w-full max-w-4xl bg-card border border-border rounded-md p-6 shadow-xl my-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">Create New Flashcard Deck</h2>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={24} />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6 p-1 bg-secondary rounded-lg">
          <button
            onClick={() => setCreateMode("auto")}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              createMode === "auto"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Auto (AI Generated)
          </button>
          <button
            onClick={() => setCreateMode("manual")}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              createMode === "manual"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Manual
          </button>
        </div>


        {createMode === "auto" ? (
          <AutoFlashcardForm
            classes={classes}
            resources={resources}
            onCreate={onCreateDeck}
            isGenerating={isGenerating}
            onClose={handleClose}
          />
        ) : (
          <ManualFlashcardForm
            classes={classes}
            onCreate={onCreateDeck}
            isGenerating={isGenerating}
            onClose={handleClose}
          />
        )}
      </div>
    </div>
  );
};

