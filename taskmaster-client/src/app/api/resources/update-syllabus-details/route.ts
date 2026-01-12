import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

const normalize = (value: any) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return value;
};

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { resource_id, user_id, course_info, course_policies } = body || {};

  if (!resource_id || !user_id) {
    return NextResponse.json({ error: 'resource_id and user_id required' }, { status: 400 });
  }

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    const { data: resource, error } = await supabase
      .from('resources')
      .select('id, user_id, extracted_data')
      .eq('id', resource_id)
      .single();

    if (error || !resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    if (resource.user_id !== user_id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const existingData = resource.extracted_data || {};
    const existingCourseInfo = existingData.course_info || {};
    const existingPolicies = existingData.course_policies || {};

    const nextCourseInfo = { ...existingCourseInfo };
    Object.entries(course_info || {}).forEach(([key, value]) => {
      nextCourseInfo[key] = normalize(value);
    });

    const nextPolicies = { ...existingPolicies };
    Object.entries(course_policies || {}).forEach(([key, value]) => {
      nextPolicies[key] = normalize(value);
    });

    const nextData = {
      ...existingData,
      course_info: nextCourseInfo,
      course_policies: nextPolicies,
    };

    const { error: updateError } = await supabase
      .from('resources')
      .update({ extracted_data: nextData })
      .eq('id', resource_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, extracted_data: nextData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
  });
}
