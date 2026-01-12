import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Plus, X, Edit, Trash2, Upload, Eye } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useUser } from "../../context/UserContext";
import { apiService } from "../../services/api";
import type { ClassData, ResourceData } from "../../services/types";
import { ProcessingAnimation } from "../../components/ui";
import { getClassColor } from "../../utils/classColors";

const extractSyllabusDetails = (classItem: ClassData, resources: ResourceData[]) => {
  const syllabusResource = resources.find(
    (resource) =>
      resource.class === classItem._id &&
      (resource.extracted_data?.document_type === "syllabus" ||
        resource.title?.toLowerCase().includes("syllabus"))
  );

  const extracted: any = syllabusResource?.extracted_data || {};
  const courseInfo = extracted.course_info || extracted.courseInfo || {};
  const policies = extracted.course_policies || extracted.coursePolicies || {};

  const rawContact = courseInfo.contact_info || classItem.contactInfo || "";
  const emailMatch = typeof rawContact === "string"
    ? rawContact.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
    : null;
  const phoneMatch = typeof rawContact === "string"
    ? rawContact.match(/(\+?\d{1,2}\s*)?(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/)
    : null;
  const officeLine = typeof rawContact === "string"
    ? rawContact.split("\n").find((line) => /office|location|room/i.test(line))
    : null;
  const officeLocationClean = officeLine
    ? officeLine
        .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "")
        .replace(/(\+?\d{1,2}\s*)?(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/g, "")
        .replace(/\b(email|e-mail|tel|telephone|phone)\b\s*[:\-]?\s*/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim()
    : "";

  return {
    resourceId: syllabusResource?._id || null,
    currentTerm: courseInfo.semester || "",
    timing: courseInfo.schedule || classItem.timing || "",
    officeHours: courseInfo.professor_office_hours || "",
    location: courseInfo.location || classItem.location || "",
    contactEmail: courseInfo.contact_email || (emailMatch ? emailMatch[0] : "") || "",
    contactPhone: courseInfo.contact_phone || (phoneMatch ? phoneMatch[0] : "") || "",
    officeLocation: courseInfo.office_location || officeLocationClean || "",
    textbooks: policies.textbooks_and_materials || (classItem.textbooks || []).join(", "),
    learningObjectives: policies.learning_objectives || "",
    description: courseInfo.description || classItem.description || "",
    gradingPolicy: policies.grading_policy || classItem.gradingPolicy || "",
    attendancePolicy: policies.attendance_policy || "",
    extraAndLate: policies.extra_and_late_policy || "",
  };
};

const ClassesPage: React.FC = () => {
  const { user, isLoadingUser } = useUser();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [resources, setResources] = useState<ResourceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const classesRef = useRef<ClassData[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    professor: "",
    currentTerm: "",
    timing: "",
    officeHours: "",
    location: "",
    contactEmail: "",
    contactPhone: "",
    officeLocation: "",
    topics: "",
    textbooks: "",
    learningObjectives: "",
    gradingPolicy: "",
    attendancePolicy: "",
    extraAndLate: "",
    contactInfo: "",
    description: "",
    syllabusResourceId: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingSyllabus, setIsUploadingSyllabus] = useState(false);
  const [pendingClassCount, setPendingClassCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(null);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const fetchClasses = useCallback(async (options?: { silent?: boolean }) => {
    if (!user?._id) {
      setIsLoading(false);
      return;
    }

    try {
      if (!options?.silent) {
        setIsLoading(true);
      }
      const [userClasses, userResources] = await Promise.all([
        apiService.getAllClasses(),
        apiService.getAllResources(),
      ]);
      setClasses(userClasses);
      setResources(userResources || []);
      classesRef.current = userClasses;
      setError(null);
    } catch (error) {
      console.error("Error fetching classes:", error);
      setError("Failed to load classes");
    } finally {
      if (!options?.silent) {
        setIsLoading(false);
      }
    }
  }, [user?._id]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchClasses({ silent: true });
      }
    };
    const handleFocus = () => fetchClasses({ silent: true });

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchClasses]);

  useEffect(() => {
    classesRef.current = classes;
  }, [classes]);

  const classSections = useMemo(() => {
    if (classes.length === 0) return [] as Array<{ label: string; sortKey: number; classes: ClassData[] }>;

    const termMap: Record<string, { label: string; sortKey: number }> = {};

    const normalizeYear = (year: string) => {
      const num = Number(year);
      if (Number.isNaN(num)) return null;
      if (year.length === 2) {
        return num >= 50 ? 1900 + num : 2000 + num;
      }
      return num;
    };

    const parseSemester = (value?: string | null) => {
      if (!value) return null;
      const cleaned = value.trim().replace(/\s+/g, " ");
      if (!cleaned) return null;

      const termAliases: Record<string, number> = {
        spring: 1,
        sp: 1,
        summer: 2,
        su: 2,
        fall: 3,
        fa: 3,
        autumn: 3,
        winter: 4,
        wi: 4,
      };

      const termFirst = cleaned.match(/^(spring|summer|fall|autumn|winter|sp|su|fa|wi)\s*(\d{2,4})/i);
      const yearFirst = cleaned.match(/(\d{2,4})\s*(spring|summer|fall|autumn|winter|sp|su|fa|wi)/i);
      const compact = cleaned.match(/(\d{2})([sfw])\b/i);

      let term: string | null = null;
      let year: string | null = null;

      if (termFirst) {
        term = termFirst[1].toLowerCase();
        year = termFirst[2];
      } else if (yearFirst) {
        year = yearFirst[1];
        term = yearFirst[2].toLowerCase();
      } else if (compact) {
        year = compact[1];
        const code = compact[2].toLowerCase();
        term = code === "s" ? "spring" : code === "f" ? "fall" : "winter";
      }

      if (!term || !year) return null;
      const normalizedYear = normalizeYear(year);
      if (!normalizedYear) return null;

      const termKey = termAliases[term];
      if (!termKey) return null;

      return {
        label: `${term.charAt(0).toUpperCase()}${term.slice(1)} ${normalizedYear}`,
        sortKey: normalizedYear * 10 + termKey,
      };
    };

    const extractSemester = (resource?: ResourceData) => {
      if (!resource) return null;
      const data: any = resource.extracted_data || {};
      const candidates = [
        data?.course_info?.semester,
        data?.courseInfo?.semester,
        data?.semester,
      ].filter(Boolean);

      for (const candidate of candidates) {
        const parsed = parseSemester(String(candidate));
        if (parsed) return parsed;
      }

      return null;
    };

    resources.forEach((resource) => {
      const classId = resource.class;
      if (!classId) return;
      const parsed = extractSemester(resource);
      if (!parsed) return;
      const existing = termMap[classId];
      if (!existing || parsed.sortKey > existing.sortKey) {
        termMap[classId] = parsed;
      }
    });

    const compareByName = (a: ClassData, b: ClassData) => {
      const aName = a.name || "";
      const bName = b.name || "";
      return aName.localeCompare(bName);
    };

    const sortedClasses = [...classes].sort((a, b) => {
      const aSemester = termMap[a._id] || parseSemester(a.name) || parseSemester(a.description || "");
      const bSemester = termMap[b._id] || parseSemester(b.name) || parseSemester(b.description || "");

      if (aSemester && bSemester) {
        if (aSemester.sortKey !== bSemester.sortKey) {
          return bSemester.sortKey - aSemester.sortKey;
        }
      } else if (aSemester) {
        return -1;
      } else if (bSemester) {
        return 1;
      }

      return compareByName(a, b);
    });

    const sections: Array<{ label: string; sortKey: number; classes: ClassData[] }> = [];
    const sectionMap = new Map<string, { label: string; sortKey: number; classes: ClassData[] }>();
    const uncategorized = { label: "Uncategorized", sortKey: -1, classes: [] as ClassData[] };

    sortedClasses.forEach((course) => {
      const semester = termMap[course._id]
        || parseSemester(course.name)
        || parseSemester(course.description || "");

      if (!semester) {
        uncategorized.classes.push(course);
        return;
      }

      const existing = sectionMap.get(semester.label);
      if (existing) {
        existing.classes.push(course);
      } else {
        const entry = { label: semester.label, sortKey: semester.sortKey, classes: [course] };
        sectionMap.set(semester.label, entry);
        sections.push(entry);
      }
    });

    sections.sort((a, b) => b.sortKey - a.sortKey);
    sections.forEach((section) => section.classes.sort(compareByName));

    if (uncategorized.classes.length > 0) {
      uncategorized.classes.sort(compareByName);
      sections.push(uncategorized);
    }

    return sections;
  }, [classes, resources]);

  const handleOpenEditModal = (classItem: ClassData) => {
    const syllabusDetails = extractSyllabusDetails(classItem, resources);

    setEditingClassId(classItem._id);
    setFormData({
      name: classItem.name || "",
      professor: classItem.professor || "",
      currentTerm: syllabusDetails.currentTerm,
      timing: syllabusDetails.timing,
      officeHours: syllabusDetails.officeHours,
      location: syllabusDetails.location,
      contactEmail: syllabusDetails.contactEmail,
      contactPhone: syllabusDetails.contactPhone,
      officeLocation: syllabusDetails.officeLocation,
      topics: classItem.topics?.join(", ") || "",
      textbooks: syllabusDetails.textbooks,
      learningObjectives: syllabusDetails.learningObjectives,
      gradingPolicy: syllabusDetails.gradingPolicy,
      attendancePolicy: syllabusDetails.attendancePolicy,
      extraAndLate: syllabusDetails.extraAndLate,
      contactInfo: classItem.contactInfo || "",
      description: classItem.description || "",
      syllabusResourceId: syllabusDetails.resourceId || "",
    });
    setShowDropdown(null);
    setError(null);
    setShowModal(true);
  };

  const handleOpenCreateModal = () => {
    setEditingClassId(null);
    setFormData({
      name: "",
      professor: "",
      currentTerm: "",
      timing: "",
      officeHours: "",
      location: "",
      contactEmail: "",
      contactPhone: "",
      officeLocation: "",
      topics: "",
      textbooks: "",
      learningObjectives: "",
      gradingPolicy: "",
      attendancePolicy: "",
      extraAndLate: "",
      contactInfo: "",
      description: "",
      syllabusResourceId: "",
    });
    setError(null);
    setShowModal(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Please enter a class name");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const contactInfoParts = [
        formData.contactEmail && `Email: ${formData.contactEmail.trim()}`,
        formData.contactPhone && `Phone: ${formData.contactPhone.trim()}`,
        formData.officeLocation && `Office: ${formData.officeLocation.trim()}`,
      ].filter(Boolean);

      const classData = {
        name: formData.name.trim(),
        professor: formData.professor.trim() || undefined,
        timing: formData.timing.trim() || undefined,
        location: formData.location.trim() || undefined,
        topics: formData.topics.trim()
          ? formData.topics
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : undefined,
        textbooks: formData.textbooks.trim()
          ? formData.textbooks
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : undefined,
        gradingPolicy: formData.gradingPolicy.trim() || undefined,
        contactInfo: contactInfoParts.length > 0 ? contactInfoParts.join("\n") : undefined,
        description: formData.description.trim() || undefined,
      };

      if (editingClassId) {
        await apiService.updateClass(editingClassId, classData);
      } else {
        await apiService.createClass(classData);
      }

      if (formData.syllabusResourceId) {
        await fetch('/api/resources/update-syllabus-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resource_id: formData.syllabusResourceId,
            user_id: user?._id,
            course_info: {
              semester: formData.currentTerm.trim() || null,
              schedule: formData.timing.trim() || null,
              professor_office_hours: formData.officeHours.trim() || null,
              location: formData.location.trim() || null,
              description: formData.description.trim() || null,
              contact_email: formData.contactEmail.trim() || null,
              contact_phone: formData.contactPhone.trim() || null,
              office_location: formData.officeLocation.trim() || null,
              contact_info: contactInfoParts.length > 0 ? contactInfoParts.join("\n") : null,
            },
            course_policies: {
              textbooks_and_materials: formData.textbooks.trim() || null,
              learning_objectives: formData.learningObjectives.trim() || null,
              grading_policy: formData.gradingPolicy.trim() || null,
              attendance_policy: formData.attendancePolicy.trim() || null,
              extra_and_late_policy: formData.extraAndLate.trim() || null,
            },
          }),
        });
      }

      // Refresh classes
      const updatedClasses = await apiService.getAllClasses();
      setClasses(updatedClasses);

      // Reset and close
      setFormData({
        name: "",
        professor: "",
        currentTerm: "",
        timing: "",
        officeHours: "",
        location: "",
        contactEmail: "",
        contactPhone: "",
        officeLocation: "",
        topics: "",
        textbooks: "",
        learningObjectives: "",
        gradingPolicy: "",
        attendancePolicy: "",
        extraAndLate: "",
        contactInfo: "",
        description: "",
        syllabusResourceId: "",
      });
      setEditingClassId(null);
      setShowModal(false);
      setError(null);
    } catch (error: any) {
      console.error("Error saving class:", error);
      setError(
        error.response?.data?.message ||
          `Failed to ${editingClassId ? "update" : "create"} class`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this class? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setError(null);
      await apiService.deleteClass(classId);
      const updatedClasses = await apiService.getAllClasses();
      setClasses(updatedClasses);
      setShowDropdown(null);
    } catch (error: any) {
      console.error("Error deleting class:", error);
      setError(error.response?.data?.message || "Failed to delete class");
      setShowDropdown(null);
    }
  };

  const openSyllabusPicker = () => {
    const input = fileInputRef.current;
    if (!input) return;
    input.value = "";
    if (typeof (input as any).showPicker === "function") {
      (input as any).showPicker();
    } else {
      input.click();
    }
  };

  const handleUploadSyllabus = () => {
    if (isLoadingUser) {
      setError("Loading your account. Try again in a moment.");
      return;
    }
    if (!user?._id) {
      setError("Please sign in to upload a syllabus.");
      return;
    }
    setError(null);
    openSyllabusPicker();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user?._id) {
      setError("Please sign in to upload a syllabus.");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const existingIds = new Set(classesRef.current.map((cls) => cls._id));

    try {
      setIsUploadingSyllabus(true);
      setPendingClassCount((prev) => prev + 1);
      setError(null);
      
      await apiService.smartUploadResource(file);
      
      // Refresh classes + resources so semester grouping is correct immediately
      const [updatedClasses, updatedResources] = await Promise.all([
        apiService.getAllClasses(),
        apiService.getAllResources(),
      ]);
      setClasses(updatedClasses);
      classesRef.current = updatedClasses;
      setResources(updatedResources || []);

      const pollForNewClass = async () => {
        const maxAttempts = 12;
        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const [nextClasses, nextResources] = await Promise.all([
            apiService.getAllClasses(),
            apiService.getAllResources(),
          ]);
          setClasses(nextClasses);
          classesRef.current = nextClasses;
          setResources(nextResources || []);
          const newClasses = nextClasses.filter((cls) => !existingIds.has(cls._id));
          if (newClasses.length > 0) {
            const allClassified = newClasses.every(
              (cls) => !!extractSyllabusDetails(cls, nextResources || []).currentTerm
            );
            if (!allClassified) {
              continue;
            }
            setPendingClassCount((prev) => Math.max(prev - 1, 0));
            return;
          }
        }
        setPendingClassCount((prev) => Math.max(prev - 1, 0));
      };

      pollForNewClass().catch((pollError) => {
        console.error("Error polling for new class:", pollError);
        setPendingClassCount((prev) => Math.max(prev - 1, 0));
      });
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error("Error uploading syllabus:", error);
      setPendingClassCount((prev) => Math.max(prev - 1, 0));
      setError(error.message || "Failed to upload syllabus");
    } finally {
      setIsUploadingSyllabus(false);
    }
  };

  const getColorClass = (classId: string) => getClassColor(classId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Classes</h1>
        </div>
        <div className="text-center text-muted-foreground">
          Loading classes...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Classes</h1>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
            id="syllabus-upload"
            onChangeCapture={(event) => {
              event.stopPropagation();
            }}
            onChange={handleFileChange}
            className="sr-only"
          />
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              handleUploadSyllabus();
            }}
            disabled={isUploadingSyllabus}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Upload size={16} />
            {isUploadingSyllabus ? "Uploading..." : "Upload Syllabus"}
          </button>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            New Class
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md">
          {error}
        </div>
      )}

      {classes.length === 0 && pendingClassCount === 0 ? (
        <div className="bg-card border border-border rounded-md p-8 text-center text-muted-foreground">
          <p>No classes found. Create your first class!</p>
        </div>
      ) : (
        <div className="space-y-8">
          {classSections.map((section) => (
            <div key={section.label} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">{section.label}</h2>
                <span className="text-xs text-muted-foreground">
                  {section.classes.length} class{section.classes.length === 1 ? "" : "es"}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {section.classes.map((course) => {
                    const cardDetails = extractSyllabusDetails(course, resources);
                    return (
                      <motion.div
                        layout
                        key={course._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        onClick={() => router.push(`/classes/${course._id}`)}
                        className="bg-card border border-border rounded-md overflow-hidden group hover:border-primary/50 transition-all cursor-pointer"
                      >
                        <div className="h-2" style={{ backgroundColor: getColorClass(course._id) }} />
                        <div className="p-5">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                              {course.name.split(" ").map((w) => w[0]).join("").substring(0, 6)}
                            </span>
                            <div className="relative" ref={showDropdown === course._id ? dropdownRef : null}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowDropdown(showDropdown === course._id ? null : course._id);
                                }}
                                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                              >
                                <MoreVertical size={16} />
                              </button>
                              {showDropdown === course._id && (
                                <div className="absolute right-0 mt-1 w-36 bg-card border border-border rounded-md shadow-lg z-50">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEditModal(course);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-secondary flex items-center gap-2 transition-colors first:rounded-t-md"
                                  >
                                    <Edit size={14} />
                                    Edit Class
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteClass(course._id);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-secondary flex items-center gap-2 transition-colors last:rounded-b-md border-t border-border"
                                  >
                                    <Trash2 size={14} />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <h3 className="text-lg font-bold text-foreground mb-1">{course.name}</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            {course.professor || "No professor listed"}
                          </p>

                          <div className="space-y-1">
                            {cardDetails.timing && (
                              <div className="text-xs text-muted-foreground">
                                <span className="font-medium">Time:</span> {cardDetails.timing}
                              </div>
                            )}
                            {cardDetails.location && (
                              <div className="text-xs text-muted-foreground">
                                <span className="font-medium">Location:</span> {cardDetails.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}

            {Array.from({ length: pendingClassCount }).map((_, index) => (
              <motion.div
                layout
                key={`pending-${index}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="bg-card border border-border rounded-md overflow-hidden animate-pulse"
              >
                <div className="h-2 bg-muted" />
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Pending
                    </span>
                    <div className="text-muted-foreground">
                      <Eye className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                  <div className="h-4 w-2/3 rounded bg-muted/60 mb-3" />
                  <div className="h-3 w-1/2 rounded bg-muted/40 mb-2" />
                  <div className="h-3 w-1/3 rounded bg-muted/40" />
                </div>
              </motion.div>
            ))}
        </div>
      )}

      {/* Create/Edit Class Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-xl bg-card border border-border rounded-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-foreground">
                {editingClassId ? "Edit Class" : "Create New Class"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingClassId(null);
                  setError(null);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-4">
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
                    Current Term
                  </label>
                  <input
                    type="text"
                    value={formData.currentTerm}
                    onChange={(e) =>
                      setFormData({ ...formData, currentTerm: e.target.value })
                    }
                    placeholder="e.g., Fall 2025"
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Professor Office Hours
                  </label>
                  <input
                    type="text"
                    value={formData.officeHours}
                    onChange={(e) =>
                      setFormData({ ...formData, officeHours: e.target.value })
                    }
                    placeholder="e.g., Tue/Thu 2:00-4:00 PM"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Professor Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, contactEmail: e.target.value })
                    }
                    placeholder="professor@university.edu"
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Professor Contact Telephone
                  </label>
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, contactPhone: e.target.value })
                    }
                    placeholder="(555) 123-4567"
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Professor Office Location
                </label>
                <input
                  type="text"
                  value={formData.officeLocation}
                  onChange={(e) =>
                    setFormData({ ...formData, officeLocation: e.target.value })
                  }
                  placeholder="e.g., ECS 3.101"
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Course Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief course description"
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
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
                  Learning Objectives or Outcomes
                </label>
                <textarea
                  value={formData.learningObjectives}
                  onChange={(e) =>
                    setFormData({ ...formData, learningObjectives: e.target.value })
                  }
                  placeholder="List the key outcomes for this course"
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Textbooks (comma-separated)
                </label>
                <textarea
                  value={formData.textbooks}
                  onChange={(e) =>
                    setFormData({ ...formData, textbooks: e.target.value })
                  }
                  placeholder="List required/optional materials"
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
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
                  Attendance Policy
                </label>
                <textarea
                  value={formData.attendancePolicy}
                  onChange={(e) =>
                    setFormData({ ...formData, attendancePolicy: e.target.value })
                  }
                  placeholder="Attendance expectations and requirements"
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Extra Credit, Make Up, and Late Work Policy
                </label>
                <textarea
                  value={formData.extraAndLate}
                  onChange={(e) =>
                    setFormData({ ...formData, extraAndLate: e.target.value })
                  }
                  placeholder="Late work rules, extra credit options, make-up work policy"
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingClassId(null);
                    setError(null);
                  }}
                  className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md transition-colors disabled:opacity-50"
                >
                  {isSubmitting
                    ? editingClassId
                      ? "Updating..."
                      : "Creating..."
                    : editingClassId
                    ? "Update Class"
                    : "Create Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Processing Animation Modal */}
      {isUploadingSyllabus && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <ProcessingAnimation 
            isProcessing={isUploadingSyllabus}
            className="w-full max-w-md"
          />
        </div>
      )}
    </div>
  );
};

export default ClassesPage;
