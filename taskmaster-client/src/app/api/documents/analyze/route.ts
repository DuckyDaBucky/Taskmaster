import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { normalizeDueDate } from '../../../lib/dateUtils';

/**
 * Document Analysis API
 * POST /api/documents/analyze
 * 
 * Analyzes uploaded documents using Gemini's native document understanding.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export const maxDuration = 60;

/**
 * Analyze PDF document with Gemini
 */
async function analyzePdfWithGemini(fileUrl: string, fileName?: string): Promise<any> {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const base64Data = Buffer.from(buffer).toString('base64');

  const geminiResponse = await fetch(
    `${GEMINI_API_URL}/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: base64Data,
              },
            },
            {
              text: `Analyze this document and extract structured information.
Return a JSON object with these fields:
{
  "document_type": "syllabus|assignment|notes|exam|article|other",
  "course_number": "e.g., CS 101",
  "course_name": "e.g., Introduction to Computer Science",
  "professor": "instructor name if found",
  "summary": "2-3 sentence summary of main content",
  "key_topics": ["topic1", "topic2", ...],
  "due_dates": [{"date": "YYYY-MM-DD", "description": "what is due"}]
}
Only return valid JSON, no markdown.`,
            },
          ],
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  if (!geminiResponse.ok) {
    const errorText = await geminiResponse.text();
    throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
  }

  const data = await geminiResponse.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.warn('Could not parse PDF analysis JSON');
  }

  return { summary: text, document_type: 'unknown' };
}

/**
 * Analyze image with Gemini
 */
async function analyzeImageWithGemini(fileUrl: string, fileName?: string): Promise<any> {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const base64Data = Buffer.from(buffer).toString('base64');
  
  const contentType = response.headers.get('content-type') || 'image/jpeg';

  const geminiResponse = await fetch(
    `${GEMINI_API_URL}/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inlineData: {
                mimeType: contentType,
                data: base64Data,
              },
            },
            {
              text: `Analyze this image and describe its content. If it's a document, extract key information.
Return JSON: {"summary": "description", "document_type": "image|diagram|screenshot|document", "key_topics": []}`,
            },
          ],
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        },
      }),
    }
  );

  if (!geminiResponse.ok) {
    throw new Error(`Gemini image analysis error: ${geminiResponse.status}`);
  }

  const data = await geminiResponse.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.warn('Could not parse image analysis JSON');
  }

  return { summary: text, document_type: 'image' };
}

/**
 * Analyze text document with Gemini
 */
async function analyzeTextWithGemini(fileUrl: string, fileName?: string): Promise<any> {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch text file: ${response.status}`);
  }

  const text = await response.text();
  
  const geminiResponse = await fetch(
    `${GEMINI_API_URL}/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze this text document and extract structured information.

DOCUMENT CONTENT:
${text.substring(0, 30000)}

Return JSON: {"summary": "2-3 sentences", "document_type": "notes|article|other", "key_topics": []}`,
          }],
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        },
      }),
    }
  );

  if (!geminiResponse.ok) {
    throw new Error(`Gemini text analysis error: ${geminiResponse.status}`);
  }

  const data = await geminiResponse.json();
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.warn('Could not parse text analysis JSON');
  }

  return { summary: responseText, document_type: 'text' };
}

/**
 * Extract full text from document for chunking
 */
async function extractFullText(fileUrl: string, fileName?: string): Promise<string | null> {
  try {
    const urlLower = fileUrl.toLowerCase();
    const isPdf = urlLower.includes('.pdf');
    const isText = /\.(txt|md|csv)/.test(urlLower);

    if (isText) {
      const response = await fetch(fileUrl);
      if (response.ok) {
        return await response.text();
      }
    } else if (isPdf) {
      // For PDFs, use Gemini to extract full text
      const response = await fetch(fileUrl);
      if (!response.ok) return null;

      const buffer = await response.arrayBuffer();
      const base64Data = Buffer.from(buffer).toString('base64');

      const geminiResponse = await fetch(
        `${GEMINI_API_URL}/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  inlineData: {
                    mimeType: 'application/pdf',
                    data: base64Data,
                  },
                },
                {
                  text: 'Extract all text content from this document. Return only the raw text, no formatting, no JSON, just the text content.',
                },
              ],
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 8192,
            },
          }),
        }
      );

      if (geminiResponse.ok) {
        const data = await geminiResponse.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
      }
    }
  } catch (error) {
    console.error('Error extracting full text:', error);
  }

  return null;
}

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { resource_id, user_id, file_url, file_name } = body;

  if (!resource_id || !file_url) {
    return NextResponse.json({ error: 'resource_id and file_url required' }, { status: 400 });
  }

  let resource_id_final = resource_id; // Store for catch block

  try {
    // Update status to processing
    if (supabase) {
      await supabase
        .from('resources')
        .update({ processing_status: 'processing' })
        .eq('id', resource_id);
    }

    // Determine file type from URL
    const urlLower = file_url.toLowerCase();
    const isPdf = urlLower.includes('.pdf');
    const isImage = /\.(jpg|jpeg|png|gif|webp)/.test(urlLower);
    const isText = /\.(txt|md|csv)/.test(urlLower);

    let analysisResult: any = null;

    if (isPdf) {
      analysisResult = await analyzePdfWithGemini(file_url, file_name);
    } else if (isImage) {
      analysisResult = await analyzeImageWithGemini(file_url, file_name);
    } else if (isText) {
      analysisResult = await analyzeTextWithGemini(file_url, file_name);
    } else {
      try {
        analysisResult = await analyzePdfWithGemini(file_url, file_name);
      } catch {
        analysisResult = await analyzeTextWithGemini(file_url, file_name);
      }
    }

    // Update resource with extracted data
    let classId: string | null = null;
    if (supabase && analysisResult) {
      // Auto-create class if course_number is extracted and it's a syllabus
      if (analysisResult.document_type === 'syllabus' && analysisResult.course_number && user_id) {
        try {
          // Normalize course number (remove spaces, handle variations like "CS 3305" -> "CS3305")
          const normalizedCourseNumber = analysisResult.course_number.replace(/\s+/g, '').toUpperCase();
          
          // Check if class already exists for this course (more accurate matching)
          const { data: allClasses } = await supabase
            .from('classes')
            .select('id, name')
            .eq('user_id', user_id);

          // Try to find existing class by course number in name
          const existingClass = allClasses?.find(cls => {
            if (!cls.name) return false;
            const className = cls.name.toUpperCase().replace(/\s+/g, '');
            // Check if course number appears in class name
            return className.includes(normalizedCourseNumber) || 
                   className.startsWith(normalizedCourseNumber) ||
                   normalizedCourseNumber.includes(className.split(':')[0]?.replace(/\s+/g, '') || '');
          });

          if (existingClass) {
            classId = existingClass.id;
            console.log(`[Auto-Class] Found existing class "${existingClass.name}" (${classId}) for ${analysisResult.course_number}`);
          } else {
            // Create new class from extracted data
            const className = analysisResult.course_number 
              ? `${analysisResult.course_number}: ${analysisResult.course_name || 'Course'}`
              : analysisResult.course_name || 'New Class';

            const { data: newClass, error: classError } = await supabase
              .from('classes')
              .insert({
                user_id: user_id,
                name: className,
                professor: analysisResult.professor || null,
                description: analysisResult.summary || null,
                topics: Array.isArray(analysisResult.key_topics) ? analysisResult.key_topics : [],
                is_personal: false,
              })
              .select('id, name')
              .single();

            if (!classError && newClass) {
              classId = newClass.id;
              console.log(`[Auto-Class] ✓ Created class "${newClass.name}" (${classId}) for ${analysisResult.course_number}`);
            } else {
              console.error('[Auto-Class] ✗ Error creating class:', classError?.message || 'Unknown error');
            }
          }

          // Link resource to class
          if (classId) {
            const { error: linkError } = await supabase
              .from('resources')
              .update({ class_id: classId })
              .eq('id', resource_id);

            if (linkError) {
              console.error('[Auto-Class] ✗ Error linking resource to class:', linkError.message);
            } else {
              console.log(`[Auto-Class] ✓ Linked resource ${resource_id} to class ${classId}`);
            }
          }
        } catch (error: any) {
          console.error('[Auto-Class] ✗ Error in class creation:', error.message || error);
        }
      }

      // Update resource with extracted data
      await supabase
        .from('resources')
        .update({
          processing_status: 'complete',
          ai_summary: analysisResult.summary || null,
          extracted_data: {
            document_type: analysisResult.document_type,
            course_number: analysisResult.course_number,
            course_name: analysisResult.course_name,
            professor: analysisResult.professor,
            key_topics: analysisResult.key_topics,
            due_dates: analysisResult.due_dates,
            analyzed_at: new Date().toISOString(),
          },
        })
        .eq('id', resource_id);
    }

    // Create tasks from due dates (non-blocking)
    if (supabase && analysisResult?.due_dates && Array.isArray(analysisResult.due_dates) && user_id) {
      try {
        // Normalize and filter due dates
        const validDueDates = analysisResult.due_dates
          .map(normalizeDueDate)
          .filter((dd): dd is { date: string; description: string } => dd !== null);

        if (validDueDates.length === 0) {
          console.log('[Auto-Tasks] No valid due dates found in document');
        } else {
          console.log(`[Auto-Tasks] Processing ${validDueDates.length} due dates...`);

          const tasksToCreate = validDueDates.map((dd) => ({
            user_id: user_id,
            class_id: classId,
            title: dd.description.substring(0, 200), // Limit title length
            deadline: dd.date,
            status: 'pending' as const,
            completed: false,
            topic: analysisResult.course_number || null,
          }));

          // Check for existing tasks to avoid duplicates (more comprehensive check)
          const dateRange = tasksToCreate.map(t => t.deadline);
          const { data: existingTasks } = await supabase
            .from('tasks')
            .select('deadline, title, class_id')
            .eq('user_id', user_id)
            .in('deadline', dateRange);

          // Create a set of existing task keys (deadline + normalized title)
          const existingTaskKeys = new Set(
            (existingTasks || []).map(t => {
              const normalizedTitle = (t.title || '').toLowerCase().trim();
              return `${t.deadline}-${normalizedTitle}`;
            })
          );

          // Filter out duplicates
          const newTasks = tasksToCreate.filter(t => {
            const normalizedTitle = t.title.toLowerCase().trim();
            const key = `${t.deadline}-${normalizedTitle}`;
            return !existingTaskKeys.has(key);
          });

          if (newTasks.length > 0) {
            const { data: insertedTasks, error: taskError } = await supabase
              .from('tasks')
              .insert(newTasks)
              .select('id, title, deadline');

            if (!taskError && insertedTasks) {
              console.log(`[Auto-Tasks] ✓ Created ${insertedTasks.length} tasks from due dates:`);
              insertedTasks.forEach((task: any) => {
                console.log(`  - "${task.title}" (${task.deadline})`);
              });
            } else {
              console.error('[Auto-Tasks] ✗ Error creating tasks:', taskError?.message || 'Unknown error');
            }
          } else {
            console.log('[Auto-Tasks] All tasks already exist, skipping duplicate creation');
          }
        }
      } catch (error: any) {
        console.error('[Auto-Tasks] ✗ Error in task creation:', error.message || error);
        // Don't fail the whole process if task creation fails
      }
    }

    // Upload to Gemini File Search for RAG (non-blocking, only for syllabi)
    if (analysisResult?.document_type === 'syllabus' && supabase && user_id) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
      
      // Trigger File Search upload in background (don't await)
      fetch(`${appUrl}/api/documents/file-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource_id,
          user_id,
          file_url,
          file_name: file_name || 'syllabus',
          metadata: {
            document_type: analysisResult.document_type,
            course_number: analysisResult.course_number,
            course_name: analysisResult.course_name,
            professor: analysisResult.professor,
            title: file_name,
            user_id: user_id, // Add user_id to metadata for filtering
          },
        }),
      })
      .then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[File Search] Upload failed:', response.status, errorText);
        } else {
          const data = await response.json();
          console.log(`[File Search] ✓ Upload triggered for ${file_name || 'syllabus'}`);
        }
      })
      .catch(e => {
        console.error('[File Search] ✗ Failed to trigger upload:', e.message || e);
      });
    }

    return NextResponse.json({
      success: true,
      resource_id,
      analysis: analysisResult,
    });

  } catch (error: any) {
    console.error('Document analysis error:', error);

    if (supabase && resource_id_final) {
      await supabase
        .from('resources')
        .update({ processing_status: 'failed' })
        .eq('id', resource_id_final);
    }

    return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 });
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
