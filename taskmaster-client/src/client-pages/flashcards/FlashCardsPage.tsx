import React, { useState, useEffect } from "react";
import { Plus, Play } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { apiService } from "../../services/api";
import { CreateDeckModal } from "../../components/flashcards/CreateDeckModal";
import { FlashcardPlayer } from "../../components/flashcards/FlashcardPlayer";
import type { ClassData } from "../../services/types";

interface FlashcardDeck {
  _id: string;
  class: string;
  className?: string;
  cardCount: number;
}

const FlashCardsPage: React.FC = () => {
  const { user } = useUser();
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

        // Fetch all flashcards and group by class
        const allFlashcards = await apiService.getAllFlashcards();
        
        // Group flashcards by class (skip null/personal classes)
        const deckMap = new Map<string, number>();
        allFlashcards.forEach((card: any) => {
          const classId = card.class?._id || card.class;
          // Only count flashcards with valid class IDs (not null or "personal")
          if (classId && typeof classId === 'string' && classId !== 'personal') {
            deckMap.set(classId, (deckMap.get(classId) || 0) + 1);
          }
        });

        // Create deck objects
        const deckList: FlashcardDeck[] = Array.from(deckMap.entries()).map(([classId, count]) => {
          const card = allFlashcards.find((c: any) => {
            const cid = c.class?._id || c.class;
            return cid === classId;
          });
          return {
            _id: classId,
            class: classId,
            className: userClasses.find(c => c._id === classId)?.name || card?.class?.name || "Unknown Class",
            cardCount: count,
          };
        });

        setDecks(deckList);
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
        const result = await apiService.generateFlashcards(data.classId, data.resourceId);
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
      const deckMap = new Map<string, number>();
      
      allFlashcards.forEach((card: any) => {
        // Handle both populated and non-populated class field
        const classId = card.class?._id || card.class;
        if (classId && typeof classId === 'string' && classId !== 'personal') {
          deckMap.set(classId, (deckMap.get(classId) || 0) + 1);
        }
      });

      const deckList: FlashcardDeck[] = Array.from(deckMap.entries()).map(([classId, count]) => {
        const card = allFlashcards.find((c: any) => {
             const cid = c.class?._id || c.class;
             return cid === classId;
        });
        return {
            _id: classId,
            class: classId,
            className: classes.find(c => c._id === classId)?.name || card?.class?.name || "Unknown Class",
            cardCount: count,
        };
      });

      setDecks(deckList);
    } catch (error) {
      console.error("Error refreshing decks:", error);
    }
  };


  const getDeckColor = (index: number) => {
    const colors = [
      "bg-blue-600",
      "bg-yellow-600",
      "bg-purple-600",
      "bg-red-600",
      "bg-green-600",
      "bg-pink-600",
      "bg-indigo-600",
      "bg-orange-600",
    ];
    return colors[index % colors.length];
  };

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
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> New Deck
        </button>
      </div>


      {successMessage && (
        <div className="bg-green-500/10 text-green-600 dark:text-green-400 px-4 py-2 rounded-md">
          {successMessage}
        </div>
      )}

      {decks.length === 0 ? (
        <div className="bg-card border border-border rounded-md p-8 text-center text-muted-foreground">
          <p>No flashcard decks yet. Create your first deck!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck, index) => (
            <div
              key={deck._id}
              onClick={() => setSelectedDeck(deck)}
              className="bg-card border border-border rounded-md p-6 hover:border-primary/50 transition-all group cursor-pointer relative overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-1 h-full ${getDeckColor(index)}`} />

              <h3 className="text-xl font-bold text-foreground mb-2">{deck.className}</h3>
              <p className="text-muted-foreground text-sm mb-6">{deck.cardCount} cards</p>

              <div className="flex justify-end">
                <button className="p-3 rounded-full bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Play size={20} fill="currentColor" />
                </button>
              </div>
            </div>
          ))}

          {/* Create New Deck Card */}
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
        onCreateDeck={handleCreateDeck}
        isGenerating={isGenerating}
      />

      {selectedDeck && (
        <FlashcardPlayer
          classId={selectedDeck.class}
          className={selectedDeck.className || "Flashcards"}
          onClose={() => setSelectedDeck(null)}
        />
      )}
    </div>
  );
};

export default FlashCardsPage;
