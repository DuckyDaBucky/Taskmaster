import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Nebula API - UTD Course Catalog Search
 * GET /api/nebula/search?query=CS3305
 * 
 * Searches UTD course catalog and stores in local DB for RAG context
 */

const NEBULA_API_KEY = process.env.NEBULA_API_KEY;
const NEBULA_BASE_URL = 'https://api.utdnebula.com/v1';

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

export async function GET(req: NextRequest) {
  if (!NEBULA_API_KEY) {
    return NextResponse.json({ error: 'NEBULA_API_KEY not configured' }, { status: 500 });
  }

  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get('query');
  const sync = searchParams.get('sync');

  try {
    // If sync=true, fetch ALL courses and store in DB
    if (sync === 'true') {
      return await syncAllCourses();
    }

    // Otherwise search for specific course
    if (!query) {
      return NextResponse.json({ error: 'query parameter required' }, { status: 400 });
    }

    const courses = await searchNebulaAPI(query);
    
    // Store in local DB for future reference
    if (courses.length > 0) {
      await storeCourses(courses);
    }

    return NextResponse.json({ courses, count: courses.length });
  } catch (error: any) {
    console.error('Nebula API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch courses' }, { status: 500 });
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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) return;

  const supabase = createClient(supabaseUrl, supabaseKey);

  const courseRecords = courses.map(course => ({
    nebula_id: course._id,
    course_number: course.course_number,
    subject_prefix: course.subject_prefix,
    course_title: course.title,
    description: course.description,
    credit_hours: parseInt(course.credit_hours, 10) || 3,
    prerequisites: course.prerequisites ? JSON.stringify(course.prerequisites) : null,
    corequisites: course.corequisites ? JSON.stringify(course.corequisites) : null,
    updated_at: new Date().toISOString(),
  }));

  await supabase.from('course_catalog').upsert(courseRecords, {
    onConflict: 'course_number',
  });
}

async function syncAllCourses(): Promise<NextResponse> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch all courses from Nebula
  const response = await fetch(`${NEBULA_BASE_URL}/course`, {
    headers: {
      'x-api-key': NEBULA_API_KEY!,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Nebula API returned ${response.status}`);
  }

  const data = await response.json();
  const courses: NebulaCourse[] = Array.isArray(data.data) ? data.data : [];

  // Store in batches
  let synced = 0;
  const batchSize = 50;
  
  for (let i = 0; i < courses.length; i += batchSize) {
    const batch = courses.slice(i, i + batchSize).map(course => ({
      nebula_id: course._id,
      course_number: course.course_number,
      subject_prefix: course.subject_prefix,
      course_title: course.title,
      description: course.description,
      credit_hours: parseInt(course.credit_hours, 10) || 3,
      prerequisites: course.prerequisites ? JSON.stringify(course.prerequisites) : null,
      corequisites: course.corequisites ? JSON.stringify(course.corequisites) : null,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('course_catalog').upsert(batch, {
      onConflict: 'course_number',
    });

    if (!error) synced += batch.length;
  }

  return NextResponse.json({
    message: 'Sync completed',
    synced,
    total: courses.length,
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
