"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  RotateCcw,
  XCircle,
} from "lucide-react";
import type { FlashcardsData, ClassData } from "../../services/types";
import { apiService } from "../../services/api";
import { learnService } from "../../services/api/learnService";

// DO NOT CHANGE: Flashcards routes and core services
// - Flashcards home: FlashCardsPage
// - Class folder: ClassFlashcardsPage
// - Set landing: FlashcardSetPage
// - Study view: FlashcardPlayer
// - Generation: flashcardService.generateFlashcards + /api/flashcards/generate

interface LearnFlashcardsPageProps {
  classId: string;
  topic: string;
}

type LearnMode = "typed" | "mc";
type LearnResult = "correct" | "incorrect" | "almost";

type SavedLearnSession = {
  classId: string;
  topic: string;
  queue: string[];
  currentIndex: number;
  mode: LearnMode;
  attempts: number;
  correctCount: number;
  savedAt: string;
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const shuffleArray = <T,>(items: T[]) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const LearnFlashcardsPage: React.FC<LearnFlashcardsPageProps> = ({ classId, topic }) => {
  const [cards, setCards] = useState<FlashcardsData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [queue, setQueue] = useState<string[]>([]);
  const [initialQueue, setInitialQueue] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<LearnResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<LearnMode>("typed");
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [correctCount, setCorrectCount] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [resumeSession, setResumeSession] = useState<SavedLearnSession | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);

  const sessionKey = useMemo(
    () => `learnSession:${encodeURIComponent(classId)}:${encodeURIComponent(topic)}`,
    [classId, topic]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [allClasses, queueData] = await Promise.all([
          apiService.getAllClasses(),
          learnService.getLearnQueue(classId, topic),
        ]);

        setClasses(allClasses);
        const nextCards = queueData.cards || [];
        const nextQueue =
          queueData.queue && queueData.queue.length > 0
            ? queueData.queue
            : nextCards.map((card: FlashcardsData) => (card._id || (card as any).id));
        setCards(nextCards);
        setQueue(nextQueue);
        setInitialQueue(nextQueue);

        const map: Record<string, number> = {};
        (queueData.progress || []).forEach((row: any) => {
          map[row.card_id] = row.mastery_level || 0;
        });
        setProgressMap(map);

        if (typeof window !== "undefined") {
          const stored = window.localStorage.getItem(sessionKey);
          if (stored) {
            try {
              const parsed = JSON.parse(stored) as SavedLearnSession;
              if (parsed.queue?.length && parsed.classId === classId && parsed.topic === topic) {
                setResumeSession(parsed);
              }
            } catch {
              window.localStorage.removeItem(sessionKey);
            }
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [classId, topic]);

  useEffect(() => {
    if (isLoading || queue.length === 0 || resumeSession) return;
    if (typeof window === "undefined") return;
    const payload: SavedLearnSession = {
      classId,
      topic,
      queue,
      currentIndex,
      mode,
      attempts,
      correctCount,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(sessionKey, JSON.stringify(payload));
  }, [
    classId,
    topic,
    queue,
    currentIndex,
    mode,
    attempts,
    correctCount,
    isLoading,
    sessionKey,
    resumeSession,
  ]);

  const currentCard = useMemo(() => {
    const currentId = queue[currentIndex];
    return cards.find((card) => (card._id || (card as any).id) === currentId);
  }, [queue, currentIndex, cards]);

  useEffect(() => {
    if (!currentCard) return;
    setIsAnimating(true);
    const frame = requestAnimationFrame(() => setIsAnimating(false));
    return () => cancelAnimationFrame(frame);
  }, [currentCard]);

  const className =
    classId === "personal"
      ? "Personal"
      : classes.find((cls) => cls._id === classId)?.name || "Unknown Class";

  const masteredCount = useMemo(
    () => Object.values(progressMap).filter((level) => level >= 4).length,
    [progressMap]
  );

  const totalCards = cards.length;
  const accuracy = attempts > 0 ? Math.round((correctCount / attempts) * 100) : 0;

  const canUseMultipleChoice = cards.length >= 4;

  useEffect(() => {
    if (!canUseMultipleChoice && mode === "mc") {
      setMode("typed");
    }
  }, [canUseMultipleChoice, mode]);

  const options = useMemo(() => {
    if (!currentCard || mode !== "mc") return [];
    const answers = cards.map((card) => card.answer).filter(Boolean);
    const unique = Array.from(new Set(answers));
    const distractors = shuffleArray(
      unique.filter((answerText) => answerText !== currentCard.answer)
    ).slice(0, 3);
    return shuffleArray([currentCard.answer, ...distractors]);
  }, [cards, currentCard, mode]);

  const handleSubmit = async (resultOverride?: LearnResult) => {
    if (!currentCard) return;
    const correctAnswer = currentCard.answer || "";
    let result: LearnResult = "incorrect";

    if (resultOverride) {
      result = resultOverride;
    } else if (mode === "typed") {
      const normalized = normalizeText(answer);
      const normalizedCorrect = normalizeText(correctAnswer);
      result = normalized && normalized === normalizedCorrect ? "correct" : "incorrect";
    } else if (mode === "mc") {
      result = answer === correctAnswer ? "correct" : "incorrect";
    }

    try {
      const cardId = currentCard._id || (currentCard as any).id;
      if (!cardId) return;
      const progress = await learnService.submitAttempt({
        classId,
        topic,
        cardId,
        result,
        typedAnswer: answer,
        mode,
      });

      setFeedback(result);
      setAttempts((prev) => prev + 1);
      if (result === "correct") {
        setCorrectCount((prev) => prev + 1);
      }

      setProgressMap((prev) => ({
        ...prev,
        [cardId]: progress.mastery_level ?? prev[cardId] ?? 0,
      }));
    } catch (error) {
      console.error("Error submitting attempt:", error);
    }
  };

  const handleContinue = () => {
    if (!currentCard) return;
    const newQueue = [...queue];
    const currentId = currentCard._id || (currentCard as any).id;
    if (feedback === "incorrect" && currentId) {
      newQueue.push(currentId);
    }
    setQueue(newQueue);
    setCurrentIndex((prev) => Math.min(prev + 1, newQueue.length - 1));
    setAnswer("");
    setFeedback(null);
  };

  const handleRestart = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(sessionKey);
    }
    setCurrentIndex(0);
    setFeedback(null);
    setAnswer("");
    setAttempts(0);
    setCorrectCount(0);
  };

  const handleResume = () => {
    if (!resumeSession) return;
    const validIds = new Set(cards.map((card) => card._id || (card as any).id).filter(Boolean));
    const filteredQueue = resumeSession.queue.filter((id) => validIds.has(id));
    const safeQueue = filteredQueue.length > 0 ? filteredQueue : initialQueue;
    setQueue(safeQueue);
    setCurrentIndex(Math.min(resumeSession.currentIndex || 0, safeQueue.length - 1));
    setMode(resumeSession.mode || "typed");
    setAttempts(resumeSession.attempts || 0);
    setCorrectCount(resumeSession.correctCount || 0);
    setAnswer("");
    setFeedback(null);
    setResumeSession(null);
  };

  const handleStartNew = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(sessionKey);
    }
    setQueue(initialQueue);
    setCurrentIndex(0);
    setMode("typed");
    setAttempts(0);
    setCorrectCount(0);
    setAnswer("");
    setFeedback(null);
    setResumeSession(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Learn</h1>
        <div className="text-center text-muted-foreground">Loading learn session...</div>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="space-y-6">
        <Link
          href={`/flashcards/set/${encodeURIComponent(classId)}/${encodeURIComponent(topic)}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Back to set
        </Link>
        <div className="bg-card border border-border rounded-md p-8 text-center text-muted-foreground">
          No cards available to learn yet.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/flashcards/set/${encodeURIComponent(classId)}/${encodeURIComponent(topic)}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Back to set
      </Link>

      {resumeSession && (
        <div className="bg-card border border-border rounded-md p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Resume your last Learn session?</p>
            <p className="text-xs text-muted-foreground">
              You left off on card {Math.min(resumeSession.currentIndex + 1, resumeSession.queue.length)}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResume}
              className="px-3 py-1.5 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90"
            >
              Continue
            </button>
            <button
              onClick={handleStartNew}
              className="px-3 py-1.5 rounded-md border border-border text-sm text-foreground"
            >
              Start new
            </button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-md p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Learn Mode
          </p>
          <h1 className="text-2xl font-bold text-foreground">{topic}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {className} • Mastered {masteredCount}/{totalCards}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Brain size={18} />
          {accuracy}% accuracy
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Mode:</span>
        <button
          type="button"
          onClick={() => setMode("typed")}
          className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
            mode === "typed" ? "bg-primary text-white border-primary" : "border-border text-foreground"
          }`}
        >
          Typed
        </button>
        <button
          type="button"
          onClick={() => setMode("mc")}
          disabled={!canUseMultipleChoice}
          className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
            mode === "mc" ? "bg-primary text-white border-primary" : "border-border text-foreground"
          } ${!canUseMultipleChoice ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Multiple Choice
        </button>
      </div>

      <div
        className={`bg-card border border-border rounded-md p-6 space-y-4 transition-all duration-300 ease-out ${
          isAnimating ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
        }`}
      >
        <h2 className="text-lg font-semibold text-foreground">{currentCard.question}</h2>

        {mode === "typed" ? (
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer..."
            className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setAnswer(option)}
                className={`px-4 py-2 rounded-md border text-sm text-left transition-colors ${
                  answer === option
                    ? "bg-primary text-white border-primary"
                    : "bg-background border-border text-foreground"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {!feedback ? (
          <button
            onClick={() => handleSubmit()}
            className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90"
          >
            Submit
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              {feedback === "correct" ? (
                <CheckCircle2 size={18} className="text-green-500" />
              ) : (
                <XCircle size={18} className="text-red-500" />
              )}
              <span className="text-foreground">
                {feedback === "correct" ? "Correct" : "Incorrect"}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Correct answer: {currentCard.answer}
            </div>
            <div className="flex flex-wrap gap-2">
              {feedback === "incorrect" && (
                <button
                  onClick={() => handleSubmit("almost")}
                  className="px-3 py-1.5 rounded-md border border-border text-sm text-foreground"
                >
                  Mark as Almost
                </button>
              )}
              <button
                onClick={handleContinue}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90"
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-md p-6 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Progress: {currentIndex + 1} / {queue.length}
        </div>
        <button
          onClick={handleRestart}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <RotateCcw size={16} />
          Restart
        </button>
      </div>
    </div>
  );
};

export default LearnFlashcardsPage;
