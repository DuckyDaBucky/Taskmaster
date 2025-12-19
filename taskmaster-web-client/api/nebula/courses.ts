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

type Nullable<T> = T | null;

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
  grades: Nullable<NebulaGrade[]>;
  difficulty: string;
};

type NebulaListResponse<T> = {
  data?: T[];
};

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type ActionContext = {
  req: VercelRequest;
  res: VercelResponse;
  apiKey: string;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isAllowedMethod(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.NEBULA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Nebula API key not configured' });
  }

  const action = normalizeAction(req.query.action);

  const handlers: Record<NebulaQueryAction, (ctx: ActionContext) => Promise<void>> = {
    search: handleSearch,
    professor: handleProfessor,
    grades: handleGrades,
    sections: handleSections,
    sync: handleSync,
    context: handleContext,
  };

  const handlerFn = handlers[action];
  if (!handlerFn) {
    return res.status(400).json({ error: 'Invalid action. Use: search, professor, grades, sections, sync, context' });
  }

  try {
    await handlerFn({ req, res, apiKey });
  } catch (error: unknown) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Failed to fetch from Nebula';
    console.error('Nebula API error:', error);
    return res.status(status).json({ error: message });
  }
}

function isAllowedMethod(method: string | undefined): method is 'GET' | 'POST' {
  return method === 'GET' || method === 'POST';
}

function normalizeAction(actionParam: unknown): NebulaQueryAction {
  if (Array.isArray(actionParam)) {
    return normalizeAction(actionParam[0]);
  }

  if (!actionParam) return 'search';

  const value = String(actionParam).toLowerCase();
  return (['search', 'professor', 'grades', 'sections', 'sync', 'context'].includes(value)
    ? (value as NebulaQueryAction)
    : 'search');
}

function getQueryString(query: VercelRequest['query'], key: string): string {
  const raw = query[key];
  if (Array.isArray(raw)) return raw[0] || '';
  return typeof raw === 'string' ? raw : '';
}

function nebulaHeaders(apiKey: string) {
  return { 'x-api-key': apiKey, Accept: 'application/json' };
}

async function nebulaGet<T>(path: string, apiKey: string): Promise<T> {
  const url = path.startsWith('http') ? path : `${NEBULA_API_URL}${path}`;
  const response = await fetch(url, { headers: nebulaHeaders(apiKey) });

  if (!response.ok) {
    throw new HttpError(response.status, `Nebula API error (${response.status})`);
  }

  return response.json() as Promise<T>;
}

async function handleSearch({ req, res, apiKey }: ActionContext): Promise<void> {
  const searchQuery = getQueryString(req.query, 'q');
  const courseNumber = getQueryString(req.query, 'course');
  const professorName = getQueryString(req.query, 'professor');

  const params = new URLSearchParams();
  if (courseNumber) params.append('course_number', courseNumber);
  if (searchQuery) params.append('title', searchQuery);
  if (professorName) params.append('professor', professorName);

  const url = `/course${params.toString() ? `?${params.toString()}` : ''}`;
  const data = await nebulaGet<unknown>(url, apiKey);

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.status(200).json(data);
}

async function handleProfessor({ req, res, apiKey }: ActionContext): Promise<void> {
  const profId = getQueryString(req.query, 'id');
  const name = getQueryString(req.query, 'name');

  let url = '/professor';
  if (profId) {
    url += `/${encodeURIComponent(profId)}`;
  } else if (name) {
    url += `?name=${encodeURIComponent(name)}`;
  }

  const data = await nebulaGet<unknown>(url, apiKey);
  res.status(200).json(data);
}

async function handleGrades({ req, res, apiKey }: ActionContext): Promise<void> {
  const courseId = getQueryString(req.query, 'course_id');
  const profId = getQueryString(req.query, 'professor_id');

  if (!courseId && !profId) {
    throw new HttpError(400, 'course_id or professor_id required');
  }

  const url = courseId ? `/course/${courseId}/grades` : `/professor/${profId}/grades`;
  const data = await nebulaGet<unknown>(url, apiKey);

  res.status(200).json(data);
}

async function handleSections({ req, res, apiKey }: ActionContext): Promise<void> {
  const courseId = getQueryString(req.query, 'course_id');
  const profId = getQueryString(req.query, 'professor_id');

  if (!courseId && !profId) {
    throw new HttpError(400, 'course_id or professor_id required');
  }

  const url = courseId ? `/course/${courseId}/sections` : `/professor/${profId}/sections`;
  const data = await nebulaGet<unknown>(url, apiKey);

  res.status(200).json(data);
}

async function handleSync({ req, res, apiKey }: ActionContext): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new HttpError(500, 'Supabase not configured');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const coursesData = await nebulaGet<NebulaListResponse<NebulaCourse>>('/course/all', apiKey);
  const courses = coursesData.data || [];
  const limit = clamp(parseQueryInt(req.query, 'limit', 100), 1, 500);

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

  res.status(200).json({
    message: 'Sync completed',
    synced: stored.length,
    courses: stored
  });
}

async function handleContext({ req, res, apiKey }: ActionContext): Promise<void> {
  const courseNumbers = getQueryString(req.query, 'courses')
    .split(',')
    .map(course => course.trim())
    .filter(Boolean);

  if (!courseNumbers.length) {
    throw new HttpError(400, 'courses parameter required');
  }

  const enrichedData: NebulaContextCourse[] = await Promise.all(
    courseNumbers.map(async courseNum => {
      const course = await bestEffortFirst<NebulaCourse>(() =>
        nebulaGet<NebulaListResponse<NebulaCourse>>(
          `/course?course_number=${encodeURIComponent(courseNum)}`,
          apiKey
        )
      );

      if (!course) {
        return null;
      }

      const grades = await bestEffortList<NebulaGrade>(() =>
        nebulaGet<NebulaListResponse<NebulaGrade>>(
          `/course/${course._id}/grades`,
          apiKey
        )
      );

      return {
        course,
        grades: grades ?? null,
        difficulty: calculateDifficulty(grades ?? null),
      };
    })
  ).then(results => results.filter(Boolean) as NebulaContextCourse[]);

  res.status(200).json({
    courses: enrichedData,
    context_summary: generateContextSummary(enrichedData)
  });
}

function calculateDifficulty(grades: Nullable<NebulaGrade[]>): string {
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

async function bestEffortFirst<T>(fn: () => Promise<NebulaListResponse<T>>): Promise<Nullable<T>> {
  try {
    const response = await fn();
    return response.data?.[0] ?? null;
  } catch {
    return null;
  }
}

async function bestEffortList<T>(fn: () => Promise<NebulaListResponse<T>>): Promise<Nullable<T[]>> {
  try {
    const response = await fn();
    return response.data ?? null;
  } catch {
    return null;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function parseQueryInt(query: VercelRequest['query'], key: string, fallback: number): number {
  const value = Number.parseInt(getQueryString(query, key), 10);
  return Number.isNaN(value) ? fallback : value;
}
