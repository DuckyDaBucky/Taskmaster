import React, { useState, useEffect } from "react";
import { FileText, Image, File, Download, Plus, X, Upload } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { apiService } from "../../services/apiService";
import type { ResourceData, ClassData } from "../../services/mockDatabase";

const ResourcesPage: React.FC = () => {
  const { user } = useUser();
  const [resources, setResources] = useState<ResourceData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [urls, setUrls] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?._id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // Fetch classes
        const userClasses = await apiService.getAllClasses();
        setClasses(userClasses);

        // Fetch resources for each class
        const allResources: ResourceData[] = [];
        for (const classItem of userClasses) {
          try {
            const classResources = await apiService.getResourcesByClassId(
              classItem._id
            );
            allResources.push(...classResources);
          } catch (error) {
            console.error(`Error fetching resources for class ${classItem._id}:`, error);
          }
        }
        setResources(allResources);
      } catch (error) {
        console.error("Error fetching resources:", error);
        setError("Failed to load resources");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?._id]);

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) {
      setError("Please select a class");
      return;
    }

    if (!urls.trim()) {
      setError("Please enter at least one URL");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const urlArray = urls
        .split("\n")
        .map((url) => url.trim())
        .filter((url) => url.length > 0);

      const resourceData = {
        urls: urlArray,
        websites: urlArray, // Backend expects both
      };

      await apiService.createResource(selectedClassId, resourceData);

      // Refresh resources
      const classResources = await apiService.getResourcesByClassId(selectedClassId);
      setResources((prev) => {
        const filtered = prev.filter((r) => r.class !== selectedClassId);
        return [...filtered, ...classResources];
      });

      // Reset form
      setUrls("");
      setSelectedClassId("");
      setShowModal(false);
    } catch (error: any) {
      console.error("Error creating resource:", error);
      setError(error.response?.data?.message || "Failed to create resource");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFileIcon = (url: string) => {
    const extension = url.split(".").pop()?.toLowerCase();
    if (extension === "pdf") return <FileText size={18} />;
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || ""))
      return <Image size={18} />;
    return <File size={18} />;
  };

  const getFileType = (url: string) => {
    const extension = url.split(".").pop()?.toLowerCase();
    if (extension === "pdf") return "PDF";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || ""))
      return "Image";
    return "Link";
  };

  const getFileName = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const fileName = pathname.split("/").pop() || url;
      return fileName.length > 50 ? fileName.substring(0, 50) + "..." : fileName;
    } catch {
      return url.length > 50 ? url.substring(0, 50) + "..." : url;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Resources</h1>
        </div>
        <div className="text-center text-muted-foreground">Loading resources...</div>
      </div>
    );
  }

  // Flatten resources to show individual URLs
  const resourceItems: Array<{
    id: string;
    url: string;
    classId: string;
    className: string;
  }> = [];
  resources.forEach((resource) => {
    const className =
      classes.find((c) => c._id === resource.class)?.name || "Unknown Class";
    resource.urls.forEach((url, index) => {
      resourceItems.push({
        id: `${resource._id}-${index}`,
        url,
        classId: resource.class,
        className,
      });
    });
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Resources</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md text-sm font-medium transition-colors"
        >
          <Plus size={16} className="inline mr-1" />
          Add Resource
        </button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md">
          {error}
        </div>
      )}

      {resourceItems.length === 0 ? (
        <div className="bg-card border border-border rounded-md p-8 text-center text-muted-foreground">
          <p>No resources found. Add your first resource!</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-md overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary text-muted-foreground font-medium border-b border-border">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Class</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {resourceItems.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-secondary/50 transition-colors group"
                >
                  <td className="px-6 py-4 font-medium text-foreground flex items-center gap-3">
                    <span className="text-muted-foreground">
                      {getFileIcon(item.url)}
                    </span>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors"
                    >
                      {getFileName(item.url)}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {getFileType(item.url)}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {item.className}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors inline-block"
                    >
                      <Download size={18} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Resource Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-xl bg-card border border-border rounded-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-foreground">Add Resource</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateResource} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Class *
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a class</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Resource URLs *
                </label>
                <textarea
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  required
                  placeholder="Enter URLs, one per line&#10;e.g.,&#10;https://example.com/notes.pdf&#10;https://example.com/slides.pdf"
                  rows={6}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter one URL per line. URLs can point to PDFs, images, or any web resource.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Adding..." : "Add Resource"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourcesPage;
