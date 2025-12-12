/**
 * Resources Page - Optimized with class tabs
 */

import React, { useState, useEffect, useMemo } from "react";
import { Loader } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { apiService } from "../../services/api";
import { ResourceUpload } from "../../components/resources/ResourceUpload";
import { ResourceCard } from "../../components/resources/ResourceCard";
import { ResourceDetailDialog } from "../../components/resources/ResourceDetailDialog";

interface Resource {
  _id: string;
  title?: string;
  files?: any[];
  urls?: string[];
  summary?: string;
  class?: any;
  classification?: string;
  processing_status?: string;
  ai_summary?: string;
  extracted_data?: any;
}

interface Class {
  _id: string;
  name: string;
  is_personal?: boolean;
}

const ResourcesPage: React.FC = () => {
  const { user, isLoadingUser } = useUser();
  const [resources, setResources] = useState<Resource[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  useEffect(() => {
    if (!isLoadingUser) {
      fetchData();
    }
  }, [user?._id, isLoadingUser]);

  const fetchData = async () => {
    if (!user?._id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [allResources, allClasses] = await Promise.all([
        apiService.getAllResources(),
        apiService.getAllClasses(),
      ]);
      setResources(allResources || []);
      setClasses(allClasses || []);
    } catch (error) {
      console.error("Error fetching resources:", error);
      setResources([]);
      setClasses([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Group resources by class
  const resourcesByClass = useMemo(() => {
    const grouped: Record<string, Resource[]> = {
      all: resources,
      unassigned: resources.filter(r => !r.class),
    };

    classes.forEach(cls => {
      grouped[cls._id] = resources.filter(r => r.class === cls._id);
    });

    return grouped;
  }, [resources, classes]);

  const handleFileSelect = (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0 || !user?._id) return;

    setIsUploading(true);
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      try {
        setUploadStatus(`Uploading ${i + 1}/${files.length}: ${files[i].name}...`);
        await apiService.smartUploadResource(files[i]);
        successCount++;
      } catch (error: any) {
        console.error("Upload error for", files[i].name, ":", error);
      }
    }

    if (successCount > 0) {
      setUploadStatus(`✓ ${successCount} file(s) uploaded!`);
      await fetchData();
    } else {
      setUploadStatus(`✗ Upload failed`);
    }

    setTimeout(() => {
      setFiles([]);
      setUploadStatus("");
      setIsUploading(false);
    }, 3000);
  };

  const handleDelete = async (resourceId: string) => {
    if (!window.confirm('Delete this resource? This action cannot be undone.')) return;
    
    try {
      await apiService.deleteResource(resourceId);
      setResources(prev => prev.filter(r => r._id !== resourceId));
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete resource');
    }
  };

  const handleResourceClick = (resource: Resource) => {
    setSelectedResource(resource);
  };

  const currentResources = resourcesByClass[selectedClass] || [];

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Resources</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload and organize your study materials
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <ResourceUpload
        files={files}
        isUploading={isUploading}
        uploadStatus={uploadStatus}
        onFileSelect={handleFileSelect}
        onRemoveFile={handleRemoveFile}
        onUpload={handleUpload}
      />

      {/* Class Tabs */}
      {classes.length > 0 && (
        <div className="border-b border-border">
          <div className="flex gap-1 overflow-x-auto pb-px">
            <button
              onClick={() => setSelectedClass("all")}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                selectedClass === "all"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({resources.length})
            </button>
            {classes.map(cls => {
              const count = resourcesByClass[cls._id]?.length || 0;
              return (
                <button
                  key={cls._id}
                  onClick={() => setSelectedClass(cls._id)}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedClass === cls._id
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cls.name} ({count})
                </button>
              );
            })}
            <button
              onClick={() => setSelectedClass("unassigned")}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                selectedClass === "unassigned"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Unassigned ({resourcesByClass.unassigned?.length || 0})
            </button>
          </div>
        </div>
      )}

      {/* Resources Grid */}
      <div>
        {currentResources.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No resources in this category. Upload your first file to get started!</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {currentResources.map(resource => (
              <ResourceCard
                key={resource._id}
                resource={resource}
                onClick={handleResourceClick}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      {selectedResource && (
        <ResourceDetailDialog
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
        />
      )}
    </div>
  );
};

export default ResourcesPage;
