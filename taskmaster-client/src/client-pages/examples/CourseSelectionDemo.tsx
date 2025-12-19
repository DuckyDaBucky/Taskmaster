/**
 * Example: Using CourseSelector in a form
 * Shows how to let users select from courses with verified syllabi
 */

import React, { useState } from 'react';
import { CourseSelector } from '../../components/resources/CourseSelector';
import { syllabusService } from '../../services/syllabusService';
import { Check, FileText } from 'lucide-react';

export const CourseSelectionDemo: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [syllabi, setSyllabi] = useState<any[]>([]);
  const [selectedSyllabus, setSelectedSyllabus] = useState<string | null>(null);

  const handleCourseSelect = (courseNumber: string, availableSyllabi: any[]) => {
    setSelectedCourse(courseNumber);
    setSyllabi(availableSyllabi);
    setSelectedSyllabus(null);
  };

  const handleCreateClass = async () => {
    if (!selectedCourse) return;

    // Create class from Nebula data
    const classId = await syllabusService.createClassFromCourse('user-id', selectedCourse);
    
    // Link selected syllabus if any
    if (selectedSyllabus && classId) {
      await syllabusService.linkSyllabusToClass(selectedSyllabus, classId);
    }

    alert(`Class created for ${selectedCourse}!`);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Select Course with Syllabus
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose from courses that have verified syllabi. Course info will be auto-filled from Nebula.
        </p>
      </div>

      {/* Course Selector */}
      <CourseSelector onSelectCourse={handleCourseSelect} />

      {/* Selected Course Info */}
      {selectedCourse && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Check className="text-green-500" size={20} />
            <h3 className="font-semibold text-foreground">
              Selected: {selectedCourse}
            </h3>
          </div>

          {/* Available Syllabi */}
          {syllabi.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">
                Choose a syllabus ({syllabi.length} available):
              </p>
              <div className="space-y-2">
                {syllabi.map((syllabus) => (
                  <label
                    key={syllabus.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSyllabus === syllabus.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="syllabus"
                      value={syllabus.id}
                      checked={selectedSyllabus === syllabus.id}
                      onChange={(e) => setSelectedSyllabus(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText size={16} className="text-primary" />
                        <span className="text-sm font-medium text-foreground">
                          {syllabus.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {syllabus.semester && <span>{syllabus.semester}</span>}
                        {syllabus.professor_name && <span>Prof. {syllabus.professor_name}</span>}
                        <span>{new Date(syllabus.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleCreateClass}
            disabled={!selectedCourse}
            className="w-full px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground rounded-lg text-sm font-medium transition-colors"
          >
            Create Class with {selectedSyllabus ? 'Selected Syllabus' : 'Nebula Data'}
          </button>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-400 mb-2">
          How it works:
        </h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Upload syllabi → Auto-extracts course number (CS3305, MATH2413, etc.)</li>
          <li>• Verifies with Nebula API → Gets official course title, description, prerequisites</li>
          <li>• Stored in database → Available in this dropdown for quick selection</li>
          <li>• Create class → Auto-fills details from Nebula + attaches syllabus</li>
        </ul>
      </div>
    </div>
  );
};
