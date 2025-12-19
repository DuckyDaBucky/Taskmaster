/**
 * Gemini File Upload API
 * POST /api/files/upload - Upload file to user's File Search Store
 * 
 * Handles document uploads with automatic indexing via Gemini File Search
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_UPLOAD_URL = 'https://generativelanguage.googleapis.com/upload/v1beta/files';

// Max file size: 20MB
const MAX_FILE_SIZE = 20 * 1024 * 1024;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }

  try {
    const { user_id, resource_id, file_url, file_name, class_id, document_type } = req.body;

    if (!user_id || !file_url) {
      return res.status(400).json({ error: 'user_id and file_url required' });
    }

    // 1. Get or create user's file search store
    const store = await getOrCreateStore(user_id);
    if (!store) {
      return res.status(500).json({ error: 'Failed to get/create file search store' });
    }

    // 2. Update resource status to processing
    if (supabase && resource_id) {
      await supabase
        .from('resources')
        .update({ processing_status: 'processing' })
        .eq('id', resource_id);
    }

    // 3. Fetch the file
    const fileResponse = await fetch(file_url);
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file: ${fileResponse.status}`);
    }

    const contentLength = fileResponse.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
      throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    const fileBuffer = await fileResponse.arrayBuffer();
    let mimeType = fileResponse.headers.get('content-type') || 'application/octet-stream';
    
    // Fix MIME type based on file extension
    const urlLower = file_url.toLowerCase();
    if (urlLower.endsWith('.pdf')) mimeType = 'application/pdf';
    else if (urlLower.endsWith('.txt') || urlLower.endsWith('.md')) mimeType = 'text/plain';
    else if (urlLower.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (urlLower.endsWith('.doc')) mimeType = 'application/msword';

    console.log(`Uploading to Gemini File Search: ${file_name || 'file'}, MIME: ${mimeType}, Size: ${fileBuffer.byteLength} bytes`);

    // 4. Upload file to Gemini
    const uploadResponse = await fetch(`${GEMINI_UPLOAD_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': mimeType,
        'X-Goog-Upload-Protocol': 'raw',
      },
      body: Buffer.from(fileBuffer),
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Gemini upload failed:', uploadResponse.status, errorText);
      throw new Error(`Gemini upload failed: ${uploadResponse.status}`);
    }

    const uploadData = await uploadResponse.json();
    const fileUri = uploadData.file?.uri;
    const fileName = uploadData.file?.name;

    if (!fileUri || !fileName) {
      throw new Error('No file URI returned from Gemini');
    }

    console.log('File uploaded to Gemini:', fileName);

    // 5. Add file to the File Search Store
    const addToStoreResponse = await fetch(
      `${GEMINI_BASE_URL}/${store.store_name}:addFiles?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: [fileName],
        }),
      }
    );

    if (!addToStoreResponse.ok) {
      const errorText = await addToStoreResponse.text();
      console.error('Failed to add file to store:', errorText);
      // Continue anyway - file is still in Gemini, just not in store
    }

    // 6. Extract summary and metadata using Gemini
    const summaryResponse = await fetch(
      `${GEMINI_BASE_URL}/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { file_data: { file_uri: fileUri, mime_type: mimeType } },
              { text: `Analyze this document and provide a JSON response with:
{
  "summary": "2-3 sentence summary",
  "document_type": "syllabus|assignment|notes|exam|project|other",
  "course_number": "e.g. CS3305 or null",
  "course_name": "full course name or null",
  "key_topics": ["topic1", "topic2"],
  "due_dates": ["YYYY-MM-DD descriptions"],
  "professor": "name or null"
}

Return ONLY valid JSON, no markdown.` }
            ]
          }],
          generationConfig: { 
            temperature: 0.1,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    let metadata: any = {};
    if (summaryResponse.ok) {
      const summaryData = await summaryResponse.json();
      const text = summaryData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      try {
        // Try to parse JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          metadata = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.warn('Could not parse metadata JSON:', e);
        metadata = { summary: text.slice(0, 500) };
      }
    }

    // 7. Save file reference in our database
    if (supabase) {
      await supabase.from('file_search_files').insert({
        user_id,
        resource_id,
        class_id,
        gemini_file_name: fileName,
        gemini_file_uri: fileUri,
        store_name: store.store_name,
        original_name: file_name,
        document_type: metadata.document_type || document_type || 'other',
        metadata,
      });

      // Update resource with extracted info
      if (resource_id) {
        await supabase
          .from('resources')
          .update({
            processing_status: 'completed',
            summary: metadata.summary,
            metadata: {
              gemini_file: fileName,
              course_number: metadata.course_number,
              course_name: metadata.course_name,
              key_topics: metadata.key_topics,
              due_dates: metadata.due_dates,
              professor: metadata.professor,
            },
          })
          .eq('id', resource_id);
      }
    }

    return res.status(200).json({
      success: true,
      gemini_file: fileName,
      gemini_uri: fileUri,
      store: store.store_name,
      metadata,
      message: 'File uploaded and indexed successfully',
    });

  } catch (error: any) {
    console.error('Upload error:', error);

    // Mark resource as failed
    if (supabase && req.body?.resource_id) {
      await supabase
        .from('resources')
        .update({ processing_status: 'failed' })
        .eq('id', req.body.resource_id);
    }

    return res.status(500).json({ error: error.message });
  }
}

/**
 * Get or create a File Search Store for the user
 */
async function getOrCreateStore(userId: string): Promise<{ store_name: string } | null> {
  if (!supabase) {
    console.error('Supabase not configured');
    return null;
  }

  // Check for existing store
  const { data: existing } = await supabase
    .from('file_search_stores')
    .select('store_name')
    .eq('user_id', userId)
    .single();

  if (existing?.store_name) {
    return existing;
  }

  // Create new store
  const displayName = `taskmaster_${userId.slice(0, 8)}`;
  
  const response = await fetch(
    `${GEMINI_BASE_URL}/fileSearchStores?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName }),
    }
  );

  if (!response.ok) {
    console.error('Failed to create store:', await response.text());
    return null;
  }

  const storeData = await response.json();

  // Save to database
  await supabase.from('file_search_stores').insert({
    user_id: userId,
    store_name: storeData.name,
    display_name: displayName,
    metadata: storeData,
  });

  return { store_name: storeData.name };
}
