"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Layers, ChevronLeft, Trash2 } from "lucide-react";
import { apiService } from "../../services/api";
import type { ClassData, FlashcardsData } from "../../services/types";
import { CreateDeckModal } from "../../components/flashcards/CreateDeckModal";
import { getClassColor } from "../../utils/classColors";

interface FlashcardSet {
  id: string;
  classId: string;
  className: string;
  topic: string;
  cardCount: number;
  notesGenerated: boolean;
}

interface ClassFlashcardsPageProps {
  classId: string;
}

const ClassFlashcardsPage: React.FC<ClassFlashcardsPageProps> = ({ classId }) => {
  const [flashcards, setFlashcards] = useState<FlashcardsData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [topicsByClass, setTopicsByClass] = useState<Record<string, string[]>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [allClasses, allFlashcards, allResources] = await Promise.all([
          apiService.getAllClasses(),
          apiService.getAllFlashcards(),
          apiService.getAllResources(),
        ]);

        setClasses(allClasses);
        setFlashcards(allFlashcards);
        setResources(allResources);

        const topicsMap: Record<string, Set<string>> = {};
        allClasses.forEach((cls) => {
          if (!cls._id) return;
          topicsMap[cls._id] = new Set(cls.topics || []);
        });

        allResources.forEach((res: any) => {
          const resClassId = res.class;
          const keyTopics = res.extracted_data?.key_topics || [];
          if (!resClassId || keyTopics.length === 0) return;
          if (!topicsMap[resClassId]) topicsMap[resClassId] = new Set();
          keyTopics.forEach((topic: string) => topicsMap[resClassId].add(topic));
        });

        const normalizedTopics: Record<string, string[]> = {};
        Object.entries(topicsMap).forEach(([id, topics]) => {
          normalizedTopics[id] = Array.from(topics).filter(Boolean).sort();
        });
        setTopicsByClass(normalizedTopics);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [classId]);

  const sets = useMemo<FlashcardSet[]>(() => {
    const filtered = flashcards.filter((card) => {
      if (classId === "personal") {
        return !card.class;
      }
      return card.class === classId;
    });

    const map = new Map<string, FlashcardSet>();
    filtered.forEach((card) => {
      const topic = card.topic || "General";
      const key = `${classId}:${topic}`;
      if (!map.has(key)) {
        const className =
          classId === "personal"
            ? "Personal"
            : classes.find((cls) => cls._id === classId)?.name || "Unknown Class";
        map.set(key, {
          id: key,
          classId,
          className,
          topic,
          cardCount: 0,
          notesGenerated: false,
        });
      }
      map.get(key)!.cardCount += 1;
      if (card.description?.toLowerCase().includes("notes-generated")) {
        map.get(key)!.notesGenerated = true;
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.topic.localeCompare(b.topic)
    );
  }, [flashcards, classes, classId]);

  const className =
    classId === "personal"
      ? "Personal"
      : classes.find((cls) => cls._id === classId)?.name || "Unknown Class";

  const handleCreateDeck = async (mode: "auto" | "manual", data: any) => {
    try {
      setIsGenerating(true);
      if (mode === "auto") {
        await apiService.generateFlashcards(data.classId, {
          resourceId: data.resourceId,
          topic: data.topic,
          count: data.count,
        });
      } else {
        await apiService.createManualFlashcards(data.classId, data.cards);
      }
      const updated = await apiService.getAllFlashcards();
      setFlashcards(updated);
      setShowCreateModal(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteSet = async (set: FlashcardSet) => {
    if (!window.confirm(`Delete the "${set.topic}" set? This cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(set.id);
      await apiService.deleteFlashcardSet(set.classId === "personal" ? null : set.classId, set.topic);
      const updated = await apiService.getAllFlashcards();
      setFlashcards(updated);
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Flashcards</h1>
        <div className="text-center text-muted-foreground">Loading sets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/flashcards"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft size={14} />
            Back to Flashcards
          </Link>
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: getClassColor(classId) }}
            />
            <h1 className="text-2xl font-bold text-foreground">{className}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {sets.length} set{sets.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> New Set
        </button>
      </div>

      {sets.length === 0 ? (
        <div className="bg-card border border-border rounded-md p-8 text-center text-muted-foreground">
          <p>No flashcard sets for this class yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sets.map((set) => (
            <div
              key={set.id}
              className="bg-card border border-border rounded-md p-6 hover:border-primary/50 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <Link
                    href={`/flashcards/set/${encodeURIComponent(set.classId)}/${encodeURIComponent(set.topic)}`}
                    className="block"
                  >
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {set.topic}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {set.cardCount} cards
                    </p>
                    {set.notesGenerated && (
                      <span className="mt-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        Notes generated
                      </span>
                    )}
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleDeleteSet(set);
                    }}
                    disabled={isDeleting === set.id}
                    className="p-2 rounded-full bg-secondary text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    aria-label="Delete set"
                  >
                    <Trash2 size={16} />
                  </button>
                  <Link
                    href={`/flashcards/set/${encodeURIComponent(set.classId)}/${encodeURIComponent(set.topic)}`}
                    className="p-3 rounded-full bg-secondary text-foreground group-hover:bg-primary group-hover:text-white transition-colors"
                    aria-label="Open set"
                  >
                    <Layers size={18} />
                  </Link>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                {set.className}
              </p>
            </div>
          ))}
        </div>
      )}

      <CreateDeckModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        classes={classes}
        resources={resources}
        topicsByClass={topicsByClass}
        defaultClassId={classId === "personal" ? undefined : classId}
        onCreateDeck={handleCreateDeck}
        isGenerating={isGenerating}
      />
    </div>
  );
};

export default ClassFlashcardsPage;
