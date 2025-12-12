/**
 * Nebula API - UTD Course Catalog Integration
 * GET /api/nebula/courses?query=CS3305
 * 
 * Searches UTD course catalog and stores in local DB for RAG context
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const NEBULA_API_KEY = process.env.NEBULA_API_KEY;
const NEBULA_BASE_URL = 'https://api.utdnebula.com/v1';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

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
    type?: string;
    required?: any;
    options?: any[];
  };
  corequisites?: any;
  sections?: any[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (!NEBULA_API_KEY) {
    return res.status(500).json({ error: 'NEBULA_API_KEY not configured' });
  }

  try {
    const { query, sync } = req.query;

    // If sync=true, fetch ALL courses and store in DB
    if (sync === 'true') {
      return await syncAllCourses(res);
    }

    // Otherwise search for specific course
    if (!query) {
      return res.status(400).json({ error: 'query parameter required' });
    }

    const courses = await searchNebulaAPI(query as string);
    
    // Store in local DB for future reference
    if (courses.length > 0) {
      await storeCourses(courses);
    }

    return res.status(200).json({ courses, count: courses.length });
  } catch (error: any) {
    console.error('Nebula API error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch courses' });
  }
}

async function searchNebulaAPI(query: string): Promise<NebulaCourse[]> {
  const url = `${NEBULA_BASE_URL}/course?course_number=${encodeURIComponent(query)}`;
  
  const response = await fetch(url, {
    headers: {
      'x-api-key': NEBULA_API_KEY!,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Nebula API returned ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data.data) ? data.data : [];
}

async function storeCourses(courses: NebulaCourse[]): Promise<void> {
  const courseRecords = courses.map(course => ({
    nebula_id: course._id,
    course_number: course.course_number,
    subject_prefix: course.subject_prefix,
    title: course.title,
    description: course.description,
    credit_hours: course.credit_hours,
    prerequisites: course.prerequisites || null,
    metadata: {
      class_level: course.class_level,
      activity_type: course.activity_type,
      grading: course.grading,
    },
  }));

  // Upsert into course_catalog table
  const { error } = await supabase
    .from('course_catalog')
    .upsert(courseRecords, { 
      onConflict: 'nebula_id',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error('Failed to store courses:', error);
  }
}

async function syncAllCourses(res: VercelResponse): Promise<VercelResponse> {
  // This would fetch ALL UTD courses - run once to populate DB
  // Can be paginated or done in batches
  
  const subjects = ['CS', 'SE', 'MATH', 'PHYS', 'CHEM', 'BIOL', 'HIST', 'ENGL', 'ECON'];
  let totalSynced = 0;

  for (const subject of subjects) {
    try {
      const courses = await searchNebulaAPI(subject);
      if (courses.length > 0) {
        await storeCourses(courses);
        totalSynced += courses.length;
      }
    } catch (error) {
      console.error(`Failed to sync ${subject}:`, error);
    }
  }

  return res.status(200).json({ 
    message: 'Sync complete', 
    synced: totalSynced 
  });
}
