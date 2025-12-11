/**
 * Resource Detail Dialog - Shows document overview
 */

import React from 'react';
import { X, FileText, Download, Calendar, Tag } from 'lucide-react';

interface Resource {
  _id: string;
  title?: string;
  files?: any[];
  urls?: string[];
  summary?: string;
  classification?: string;
  processing_status?: string;
  ai_summary?: string;
  extracted_data?: any;
}

interface ResourceDetailDialogProps {
  resource: Resource | null;
  onClose: () => void;
}

export const ResourceDetailDialog: React.FC<ResourceDetailDialogProps> = ({ resource, onClose }) => {
  if (!resource) return null;

  const displayName = resource.title || resource.files?.[0]?.originalName || 'Untitled Resource';
  const classificationLabel = resource.classification?.replace('_', ' ').toUpperCase() || 'MISC';
  
  const classificationColors: Record<string, string> = {
    syllabus: 'bg-purple-500 text-white',
    homework: 'bg-blue-500 text-white',
    assignment: 'bg-cyan-500 text-white',
    project: 'bg-green-500 text-white',
    exam: 'bg-red-500 text-white',
    quiz: 'bg-orange-500 text-white',
    textbook: 'bg-yellow-500 text-white',
    lecture_notes: 'bg-indigo-500 text-white',
    class_material: 'bg-pink-500 text-white',
    study_guide: 'bg-teal-500 text-white',
    misc: 'bg-gray-500 text-white',
  };

  const classificationClass = classificationColors[resource.classification || 'misc'] || classificationColors.misc;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="text-primary flex-shrink-0" size={24} />
              <h2 className="text-xl font-bold text-foreground truncate">{displayName}</h2>
            </div>
            <span className={`inline-block text-xs px-3 py-1 rounded-full font-semibold ${classificationClass}`}>
              {classificationLabel}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Processing Status */}
          {resource.processing_status === 'pending' && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-700">
                <div className="w-4 h-4 border-2 border-yellow-700 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-medium">Processing document...</span>
              </div>
              <p className="text-sm text-yellow-600 mt-1">
                We're analyzing this document. Summary and insights will appear soon.
              </p>
            </div>
          )}

          {/* AI Summary */}
          {(resource.ai_summary || resource.summary) && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Tag size={16} />
                Summary
              </h3>
              <div className="bg-secondary/30 rounded-lg p-4 text-sm text-foreground/90">
                {resource.ai_summary || resource.summary}
              </div>
            </div>
          )}

          {/* File Information */}
          {resource.files && resource.files.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <FileText size={16} />
                Files ({resource.files.length})
              </h3>
              <div className="space-y-2">
                {resource.files.map((file: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText size={18} className="text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {file.originalName || file.filename}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {file.mimetype} • {(file.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                    {file.url && (
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-primary/10 rounded-lg transition-colors flex-shrink-0"
                        title="Download"
                      >
                        <Download size={16} className="text-primary" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* URLs */}
          {resource.urls && resource.urls.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Links</h3>
              <div className="space-y-2">
                {resource.urls.map((url: string, idx: number) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-secondary/20 rounded-lg hover:bg-secondary/30 transition-colors text-sm text-primary truncate"
                  >
                    {url}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Extracted Data */}
          {resource.extracted_data && Object.keys(resource.extracted_data).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Calendar size={16} />
                Extracted Information
              </h3>
              <div className="bg-secondary/20 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {Object.entries(resource.extracted_data).map(([key, value]) => (
                    <div key={key}>
                      <div className="text-muted-foreground capitalize">{key.replace('_', ' ')}</div>
                      <div className="text-foreground font-medium">{String(value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!resource.ai_summary && !resource.summary && resource.processing_status !== 'pending' && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText size={48} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No additional information available yet.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
