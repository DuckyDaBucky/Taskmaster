/**
 * ClassOverviewDialog - Modal showing detailed class info from syllabus
 * Refactored to use modular UI components
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Loader2,
  BookOpen,
  User,
  FileText,
  ListChecks,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  PenTool,
  Video,
} from 'lucide-react';
import Link from 'next/link';
import type { ClassData, TasksData, ResourceData } from '../services/types';
import { apiService } from '../services/api';
import { InfoCard } from './ui/InfoCard';
import { Badge } from './ui/Badge';
import { SectionHeader } from './ui/SectionHeader';
import { useUser } from '../context/UserContext';
import { TaskModal } from './tasks/TaskModal';
import { streakService } from '../services/streakService';
import { supabase } from '../lib/supabase';

// --- Types ---
interface ClassOverviewDialogProps {
  classData: ClassData | null;
  isOpen: boolean;
  onClose: () => void;
  variant?: "modal" | "page";
}

interface TaskStats {
  overdue: TasksData[];
  upcoming: TasksData[];
  completed: TasksData[];
}

interface FlashcardSetSummary {
  id: string;
  topic: string;
  cardCount: number;
  notesGenerated: boolean;
}

interface ResourceLink {
  title: string;
  url: string;
  type: string;
  source?: string;
  description?: string;
}

const RESOURCE_TYPE_META: Record<string, { label: string; Icon: React.ElementType }> = {
  youtube: { label: "Video", Icon: Video },
  article: { label: "Research", Icon: FileText },
  textbook: { label: "Textbook", Icon: BookOpen },
  practice: { label: "Practice", Icon: PenTool },
  course: { label: "Lecture", Icon: GraduationCap },
  notes: { label: "Notes", Icon: FileText },
  reference: { label: "Reference", Icon: FileText },
};

// --- Helper Functions ---
const categorizeTasksByStatus = (tasks: TasksData[]): TaskStats => {
  const now = new Date();
  return {
    overdue: tasks.filter(t => !t.completed && t.deadline && new Date(t.deadline) < now),
    upcoming: tasks.filter(t => !t.completed && t.deadline && new Date(t.deadline) >= now),
    completed: tasks.filter(t => t.completed),
  };
};

const findSyllabusResource = (resources: ResourceData[]): ResourceData | undefined => {
  return resources.find(r => 
    r.extracted_data?.document_type === 'syllabus' || 
    r.title?.toLowerCase().includes('syllabus')
  );
};

const getResourceFileUrl = (resource?: ResourceData): string | null => {
  if (!resource) return null;
  const fileWithUrl = (resource.files || []).find((file: any) => file?.url);
  if (fileWithUrl?.url) return fileWithUrl.url;
  const urlFromList = resource.urls?.find(Boolean);
  return urlFromList || null;
};

const formatDetail = (value?: string | null) => {
  if (!value) return "Information not provided";
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "Information not provided";
};

const formatListDetail = (value?: string | null) => {
  if (!value) return "Information not provided";
  const trimmed = value.trim();
  if (!trimmed) return "Information not provided";

  const hasBullets = /(^|\n)\s*-/.test(trimmed);
  if (hasBullets) return trimmed;

  const normalized = trimmed.replace(/\r\n/g, "\n");
  const parts = normalized
    .split(/\n|;|\. (?=[A-Z])/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length <= 1) return trimmed;

  return parts.map((part) => `- ${part}`).join("\n");
};

const formatMaterialsDetail = (value?: string | null) => {
  if (!value) return "Information not provided";
  const trimmed = value.trim();
  if (!trimmed) return "Information not provided";

  const normalized = trimmed.replace(/\r\n/g, "\n");
  const requiredMatch = normalized.match(/required\s*:\s*([\s\S]*?)(optional\s*:|$)/i);
  const optionalMatch = normalized.match(/optional\s*:\s*([\s\S]*)/i);

  if (!requiredMatch && !optionalMatch) {
    return formatListDetail(trimmed);
  }

  const requiredText = requiredMatch ? requiredMatch[1].trim() : "";
  const optionalText = optionalMatch ? optionalMatch[1].trim() : "";

  const lines: string[] = [];
  if (requiredText) {
    lines.push("Required:");
    lines.push(formatListDetail(requiredText));
  }
  if (optionalText) {
    lines.push("Optional:");
    lines.push(formatListDetail(optionalText));
  }

  return lines.join("\n");
};

const formatPolicyDetail = (value?: string | null) => {
  if (!value) return "Information not provided";
  const trimmed = value.trim();
  if (!trimmed) return "Information not provided";
  return formatListDetail(trimmed);
};

const makeTopicKey = (classId: string, topic: string) => `${classId}::${topic}`;

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

const dropdownTransition = { duration: 0.25, ease: "easeInOut" } as const;

// --- Sub-components ---
const DialogHeader: React.FC<{
  classData: ClassData;
  onClose?: () => void;
  showClose?: boolean;
}> = ({ classData, onClose, showClose = true }) => (
  <div className="bg-primary text-white px-6 py-4 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
        <BookOpen size={24} />
      </div>
      <div>
        <h2 className="text-xl font-bold">{classData.name}</h2>
        {classData.professor && (
          <p className="text-sm opacity-90 flex items-center gap-1">
            <User size={14} />
            {classData.professor}
          </p>
        )}
      </div>
    </div>
    {showClose && (
      <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
        <X size={20} />
      </button>
    )}
  </div>
);

const AISummarySection: React.FC<{
  summary: string;
  isGenerating: boolean;
  onGenerate: () => void;
}> = ({ summary, isGenerating, onGenerate }) => (
  <div className="bg-secondary/30 rounded-lg p-4">
    <div className="flex items-center justify-between mb-2">
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <Sparkles size={16} className="text-primary" />
        AI Overview
      </h3>
      {!summary && (
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="text-xs px-3 py-1 bg-primary text-white rounded-full hover:bg-primary/90 disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : 'Generate Summary'}
        </button>
      )}
    </div>
    <p className="text-sm text-muted-foreground">
      {summary || 'Upload a syllabus or click Generate to get an AI overview of this class.'}
    </p>
  </div>
);

const TopicsSection: React.FC<{ topics: string[] }> = ({ topics }) => (
  <div>
    <SectionHeader title="Topics" icon={BookOpen} />
    <div className="flex flex-wrap gap-2">
      {topics.map((topic, i) => (
        <Badge key={i} variant="primary" className="px-3 py-1 rounded-full">
          {topic}
        </Badge>
      ))}
    </div>
  </div>
);

const TaskStatusPanel: React.FC<{
  label: string;
  count: number;
  accent: string;
  tasks: TasksData[];
  defaultOpen?: boolean;
  onEdit: (task: TasksData) => void;
  onDelete: (taskId: string) => void;
  onToggleComplete: (task: TasksData) => void;
}> = ({ label, count, accent, tasks, defaultOpen = true, onEdit, onDelete, onToggleComplete }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-secondary/10 border border-border rounded-xl p-4">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${accent}`} />
          <span className="text-sm font-semibold text-foreground">{label}</span>
          <span className="text-xs text-muted-foreground">({count})</span>
        </div>
        <span className="text-xs text-muted-foreground">{isOpen ? "Hide" : "Show"}</span>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-3">
          {tasks.length == 0 ? (
            <div className="text-xs text-muted-foreground">No tasks in this section.</div>
          ) : (
            tasks.map((task) => (
              <div
                key={task._id}
                className="bg-card border border-border rounded-md p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onToggleComplete(task)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      task.completed ? "bg-green-500 border-green-500" : "border-muted-foreground hover:border-primary"
                    }`}
                    aria-label="Toggle complete"
                  >
                    {task.completed && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        strokeWidth="2"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div>
                    <p className={`text-sm ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Due: {task.deadline ? new Date(task.deadline).toLocaleDateString() : "No deadline"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(task)}
                    className="text-xs px-2 py-1 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(task._id)}
                    className="text-xs px-2 py-1 rounded-md border border-border text-destructive hover:bg-destructive/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const TasksSection: React.FC<{
  stats: TaskStats;
  total: number;
  onEdit: (task: TasksData) => void;
  onDelete: (taskId: string) => void;
  onToggleComplete: (task: TasksData) => void;
}> = ({ stats, total, onEdit, onDelete, onToggleComplete }) => (
  <div className="space-y-4">
    <SectionHeader title="Tasks" icon={ListChecks} count={total} />
    <div className="space-y-4">
      <TaskStatusPanel
        label="Overdue"
        count={stats.overdue.length}
        accent="bg-red-500"
        tasks={stats.overdue}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleComplete={onToggleComplete}
      />
      <TaskStatusPanel
        label="Upcoming"
        count={stats.upcoming.length}
        accent="bg-orange-500"
        tasks={stats.upcoming}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleComplete={onToggleComplete}
      />
      <TaskStatusPanel
        label="Completed"
        count={stats.completed.length}
        accent="bg-green-500"
        tasks={stats.completed}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleComplete={onToggleComplete}
        defaultOpen={false}
      />
    </div>
  </div>
);

const ResourcesSection: React.FC<{ resources: ResourceData[] }> = ({ resources }) => (
  <div>
    <SectionHeader title="User Uploaded Resources" icon={FileText} count={resources.length} />
    <div className="space-y-2">
      {resources.slice(0, 5).map(resource => (
        <div key={resource._id} className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/20 rounded px-3 py-2">
          <FileText size={14} />
          <span className="truncate">{resource.title || 'Untitled Resource'}</span>
          {resource.extracted_data?.document_type && (
            <Badge variant="primary" className="ml-auto">
              {resource.extracted_data.document_type}
            </Badge>
          )}
        </div>
      ))}
    </div>
  </div>
);

// --- Main Component ---
const ClassOverviewDialog: React.FC<ClassOverviewDialogProps> = ({
  classData,
  isOpen,
  onClose,
  variant = "modal",
}) => {
  const [tasks, setTasks] = useState<TasksData[]>([]);
  const [resources, setResources] = useState<ResourceData[]>([]);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isFillingDetails, setIsFillingDetails] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isInternetResourcesOpen, setIsInternetResourcesOpen] = useState(true);
  const [isFlashcardsOpen, setIsFlashcardsOpen] = useState(true);
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [expandedEmbeds, setExpandedEmbeds] = useState<Record<string, boolean>>({});
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [topicResources, setTopicResources] = useState<Record<string, ResourceLink[]>>({});
  const [topicStatus, setTopicStatus] = useState<Record<string, { loading: boolean; error?: string }>>({});
  const [detailsForm, setDetailsForm] = useState({
    currentTerm: "",
    timing: "",
    officeHours: "",
    location: "",
    contactEmail: "",
    contactPhone: "",
    officeLocation: "",
    textbooks: "",
    learningObjectives: "",
    description: "",
    gradingPolicy: "",
    attendancePolicy: "",
    extraAndLate: "",
  });
  const reparseAttemptsRef = useRef<Record<string, boolean>>({});
  const { user } = useUser();

  const syllabusResource = useMemo(
    () => findSyllabusResource(resources),
    [resources]
  );
  const syllabusDetails = useMemo(() => {
    const extracted: any = syllabusResource?.extracted_data || {};
    const courseInfo = extracted.course_info || extracted.courseInfo || {};
    const policies = extracted.course_policies || extracted.coursePolicies || {};

    const description =
      courseInfo.description ||
      classData?.description ||
      null;
    const timing =
      courseInfo.schedule ||
      classData?.timing ||
      null;
    const location =
      courseInfo.location ||
      classData?.location ||
      null;
    const textbooks =
      policies.textbooks_and_materials ||
      (classData?.textbooks && classData.textbooks.length > 0
        ? classData.textbooks.join(", ")
        : null);
    const extraCredit = policies.extra_credit_policy || null;
    const lateWork = policies.late_work_policy || null;
    const extraAndLateOverride = policies.extra_and_late_policy || null;
    const extraAndLate = extraCredit || lateWork
      ? [
          lateWork ? `Late work: ${lateWork}` : null,
          extraCredit ? `Extra credit: ${extraCredit}` : null,
        ].filter(Boolean).join(" | ")
      : null;

    const rawContact = courseInfo.contact_info || classData?.contactInfo || null;
    const explicitEmail = courseInfo.contact_email || null;
    const explicitPhone = courseInfo.contact_phone || null;
    const explicitOffice = courseInfo.office_location || null;
    const emailMatch = typeof rawContact === "string"
      ? rawContact.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
      : null;
    const phoneMatch = typeof rawContact === "string"
      ? rawContact.match(/(\+?\d{1,2}\s*)?(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/)
      : null;
    const officeLine = typeof rawContact === "string"
      ? rawContact.split("\n").find((line) => /office|location|room/i.test(line))
      : null;

    const officeLocationClean = officeLine
      ? officeLine
          .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "")
          .replace(/(\+?\d{1,2}\s*)?(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/g, "")
          .replace(/\b(email|e-mail|tel|telephone|phone)\b\s*[:\-]?\s*/gi, "")
          .replace(/\s{2,}/g, " ")
          .trim()
      : null;

    return {
      currentTerm: courseInfo.semester || null,
      timing,
      officeHours: courseInfo.professor_office_hours || null,
      location,
      textbooks,
      description,
      learningObjectives: policies.learning_objectives || null,
      extraAndLate: extraAndLateOverride || extraAndLate,
      gradingPolicy: policies.grading_policy || classData?.gradingPolicy || null,
      attendancePolicy: policies.attendance_policy || null,
      contactEmail: explicitEmail || (emailMatch ? emailMatch[0] : null),
      contactPhone: explicitPhone || (phoneMatch ? phoneMatch[0] : null),
      officeLocation: explicitOffice || officeLocationClean || null,
      contactInfoRaw: rawContact,
    };
  }, [syllabusResource, classData]);

  const missingDetailCount = useMemo(() => {
    const values = [
      syllabusDetails.currentTerm,
      syllabusDetails.timing,
      syllabusDetails.officeHours,
      syllabusDetails.location,
      syllabusDetails.textbooks,
      syllabusDetails.description,
      syllabusDetails.learningObjectives,
      syllabusDetails.extraAndLate,
      syllabusDetails.gradingPolicy,
      syllabusDetails.attendancePolicy,
      syllabusDetails.contactEmail,
      syllabusDetails.contactPhone,
      syllabusDetails.officeLocation,
    ];
    return values.filter((value) => {
      if (!value) return true;
      if (typeof value === "string") return value.trim().length === 0;
      return false;
    }).length;
  }, [syllabusDetails]);
  const syllabusUrl = useMemo(
    () => getResourceFileUrl(syllabusResource),
    [syllabusResource]
  );

  // Memoized task categorization
  const taskStats = useMemo(() => categorizeTasksByStatus(tasks), [tasks]);
  const flashcardSets = useMemo<FlashcardSetSummary[]>(() => {
    if (!classData) return [];
    const map = new Map<string, FlashcardSetSummary>();

    flashcards.forEach((card: any) => {
      const topic = card.topic || "General";
      if (!map.has(topic)) {
        map.set(topic, {
          id: topic,
          topic,
          cardCount: 0,
          notesGenerated: false,
        });
      }
      const entry = map.get(topic)!;
      entry.cardCount += 1;
      if (card.description?.toLowerCase().includes("notes-generated")) {
        entry.notesGenerated = true;
      }
    });

    return Array.from(map.values()).sort((a, b) => a.topic.localeCompare(b.topic));
  }, [flashcards, classData]);

  const loadClassDetails = useCallback(async () => {
    if (!classData) return;
    
    setIsLoading(true);
    try {
      const [classTasks, classResources, classFlashcards] = await Promise.all([
        apiService.getTasksByClassId(classData._id),
        apiService.getResourcesByClassId(classData._id),
        apiService.getFlashcardsByClassId(classData._id),
      ]);
      
      setTasks(classTasks);
      setResources(classResources);
      setFlashcards(classFlashcards);

      // Extract AI summary from syllabus if available
      const syllabusResource = findSyllabusResource(classResources);
      if (syllabusResource?.ai_summary) {
        setAiSummary(syllabusResource.ai_summary);
      } else if (syllabusResource?.extracted_data?.course_info?.description) {
        setAiSummary(syllabusResource.extracted_data.course_info.description);
      }
    } catch (error) {
      console.error('Error loading class details:', error);
    } finally {
      setIsLoading(false);
    }
  }, [classData]);

  useEffect(() => {
    if (isOpen && classData) {
      loadClassDetails();
    }
  }, [isOpen, classData, loadClassDetails]);

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

  useEffect(() => {
    if (!isOpen || isEditingDetails) return;
    setDetailsForm({
      currentTerm: syllabusDetails.currentTerm || "",
      timing: syllabusDetails.timing || "",
      officeHours: syllabusDetails.officeHours || "",
      location: syllabusDetails.location || "",
      contactEmail: syllabusDetails.contactEmail || "",
      contactPhone: syllabusDetails.contactPhone || "",
      officeLocation: syllabusDetails.officeLocation || "",
      textbooks: syllabusDetails.textbooks || "",
      learningObjectives: syllabusDetails.learningObjectives || "",
      description: syllabusDetails.description || "",
      gradingPolicy: syllabusDetails.gradingPolicy || "",
      attendancePolicy: syllabusDetails.attendancePolicy || "",
      extraAndLate: syllabusDetails.extraAndLate || "",
    });
  }, [isOpen, syllabusDetails, isEditingDetails]);

  useEffect(() => {
    if (!isOpen || !classData) return;
    if (!syllabusResource?._id || !syllabusUrl) return;
    if (missingDetailCount === 0) return;
    if (reparseAttemptsRef.current[syllabusResource._id]) return;

    const fillMissingDetails = async () => {
      try {
        reparseAttemptsRef.current[syllabusResource._id] = true;
        setIsFillingDetails(true);
        const response = await fetch('/api/documents/reparse-syllabus-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resource_id: syllabusResource._id,
            file_url: syllabusUrl,
          }),
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (!data?.extracted_data) return;

        setResources((prev) =>
          prev.map((resource) =>
            resource._id === syllabusResource._id
              ? { ...resource, extracted_data: data.extracted_data }
              : resource
          )
        );
      } catch (error) {
        console.error('Error filling missing syllabus details:', error);
      } finally {
        setIsFillingDetails(false);
      }
    };

    fillMissingDetails();
  }, [isOpen, classData, syllabusResource, syllabusUrl, missingDetailCount]);

  const fetchTopicResources = useCallback(
    async (topic: string, force: boolean = false) => {
      if (!classData) return;
      const key = makeTopicKey(classData._id, topic);
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
            class_id: classData._id,
            user_id: sessionUserId,
            class_name: classData.name,
            class_description: classData.description,
            textbooks: classData.textbooks || [],
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
              error: result.error || "No direct resources found. Try regenerate.",
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
    [classData, topicResources, topicStatus, userId]
  );

  const toggleTopic = useCallback(
    async (topic: string) => {
      if (!classData) return;
      const key = makeTopicKey(classData._id, topic);
      const nextOpen = !expandedTopics[key];

      setExpandedTopics((prev) => ({ ...prev, [key]: nextOpen }));

      if (nextOpen) {
        await fetchTopicResources(topic);
      }
    },
    [classData, expandedTopics, fetchTopicResources]
  );

  const handleEditDetails = () => {
    setDetailsForm({
      currentTerm: syllabusDetails.currentTerm || "",
      timing: syllabusDetails.timing || "",
      officeHours: syllabusDetails.officeHours || "",
      location: syllabusDetails.location || "",
      contactEmail: syllabusDetails.contactEmail || "",
      contactPhone: syllabusDetails.contactPhone || "",
      officeLocation: syllabusDetails.officeLocation || "",
      textbooks: syllabusDetails.textbooks || "",
      learningObjectives: syllabusDetails.learningObjectives || "",
      description: syllabusDetails.description || "",
      gradingPolicy: syllabusDetails.gradingPolicy || "",
      attendancePolicy: syllabusDetails.attendancePolicy || "",
      extraAndLate: syllabusDetails.extraAndLate || "",
    });
    setIsEditingDetails(true);
    setDetailsError(null);
  };

  const handleCancelEditDetails = () => {
    setIsEditingDetails(false);
    setDetailsError(null);
    setDetailsForm({
      currentTerm: syllabusDetails.currentTerm || "",
      timing: syllabusDetails.timing || "",
      officeHours: syllabusDetails.officeHours || "",
      location: syllabusDetails.location || "",
      contactEmail: syllabusDetails.contactEmail || "",
      contactPhone: syllabusDetails.contactPhone || "",
      officeLocation: syllabusDetails.officeLocation || "",
      textbooks: syllabusDetails.textbooks || "",
      learningObjectives: syllabusDetails.learningObjectives || "",
      description: syllabusDetails.description || "",
      gradingPolicy: syllabusDetails.gradingPolicy || "",
      attendancePolicy: syllabusDetails.attendancePolicy || "",
      extraAndLate: syllabusDetails.extraAndLate || "",
    });
  };

  const handleSaveDetails = async () => {
    if (!classData) return;
    setIsSavingDetails(true);
    setDetailsError(null);

    const normalize = (value: string) => {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    };

    try {
      await apiService.updateClass(classData._id, {
        timing: normalize(detailsForm.timing) || undefined,
        location: normalize(detailsForm.location) || undefined,
        contactInfo: normalize(
          [detailsForm.contactEmail && `Email: ${detailsForm.contactEmail}`,
           detailsForm.contactPhone && `Phone: ${detailsForm.contactPhone}`,
           detailsForm.officeLocation && `Office: ${detailsForm.officeLocation}`]
            .filter(Boolean)
            .join("\n")
        ) || undefined,
        gradingPolicy: normalize(detailsForm.gradingPolicy) || undefined,
        description: normalize(detailsForm.description) || undefined,
      });

      if (syllabusResource?._id && user?._id) {
        const response = await fetch('/api/resources/update-syllabus-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resource_id: syllabusResource._id,
            user_id: user._id,
            course_info: {
              semester: normalize(detailsForm.currentTerm),
              schedule: normalize(detailsForm.timing),
              professor_office_hours: normalize(detailsForm.officeHours),
              location: normalize(detailsForm.location),
              description: normalize(detailsForm.description),
              contact_email: normalize(detailsForm.contactEmail),
              contact_phone: normalize(detailsForm.contactPhone),
              office_location: normalize(detailsForm.officeLocation),
              contact_info: normalize(
                [detailsForm.contactEmail && `Email: ${detailsForm.contactEmail}`,
                 detailsForm.contactPhone && `Phone: ${detailsForm.contactPhone}`,
                 detailsForm.officeLocation && `Office: ${detailsForm.officeLocation}`]
                  .filter(Boolean)
                  .join("\n")
              ),
            },
            course_policies: {
              textbooks_and_materials: normalize(detailsForm.textbooks),
              learning_objectives: normalize(detailsForm.learningObjectives),
              grading_policy: normalize(detailsForm.gradingPolicy),
              attendance_policy: normalize(detailsForm.attendancePolicy),
              extra_and_late_policy: normalize(detailsForm.extraAndLate),
            },
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data?.error || "Failed to save syllabus details");
        }

        const data = await response.json();
        if (data?.extracted_data) {
          setResources((prev) =>
            prev.map((resource) =>
              resource._id === syllabusResource._id
                ? { ...resource, extracted_data: data.extracted_data }
                : resource
            )
          );
        }
      }

      setIsEditingDetails(false);
    } catch (error: any) {
      console.error("Error saving class details:", error);
      setDetailsError(error.message || "Failed to save details");
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleOpenEditTask = (task: TasksData) => {
    setEditingTaskId(task._id);
    setShowTaskModal(true);
  };

  const handleTaskSaved = () => {
    loadClassDetails();
    setShowTaskModal(false);
    setEditingTaskId(null);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await apiService.deleteTask(taskId);
      setTasks((prev) => prev.filter((task) => task._id !== taskId));
    } catch (error: any) {
      console.error("Error deleting task:", error);
    }
  };

  const handleToggleComplete = async (task: TasksData) => {
    try {
      const completed = !task.completed;
      const status = completed ? "completed" : "pending";
      await apiService.updateTask(task._id, { completed, status });
      setTasks((prev) =>
        prev.map((item) => (item._id === task._id ? { ...item, completed, status } : item))
      );
      if (completed) {
        await streakService.updateStreak();
      }
    } catch (error: any) {
      console.error("Error updating task:", error);
    }
  };

  const generateAISummary = useCallback(async () => {
    if (!classData) return;
    
    setIsGeneratingSummary(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Give me a brief overview of ${classData.name}${classData.professor ? ` taught by ${classData.professor}` : ''}. Include key topics: ${classData.topics?.join(', ') || 'Not specified'}. Keep it to 2-3 sentences.`,
          systemPrompt: 'You are a helpful academic assistant. Provide concise, informative summaries about university courses.',
        }),
      });
      
      const data = await response.json();
      if (data.response) {
        setAiSummary(data.response);
      }
    } catch (error) {
      console.error('Error generating AI summary:', error);
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [classData]);

  // Early return for closed/no data state
  if (!isOpen || !classData) return null;

  const contentBodyClass =
    variant === "page"
      ? "p-6 space-y-6"
      : "p-6 overflow-y-auto max-h-[calc(85vh-80px)] space-y-6";

  const content = (
    <>
      <DialogHeader classData={classData} onClose={onClose} showClose={variant === "modal"} />

      <div className={contentBodyClass}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <>
            <AISummarySection 
              summary={aiSummary} 
              isGenerating={isGeneratingSummary} 
              onGenerate={generateAISummary} 
            />
            {syllabusUrl && (
              <a
                href={syllabusUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-border rounded-md text-foreground hover:bg-secondary transition-colors"
              >
                <ExternalLink size={16} />
                View Syllabus
              </a>
            )}

            {classData.topics && classData.topics.length > 0 && (
              <TopicsSection topics={classData.topics} />
            )}

            <TasksSection
              stats={taskStats}
              total={tasks.length}
              onEdit={handleOpenEditTask}
              onDelete={handleDeleteTask}
              onToggleComplete={handleToggleComplete}
            />

            <div className="border border-border rounded-lg overflow-hidden bg-card">
              <div className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors">
                <button
                  type="button"
                  onClick={() => setIsDetailsOpen((prev) => !prev)}
                  className="flex items-center gap-2"
                >
                  <span className="text-sm font-semibold text-foreground">Class Details</span>
                  {isDetailsOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {isFillingDetails ? "Filling in missing details..." : "From syllabus + class profile"}
                  </span>
                  {!isEditingDetails ? (
                    <button
                      onClick={handleEditDetails}
                      className="text-xs px-3 py-1 rounded-full border border-border text-foreground hover:bg-secondary transition-colors"
                    >
                      Edit details
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCancelEditDetails}
                        className="text-xs px-3 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveDetails}
                        disabled={isSavingDetails}
                        className="text-xs px-3 py-1 rounded-full bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
                      >
                        {isSavingDetails ? "Saving..." : "Save"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <AnimatePresence initial={false}>
                {isDetailsOpen && (
                  <motion.div
                    key="class-details-panel"
                    variants={dropdownVariants}
                    initial="collapsed"
                    animate="open"
                    exit="collapsed"
                    transition={dropdownTransition}
                    className="overflow-hidden border-t border-border bg-muted/30"
                  >
                    <div className="px-4 py-4 space-y-4">
                      {detailsError && (
                        <div className="bg-destructive/10 text-destructive text-xs px-3 py-2 rounded-md">
                          {detailsError}
                        </div>
                      )}
                      {isEditingDetails ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-secondary/10 border border-border rounded-xl p-3">
                            <label className="text-xs text-muted-foreground mb-1 block">Current Term</label>
                            <input
                              value={detailsForm.currentTerm}
                              onChange={(e) => setDetailsForm({ ...detailsForm, currentTerm: e.target.value })}
                              className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm text-foreground"
                            />
                          </div>
                          <div className="bg-secondary/10 border border-border rounded-xl p-3">
                            <label className="text-xs text-muted-foreground mb-1 block">Timing</label>
                            <input
                              value={detailsForm.timing}
                              onChange={(e) => setDetailsForm({ ...detailsForm, timing: e.target.value })}
                              className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm text-foreground"
                            />
                          </div>
                          <div className="bg-secondary/10 border border-border rounded-xl p-3">
                            <label className="text-xs text-muted-foreground mb-1 block">Professor Office Hours</label>
                            <textarea
                              value={detailsForm.officeHours}
                              onChange={(e) => setDetailsForm({ ...detailsForm, officeHours: e.target.value })}
                              rows={2}
                              className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm text-foreground"
                            />
                          </div>
                          <div className="bg-secondary/10 border border-border rounded-xl p-3">
                            <label className="text-xs text-muted-foreground mb-1 block">Location</label>
                            <input
                              value={detailsForm.location}
                              onChange={(e) => setDetailsForm({ ...detailsForm, location: e.target.value })}
                              className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm text-foreground"
                            />
                          </div>
                          <div className="bg-secondary/10 border border-border rounded-xl p-3">
                            <label className="text-xs text-muted-foreground mb-1 block">Professor Contact Email</label>
                            <input
                              value={detailsForm.contactEmail}
                              onChange={(e) => setDetailsForm({ ...detailsForm, contactEmail: e.target.value })}
                              className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm text-foreground"
                            />
                          </div>
                          <div className="bg-secondary/10 border border-border rounded-xl p-3">
                            <label className="text-xs text-muted-foreground mb-1 block">Professor Contact Telephone</label>
                            <input
                              value={detailsForm.contactPhone}
                              onChange={(e) => setDetailsForm({ ...detailsForm, contactPhone: e.target.value })}
                              className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm text-foreground"
                            />
                          </div>
                          <div className="bg-secondary/10 border border-border rounded-xl p-3">
                            <label className="text-xs text-muted-foreground mb-1 block">Professor Office Location</label>
                            <input
                              value={detailsForm.officeLocation}
                              onChange={(e) => setDetailsForm({ ...detailsForm, officeLocation: e.target.value })}
                              className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm text-foreground"
                            />
                          </div>
                          <div className="bg-secondary/10 border border-border rounded-xl p-3 md:col-span-2">
                            <label className="text-xs text-muted-foreground mb-1 block">Textbook and Class Material</label>
                            <textarea
                              value={detailsForm.textbooks}
                              onChange={(e) => setDetailsForm({ ...detailsForm, textbooks: e.target.value })}
                              rows={3}
                              className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm text-foreground"
                            />
                          </div>
                          <div className="bg-secondary/10 border border-border rounded-xl p-3 md:col-span-2">
                            <label className="text-xs text-muted-foreground mb-1 block">Learning Objectives or Outcomes</label>
                            <textarea
                              value={detailsForm.learningObjectives}
                              onChange={(e) => setDetailsForm({ ...detailsForm, learningObjectives: e.target.value })}
                              rows={3}
                              className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm text-foreground"
                            />
                          </div>
                          <div className="bg-secondary/10 border border-border rounded-xl p-3 md:col-span-2">
                            <label className="text-xs text-muted-foreground mb-1 block">Course Description</label>
                            <textarea
                              value={detailsForm.description}
                              onChange={(e) => setDetailsForm({ ...detailsForm, description: e.target.value })}
                              rows={3}
                              className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm text-foreground"
                            />
                          </div>
                          <div className="bg-secondary/10 border border-border rounded-xl p-3 md:col-span-2">
                            <label className="text-xs text-muted-foreground mb-1 block">Grading Policy</label>
                            <textarea
                              value={detailsForm.gradingPolicy}
                              onChange={(e) => setDetailsForm({ ...detailsForm, gradingPolicy: e.target.value })}
                              rows={3}
                              className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm text-foreground"
                            />
                          </div>
                          <div className="bg-secondary/10 border border-border rounded-xl p-3 md:col-span-2">
                            <label className="text-xs text-muted-foreground mb-1 block">Attendance Policy</label>
                            <textarea
                              value={detailsForm.attendancePolicy}
                              onChange={(e) => setDetailsForm({ ...detailsForm, attendancePolicy: e.target.value })}
                              rows={3}
                              className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm text-foreground"
                            />
                          </div>
                          <div className="bg-secondary/10 border border-border rounded-xl p-3 md:col-span-2">
                            <label className="text-xs text-muted-foreground mb-1 block">Extra Credit, Make Up, and Late Work Policy</label>
                            <textarea
                              value={detailsForm.extraAndLate}
                              onChange={(e) => setDetailsForm({ ...detailsForm, extraAndLate: e.target.value })}
                              rows={3}
                              className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm text-foreground"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <InfoCard label="Current Term" value={formatDetail(syllabusDetails.currentTerm)} />
                          <InfoCard label="Timing" value={formatDetail(syllabusDetails.timing)} />
                          <InfoCard label="Professor Office Hours" value={formatListDetail(syllabusDetails.officeHours)} />
                          <InfoCard label="Location" value={formatDetail(syllabusDetails.location)} />
                          <InfoCard label="Professor Contact Email" value={formatDetail(syllabusDetails.contactEmail)} />
                          <InfoCard label="Professor Contact Telephone" value={formatDetail(syllabusDetails.contactPhone)} />
                          <InfoCard label="Professor Office Location" value={formatDetail(syllabusDetails.officeLocation)} />
                          <InfoCard label="Textbook and Class Material" value={formatMaterialsDetail(syllabusDetails.textbooks)} fullWidth />
                          <InfoCard label="Learning Objectives or Outcomes" value={formatListDetail(syllabusDetails.learningObjectives)} fullWidth />
                          <InfoCard label="Course Description" value={formatDetail(syllabusDetails.description)} fullWidth />
                          <InfoCard label="Grading Policy" value={formatPolicyDetail(syllabusDetails.gradingPolicy)} fullWidth />
                          <InfoCard label="Attendance Policy" value={formatPolicyDetail(syllabusDetails.attendancePolicy)} fullWidth />
                          <InfoCard
                            label="Extra Credit, Make Up, and Late Work Policy"
                            value={formatPolicyDetail(syllabusDetails.extraAndLate)}
                            fullWidth
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-3">
              <div className="border border-border rounded-lg overflow-hidden bg-card">
                <button
                  type="button"
                  onClick={() => setIsInternetResourcesOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-foreground">Internet Resources</div>
                    {isInternetResourcesOpen ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {(classData.topics || []).length} topics
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isInternetResourcesOpen && (
                    <motion.div
                      key="internet-resources-panel"
                      variants={dropdownVariants}
                      initial="collapsed"
                      animate="open"
                      exit="collapsed"
                      transition={dropdownTransition}
                      className="overflow-hidden border-t border-border bg-muted/30"
                    >
                      <div className="px-4 py-4 space-y-3">
                        {(classData.topics || []).length === 0 ? (
                          <div className="text-sm text-muted-foreground">
                            No topics found yet. Upload a syllabus or add topics in Classes.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {(classData.topics || []).map((topic) => {
                              const key = makeTopicKey(classData._id, topic);
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
                                    onClick={() => toggleTopic(topic)}
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
                                              {resources.map((resource, index) => {
                                                const meta =
                                                  RESOURCE_TYPE_META[resource.type] ||
                                                  RESOURCE_TYPE_META.reference;
                                                const Icon = meta.Icon;
                                                const embedUrl = getYoutubeEmbedUrl(resource.url);
                                                const typeLabel = meta.label;
                                                const sourceLabel = resource.source || "Source";
                                                const titleLine = `${resource.title} - ${typeLabel} - ${sourceLabel}`;
                                                const embedKey = `${key}::${resource.url}`;
                                                const isEmbedOpen = expandedEmbeds[embedKey];

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
                                                            setExpandedEmbeds((prev) => ({
                                                              ...prev,
                                                              [embedKey]: !prev[embedKey],
                                                            }))
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
                                                                title={resource.title}
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
                                              })}
                                            </div>
                                          )}

                                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>
                                              Links are AI-generated. Verify quality before use.
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => fetchTopicResources(topic, true)}
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
            </div>

            <div className="border border-border rounded-lg overflow-hidden bg-card">
              <button
                type="button"
                onClick={() => setIsFlashcardsOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-foreground">Flashcards</div>
                  {isFlashcardsOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {flashcardSets.length} set{flashcardSets.length !== 1 ? "s" : ""}
                  </span>
                  <Link
                    href={`/flashcards/class/${encodeURIComponent(classData._id)}`}
                    className="text-xs px-3 py-1 rounded-full border border-border text-foreground hover:bg-secondary transition-colors"
                  >
                    New set
                  </Link>
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isFlashcardsOpen && (
                  <motion.div
                    key="flashcards-panel"
                    variants={dropdownVariants}
                    initial="collapsed"
                    animate="open"
                    exit="collapsed"
                    transition={dropdownTransition}
                    className="overflow-hidden border-t border-border bg-muted/30"
                  >
                    <div className="px-4 py-4 space-y-3">
                      {flashcardSets.length === 0 ? (
                        <div className="text-sm text-muted-foreground">
                          No flashcard sets yet. Create one to start studying.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {flashcardSets.map((set) => (
                            <Link
                              key={set.id}
                              href={`/flashcards/set/${encodeURIComponent(classData._id)}/${encodeURIComponent(set.topic)}`}
                              className="flex items-center justify-between border border-border rounded-md bg-card px-3 py-2 text-sm hover:bg-muted/40 transition-colors"
                            >
                              <div>
                                <div className="font-medium text-foreground">{set.topic}</div>
                                <div className="text-xs text-muted-foreground">
                                  {set.cardCount} cards
                                </div>
                                {set.notesGenerated && (
                                  <span className="mt-1 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                                    Notes generated
                                  </span>
                                )}
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {resources.length > 0 && <ResourcesSection resources={resources} />}

            {classData.gradingPolicy && (
              <div>
                <SectionHeader title="Grading Policy" />
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {classData.gradingPolicy}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );

  if (variant === "page") {
    return (
      <div className="space-y-6">
        {content}
        {showTaskModal && (
          <TaskModal
            editingTaskId={editingTaskId}
            onClose={() => {
              setShowTaskModal(false);
              setEditingTaskId(null);
            }}
            onTaskSaved={handleTaskSaved}
          />
        )}
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4" 
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl max-h-[85vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {content}
      </div>
      {showTaskModal && (
        <TaskModal
          editingTaskId={editingTaskId}
          onClose={() => {
            setShowTaskModal(false);
            setEditingTaskId(null);
          }}
          onTaskSaved={handleTaskSaved}
        />
      )}
    </div>
  );
};

export default ClassOverviewDialog;
