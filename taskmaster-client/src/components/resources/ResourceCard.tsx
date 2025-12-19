/**
 * Resource Card - Individual resource item
 */

import React from 'react';
import { FileText, Loader, Trash2 } from 'lucide-react';

interface Resource {
  _id: string;
  title?: string;
  files?: any[];
  urls?: string[];
  summary?: string;
  classification?: string;
  processing_status?: string;
  ai_summary?: string;
}

interface ResourceCardProps {
  resource: Resource;
  onClick: (resource: Resource) => void;
  onDelete: (resourceId: string) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onClick, onDelete }) => {
  const displayName = resource.title 
    || resource.files?.[0]?.originalName 
    || resource.urls?.[0] 
    || 'Untitled Resource';
  
  const classificationColors: Record<string, string> = {
    syllabus: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    homework: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    assignment: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
    project: 'bg-green-500/10 text-green-600 border-green-500/20',
    exam: 'bg-red-500/10 text-red-600 border-red-500/20',
    quiz: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    textbook: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    lecture_notes: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    class_material: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
    study_guide: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
    misc: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  };
  
  const classificationLabel = resource.classification?.replace('_', ' ').toUpperCase() || 'MISC';
  const classificationClass = classificationColors[resource.classification || 'misc'] || classificationColors.misc;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(resource._id);
  };

  return (
    <div
      onClick={() => onClick(resource)}
      className="p-4 bg-secondary/20 rounded-lg hover:bg-secondary/30 transition-all cursor-pointer border border-transparent hover:border-primary/20 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <FileText size={20} className="text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-foreground font-medium truncate">{displayName}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${classificationClass}`}>
                {classificationLabel}
              </span>
              {resource.processing_status === 'pending' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 flex items-center gap-1">
                  <Loader className="animate-spin" size={10} />
                  Processing
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              {(resource.files?.length ?? 0) > 0 && (
                <div>{resource.files!.length} file(s) - {(resource.files!.reduce((sum: number, f: any) => sum + (f.size || 0), 0) / 1024).toFixed(1)} KB</div>
              )}
              {(resource.ai_summary || resource.summary) && (
                <div className="text-xs text-foreground/70 mt-2 line-clamp-2">
                  {resource.ai_summary || resource.summary}
                </div>
              )}
            </div>
          </div>
        </div>
        <button 
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1 hover:bg-destructive/10 rounded flex-shrink-0"
          title="Delete resource"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};
