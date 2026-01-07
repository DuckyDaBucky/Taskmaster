import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Gemini File Search API
 * POST /api/documents/file-search
 * 
 * Uploads documents to Gemini File Search store for RAG
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta';
const FILE_SEARCH_STORE_NAME = 'taskmaster-syllabi'; // Shared store for all users

export const maxDuration = 300; // 5 minutes for large files

/**
 * Get or create File Search store
 */
async function getOrCreateFileSearchStore(): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  try {
    // Try to get existing store
    const listResponse = await fetch(
      `${GEMINI_API_URL}/fileSearchStores?key=${GEMINI_API_KEY}`,
      { method: 'GET' }
    );

    if (listResponse.ok) {
      const data = await listResponse.json();
      const existingStore = data.fileSearchStores?.find(
        (store: any) => store.displayName === FILE_SEARCH_STORE_NAME
      );
      if (existingStore) {
        console.log(`[File Search] Using existing store: ${existingStore.name}`);
        return existingStore.name;
      }
    }

    // Create new store if not found
    const createResponse = await fetch(
      `${GEMINI_API_URL}/fileSearchStores?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: FILE_SEARCH_STORE_NAME,
        }),
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      let errorMessage = `Failed to create File Search store: ${createResponse.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage += ` - ${errorJson.error?.message || errorText}`;
      } catch {
        errorMessage += ` - ${errorText}`;
      }
      throw new Error(errorMessage);
    }

    const storeData = await createResponse.json();
    if (!storeData.name) {
      throw new Error('Store creation response missing name field');
    }
    console.log(`[File Search] ✓ Created store: ${storeData.name}`);
    return storeData.name;
  } catch (error: any) {
    console.error('[File Search] Error managing store:', error);
    throw error;
  }
}

/**
 * Upload file to Gemini File Search
 */
async function uploadToFileSearch(
  fileUrl: string,
  fileName: string,
  storeName: string,
  metadata?: any
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  try {
    // Fetch the file
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file: ${fileResponse.status}`);
    }

    const fileBuffer = await fileResponse.arrayBuffer();
    const fileBlob = new Blob([fileBuffer]);
    
    // Determine MIME type
    const urlLower = fileUrl.toLowerCase();
    let mimeType = 'application/pdf';
    if (urlLower.includes('.pdf')) mimeType = 'application/pdf';
    else if (urlLower.includes('.txt')) mimeType = 'text/plain';
    else if (urlLower.includes('.doc') || urlLower.includes('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (/\.(jpg|jpeg)/.test(urlLower)) mimeType = 'image/jpeg';
    else if (urlLower.includes('.png')) mimeType = 'image/png';

    // Prepare metadata
    const customMetadata: any[] = [];
    if (metadata) {
      if (metadata.course_number) {
        customMetadata.push({ key: 'course_number', stringValue: metadata.course_number });
      }
      if (metadata.course_name) {
        customMetadata.push({ key: 'course_name', stringValue: metadata.course_name });
      }
      if (metadata.professor) {
        customMetadata.push({ key: 'professor', stringValue: metadata.professor });
      }
      if (metadata.document_type) {
        customMetadata.push({ key: 'document_type', stringValue: metadata.document_type });
      }
    }

    // Use uploadToFileSearchStore API (direct upload + import in one call)
    // According to Gemini API, we need to send multipart/form-data with:
    // - file: the actual file
    // - config: JSON string with displayName and optional customMetadata
    
    const formData = new FormData();
    formData.append('file', fileBlob, fileName);
    
    const uploadConfig: any = {
      displayName: fileName,
    };
    
    if (customMetadata.length > 0) {
      uploadConfig.customMetadata = customMetadata;
    }
    
    // Add config as JSON string
    formData.append('config', JSON.stringify(uploadConfig));

    // Direct upload to File Search store
    // storeName format: "fileSearchStores/xxxxx" or just the ID
    const storePath = storeName.startsWith('fileSearchStores/') 
      ? storeName 
      : `fileSearchStores/${storeName}`;
    
    console.log(`[File Search] Uploading to store: ${storePath}`);
    
    const uploadResponse = await fetch(
      `${GEMINI_API_URL}/${storePath}:uploadToFileSearchStore?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      let errorMessage = `Failed to upload to File Search: ${uploadResponse.status}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage += ` - ${errorJson.error?.message || errorText}`;
      } catch {
        errorMessage += ` - ${errorText}`;
      }
      
      console.error(`[File Search] Upload error: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    const uploadData = await uploadResponse.json();
    const operationName = uploadData.name;

    if (!operationName) {
      console.error('[File Search] Upload response:', uploadData);
      throw new Error('Upload did not return operation name. Response: ' + JSON.stringify(uploadData));
    }

    console.log(`[File Search] Upload operation started: ${operationName}`);

    // Poll operation until complete
    let operation = uploadData;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (60 * 5 seconds)

    while (!operation.done && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      attempts++;
      
      try {
        const operationResponse = await fetch(
          `${GEMINI_API_URL}/${operationName}?key=${GEMINI_API_KEY}`,
          { method: 'GET' }
        );

        if (!operationResponse.ok) {
          const errorText = await operationResponse.text();
          console.warn(`[File Search] Operation check failed (attempt ${attempts}):`, errorText);
          // Continue polling unless it's a critical error
          if (operationResponse.status >= 500) {
            continue; // Retry on server errors
          }
        } else {
          operation = await operationResponse.json();
          
          // Check for operation errors
          if (operation.error) {
            throw new Error(`Operation failed: ${JSON.stringify(operation.error)}`);
          }
          
          // Log progress
          if (attempts % 6 === 0) { // Every 30 seconds
            console.log(`[File Search] Operation in progress (${attempts * 5}s elapsed)...`);
          }
        }
      } catch (pollError: any) {
        console.error(`[File Search] Error polling operation (attempt ${attempts}):`, pollError.message);
        // Continue polling unless we've hit max attempts
        if (attempts >= maxAttempts) {
          throw new Error(`Operation polling failed after ${maxAttempts} attempts: ${pollError.message}`);
        }
      }
    }

    if (!operation.done) {
      throw new Error(`File upload operation timed out after ${attempts * 5} seconds`);
    }

    // Check if operation was successful
    if (operation.error) {
      throw new Error(`File upload operation failed: ${JSON.stringify(operation.error)}`);
    }

    console.log(`[File Search] File uploaded and indexed successfully: ${fileName}`);
    return fileName;
  } catch (error: any) {
    console.error('[File Search] Upload error:', error);
    throw error;
  }
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

  const { resource_id, user_id, file_url, file_name, metadata } = body;

  if (!resource_id || !file_url) {
    return NextResponse.json({ error: 'resource_id and file_url required' }, { status: 400 });
  }

  try {
    // Get or create File Search store
    const storeName = await getOrCreateFileSearchStore();

    // Upload file to File Search
    const fileName = await uploadToFileSearch(file_url, file_name || 'syllabus', storeName, metadata);

    // Update resource with File Search info (merge with existing extracted_data)
    if (supabase) {
      // Get existing extracted_data first
      const { data: existingResource } = await supabase
        .from('resources')
        .select('extracted_data')
        .eq('id', resource_id)
        .single();

      await supabase
        .from('resources')
        .update({
          extracted_data: {
            ...(existingResource?.extracted_data || {}),
            ...(metadata || {}),
            file_search_store: storeName,
            file_search_file: fileName,
            file_search_indexed: true,
            file_search_indexed_at: new Date().toISOString(),
          }
        })
        .eq('id', resource_id);
    }

    return NextResponse.json({
      success: true,
      resource_id,
      store_name: storeName,
      file_name: fileName,
    });

  } catch (error: any) {
    console.error('File Search upload error:', error);
    return NextResponse.json({ 
      error: error.message || 'File Search upload failed' 
    }, { status: 500 });
  }
}
