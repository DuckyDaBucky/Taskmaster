/**
 * Resources Page - Simplified
 * Resources are now managed through the Classes page
 */

import React from "react";
import { FileText, ArrowRight } from "lucide-react";
import Link from "next/link";

const ResourcesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Resources</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload and manage your study materials
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <FileText className="mx-auto mb-4 text-muted-foreground" size={48} />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Resources Moved to Classes
        </h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          You can now upload syllabi and resources directly from the Classes page. 
          This keeps everything organized by course.
        </p>
        <Link
          href="/classes"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors font-medium"
        >
          Go to Classes
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
};

export default ResourcesPage;
