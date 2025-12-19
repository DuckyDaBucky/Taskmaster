/**
 * Nebula API Service
 * 
 * Integrates with UTD Nebula Labs API (api.utdnebula.com)
 * Provides course information, professors, sections, and grades data
 * 
 * API Docs: https://api.utdnebula.com/swagger/index.html
 * Note: Requires API key from Nebula Labs Discord
 */

const NEBULA_API_URL = 'https://api.utdnebula.com';

// Get API key from environment (set in Vercel)
const getApiKey = () => {
  if (typeof window !== 'undefined') {
    // Client-side - should call our API route instead
    return null;
  }
  return process.env.NEBULA_API_KEY || '';
};

// Types based on Nebula API schema
export interface NebulaCourse {
  _id: string;
  course_number: string;
  subject_prefix: string;
  title: string;
  description: string;
  school: string;
  credit_hours: string;
  class_level: string;
  activity_type: string;
  grading: string;
  prerequisites?: any;
  corequisites?: any;
  co_or_pre_requisites?: any;
}

export interface NebulaSection {
  _id: string;
  section_number: string;
  course_reference: string;
  academic_session: {
    name: string;
    start_date: string;
    end_date: string;
  };
  professors: string[];
  teaching_assistants?: any[];
  internal_class_number: string;
  instruction_mode: string;
  meetings: Array<{
    start_date: string;
    end_date: string;
    meeting_days: string[];
    start_time: string;
    end_time: string;
    modality: string;
    location?: {
      building: string;
      room: string;
      map_uri: string;
    };
  }>;
  syllabus_uri?: string;
}

export interface NebulaProfessor {
  _id: string;
  first_name: string;
  last_name: string;
  titles: string[];
  email: string;
  phone_number?: string;
  office?: {
    building: string;
    room: string;
    map_uri: string;
  };
  profile_uri?: string;
  image_uri?: string;
  office_hours?: any[];
  sections: string[];
}

export interface NebulaGrades {
  _id: string;
  section_id: string;
  grade_distribution: number[];
}

/**
 * For client-side use, calls go through our API route
 * This avoids exposing the API key
 */
export const nebulaService = {
  /**
   * Search courses by various criteria
   */
  async searchCourses(params: {
    course_number?: string;
    subject_prefix?: string;
    title?: string;
    school?: string;
  }): Promise<NebulaCourse[]> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, value);
    });

    const response = await fetch(`/api/nebula/courses?${searchParams}`);
    if (!response.ok) throw new Error('Failed to fetch courses');
    const data = await response.json();
    return data.data || [];
  },

  /**
   * Get a specific course by ID
   */
  async getCourse(courseId: string): Promise<NebulaCourse | null> {
    const response = await fetch(`/api/nebula/courses/${courseId}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.data || null;
  },

  /**
   * Get sections for a course in a specific semester
   */
  async getSections(params: {
    course_reference?: string;
    section_number?: string;
    professor?: string;
  }): Promise<NebulaSection[]> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, value);
    });

    const response = await fetch(`/api/nebula/sections?${searchParams}`);
    if (!response.ok) throw new Error('Failed to fetch sections');
    const data = await response.json();
    return data.data || [];
  },

  /**
   * Get professor information
   */
  async getProfessor(professorId: string): Promise<NebulaProfessor | null> {
    const response = await fetch(`/api/nebula/professors/${professorId}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.data || null;
  },

  /**
   * Search professors by name
   */
  async searchProfessors(params: {
    first_name?: string;
    last_name?: string;
  }): Promise<NebulaProfessor[]> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, value);
    });

    const response = await fetch(`/api/nebula/professors?${searchParams}`);
    if (!response.ok) throw new Error('Failed to fetch professors');
    const data = await response.json();
    return data.data || [];
  },

  /**
   * Get grade distribution for a section
   */
  async getGrades(sectionId: string): Promise<NebulaGrades | null> {
    const response = await fetch(`/api/nebula/grades/${sectionId}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.data || null;
  },

  /**
   * Get current semester code (e.g., "25s" for Spring 2025)
   */
  getCurrentSemester(): string {
    const now = new Date();
    const year = now.getFullYear() % 100; // Get last 2 digits
    const month = now.getMonth() + 1;

    if (month >= 1 && month <= 5) {
      return `${year}s`; // Spring
    } else if (month >= 6 && month <= 7) {
      return `${year}u`; // Summer
    } else {
      return `${year}f`; // Fall
    }
  },

  /**
   * Parse course code like "CS 2340" into parts
   */
  parseCourseCode(code: string): { prefix: string; number: string } | null {
    const match = code.trim().match(/^([A-Z]{2,4})\s*(\d{4})$/i);
    if (!match) return null;
    return {
      prefix: match[1].toUpperCase(),
      number: match[2],
    };
  },
};

/**
 * Server-side only: Direct API calls with API key
 * Use this in Vercel API routes
 */
export const nebulaServerAPI = {
  async fetch(endpoint: string, apiKey: string): Promise<any> {
    const response = await fetch(`${NEBULA_API_URL}${endpoint}`, {
      headers: {
        'x-api-key': apiKey,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Nebula API error: ${response.status}`);
    }
    
    return response.json();
  },

  // Course endpoints
  courses: {
    all: (apiKey: string) => nebulaServerAPI.fetch('/course/all', apiKey),
    search: (apiKey: string, params: Record<string, string>) => {
      const query = new URLSearchParams(params).toString();
      return nebulaServerAPI.fetch(`/course?${query}`, apiKey);
    },
    byId: (apiKey: string, id: string) => nebulaServerAPI.fetch(`/course/${id}`, apiKey),
  },

  // Section endpoints
  sections: {
    search: (apiKey: string, params: Record<string, string>) => {
      const query = new URLSearchParams(params).toString();
      return nebulaServerAPI.fetch(`/section?${query}`, apiKey);
    },
    byId: (apiKey: string, id: string) => nebulaServerAPI.fetch(`/section/${id}`, apiKey),
  },

  // Professor endpoints
  professors: {
    search: (apiKey: string, params: Record<string, string>) => {
      const query = new URLSearchParams(params).toString();
      return nebulaServerAPI.fetch(`/professor?${query}`, apiKey);
    },
    byId: (apiKey: string, id: string) => nebulaServerAPI.fetch(`/professor/${id}`, apiKey),
  },

  // Grades endpoint
  grades: {
    bySection: (apiKey: string, sectionId: string) => 
      nebulaServerAPI.fetch(`/grades?section_id=${sectionId}`, apiKey),
  },
};

