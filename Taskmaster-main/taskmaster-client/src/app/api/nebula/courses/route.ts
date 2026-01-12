import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Nebula API - Comprehensive Course & Context Data
 * GET /api/nebula/courses?action=search|professor|grades|sections|sync|context
 * 
 * Provides rich UTD data for AI RAG context
 */

const NEBULA_API_URL = 'https://api.utdnebula.com';

type NebulaQueryAction =
  | 'search'
  | 'professor'
  | 'grades'
  | 'sections'
  | 'sync'
  | 'context';

type NebulaCourse = {
  _id: string;
  course_number: string;
  subject_prefix: string;
  title: string;
  description: string;
  credit_hours: string;
  prerequisites?: Record<string, unknown>;
  corequisites?: Record<string, unknown>;
};

type NebulaGrade = {
  grade_distribution?: {
    gpa?: number;
  };
};

type NebulaContextCourse = {
  course: NebulaCourse;
  grades: NebulaGrade[] | null;
  difficulty: string;
};

type NebulaListResponse<T> = {
  data?: T[];
};

function nebulaHeaders(apiKey: string) {
  return { 'x-api-key': apiKey, Accept: 'application/json' };
}

async function nebulaGet<T>(path: string, apiKey: string): Promise<T> {
  const url = path.startsWith('http') ? path : `${NEBULA_API_URL}${path}`;
  const response = await fetch(url, { headers: nebulaHeaders(apiKey) });

  if (!response.ok) {
    throw new Error(`Nebula API error (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.NEBULA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Nebula API key not configured' }, { status: 500 });
  }

  const searchParams = req.nextUrl.searchParams;
  const action = (searchParams.get('action') || 'search') as NebulaQueryAction;

  try {
    switch (action) {
      case 'search':
        return await handleSearch(searchParams, apiKey);
      case 'professor':
        return await handleProfessor(searchParams, apiKey);
      case 'grades':
        return await handleGrades(searchParams, apiKey);
      case 'sections':
        return await handleSections(searchParams, apiKey);
      case 'sync':
        return await handleSync(searchParams, apiKey);
      case 'context':
        return await handleContext(searchParams, apiKey);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Nebula API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch from Nebula' }, { status: 500 });
  }
}

async function handleSearch(params: URLSearchParams, apiKey: string) {
  const searchQuery = params.get('q') || '';
  const courseNumber = params.get('course') || '';
  const professorName = params.get('professor') || '';

  const queryParams = new URLSearchParams();
  if (courseNumber) queryParams.append('course_number', courseNumber);
  if (searchQuery) queryParams.append('title', searchQuery);
  if (professorName) queryParams.append('professor', professorName);

  const url = `/course${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const data = await nebulaGet<unknown>(url, apiKey);

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' },
  });
}

async function handleProfessor(params: URLSearchParams, apiKey: string) {
  const profId = params.get('id') || '';
  const name = params.get('name') || '';

  let url = '/professor';
  if (profId) {
    url += `/${encodeURIComponent(profId)}`;
  } else if (name) {
    url += `?name=${encodeURIComponent(name)}`;
  }

  const data = await nebulaGet<unknown>(url, apiKey);
  return NextResponse.json(data);
}

async function handleGrades(params: URLSearchParams, apiKey: string) {
  const courseId = params.get('course_id') || '';
  const profId = params.get('professor_id') || '';

  if (!courseId && !profId) {
    return NextResponse.json({ error: 'course_id or professor_id required' }, { status: 400 });
  }

  const url = courseId ? `/course/${courseId}/grades` : `/professor/${profId}/grades`;
  const data = await nebulaGet<unknown>(url, apiKey);

  return NextResponse.json(data);
}

async function handleSections(params: URLSearchParams, apiKey: string) {
  const courseId = params.get('course_id') || '';
  const profId = params.get('professor_id') || '';

  if (!courseId && !profId) {
    return NextResponse.json({ error: 'course_id or professor_id required' }, { status: 400 });
  }

  const url = courseId ? `/course/${courseId}/sections` : `/professor/${profId}/sections`;
  const data = await nebulaGet<unknown>(url, apiKey);

  return NextResponse.json(data);
}

async function handleSync(params: URLSearchParams, apiKey: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const limit = Math.min(Math.max(parseInt(params.get('limit') || '100', 10), 1), 500);

  const coursesData = await nebulaGet<NebulaListResponse<NebulaCourse>>('/course/all', apiKey);
  const courses = coursesData.data || [];

  const stored: string[] = [];
  for (const course of courses.slice(0, limit)) {
    const { error } = await supabase.from('course_catalog').upsert({
      course_number: course.course_number,
      subject_prefix: course.subject_prefix,
      course_title: course.title,
      description: course.description,
      credit_hours: parseInt(course.credit_hours, 10) || 3,
      prerequisites: course.prerequisites ? JSON.stringify(course.prerequisites) : null,
      corequisites: course.corequisites ? JSON.stringify(course.corequisites) : null,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'course_number'
    });

    if (!error) stored.push(course.course_number);
  }

  return NextResponse.json({
    message: 'Sync completed',
    synced: stored.length,
    courses: stored
  });
}

async function handleContext(params: URLSearchParams, apiKey: string) {
  const courseNumbers = (params.get('courses') || '')
    .split(',')
    .map(course => course.trim())
    .filter(Boolean);

  if (!courseNumbers.length) {
    return NextResponse.json({ error: 'courses parameter required' }, { status: 400 });
  }

  const enrichedData: NebulaContextCourse[] = [];

  for (const courseNum of courseNumbers) {
    try {
      const courseResponse = await nebulaGet<NebulaListResponse<NebulaCourse>>(
        `/course?course_number=${encodeURIComponent(courseNum)}`,
        apiKey
      );
      const course = courseResponse.data?.[0];
      if (!course) continue;

      let grades: NebulaGrade[] | null = null;
      try {
        const gradesResponse = await nebulaGet<NebulaListResponse<NebulaGrade>>(
          `/course/${course._id}/grades`,
          apiKey
        );
        grades = gradesResponse.data || null;
      } catch {
        // Grades not available
      }

      enrichedData.push({
        course,
        grades,
        difficulty: calculateDifficulty(grades),
      });
    } catch {
      // Course not found, skip
    }
  }

  return NextResponse.json({
    courses: enrichedData,
    context_summary: generateContextSummary(enrichedData)
  });
}

function calculateDifficulty(grades: NebulaGrade[] | null): string {
  if (!grades || !grades.length) return 'Unknown';

  const avgGPA = grades.reduce((sum, grade) => {
    return sum + (grade.grade_distribution?.gpa || 0);
  }, 0) / grades.length;

  if (avgGPA >= 3.5) return 'Easy';
  if (avgGPA >= 3.0) return 'Moderate';
  if (avgGPA >= 2.5) return 'Challenging';
  return 'Very Difficult';
}

function generateContextSummary(data: NebulaContextCourse[]): string {
  return data.map(item => {
    const course = item.course;
    return `${course.course_number}: ${course.title} (${item.difficulty}) - ${course.description}`;
  }).join('\n');
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
