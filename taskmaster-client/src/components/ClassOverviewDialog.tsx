/**
 * ClassOverviewDialog - Modal showing detailed class info from syllabus
 * Refactored to use modular UI components
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Loader2, BookOpen, User, FileText, ListChecks, Sparkles } from 'lucide-react';
import type { ClassData, TasksData, ResourceData } from '../services/types';
import { apiService } from '../services/api';
import { StatCard } from './ui/StatCard';
import { InfoCard } from './ui/InfoCard';
import { Badge } from './ui/Badge';
import { SectionHeader } from './ui/SectionHeader';

// --- Types ---
interface ClassOverviewDialogProps {
  classData: ClassData | null;
  isOpen: boolean;
  onClose: () => void;
}

interface TaskStats {
  overdue: TasksData[];
  upcoming: TasksData[];
  completed: TasksData[];
}

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

// --- Sub-components ---
const DialogHeader: React.FC<{ classData: ClassData; onClose: () => void }> = ({ classData, onClose }) => (
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
    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
      <X size={20} />
    </button>
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

const TasksSection: React.FC<{ stats: TaskStats; total: number }> = ({ stats, total }) => (
  <div>
    <SectionHeader title="Tasks" icon={ListChecks} count={total} />
    <div className="grid grid-cols-3 gap-3">
      <StatCard value={stats.overdue.length} label="Overdue" variant="danger" />
      <StatCard value={stats.upcoming.length} label="Upcoming" variant="warning" />
      <StatCard value={stats.completed.length} label="Completed" variant="success" />
    </div>

    {stats.overdue.length > 0 && (
      <div className="mt-3 space-y-2">
        <p className="text-xs font-medium text-red-500">⚠️ Overdue Tasks:</p>
        {stats.overdue.slice(0, 3).map(task => (
          <div key={task._id} className="flex items-center justify-between bg-red-500/5 rounded px-3 py-2">
            <span className="text-sm text-foreground">{task.title}</span>
            <span className="text-xs text-red-500">
              {task.deadline && new Date(task.deadline).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
);

const ResourcesSection: React.FC<{ resources: ResourceData[] }> = ({ resources }) => (
  <div>
    <SectionHeader title="Resources" icon={FileText} count={resources.length} />
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
const ClassOverviewDialog: React.FC<ClassOverviewDialogProps> = ({ classData, isOpen, onClose }) => {
  const [tasks, setTasks] = useState<TasksData[]>([]);
  const [resources, setResources] = useState<ResourceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Memoized task categorization
  const taskStats = useMemo(() => categorizeTasksByStatus(tasks), [tasks]);

  const loadClassDetails = useCallback(async () => {
    if (!classData) return;
    
    setIsLoading(true);
    try {
      const [classTasks, classResources] = await Promise.all([
        apiService.getTasksByClassId(classData._id),
        apiService.getResourcesByClassId(classData._id),
      ]);
      
      setTasks(classTasks);
      setResources(classResources);

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

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4" 
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl max-h-[85vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <DialogHeader classData={classData} onClose={onClose} />

        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)] space-y-6">
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

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                {classData.timing && <InfoCard label="Schedule" value={classData.timing} />}
                {classData.location && <InfoCard label="Location" value={classData.location} />}
                {classData.contactInfo && <InfoCard label="Contact" value={classData.contactInfo} fullWidth />}
              </div>

              {classData.topics && classData.topics.length > 0 && (
                <TopicsSection topics={classData.topics} />
              )}

              <TasksSection stats={taskStats} total={tasks.length} />

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
      </div>
    </div>
  );
};

export default ClassOverviewDialog;
