"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { apiService } from "../../services/api";
import type { ClassData } from "../../services/types";
import ClassOverviewDialog from "../../components/ClassOverviewDialog";

const ClassDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const classId = params?.classId as string | undefined;
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClass = async () => {
      if (!classId) return;
      setIsLoading(true);
      setError(null);
      try {
        const allClasses = await apiService.getAllClasses();
        const found = (allClasses || []).find((item) => item._id === classId) || null;
        setClassData(found);
        if (!found) {
          setError("Class not found.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load class.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClass();
  }, [classId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/classes")}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Back to Classes
          </button>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/classes")}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Back to Classes
          </button>
        </div>
        <div className="bg-card border border-border rounded-md p-6 text-muted-foreground">
          {error || "Class not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/classes")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Back to Classes
        </button>
      </div>
      <ClassOverviewDialog
        classData={classData}
        isOpen={true}
        onClose={() => undefined}
        variant="page"
      />
    </div>
  );
};

export default ClassDetailPage;
