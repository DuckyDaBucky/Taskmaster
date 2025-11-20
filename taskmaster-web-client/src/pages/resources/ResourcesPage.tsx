import React, { useState, useEffect } from "react";
import { Upload, X, Loader } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { apiService } from "../../services/apiService";

const ResourcesPage: React.FC = () => {
  const { user } = useUser();
  const [resources, setResources] = useState<any[]>([]);
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
        setResources(allResources);
      } catch (error) {
        console.error("Error fetching resources:", error);
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
    if (files.length === 0) return;

    try {
      setIsUploading(true);
      setUploadStatus("Uploading and analyzing files...");

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        // Call smart upload endpoint that uses Gemini to auto-classify
        await apiService.smartUploadResource(formData);
      }

      setUploadStatus("✓ Files uploaded and classified!");
      
      // Refresh resources
      const allResources = await apiService.getAllResources();
      setResources(allResources);

      // Reset
      setTimeout(() => {
        setFiles([]);
        setUploadStatus("");
      }, 2000);
    } catch (error: any) {
      console.error("Upload error:", error);
      setUploadStatus("✗ Upload failed");
      setTimeout(() => setUploadStatus(""), 3000);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Resources</h1>
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Smart Upload</h1>
        <p className="text-sm text-muted-foreground">
          AI automatically organizes your files
        </p>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
          isDragging
            ? "border-primary bg-primary/10 scale-105"
            : "border-border hover:border-primary/50"
        }`}
      >
        <Upload className="mx-auto mb-4 text-muted-foreground" size={48} />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Drop files here
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          AI will analyze and organize them automatically
        </p>
        <input
          type="file"
          multiple
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
              {isUploading ? "Uploading..." : "Upload All"}
            </button>
          </div>

          {uploadStatus && (
            <div className="text-sm text-center py-2 bg-secondary/50 rounded">
              {uploadStatus}
            </div>
          )}

          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-secondary/30 px-4 py-3 rounded-md"
              >
                <span className="text-sm text-foreground truncate flex-1">
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-muted-foreground hover:text-destructive transition-colors ml-2"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resources List */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-semibold text-foreground mb-3">
          Uploaded Resources ({resources.length})
        </h3>
        {resources.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No resources yet. Upload your first file!
          </p>
        ) : (
          <div className="space-y-2">
            {resources.slice(0, 10).map((resource) => (
              <div
                key={resource._id}
                className="text-sm text-muted-foreground py-2 border-b border-border last:border-0"
              >
                {resource.title || "Untitled"}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourcesPage;
