import React from "react";
import { Plus, Play } from "lucide-react";

const DECKS_DATA = [
  { id: 1, title: "Calculus Formulas", count: 24, color: "bg-blue-600" },
  { id: 2, title: "History Dates", count: 50, color: "bg-yellow-600" },
  { id: 3, title: "Physics Constants", count: 15, color: "bg-purple-600" },
  { id: 4, title: "Spanish Vocabulary", count: 100, color: "bg-red-600" },
];

const FlashCardsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Flashcards</h1>
        <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md text-sm font-medium transition-colors flex items-center gap-2">
          <Plus size={16} /> New Deck
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {DECKS_DATA.map((deck) => (
          <div key={deck.id} className="bg-card border border-border rounded-md p-6 hover:border-primary/50 transition-all group cursor-pointer relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${deck.color}`} />
            
            <h3 className="text-xl font-bold text-foreground mb-2">{deck.title}</h3>
            <p className="text-muted-foreground text-sm mb-6">{deck.count} cards</p>
            
            <div className="flex justify-end">
              <button className="p-3 rounded-full bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Play size={20} fill="currentColor" />
              </button>
            </div>
          </div>
        ))}
        
        {/* Create New Deck Card */}
        <button className="border-2 border-dashed border-border rounded-md p-6 flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors h-full min-h-[180px]">
          <Plus size={32} className="mb-2" />
          <span className="font-medium">Create New Deck</span>
        </button>
      </div>
    </div>
  );
};

export default FlashCardsPage;
