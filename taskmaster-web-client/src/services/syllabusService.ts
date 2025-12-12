/**
 * Syllabus Verification Service
 * Matches uploaded syllabi with Nebula course catalog
 */

import { supabase } from '../lib/supabase';
import { nebulaService } from './nebulaService';

interface SyllabusVerification {
  resourceId: string;
  courseNumber: string | null;
  verified: boolean;
  nebulaData: any | null;
  error?: string;
}

interface CourseWithSyllabus {
  courseNumber: string;
  title: string;
  description: string;
  creditHours: string;
  prerequisites: any;
  syllabusCount: number;
  latestSemester: string | null;
  professors: string[];
  resourceIds: string[];
  difficulty?: string;
  grades?: any;
}

export const syllabusService = {
  /**
   * Verify uploaded syllabus against Nebula catalog
   */
  async verifySyllabus(resourceId: string, fileName: string): Promise<SyllabusVerification> {
    try {
      // Extract course number from filename (handles ECS2390.0W1 → ECS2390)
      const courseNumber = nebulaService.extractCourseNumbers(fileName)[0];
      
      if (!courseNumber) {
        // Still mark with extracted info even if no course number
        await supabase
          .from('resources')
          .update({ verification_status: 'pending' })
          .eq('id', resourceId);
          
        return {
          resourceId,
          courseNumber: null,
          verified: false,
          nebulaData: null,
          error: 'Could not extract course number from filename'
        };
      }

      // Get course from Nebula
      const nebulaCourse = await nebulaService.getCourse(courseNumber);
      
      if (!nebulaCourse) {
        // Mark as "manual" - we have the course number but Nebula doesn't have it
        // This is OK! Not all UTD courses are in Nebula yet
        await supabase
          .from('resources')
          .update({
            verified_course_number: courseNumber,
            verification_status: 'manual',
            course_metadata: {
              note: 'Course number extracted but not found in Nebula catalog. May need manual verification.'
            }
          })
          .eq('id', resourceId);
          
        console.log(`📝 Course ${courseNumber} extracted but not in Nebula - marked as manual`);
        
        return {
          resourceId,
          courseNumber,
          verified: false, // Not fully verified, but extracted
          nebulaData: null,
          error: `Course ${courseNumber} not in Nebula catalog (marked as manual)`
        };
      }

      // Update resource with verified data from Nebula
      const { error } = await supabase
        .from('resources')
        .update({
          verified_course_number: courseNumber,
          verification_status: 'verified',
          nebula_course_id: nebulaCourse._id,
          course_metadata: {
            title: nebulaCourse.title,
            description: nebulaCourse.description,
            credit_hours: nebulaCourse.credit_hours,
            prerequisites: nebulaCourse.prerequisites,
            subject_prefix: nebulaCourse.subject_prefix
          }
        })
        .eq('id', resourceId);

      if (error) throw error;

      // Also try to match with course_catalog table
      const { data: catalogCourse } = await supabase
        .from('course_catalog')
        .select('id')
        .eq('course_number', courseNumber)
        .single();

      if (catalogCourse) {
        await supabase
          .from('resources')
          .update({ verified_course_id: catalogCourse.id })
          .eq('id', resourceId);
      }

      return {
        resourceId,
        courseNumber,
        verified: true,
        nebulaData: nebulaCourse
      };
    } catch (error: any) {
      console.error('Error verifying syllabus:', error);
      return {
        resourceId,
        courseNumber: null,
        verified: false,
        nebulaData: null,
        error: error.message
      };
    }
  },

  /**
   * Get all courses that have verified syllabi
   */
  async getCoursesWithSyllabi(): Promise<CourseWithSyllabus[]> {
    try {
      const { data, error } = await supabase
        .from('courses_with_syllabi')
        .select('*')
        .order('course_number');

      if (error) throw error;

      return (data || []).map(row => ({
        courseNumber: row.course_number,
        title: row.course_title,
        description: row.description,
        creditHours: row.credit_hours,
        prerequisites: row.prerequisites,
        syllabusCount: row.syllabus_count,
        latestSemester: row.latest_semester,
        professors: row.professors || [],
        resourceIds: row.resource_ids || []
      }));
    } catch (error) {
      console.error('Error fetching courses with syllabi:', error);
      return [];
    }
  },

  /**
   * Get enriched course data (Nebula + local syllabi)
   */
  async getEnrichedCourseData(courseNumber: string): Promise<any> {
    try {
      // Get Nebula data
      const [nebulaCourse, nebulaGrades] = await Promise.all([
        nebulaService.getCourse(courseNumber),
        nebulaService.getCourseGrades(courseNumber)
      ]);

      // Get local syllabi
      const { data: syllabi } = await supabase
        .from('resources')
        .select('id, title, semester, professor_name, created_at, files')
        .eq('verified_course_number', courseNumber)
        .eq('verification_status', 'verified')
        .order('created_at', { ascending: false });

      return {
        courseNumber,
        official: nebulaCourse,
        grades: nebulaGrades,
        syllabi: syllabi || [],
        syllabusCount: syllabi?.length || 0,
        hasUpToDateSyllabus: syllabi && syllabi.length > 0
      };
    } catch (error) {
      console.error('Error getting enriched course data:', error);
      return null;
    }
  },

  /**
   * Search courses with syllabi (for dropdown)
   */
  async searchCoursesWithSyllabi(query: string): Promise<CourseWithSyllabus[]> {
    try {
      const allCourses = await this.getCoursesWithSyllabi();
      
      if (!query.trim()) return allCourses;

      const lowerQuery = query.toLowerCase();
      return allCourses.filter(course => 
        course.courseNumber.toLowerCase().includes(lowerQuery) ||
        course.title.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('Error searching courses:', error);
      return [];
    }
  },

  /**
   * Get syllabus options for a specific course
   */
  async getSyllabiForCourse(courseNumber: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('id, title, semester, professor_name, created_at, files')
        .eq('verified_course_number', courseNumber)
        .eq('verification_status', 'verified')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching syllabi:', error);
      return [];
    }
  },

  /**
   * Auto-fill class from Nebula when user selects a course
   */
  async createClassFromCourse(userId: string, courseNumber: string): Promise<string | null> {
    try {
      // Get course data
      const enrichedData = await this.getEnrichedCourseData(courseNumber);
      if (!enrichedData?.official) return null;

      const course = enrichedData.official;

      // Create class with Nebula data
      const { data, error } = await supabase
        .from('classes')
        .insert({
          user_id: userId,
          name: `${courseNumber}: ${course.title}`,
          description: course.description,
          topics: course.prerequisites ? [JSON.stringify(course.prerequisites)] : [],
          is_personal: false
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating class from course:', error);
      return null;
    }
  },

  /**
   * Link existing syllabus to a class
   */
  async linkSyllabusToClass(resourceId: string, classId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('resources')
        .update({ class_id: classId })
        .eq('id', resourceId);

      return !error;
    } catch (error) {
      console.error('Error linking syllabus:', error);
      return false;
    }
  },

  /**
   * Manual verification (when auto-extraction fails)
   */
  async manuallyVerifySyllabus(
    resourceId: string, 
    courseNumber: string,
    semester?: string,
    professor?: string
  ): Promise<boolean> {
    try {
      const nebulaCourse = await nebulaService.getCourse(courseNumber);
      
      const updates: any = {
        verified_course_number: courseNumber,
        verification_status: nebulaCourse ? 'verified' : 'manual'
      };

      if (nebulaCourse) {
        updates.nebula_course_id = nebulaCourse._id;
        updates.course_metadata = {
          title: nebulaCourse.title,
          description: nebulaCourse.description,
          credit_hours: nebulaCourse.credit_hours,
          prerequisites: nebulaCourse.prerequisites
        };
      }

      if (semester) updates.semester = semester;
      if (professor) updates.professor_name = professor;

      const { error } = await supabase
        .from('resources')
        .update(updates)
        .eq('id', resourceId);

      return !error;
    } catch (error) {
      console.error('Error manually verifying syllabus:', error);
      return false;
    }
  }
};
