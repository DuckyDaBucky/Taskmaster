/**
 * Nebula Service
 * Wrapper for accessing UTD course/professor data for AI context
 */

interface CourseContext {
  course_number: string;
  title: string;
  description: string;
  difficulty: string;
  prerequisites: string;
  grades: any;
}

export const nebulaService = {
  /**
   * Search courses by number or name
   */
  async searchCourses(query: string): Promise<any[]> {
    try {
      const response = await fetch(`/api/nebula/courses?action=search&q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to search courses');
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error searching courses:', error);
      return [];
    }
  },

  /**
   * Get specific course by course number
   */
  async getCourse(courseNumber: string): Promise<any | null> {
    try {
      const response = await fetch(`/api/nebula/courses?action=search&course=${encodeURIComponent(courseNumber)}`);
      if (!response.ok) throw new Error('Failed to get course');
      
      const data = await response.json();
      const courses = data.data || [];
      return courses.length > 0 ? courses[0] : null;
    } catch (error) {
      console.error('Error getting course:', error);
      return null;
    }
  },

  /**
   * Get professor info
   */
  async getProfessor(nameOrId: string): Promise<any | null> {
    try {
      const isId = nameOrId.length === 24; // MongoDB ObjectId length
      const param = isId ? `id=${nameOrId}` : `name=${encodeURIComponent(nameOrId)}`;
      const response = await fetch(`/api/nebula/courses?action=professor&${param}`);
      if (!response.ok) throw new Error('Failed to get professor');
      
      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Error getting professor:', error);
      return null;
    }
  },

  /**
   * Get grade distributions for a course
   */
  async getCourseGrades(courseId: string): Promise<any[]> {
    try {
      const response = await fetch(`/api/nebula/courses?action=grades&course_id=${courseId}`);
      if (!response.ok) throw new Error('Failed to get grades');
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error getting grades:', error);
      return [];
    }
  },

  /**
   * Get sections for a course (with schedules)
   */
  async getCourseSections(courseId: string): Promise<any[]> {
    try {
      const response = await fetch(`/api/nebula/courses?action=sections&course_id=${courseId}`);
      if (!response.ok) throw new Error('Failed to get sections');
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error getting sections:', error);
      return [];
    }
  },

  /**
   * Get enriched context for multiple courses (for AI RAG)
   * This returns course details + grades + difficulty metrics
   */
  async getEnrichedContext(courseNumbers: string[]): Promise<CourseContext[]> {
    try {
      const courses = courseNumbers.join(',');
      const response = await fetch(`/api/nebula/courses?action=context&courses=${encodeURIComponent(courses)}`);
      if (!response.ok) throw new Error('Failed to get enriched context');
      
      const data = await response.json();
      return data.courses || [];
    } catch (error) {
      console.error('Error getting enriched context:', error);
      return [];
    }
  },

  /**
   * Sync all courses to Supabase (run once to populate DB)
   */
  async syncToDatabase(): Promise<{ success: boolean; count: number }> {
    try {
      const response = await fetch('/api/nebula/courses?action=sync', {
        method: 'GET'
      });
      
      if (!response.ok) throw new Error('Failed to sync courses');
      
      const data = await response.json();
      return {
        success: true,
        count: data.synced || 0
      };
    } catch (error) {
      console.error('Error syncing courses:', error);
      return { success: false, count: 0 };
    }
  },

  /**
   * Extract course numbers from text (syllabus, user message, etc.)
   * Handles: CS3305, CS 3305, ECS2390.0W1 → ECS2390, MATH2413, etc.
   * Fallback: "2414 - Syllabus.pdf" → "2414" (number-only for manual prefix)
   */
  extractCourseNumbers(text: string): string[] {
    const matches = new Set<string>();
    
    // Primary pattern: Full course codes (CS3305, MATH 2413, ECS2390)
    // Strips section numbers (anything after the 4-digit course number)
    const fullPattern = /\b([A-Z]{2,4})\s*(\d{4})/gi;
    let match;
    while ((match = fullPattern.exec(text)) !== null) {
      const prefix = match[1].toUpperCase();
      const number = match[2];
      matches.add(`${prefix}${number}`);
    }
    
    // Fallback: Number-only pattern for files like "2414 - Syllabus.pdf"
    // Only use if no full patterns found (to avoid false positives like years)
    if (matches.size === 0) {
      const numberPattern = /\b(\d{4})\b/g;
      while ((match = numberPattern.exec(text)) !== null) {
        // Must be exactly 4 digits and not look like a year
        const num = parseInt(match[1]);
        if (num >= 1000 && num <= 9999 && num < 2100) {
          matches.add(match[1]);
        }
      }
    }
    
    return Array.from(matches);
  },

  /**
   * Format course context for AI prompt
   */
  formatContextForAI(context: CourseContext[]): string {
    if (!context.length) return '';
    
    const sections = context.map(course => {
      return `
**${course.course_number}: ${course.title}**
- Difficulty: ${course.difficulty}
- Prerequisites: ${course.prerequisites || 'None'}
- Description: ${course.description}
${course.grades ? `- Average GPA: ${course.grades.avg_gpa || 'N/A'}` : ''}
      `.trim();
    });
    
    return `
## UTD Course Context (from Nebula)

${sections.join('\n\n')}

Use this data to provide accurate, UTD-specific advice about courses, difficulty, prerequisites, and professor recommendations.
    `.trim();
  }
};
