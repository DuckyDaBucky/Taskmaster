import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { apiService } from "../../services/api";
import type { FlashcardsData } from "../../services/types";

interface FlashcardPlayerProps {
  classId: string;
  className: string;
  onClose: () => void;
}

export const FlashcardPlayer: React.FC<FlashcardPlayerProps> = ({
  classId,
  className,
  onClose,
}) => {
  const [cards, setCards] = useState<FlashcardsData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        setIsLoading(true);
        const allCards = await apiService.getFlashcardsByClassId(classId);
        setCards(allCards);
      } catch (error) {
        console.error("Error fetching flashcards for player:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCards();
  }, [classId]);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex((prev) => prev + 1), 150);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex((prev) => prev - 1), 150);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="text-white text-xl">Loading deck...</div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-card p-8 rounded-lg max-w-md w-full text-center space-y-4">
          <h3 className="text-xl font-bold">No Cards Found</h3>
          <p className="text-muted-foreground">This deck has no flashcards yet.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl h-[80vh] flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between text-white mb-4">
          <div>
            <h2 className="text-2xl font-bold">{className}</h2>
            <p className="text-sm opacity-80">
              Card {currentIndex + 1} of {cards.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Card Area */}
        <div className="flex-1 flex items-center justify-center relative perspective-1000">
          <div
            className="relative w-full max-w-2xl aspect-[3/2] cursor-pointer transition-transform duration-500 transform-style-3d"
            onClick={handleFlip}
            style={{ transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
          >
            {/* Front (Question) */}
            <div
              className="absolute inset-0 backface-hidden bg-card border-2 border-border rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-2xl"
              style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
            >
              <span className="absolute top-4 left-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Question
              </span>
              <h3 className="text-2xl md:text-3xl font-medium text-foreground select-none">
                {currentCard.question}
              </h3>
              <p className="absolute bottom-4 text-sm text-muted-foreground animate-pulse">
                Click to flip
              </p>
            </div>

            {/* Back (Answer) */}
            <div
              className="absolute inset-0 backface-hidden bg-card border-2 border-primary/50 rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-2xl"
              style={{ 
                backfaceVisibility: "hidden", 
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)" 
              }}
            >
              <span className="absolute top-4 left-4 text-xs font-bold uppercase tracking-wider text-primary">
                Answer
              </span>
              <p className="text-xl md:text-2xl text-foreground leading-relaxed select-none">
                {currentCard.answer}
              </p>
            </div>
          </div>

          {/* Navigation Buttons (Absolute to be on sides) */}
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`absolute left-0 md:-left-16 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
              currentIndex === 0 ? "hidden md:flex" : "flex"
            }`}
          >
            <ChevronLeft size={32} />
          </button>

          <button
            onClick={handleNext}
            disabled={currentIndex === cards.length - 1}
            className={`absolute right-0 md:-right-16 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
              currentIndex === cards.length - 1 ? "hidden md:flex" : "flex"
            }`}
          >
            <ChevronRight size={32} />
          </button>
        </div>

        {/* Mobile Navigation (Bottom) */}
        <div className="mt-4 flex items-center justify-center gap-4 md:hidden">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-3 rounded-full bg-white/10 text-white disabled:opacity-30"
          >
            <ChevronLeft size={24} />
          </button>
          <span className="text-white font-medium">
            {currentIndex + 1} / {cards.length}
          </span>
          <button
            onClick={handleNext}
            disabled={currentIndex === cards.length - 1}
            className="p-3 rounded-full bg-white/10 text-white disabled:opacity-30"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};
