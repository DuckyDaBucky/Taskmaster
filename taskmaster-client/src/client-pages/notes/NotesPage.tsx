"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  PenLine,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { marked } from "marked";
import { classService } from "@/services/api/classService";
import { resourceService } from "@/services/api/resourceService";
import { notesService } from "@/services/api/notesService";
import type { ClassData, NoteData } from "@/services/types";

const NotesPage: React.FC = () => {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [topicsByClass, setTopicsByClass] = useState<Record<string, string[]>>({});
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [createFlashcards, setCreateFlashcards] = useState(true);
  const [flashcardCount, setFlashcardCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedNote, setGeneratedNote] = useState<NoteData | null>(null);
  const [flashcardLink, setFlashcardLink] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<NoteData | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const normalizeMarkdown = (value: string) => {
    const normalized = value
      .replace(/\\r\\n/g, "\n")
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "  ")
      .replace(/\r\n/g, "\n");

    const lines = normalized.split("\n");
    const indents = lines
      .filter((line) => line.trim().length > 0)
      .map((line) => line.match(/^(\s+)/)?.[1].length || 0);
    const minIndent = indents.length ? Math.min(...indents) : 0;
    if (minIndent === 0) return normalized;

    return lines
      .map((line) => (line.length >= minIndent ? line.slice(minIndent) : line))
      .join("\n");
  };

  const renderMarkdown = (value: string) => {
    const normalized = normalizeMarkdown(value);
    return marked.parse(normalized, { gfm: true, breaks: true });
  };

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        const [allClasses, allResources, allNotes] = await Promise.all([
          classService.getAllClasses(),
          resourceService.getAllResources(),
          notesService.getAllNotes(),
        ]);

        if (!active) return;

        const filteredClasses = allClasses.filter((cls) => !cls.isPersonal);
        setClasses(filteredClasses);
        setResources(allResources);
        setNotes(allNotes);

        const topicsMap: Record<string, Set<string>> = {};
        filteredClasses.forEach((cls) => {
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

        const normalized: Record<string, string[]> = {};
        Object.entries(topicsMap).forEach(([id, topics]) => {
          normalized[id] = Array.from(topics).filter(Boolean).sort();
        });
        setTopicsByClass(normalized);
      } catch (err: any) {
        if (active) setError(err?.message || "Failed to load notes");
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const classOptions = useMemo(() => classes, [classes]);
  const topicOptions = useMemo(
    () => topicsByClass[selectedClassId] || [],
    [topicsByClass, selectedClassId]
  );

  const notesByClass = useMemo(() => {
    const grouped: Record<string, NoteData[]> = {};
    notes.forEach((note) => {
      if (!grouped[note.classId]) grouped[note.classId] = [];
      grouped[note.classId].push(note);
    });
    return grouped;
  }, [notes]);

  const handleGenerate = async () => {
    setError(null);
    setGeneratedNote(null);
    setFlashcardLink(null);

    if (!selectedClassId) {
      setError("Select a class.");
      return;
    }
    if (!selectedTopic) {
      setError("Select a topic.");
      return;
    }
    if (!selectedFile) {
      setError("Upload a file to generate notes.");
      return;
    }

    try {
      setIsGenerating(true);
      const result = await notesService.generateNotes({
        classId: selectedClassId,
        topic: selectedTopic,
        file: selectedFile,
        createFlashcards,
        flashcardCount,
      });

      const note = result.note
        ? {
            _id: result.note.id,
            classId: result.note.class_id,
            topic: result.note.topic,
            title: result.note.title,
            content: result.note.content,
            resourceId: result.note.resource_id,
            createdAt: result.note.created_at,
          }
        : null;

      if (note) {
        setGeneratedNote(note);
        setSelectedNote(note);
      }

      if (result.flashcards?.set_url) {
        setFlashcardLink(result.flashcards.set_url);
      }

      const updatedNotes = await notesService.getAllNotes();
      setNotes(updatedNotes);
      setSelectedFile(null);
    } catch (err: any) {
      setError(err?.message || "Failed to generate notes");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteNote = async (note: NoteData) => {
    if (!window.confirm(`Delete "${note.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(note._id);
      await notesService.deleteNote(note._id);
      setNotes((prev) => prev.filter((item) => item._id !== note._id));
      if (selectedNote?._id === note._id) {
        setSelectedNote(null);
      }
      if (generatedNote?._id === note._id) {
        setGeneratedNote(null);
      }
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Note Creation</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload lecture materials and turn them into structured study notes.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-card border border-border rounded-lg p-6 space-y-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles size={16} />
            Generate structured notes from PDF/DOCX/PPTX
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Class
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedTopic("");
                }}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="">Select a class</option>
                {classOptions.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Topic
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                disabled={!selectedClassId}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground disabled:opacity-50"
              >
                <option value="">Select a topic</option>
                {topicOptions.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Upload Notes (PDF/DOCX/PPTX)
            </label>
            <div className="flex flex-col gap-3 rounded-md border border-dashed border-border bg-background/60 p-4">
              <input
                type="file"
                accept=".pdf,.docx,.pptx"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="text-sm text-muted-foreground"
              />
              {selectedFile && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText size={14} />
                  {selectedFile.name}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-md border border-border bg-background/60 p-4">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={createFlashcards}
                onChange={(e) => setCreateFlashcards(e.target.checked)}
                className="accent-primary"
              />
              Also create a flashcard set from these notes
            </label>
            {createFlashcards && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>Cards:</span>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={flashcardCount}
                  onChange={(e) => setFlashcardCount(Number(e.target.value))}
                  className="w-24 rounded-md border border-border bg-background px-2 py-1 text-foreground"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating notes...
              </>
            ) : (
              <>
                <PenLine size={16} />
                Generate Notes
              </>
            )}
          </button>

          {flashcardLink && (
            <Link
              href={flashcardLink}
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Zap size={14} />
              Open generated flashcard set
            </Link>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="text-sm font-semibold text-foreground">Latest Notes</div>
          {generatedNote ? (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-foreground">
                {generatedNote.title}
              </div>
              <div className="text-xs text-muted-foreground">
                {generatedNote.topic}
              </div>
              <div
                className="max-h-[320px] overflow-y-auto rounded-md border border-border bg-background p-3 text-sm text-foreground leading-relaxed space-y-2 [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_pre]:bg-muted/40 [&_pre]:p-3 [&_pre]:rounded-md [&_code]:bg-muted/40 [&_code]:px-1 [&_code]:rounded"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(generatedNote.content) }}
              />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Generate notes to see a preview here.
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Your Notes</h2>
        {classes.length === 0 ? (
          <div className="rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">
            No classes available yet. Create a class first.
          </div>
        ) : (
          classes.map((cls) => {
            const classNotes = notesByClass[cls._id] || [];
            const isOpen = expandedClasses[cls._id];
            return (
              <div
                key={cls._id}
                className="border border-border rounded-lg overflow-hidden bg-card"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedClasses((prev) => ({
                      ...prev,
                      [cls._id]: !prev[cls._id],
                    }))
                  }
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors"
                >
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {cls.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {classNotes.length} note{classNotes.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {isOpen && (
                  <div className="border-t border-border bg-background px-4 py-4 space-y-2">
                    {classNotes.length === 0 ? (
                      <div className="text-sm text-muted-foreground">
                        No notes yet for this class.
                      </div>
                    ) : (
                      classNotes.map((note) => (
                        <div
                          key={note._id}
                          className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 hover:bg-muted/40 transition-colors"
                        >
                          <button
                            onClick={() => setSelectedNote(note)}
                            className="flex-1 text-left"
                          >
                            <div className="text-sm font-medium text-foreground">
                              {note.title}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {note.topic}
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note)}
                            disabled={isDeleting === note._id}
                            className="ml-3 inline-flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {selectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-w-3xl w-full max-h-[80vh] overflow-hidden rounded-lg border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {selectedNote.title}
                </div>
                <div className="text-xs text-muted-foreground">{selectedNote.topic}</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDeleteNote(selectedNote)}
                  disabled={isDeleting === selectedNote._id}
                  className="inline-flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
                <button
                  onClick={() => setSelectedNote(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Close
                </button>
              </div>
            </div>
            <div
              className="p-4 overflow-y-auto max-h-[70vh] text-sm text-foreground leading-relaxed space-y-2 [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_pre]:bg-muted/40 [&_pre]:p-3 [&_pre]:rounded-md [&_code]:bg-muted/40 [&_code]:px-1 [&_code]:rounded"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedNote.content) }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesPage;
