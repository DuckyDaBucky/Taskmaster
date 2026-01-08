"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, Play, ChevronLeft, Trash2, Brain } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiService } from "../../services/api";
import type { ClassData, FlashcardsData } from "../../services/types";
import { FlashcardPlayer } from "../../components/flashcards/FlashcardPlayer";

interface FlashcardSetPageProps {
  classId: string;
  topic: string;
}

const FlashcardSetPage: React.FC<FlashcardSetPageProps> = ({ classId, topic }) => {
  const [cards, setCards] = useState<FlashcardsData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showStudy, setShowStudy] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [allClasses, classCards] = await Promise.all([
          apiService.getAllClasses(),
          classId === "personal"
            ? apiService.getAllFlashcards()
            : apiService.getFlashcardsByClassId(classId),
        ]);

        setClasses(allClasses);

        const scopedCards = classCards.filter((card: FlashcardsData) => {
          const matchesClass =
            classId === "personal" ? !card.class : card.class === classId;
          return matchesClass && (card.topic || "General") === topic;
        });
        setCards(scopedCards);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [classId, topic]);

  const className =
    classId === "personal"
      ? "Personal"
      : classes.find((cls) => cls._id === classId)?.name || "Unknown Class";

  const filteredCards = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return cards;
    return cards.filter(
      (card) =>
        card.question.toLowerCase().includes(query) ||
        card.answer.toLowerCase().includes(query)
    );
  }, [cards, search]);

  const isNotesGenerated = useMemo(
    () => cards.some((card) => card.description?.toLowerCase().includes("notes-generated")),
    [cards]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Flashcards</h1>
        <div className="text-center text-muted-foreground">Loading set...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-md p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href={`/flashcards/class/${encodeURIComponent(classId)}`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft size={14} />
              Back to Class
            </Link>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Flashcard Set
            </p>
            <h1 className="text-2xl font-bold text-foreground">{topic}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {className} • {cards.length} card{cards.length !== 1 ? "s" : ""}
            </p>
            {isNotesGenerated && (
              <span className="mt-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                Notes generated
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowStudy(true)}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Play size={16} /> Study
            </button>
            <Link
              href={`/flashcards/set/${encodeURIComponent(classId)}/${encodeURIComponent(topic)}/learn`}
              className="px-4 py-2 border border-primary text-primary rounded-md text-sm font-medium hover:bg-primary/10 transition-colors flex items-center gap-2"
            >
              <Brain size={16} /> Learn
            </Link>
            <button
              onClick={async () => {
                if (!window.confirm(`Delete the "${topic}" set? This cannot be undone.`)) {
                  return;
                }
                try {
                  setIsDeleting(true);
                  await apiService.deleteFlashcardSet(classId === "personal" ? null : classId, topic);
                  router.push(`/flashcards/class/${encodeURIComponent(classId)}`);
                } finally {
                  setIsDeleting(false);
                }
              }}
              disabled={isDeleting}
              className="px-4 py-2 border border-border rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Trash2 size={16} /> Delete Set
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-card border border-border rounded-md px-3 py-2">
        <Search size={16} className="text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search cards..."
          className="w-full bg-transparent text-sm text-foreground focus:outline-none"
        />
      </div>

      <div className="bg-card border border-border rounded-md p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">All Cards</h2>
        {filteredCards.length === 0 ? (
          <p className="text-sm text-muted-foreground">No cards found.</p>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2">
            {filteredCards.map((card) => (
              <div
                key={card._id}
                className="rounded-md border border-border bg-background p-4"
              >
                <p className="text-sm font-semibold text-foreground mb-2">
                  {card.question}
                </p>
                <p className="text-sm text-muted-foreground">{card.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showStudy && (
        <FlashcardPlayer
          classId={classId === "personal" ? "" : classId}
          className={className}
          topic={topic}
          onClose={() => setShowStudy(false)}
        />
      )}
    </div>
  );
};

export default FlashcardSetPage;
