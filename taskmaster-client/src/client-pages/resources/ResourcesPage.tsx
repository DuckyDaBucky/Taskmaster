"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  GraduationCap,
  Loader2,
  PenTool,
  Video,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { classService } from "@/services/api/classService";
import type { ClassData } from "@/services/types";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/context/UserContext";

interface ResourceLink {
  title: string;
  url: string;
  type: string;
  source?: string;
  description?: string;
}

const RESOURCE_TYPE_META: Record<
  string,
  { label: string; Icon: React.ElementType }
> = {
  youtube: { label: "Video", Icon: Video },
  article: { label: "Research", Icon: FileText },
  textbook: { label: "Textbook", Icon: BookOpen },
  practice: { label: "Practice", Icon: PenTool },
  course: { label: "Lecture", Icon: GraduationCap },
  notes: { label: "Notes", Icon: FileText },
  reference: { label: "Reference", Icon: FileText },
};

const makeTopicKey = (classId: string, topic: string) =>
  `${classId}::${topic}`;

const getYoutubeEmbedUrl = (value: string) => {
  try {
    const url = new URL(value);
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (url.hostname.includes("youtube.com")) {
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
};

const dropdownVariants = {
  collapsed: { height: 0, opacity: 0 },
  open: { height: "auto", opacity: 1 },
};

const dropdownTransition = { duration: 0.25, ease: "easeOut" };

const ResourcesPage: React.FC = () => {
  const { user } = useUser();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [expandedEmbeds, setExpandedEmbeds] = useState<Record<string, boolean>>(
    {}
  );
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>(
    {}
  );
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>(
    {}
  );
  const [topicResources, setTopicResources] = useState<
    Record<string, ResourceLink[]>
  >({});
  const [topicStatus, setTopicStatus] = useState<
    Record<string, { loading: boolean; error?: string }>
  >({});

  useEffect(() => {
    let active = true;

    const loadClasses = async () => {
      try {
        const data = await classService.getAllClasses();
        if (active) {
          setClasses(data.filter((cls) => !cls.isPersonal));
        }
      } catch (err: any) {
        if (active) setError(err?.message || "Failed to load classes");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadClasses();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadUserId = async () => {
      if (user?._id) {
        if (active) setUserId(user._id);
        return;
      }

      const { data } = await supabase.auth.getUser();
      if (active) setUserId(data.user?.id || null);
    };

    loadUserId();
    return () => {
      active = false;
    };
  }, [user]);

  const toggleClass = useCallback((classId: string) => {
    setExpandedClasses((prev) => ({
      ...prev,
      [classId]: !prev[classId],
    }));
  }, []);

  const fetchTopicResources = useCallback(
    async (classItem: ClassData, topic: string, force: boolean = false) => {
      const key = makeTopicKey(classItem._id, topic);
      if (!force && (topicResources[key] || topicStatus[key]?.loading)) return;

      let sessionUserId = userId;
      if (!sessionUserId) {
        const { data } = await supabase.auth.getUser();
        sessionUserId = data.user?.id || null;
        if (sessionUserId) {
          setUserId(sessionUserId);
        }
      }

      if (!sessionUserId) {
        setTopicStatus((prev) => ({
          ...prev,
          [key]: { loading: false, error: "User session not available." },
        }));
        return;
      }

      setTopicStatus((prev) => ({ ...prev, [key]: { loading: true } }));

      try {
        const response = await fetch("/api/resources/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            class_id: classItem._id,
            user_id: sessionUserId,
            class_name: classItem.name,
            class_description: classItem.description,
            textbooks: classItem.textbooks || [],
            force,
          }),
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "Failed to generate resources");
        }

        const result = await response.json();
        const resources = result.resources || [];
        if (result.error || resources.length === 0) {
          setTopicResources((prev) => ({ ...prev, [key]: [] }));
          setTopicStatus((prev) => ({
            ...prev,
            [key]: {
              loading: false,
              error:
                result.error ||
                "No direct resources found. Try regenerate.",
            },
          }));
          return;
        }

        setTopicResources((prev) => ({ ...prev, [key]: resources }));
        setTopicStatus((prev) => ({ ...prev, [key]: { loading: false } }));
      } catch (err: any) {
        setTopicStatus((prev) => ({
          ...prev,
          [key]: { loading: false, error: err?.message || "Request failed" },
        }));
      }
    },
    [topicResources, topicStatus, userId]
  );

  const toggleTopic = useCallback(
    async (classItem: ClassData, topic: string) => {
      const key = makeTopicKey(classItem._id, topic);
      const nextOpen = !expandedTopics[key];

      setExpandedTopics((prev) => ({ ...prev, [key]: nextOpen }));

      if (nextOpen) {
        await fetchTopicResources(classItem, topic);
      }
    },
    [expandedTopics, fetchTopicResources]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Resources</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Explore AI-curated links by class and topic
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading classes...
        </div>
      ) : error ? (
        <div className="bg-card border border-border rounded-lg p-4 text-sm text-destructive">
          {error}
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-6 text-muted-foreground">
          No classes yet. Upload a syllabus in Classes to auto-generate topics.
        </div>
      ) : (
        <div className="space-y-3">
          {classes.map((classItem) => {
            const isOpen = expandedClasses[classItem._id];
            const topics = classItem.topics || [];

            return (
              <div
                key={classItem._id}
                className="border border-border rounded-lg overflow-hidden bg-card"
              >
                <button
                  type="button"
                  onClick={() => toggleClass(classItem._id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors"
                >
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {classItem.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {topics.length} topics
                      {classItem.professor ? ` - ${classItem.professor}` : ""}
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="class-panel"
                      variants={dropdownVariants}
                      initial="collapsed"
                      animate="open"
                      exit="collapsed"
                      transition={dropdownTransition}
                      className="overflow-hidden border-t border-border bg-muted/30"
                    >
                      <div className="px-4 py-4">
                        {topics.length === 0 ? (
                          <div className="text-sm text-muted-foreground">
                            No topics found yet. Upload a syllabus or add topics
                            in Classes.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {topics.map((topic) => {
                              const key = makeTopicKey(classItem._id, topic);
                              const isTopicOpen = expandedTopics[key];
                              const resources = topicResources[key] || [];
                              const status = topicStatus[key];

                              return (
                                <div
                                  key={key}
                                  className="border border-border rounded-md bg-card"
                                >
                                  <button
                                    type="button"
                                    onClick={() => toggleTopic(classItem, topic)}
                                    className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-muted/40 transition-colors"
                                  >
                                    <span className="text-sm font-medium text-foreground">
                                      {topic}
                                    </span>
                                    {isTopicOpen ? (
                                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </button>

                                  <AnimatePresence initial={false}>
                                    {isTopicOpen && (
                                      <motion.div
                                        key="topic-panel"
                                        variants={dropdownVariants}
                                        initial="collapsed"
                                        animate="open"
                                        exit="collapsed"
                                        transition={dropdownTransition}
                                        className="overflow-hidden border-t border-border bg-background"
                                      >
                                        <div className="px-3 py-3 space-y-3">
                                          {status?.loading && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                              <Loader2 className="h-4 w-4 animate-spin" />
                                              Gathering resources...
                                            </div>
                                          )}

                                          {status?.error && (
                                            <div className="text-sm text-destructive">
                                              {status.error}
                                            </div>
                                          )}

                                      {!status?.loading &&
                                        resources.length === 0 &&
                                        !status?.error && (
                                          <div className="text-sm text-muted-foreground">
                                            No direct resources generated yet.
                                          </div>
                                        )}

                                      {resources.length > 0 && (
                                        <div className="space-y-2">
                                              {resources.map(
                                                (resource, index) => {
                                                  const meta =
                                                    RESOURCE_TYPE_META[
                                                      resource.type
                                                    ] ||
                                                    RESOURCE_TYPE_META.reference;
                                                  const Icon = meta.Icon;
                                                  const embedUrl =
                                                    getYoutubeEmbedUrl(
                                                      resource.url
                                                    );
                                                  const typeLabel = meta.label;
                                                  const sourceLabel =
                                                    resource.source || "Source";
                                                  const titleLine = `${resource.title} — ${typeLabel} — ${sourceLabel}`;
                                                  const embedKey = `${key}::${resource.url}`;
                                                  const isEmbedOpen =
                                                    expandedEmbeds[embedKey];

                                                  return (
                                                    <div
                                                      key={`${resource.url}-${index}`}
                                                      className="rounded-md border border-border bg-card p-3 text-sm"
                                                    >
                                                      <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-center gap-2">
                                                          <Icon className="h-4 w-4 text-muted-foreground" />
                                                          <div>
                                                            <div className="font-medium text-foreground">
                                                              {titleLine}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                              {resource.url}
                                                            </div>
                                                          </div>
                                                        </div>
                                                        {!embedUrl && (
                                                          <a
                                                            href={resource.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                                          >
                                                            Open
                                                            <ExternalLink className="h-3 w-3" />
                                                          </a>
                                                        )}
                                                      </div>

                                                      {resource.description && (
                                                        <div className="mt-2 text-xs text-muted-foreground">
                                                          {resource.description}
                                                        </div>
                                                      )}

                                                      {embedUrl && (
                                                        <div className="mt-3">
                                                          <button
                                                            type="button"
                                                            onClick={() =>
                                                              setExpandedEmbeds(
                                                                (prev) => ({
                                                                  ...prev,
                                                                  [embedKey]:
                                                                    !prev[
                                                                      embedKey
                                                                    ],
                                                                })
                                                              )
                                                            }
                                                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                                          >
                                                            {isEmbedOpen ? (
                                                              <>
                                                                <ChevronDown className="h-3 w-3" />
                                                                Collapse video
                                                              </>
                                                            ) : (
                                                              <>
                                                                <ChevronRight className="h-3 w-3" />
                                                                Expand video
                                                              </>
                                                            )}
                                                          </button>

                                                          {isEmbedOpen && (
                                                            <div className="mt-2 max-w-md overflow-hidden rounded-md border border-border">
                                                              <div className="aspect-video w-full bg-black">
                                                                <iframe
                                                                  src={embedUrl}
                                                                  title={
                                                                    resource.title
                                                                  }
                                                                  className="h-full w-full"
                                                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                  allowFullScreen
                                                                />
                                                              </div>
                                                            </div>
                                                          )}
                                                        </div>
                                                      )}
                                                    </div>
                                                  );
                                                }
                                              )}
                                            </div>
                                      )}

                                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>
                                          Links are AI-generated direct
                                          resources. Verify quality before
                                          using.
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            fetchTopicResources(
                                              classItem,
                                              topic,
                                              true
                                            )
                                          }
                                          className="text-primary hover:underline"
                                        >
                                          Regenerate
                                        </button>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ResourcesPage;
