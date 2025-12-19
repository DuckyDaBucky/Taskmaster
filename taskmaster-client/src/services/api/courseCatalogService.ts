/**
 * Course Catalog Service
 * 
 * Provides course data from:
 * 1. Local Supabase cache (fastest)
 * 2. Nebula API (if key available)
 * 
 * Modular design - swap sources easily
 */

import { supabase } from '../../lib/supabase';

export interface Course {
  id: string;
  subject_prefix: string;
  course_number: string;
  title: string;
  description: string | null;
  credit_hours: string;
  class_level: string | null;
  school: string | null;
  prerequisites?: any;
  source: 'manual' | 'nebula' | 'scraped';
}

export const courseCatalogService = {
  /**
   * Search courses by query (prefix, number, or title)
   */
  async searchCourses(query: string, limit = 20): Promise<Course[]> {
    if (!query.trim()) return [];

    // Parse if it looks like a course code (e.g., "CS 2340" or "CS2340")
    const codeMatch = query.trim().match(/^([A-Z]{2,4})\s*(\d{0,4})$/i);
    
    if (codeMatch) {
      const prefix = codeMatch[1].toUpperCase();
      const number = codeMatch[2];
      
      let queryBuilder = supabase
        .from('course_catalog')
        .select('*')
        .ilike('subject_prefix', prefix);
      
      if (number) {
        queryBuilder = queryBuilder.ilike('course_number', `${number}%`);
      }
      
      const { data, error } = await queryBuilder.limit(limit);
      
      if (error) {
        console.error('Course search error:', error);
        return [];
      }
      
      return data || [];
    }

    // General text search
    const { data, error } = await supabase
      .from('course_catalog')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit);

    if (error) {
      console.error('Course search error:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Get a specific course by prefix and number
   */
  async getCourse(prefix: string, number: string): Promise<Course | null> {
    const { data, error } = await supabase
      .from('course_catalog')
      .select('*')
      .eq('subject_prefix', prefix.toUpperCase())
      .eq('course_number', number)
      .single();

    if (error) {
      console.error('Get course error:', error);
      return null;
    }

    return data;
  },

  /**
   * Get all courses for a subject prefix
   */
  async getCoursesByPrefix(prefix: string): Promise<Course[]> {
    const { data, error } = await supabase
      .from('course_catalog')
      .select('*')
      .eq('subject_prefix', prefix.toUpperCase())
      .order('course_number');

    if (error) {
      console.error('Get courses by prefix error:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Get all available subject prefixes
   */
  async getSubjectPrefixes(): Promise<string[]> {
    const { data, error } = await supabase
      .from('course_catalog')
      .select('subject_prefix')
      .order('subject_prefix');

    if (error) {
      console.error('Get prefixes error:', error);
      return [];
    }

    // Get unique prefixes
    const prefixes = [...new Set(data?.map(d => d.subject_prefix) || [])];
    return prefixes;
  },

  /**
   * Format course code for display
   */
  formatCourseCode(prefix: string, number: string): string {
    return `${prefix} ${number}`;
  },

  /**
   * Parse a course code string
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

