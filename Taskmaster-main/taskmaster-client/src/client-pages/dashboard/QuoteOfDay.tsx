/**
 * QuoteOfDay - Daily motivational quote widget
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Quote, RefreshCw, Sparkles } from 'lucide-react';

interface QuoteData {
  text: string;
  author: string;
}

const quotes: QuoteData[] = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "What we learn with pleasure we never forget.", author: "Alfred Mercier" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
  { text: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.", author: "Dr. Seuss" },
  { text: "Don't let yesterday take up too much of today.", author: "Will Rogers" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
];

export const QuoteOfDay: React.FC = () => {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Get quote based on current day (consistent per day)
  useEffect(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    setQuoteIndex(dayOfYear % quotes.length);
  }, []);

  const quote = quotes[quoteIndex];

  const refreshQuote = () => {
    setIsAnimating(true);
    setQuoteIndex(prev => (prev + 1) % quotes.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  return (
    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-5 relative overflow-hidden">
      {/* Decorative element */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-8 -mt-8" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles size={18} className="text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Quote of the Day</h3>
        </div>
        <button 
          onClick={refreshQuote}
          className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors"
          title="Get new quote"
        >
          <RefreshCw size={16} className={`text-primary ${isAnimating ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Quote */}
      <div className={`relative transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
        <Quote size={24} className="text-primary/30 absolute -left-1 -top-1" />
        <blockquote className="pl-6 pr-2">
          <p className="text-sm text-foreground leading-relaxed italic">
            "{quote.text}"
          </p>
          <footer className="mt-2 text-xs text-muted-foreground">
            — {quote.author}
          </footer>
        </blockquote>
      </div>
    </div>
  );
};

export default QuoteOfDay;
