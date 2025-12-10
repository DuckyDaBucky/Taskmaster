import React, { useState, useEffect } from "react";
import { Upload, X, Loader, FileText, Trash2 } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { apiService } from "../../services/apiService";

interface Resource {
  _id: string;
  title?: string;
  files?: any[];
  urls?: string[];
  websites?: string[];
  summary?: string;
  class?: any;
}

const ResourcesPage: React.FC = () => {
  const { user } = useUser();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!user?._id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const allResources = await apiService.getAllResources();
        setResources(allResources || []);
      } catch (error) {
        console.error("Error fetching resources:", error);
        setResources([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?._id]);

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
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0 || !user?._id) return;

    setIsUploading(true);
    let successCount = 0;

    for (const file of files) {
      try {
        setUploadStatus(`Uploading ${file.name}...`);
        await apiService.smartUploadResource(file);
        successCount++;
      } catch (error: any) {
        console.error("Upload error for", file.name, ":", error);
      }
    }

    if (successCount > 0) {
      setUploadStatus(`✓ ${successCount} file(s) uploaded!`);
      // Refresh resources
      try {
        const allResources = await apiService.getAllResources();
        setResources(allResources);
      } catch (e) {
        console.error("Error refreshing resources:", e);
      }
    } else {
      setUploadStatus(`✗ Upload failed`);
    }

    setTimeout(() => {
      setFiles([]);
      setUploadStatus("");
      setIsUploading(false);
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Resources</h1>
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-primary" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Resources</h1>
        <p className="text-sm text-muted-foreground">
          Upload documents, notes, and study materials
        </p>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
          isDragging
            ? "border-primary bg-primary/10 scale-[1.02]"
            : "border-border hover:border-primary/50"
        }`}
      >
        <Upload className="mx-auto mb-4 text-muted-foreground" size={48} />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Drop files here
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          PDFs, documents, images, notes
        </p>
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.md"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="inline-block px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg cursor-pointer transition-colors font-medium"
        >
          Select Files
        </label>
      </div>

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">
              Ready to upload ({files.length})
            </h3>
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isUploading && <Loader className="animate-spin" size={16} />}
              {isUploading ? "Uploading..." : "Upload"}
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
                className="flex items-center justify-between bg-secondary/30 px-4 py-3 rounded-md"
              >
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-muted-foreground" />
                  <span className="text-sm text-foreground truncate">
                    {file.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resources List */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-semibold text-foreground mb-3">
          Your Resources ({resources.length})
        </h3>
        {resources.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4 text-center">
            No resources yet. Upload your first file to get started!
          </p>
        ) : (
          <div className="space-y-2">
            {resources.map((resource) => {
              const displayName = resource.title 
                || resource.files?.[0]?.originalName 
                || resource.urls?.[0] 
                || "Untitled Resource";
              
              return (
                <div
                  key={resource._id}
                  className="flex items-center justify-between p-3 bg-secondary/20 rounded-md hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-primary" />
                    <div>
                      <span className="text-foreground font-medium">{displayName}</span>
                      <div className="text-xs text-muted-foreground">
                        {resource.files?.length ? `${resource.files.length} file(s)` : ''}
                      </div>
                    </div>
                  </div>
                  <button className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourcesPage;
