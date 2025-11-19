import React from "react";
import { MoreVertical } from "lucide-react";

const CLASSES_DATA = [
  { id: 1, name: "Introduction to Algorithms", code: "CS 301", instructor: "Dr. Smith", progress: 75, color: "bg-blue-600" },
  { id: 2, name: "Database Systems", code: "CS 402", instructor: "Prof. Johnson", progress: 45, color: "bg-green-600" },
  { id: 3, name: "Linear Algebra", code: "MATH 201", instructor: "Dr. Brown", progress: 90, color: "bg-purple-600" },
];

const ClassesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Classes</h1>
        <button className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md text-sm font-medium transition-colors">
          Manage Classes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CLASSES_DATA.map((course) => (
          <div key={course.id} className="bg-card border border-border rounded-md overflow-hidden group hover:border-primary/50 transition-all">
            <div className={`h-2 ${course.color}`} />
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{course.code}</span>
                <button className="text-muted-foreground hover:text-foreground">
                  <MoreVertical size={16} />
                </button>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">{course.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{course.instructor}</p>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{course.progress}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className={`h-full ${course.color} w-[${course.progress}%]`} style={{ width: `${course.progress}%` }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassesPage;
