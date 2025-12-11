/**
 * Resource Upload Area - Drag & drop file upload
 */

import React from 'react';
import { Upload, X, FileText, Loader } from 'lucide-react';

interface ResourceUploadProps {
  files: File[];
  isUploading: boolean;
  uploadStatus: string;
  onFileSelect: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  onUpload: () => void;
}

export const ResourceUpload: React.FC<ResourceUploadProps> = ({
  files,
  isUploading,
  uploadStatus,
  onFileSelect,
  onRemoveFile,
  onUpload,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    onFileSelect(droppedFiles);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      onFileSelect(selectedFiles);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          isDragging
            ? 'border-primary bg-primary/10 scale-[1.02]'
            : 'border-border hover:border-primary/50'
        }`}
      >
        <Upload className="mx-auto mb-3 text-muted-foreground" size={40} />
        <h3 className="text-base font-semibold text-foreground mb-1">
          Drop files here
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          PDFs, documents, images, notes
        </p>
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.md"
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="inline-block px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg cursor-pointer transition-colors font-medium text-sm"
        >
          Select Files
        </label>
      </div>

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground text-sm">
              Ready to upload ({files.length})
            </h3>
            <button
              onClick={onUpload}
              disabled={isUploading}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {isUploading && <Loader className="animate-spin" size={14} />}
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>

          {uploadStatus && (
            <div className="text-sm text-center py-2 bg-secondary/50 rounded flex items-center justify-center gap-2">
              {isUploading && <Loader className="animate-spin" size={14} />}
              {uploadStatus}
            </div>
          )}

          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-secondary/30 px-3 py-2 rounded-md"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText size={16} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-foreground truncate">
                    {file.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveFile(index)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
