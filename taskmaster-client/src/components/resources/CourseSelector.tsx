/**
 * Course Selector Component
 * Dropdown showing courses with available syllabi from Nebula
 */

import React, { useState, useEffect } from 'react';
import { Search, Book, CheckCircle, AlertCircle } from 'lucide-react';
import { syllabusService } from '../../services/syllabusService';

interface CourseOption {
  courseNumber: string;
  title: string;
  description: string;
  syllabusCount: number;
  latestSemester: string | null;
  professors: string[];
}

interface CourseSelectorProps {
  onSelectCourse: (courseNumber: string, syllabi: any[]) => void;
  className?: string;
}

export const CourseSelector: React.FC<CourseSelectorProps> = ({ 
  onSelectCourse, 
  className = '' 
}) => {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = courses.filter(c => 
        c.courseNumber.toLowerCase().includes(query) ||
        c.title.toLowerCase().includes(query)
      );
      setFilteredCourses(filtered);
    } else {
      setFilteredCourses(courses);
    }
  }, [searchQuery, courses]);

  const loadCourses = async () => {
    setIsLoading(true);
    try {
      const data = await syllabusService.getCoursesWithSyllabi();
      setCourses(data);
      setFilteredCourses(data);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCourse = async (courseNumber: string) => {
    setSelectedCourse(courseNumber);
    setShowDropdown(false);
    setSearchQuery(courseNumber);

    // Fetch syllabi for selected course
    const syllabi = await syllabusService.getSyllabiForCourse(courseNumber);
    onSelectCourse(courseNumber, syllabi);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search courses with syllabi (e.g., CS3305)..."
          className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {selectedCourse && (
          <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" size={18} />
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Results */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto z-20">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading courses...
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="p-4 text-center">
                <AlertCircle className="mx-auto mb-2 text-muted-foreground" size={32} />
                <p className="text-sm text-muted-foreground">
                  {courses.length === 0 
                    ? 'No syllabi available yet. Upload your first syllabus!'
                    : 'No courses match your search'
                  }
                </p>
              </div>
            ) : (
              <div className="py-2">
                {filteredCourses.map((course) => (
                  <button
                    key={course.courseNumber}
                    onClick={() => handleSelectCourse(course.courseNumber)}
                    className="w-full px-4 py-3 text-left hover:bg-secondary/50 transition-colors border-b border-border last:border-0"
                  >
                    <div className="flex items-start gap-3">
                      <Book className="text-primary mt-0.5 shrink-0" size={20} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground">
                            {course.courseNumber}
                          </span>
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
                            {course.syllabusCount} {course.syllabusCount === 1 ? 'syllabus' : 'syllabi'}
                          </span>
                        </div>
                        <p className="text-sm text-foreground mb-1 line-clamp-1">
                          {course.title}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {course.latestSemester && (
                            <span>Latest: {course.latestSemester}</span>
                          )}
                          {course.professors.length > 0 && (
                            <span>
                              Prof: {course.professors.slice(0, 2).join(', ')}
                              {course.professors.length > 2 && ` +${course.professors.length - 2}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Info Text */}
      {courses.length > 0 && !showDropdown && (
        <p className="mt-2 text-xs text-muted-foreground">
          {courses.length} courses with verified syllabi available
        </p>
      )}
    </div>
  );
};
