/**
 * Nebula API - Comprehensive Course & Context Data
 * Vercel Serverless Function
 * 
 * Provides rich UTD data for AI RAG context:
 * - Course catalog with grades, sections, professors
 * - Professor info and teaching history
 * - Section data with enrollment trends
 * - Grade distributions and difficulty metrics
 * - Real-time classroom events and schedules
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const NEBULA_API_URL = 'https://api.utdnebula.com';

interface NebulaCourse {
  _id: string;
  course_number: string;
  subject_prefix: string;
  title: string;
  description: string;
  credit_hours: string;
  class_level: string;
  activity_type: string;
  grading: string;
  internal_course_number: string;
  prerequisites?: {
    [key: string]: any;
  };
  corequisites?: {
    [key: string]: any;
  };
  lecture_contact_hours: string;
  laboratory_contact_hours: string;
  offering_frequency: string;
}

interface Professor {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_uri: string;
  office: {
    building: string;
    room: string;
  };
  titles: string[];
}

interface Section {
  _id: string;
  section_number: string;
  course_reference: string;
  section_corequisites: any[];
  academic_session: {
    name: string;
    start_date: string;
    end_date: string;
  };
  professors: string[];
  teaching_assistants: any[];
  internal_class_number: string;
  instruction_mode: string;
  meetings: Array<{
    start_date: string;
    end_date: string;
    meeting_days: string[];
    start_time: string;
    end_time: string;
    modality: string;
    location: {
      building: string;
      room: string;
    };
  }>;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, query } = req;

  // Only allow GET and POST
  if (method !== 'GET' && method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.NEBULA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Nebula API key not configured' });
  }

  try {
    const action = query.action as string;

    // === COURSE SEARCH ===
    if (action === 'search' || !action) {
      const searchQuery = query.q as string || '';
      const courseNumber = query.course as string;
      const professor = query.professor as string;

      let url = `${NEBULA_API_URL}/course`;
      const params = new URLSearchParams();
      
      if (courseNumber) params.append('course_number', courseNumber);
      if (searchQuery) params.append('title', searchQuery);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, {
        headers: { 'x-api-key': apiKey, 'Accept': 'application/json' }
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: 'Nebula API error' });
      }

      const data = await response.json();
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
      return res.status(200).json(data);
    }

    // === PROFESSOR INFO ===
    if (action === 'professor') {
      const profId = query.id as string;
      const name = query.name as string;

      let url = `${NEBULA_API_URL}/professor`;
      if (profId) {
        url += `/${profId}`;
      } else if (name) {
        url += `?name=${encodeURIComponent(name)}`;
      }

      const response = await fetch(url, {
        headers: { 'x-api-key': apiKey, 'Accept': 'application/json' }
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: 'Professor not found' });
      }

      const data = await response.json();
      return res.status(200).json(data);
    }

    // === GRADE DISTRIBUTIONS ===
    if (action === 'grades') {
      const courseId = query.course_id as string;
      const profId = query.professor_id as string;

      if (!courseId && !profId) {
        return res.status(400).json({ error: 'course_id or professor_id required' });
      }

      let url = `${NEBULA_API_URL}/`;
      if (courseId) {
        url += `course/${courseId}/grades`;
      } else {
        url += `professor/${profId}/grades`;
      }

      const response = await fetch(url, {
        headers: { 'x-api-key': apiKey, 'Accept': 'application/json' }
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: 'Grades not found' });
      }

      const data = await response.json();
      return res.status(200).json(data);
    }

    // === SECTIONS (with schedules) ===
    if (action === 'sections') {
      const courseId = query.course_id as string;
      const profId = query.professor_id as string;

      if (!courseId && !profId) {
        return res.status(400).json({ error: 'course_id or professor_id required' });
      }

      let url = `${NEBULA_API_URL}/`;
      if (courseId) {
        url += `course/${courseId}/sections`;
      } else {
        url += `professor/${profId}/sections`;
      }

      const response = await fetch(url, {
        headers: { 'x-api-key': apiKey, 'Accept': 'application/json' }
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: 'Sections not found' });
      }

      const data = await response.json();
      return res.status(200).json(data);
    }

    // === SYNC TO SUPABASE (for RAG context) ===
    if (action === 'sync') {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: 'Supabase not configured' });
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // Fetch all courses
      const coursesRes = await fetch(`${NEBULA_API_URL}/course/all`, {
        headers: { 'x-api-key': apiKey, 'Accept': 'application/json' }
      });

      if (!coursesRes.ok) {
        return res.status(coursesRes.status).json({ error: 'Failed to fetch courses' });
      }

      const coursesData = await coursesRes.json();
      const courses = coursesData.data || [];

      // Store in Supabase
      const stored: string[] = [];
      for (const course of courses.slice(0, 100)) { // Batch process
        const { error } = await supabase.from('course_catalog').upsert({
          course_number: course.course_number,
          subject_prefix: course.subject_prefix,
          course_title: course.title,
          description: course.description,
          credit_hours: parseInt(course.credit_hours) || 3,
          prerequisites: course.prerequisites ? JSON.stringify(course.prerequisites) : null,
          corequisites: course.corequisites ? JSON.stringify(course.corequisites) : null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'course_number'
        });

        if (!error) stored.push(course.course_number);
      }

      return res.status(200).json({
        message: 'Sync completed',
        synced: stored.length,
        courses: stored
      });
    }

    // === ENHANCED CONTEXT (for AI) ===
    if (action === 'context') {
      const courseNumbers = (query.courses as string || '').split(',').filter(Boolean);
      
      if (!courseNumbers.length) {
        return res.status(400).json({ error: 'courses parameter required' });
      }

      const enrichedData = [];

      for (const courseNum of courseNumbers) {
        // Get course details
        const courseRes = await fetch(`${NEBULA_API_URL}/course?course_number=${courseNum}`, {
          headers: { 'x-api-key': apiKey, 'Accept': 'application/json' }
        });

        if (!courseRes.ok) continue;

        const courseData = await courseRes.json();
        const courses = courseData.data || [];
        if (!courses.length) continue;

        const course = courses[0];

        // Get grades
        const gradesRes = await fetch(`${NEBULA_API_URL}/course/${course._id}/grades`, {
          headers: { 'x-api-key': apiKey, 'Accept': 'application/json' }
        });

        let grades = null;
        if (gradesRes.ok) {
          const gradesData = await gradesRes.json();
          grades = gradesData.data;
        }

        enrichedData.push({
          course,
          grades,
          difficulty: calculateDifficulty(grades),
        });
      }

      return res.status(200).json({
        courses: enrichedData,
        context_summary: generateContextSummary(enrichedData)
      });
    }

    return res.status(400).json({ error: 'Invalid action. Use: search, professor, grades, sections, sync, context' });

  } catch (error: any) {
    console.error('Nebula API error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch from Nebula' });
  }
}

function calculateDifficulty(grades: any): string {
  if (!grades || !grades.length) return 'Unknown';
  
  const avgGPA = grades.reduce((sum: number, g: any) => 
    sum + (g.grade_distribution?.gpa || 0), 0) / grades.length;
  
  if (avgGPA >= 3.5) return 'Easy';
  if (avgGPA >= 3.0) return 'Moderate';
  if (avgGPA >= 2.5) return 'Challenging';
  return 'Very Difficult';
}

function generateContextSummary(data: any[]): string {
  return data.map(item => {
    const c = item.course;
    return `${c.course_number}: ${c.title} (${item.difficulty}) - ${c.description}`;
  }).join('\n');
}

