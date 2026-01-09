import React, { useState, useEffect, useMemo } from "react";
import { Folder, Plus } from "lucide-react";
import Link from "next/link";
import { useUser } from "../../context/UserContext";
import { apiService } from "../../services/api";
import { CreateDeckModal } from "../../components/flashcards/CreateDeckModal";
import type { ClassData, FlashcardsData } from "../../services/types";
import { getClassColor } from "../../utils/classColors";

// DO NOT CHANGE: Flashcards data flow relies on:
// - apiService.getAllFlashcards / getAllClasses / getAllResources
// - apiService.generateFlashcards / createManualFlashcards
// - /api/flashcards/generate payload compatibility
// - FlashcardPlayer props: classId, className, onClose (topic optional)

interface ClassFolder {
  classId: string;
  className: string;
  setCount: number;
  topics: string[];
}

const FlashCardsPage: React.FC = () => {
  const { user } = useUser();
  const [flashcards, setFlashcards] = useState<FlashcardsData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [resources, setResources] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [topicsByClass, setTopicsByClass] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!user?._id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // Fetch classes
        const userClasses = await apiService.getAllClasses();
        setClasses(userClasses);

        // Fetch resources for auto mode
        const allResources = await apiService.getAllResources();
        setResources(allResources);

        // Fetch all flashcards
        const allFlashcards = await apiService.getAllFlashcards();
        setFlashcards(allFlashcards);

        const topicsMap: Record<string, Set<string>> = {};
        userClasses.forEach((cls) => {
          if (!cls._id) return;
          topicsMap[cls._id] = new Set(cls.topics || []);
        });

        allResources.forEach((res: any) => {
          const classId = res.class;
          const keyTopics = res.extracted_data?.key_topics || [];
          if (!classId || keyTopics.length === 0) return;
          if (!topicsMap[classId]) topicsMap[classId] = new Set();
          keyTopics.forEach((topic: string) => topicsMap[classId].add(topic));
        });

        const normalizedTopics: Record<string, string[]> = {};
        Object.entries(topicsMap).forEach(([classId, topics]) => {
          normalizedTopics[classId] = Array.from(topics).filter(Boolean).sort();
        });
        setTopicsByClass(normalizedTopics);
      } catch (error) {
        console.error("Error fetching flashcards:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?._id]);

  const handleCreateDeck = async (mode: "auto" | "manual", data: any) => {
    try {
      setIsGenerating(true);
      setSuccessMessage(null);

      if (mode === "auto") {
        const result = await apiService.generateFlashcards(data.classId, {
          resourceId: data.resourceId,
          topic: data.topic,
          count: data.count,
        });
        setSuccessMessage(`Flashcards generated successfully! Created ${result.length || 0} cards.`);
      } else {
        const result = await apiService.createManualFlashcards(data.classId, data.cards);
        setSuccessMessage(`Created ${result.count || data.cards.length} flashcards successfully!`);
      }

      await refreshDecks();
      setShowCreateModal(false);
    } catch (error: any) {
      console.error("Error creating flashcards:", error);
      // Silently fail - don't show error to user
    } finally {
      setIsGenerating(false);
    }
  };

  const refreshDecks = async () => {
    try {
      const allFlashcards = await apiService.getAllFlashcards();
      setFlashcards(allFlashcards);
    } catch (error) {
      console.error("Error refreshing decks:", error);
    }
  };

  const folders = useMemo<ClassFolder[]>(() => {
    const folderMap = new Map<string, { className: string; topics: Set<string> }>();

    classes.forEach((cls) => {
      if (!cls._id) return;
      folderMap.set(cls._id, {
        className: cls.name || "Unknown Class",
        topics: new Set(),
      });
    });

    flashcards.forEach((card) => {
      const classId = (card.class as string) || "personal";
      const topic = card.topic || "General";
      if (!folderMap.has(classId)) {
        folderMap.set(classId, { className: "Personal", topics: new Set() });
      }
      folderMap.get(classId)?.topics.add(topic);
    });

    return Array.from(folderMap.entries()).map(([classId, info]) => ({
      classId,
      className: info.className,
      setCount: info.topics.size,
      topics: Array.from(info.topics).slice(0, 3),
    }));
  }, [flashcards, classes]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Flashcards</h1>
        </div>
        <div className="text-center text-muted-foreground">Loading flashcards...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Flashcards</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> New Deck
        </button>
      </div>


      {successMessage && (
        <div className="bg-green-500/10 text-green-600 dark:text-green-400 px-4 py-2 rounded-md">
          {successMessage}
        </div>
      )}

      {folders.length === 0 ? (
        <div className="bg-card border border-border rounded-md p-8 text-center text-muted-foreground">
          <p>No flashcard decks yet. Create your first deck!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {folders.map((folder) => (
            <Link
              key={folder.classId}
              href={`/flashcards/class/${encodeURIComponent(folder.classId)}`}
              className="bg-card border border-border rounded-md p-6 hover:border-primary/50 transition-all group cursor-pointer relative overflow-hidden"
            >
              <span
                className="absolute inset-x-0 top-0 h-1"
                style={{ backgroundColor: getClassColor(folder.classId) }}
              />
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {folder.className}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {folder.setCount} set{folder.setCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-secondary text-foreground group-hover:bg-primary group-hover:text-white transition-colors">
                  <Folder size={20} />
                </div>
              </div>
              {folder.topics.length > 0 && (
                <div className="mt-4 text-xs text-muted-foreground">
                  Top topics: {folder.topics.join(", ")}
                </div>
              )}
            </Link>
          ))}

          <button
            onClick={() => setShowCreateModal(true)}
            className="border-2 border-dashed border-border rounded-md p-6 flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors h-full min-h-[180px]"
          >
            <Plus size={32} className="mb-2" />
            <span className="font-medium">Create New Deck</span>
          </button>
        </div>
      )}

      <CreateDeckModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
        }}
        classes={classes}
        resources={resources}
        topicsByClass={topicsByClass}
        onCreateDeck={handleCreateDeck}
        isGenerating={isGenerating}
      />

    </div>
  );
};

export default FlashCardsPage;
