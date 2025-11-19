import React, { useState, useEffect } from "react";
import { MoreVertical, Plus, X } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { apiService } from "../../services/apiService";
import type { ClassData } from "../../services/mockDatabase";

const ClassesPage: React.FC = () => {
  const { user } = useUser();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    professor: "",
    timing: "",
    location: "",
    topics: "",
    textbooks: "",
    gradingPolicy: "",
    contactInfo: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      if (!user?._id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const userClasses = await apiService.getAllClasses();
        setClasses(userClasses);
      } catch (error) {
        console.error("Error fetching classes:", error);
        setError("Failed to load classes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, [user?._id]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setError("Please enter a class name");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const classData = {
        name: formData.name,
        professor: formData.professor || undefined,
        timing: formData.timing || undefined,
        location: formData.location || undefined,
        topics: formData.topics
          ? formData.topics.split(",").map((t) => t.trim())
          : undefined,
        textbooks: formData.textbooks
          ? formData.textbooks.split(",").map((t) => t.trim())
          : undefined,
        gradingPolicy: formData.gradingPolicy || undefined,
        contactInfo: formData.contactInfo || undefined,
      };

      await apiService.createClass(classData);

      // Refresh classes
      const updatedClasses = await apiService.getAllClasses();
      setClasses(updatedClasses);

      // Reset form
      setFormData({
        name: "",
        professor: "",
        timing: "",
        location: "",
        topics: "",
        textbooks: "",
        gradingPolicy: "",
        contactInfo: "",
      });
      setShowModal(false);
    } catch (error: any) {
      console.error("Error creating class:", error);
      setError(error.response?.data?.message || "Failed to create class");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getColorClass = (index: number) => {
    const colors = [
      "bg-blue-600",
      "bg-green-600",
      "bg-purple-600",
      "bg-red-600",
      "bg-orange-600",
      "bg-cyan-600",
    ];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Classes</h1>
        </div>
        <div className="text-center text-muted-foreground">Loading classes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Classes</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md text-sm font-medium transition-colors"
        >
          <Plus size={16} className="inline mr-1" />
          New Class
        </button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md">
          {error}
        </div>
      )}

      {classes.length === 0 ? (
        <div className="bg-card border border-border rounded-md p-8 text-center text-muted-foreground">
          <p>No classes found. Create your first class!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((course, index) => (
            <div
              key={course._id}
              className="bg-card border border-border rounded-md overflow-hidden group hover:border-primary/50 transition-all"
            >
              <div className={`h-2 ${getColorClass(index)}`} />
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {course.name.split(" ").map((w) => w[0]).join("").substring(0, 6)}
                  </span>
                  <button className="text-muted-foreground hover:text-foreground">
                    <MoreVertical size={16} />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">{course.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {course.professor || "No professor listed"}
                </p>

                <div className="space-y-1">
                  {course.timing && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Time:</span> {course.timing}
                    </div>
                  )}
                  {course.location && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Location:</span> {course.location}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Class Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-xl bg-card border border-border rounded-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-foreground">Create New Class</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Class Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="e.g., Introduction to Algorithms"
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Professor
                  </label>
                  <input
                    type="text"
                    value={formData.professor}
                    onChange={(e) =>
                      setFormData({ ...formData, professor: e.target.value })
                    }
                    placeholder="e.g., Dr. Smith"
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Timing
                  </label>
                  <input
                    type="text"
                    value={formData.timing}
                    onChange={(e) =>
                      setFormData({ ...formData, timing: e.target.value })
                    }
                    placeholder="e.g., MWF 10:00-11:00"
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="e.g., Room 101"
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Topics (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.topics}
                  onChange={(e) =>
                    setFormData({ ...formData, topics: e.target.value })
                  }
                  placeholder="e.g., Algorithms, Data Structures, Sorting"
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Textbooks (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.textbooks}
                  onChange={(e) =>
                    setFormData({ ...formData, textbooks: e.target.value })
                  }
                  placeholder="e.g., Introduction to Algorithms, CLRS"
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Grading Policy
                </label>
                <textarea
                  value={formData.gradingPolicy}
                  onChange={(e) =>
                    setFormData({ ...formData, gradingPolicy: e.target.value })
                  }
                  placeholder="e.g., 40% Exams, 30% Assignments, 30% Projects"
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Contact Info
                </label>
                <input
                  type="text"
                  value={formData.contactInfo}
                  onChange={(e) =>
                    setFormData({ ...formData, contactInfo: e.target.value })
                  }
                  placeholder="e.g., email@university.edu"
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
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
                  className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassesPage;
