import React, { useState, useEffect } from "react";
import { Upload, X, Loader, Search, Sparkles, CheckCircle, AlertCircle } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { apiService } from "../../services/apiService";
import { aiService } from "../../services/api/aiService";

interface ResourceWithStatus {
  _id: string;
  title?: string;
  files?: any[];
  urls?: string[];
  websites?: string[];
  summary?: string;
  processing_status?: 'pending' | 'processing' | 'completed' | 'failed';
  class?: any;
}

const ResourcesPage: React.FC = () => {
  const { user } = useUser();
  const [resources, setResources] = useState<ResourceWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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
    let failCount = 0;

    for (const file of files) {
      try {
        setUploadStatus(`Uploading ${file.name}...`);
        console.log("Starting upload for:", file.name);
        
        const result = await apiService.smartUploadResource(file);
        console.log("Upload result:", result);
        successCount++;
        
        // Fire-and-forget AI processing (don't await)
        if (result?.id) {
          aiService.processDocument(result.id, user._id)
            .then((res) => console.log("AI processing started:", res))
            .catch((err) => console.warn("AI processing skipped (service may be warming up):", err.message));
        }
      } catch (error: any) {
        console.error("Upload error for", file.name, ":", error);
        failCount++;
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
      setUploadStatus(`✗ Upload failed. Check console for details.`);
    }

    setTimeout(() => {
      setFiles([]);
      setUploadStatus("");
      setIsUploading(false);
    }, 2000);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user?._id) return;

    try {
      setIsSearching(true);
      const result = await aiService.search(searchQuery, user._id);
      setSearchResults(result.results || []);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'processing':
        return <Loader className="text-yellow-500 animate-spin" size={16} />;
      case 'failed':
        return <AlertCircle className="text-red-500" size={16} />;
      default:
        return <Sparkles className="text-muted-foreground" size={16} />;
    }
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
        <h1 className="text-2xl font-bold text-foreground">Smart Resources</h1>
        <p className="text-sm text-muted-foreground">
          AI-powered document analysis
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search your documents with AI..."
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSearching ? <Loader className="animate-spin" size={16} /> : <Sparkles size={16} />}
            Search
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-foreground">Results:</h4>
            {searchResults.map((result, index) => (
              <div key={index} className="p-3 bg-secondary/30 rounded-md">
                <p className="text-sm text-foreground">{result.text}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Relevance: {Math.round((result.score || 0) * 100)}%
                </p>
              </div>
            ))}
          </div>
        )}
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
          PDFs, documents, images - AI will analyze and index them
        </p>
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
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
              {isUploading ? "Processing..." : "Upload & Analyze"}
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
                <span className="text-sm text-foreground truncate flex-1">
                  {file.name}
                </span>
                <span className="text-xs text-muted-foreground mx-2">
                  {(file.size / 1024).toFixed(1)} KB
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
                  className="p-3 bg-secondary/20 rounded-md hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(resource.processing_status)}
                        <span className="text-foreground font-medium">{displayName}</span>
                      </div>
                      {resource.summary && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {resource.summary}
                        </p>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        {resource.files?.length ? `${resource.files.length} file(s)` : ''}
                        {resource.urls?.length ? ` • ${resource.urls.length} URL(s)` : ''}
                      </div>
                    </div>
                  </div>
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
