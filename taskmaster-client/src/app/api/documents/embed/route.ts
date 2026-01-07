import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { chunkText, generateEmbeddings } from '../../../lib/vectorUtils';

/**
 * Document Embedding API
 * POST /api/documents/embed
 * 
 * Chunks a document and stores embeddings in the syllabi Vector Bucket
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

const VECTOR_BUCKET_NAME = 'syllabi';
const VECTOR_INDEX_NAME = 'syllabus-index';
const EMBEDDING_DIMENSION = 768; // text-embedding-004 uses 768 dimensions

export const maxDuration = 300; // 5 minutes for large documents

export async function POST(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { resource_id, user_id, document_text, metadata } = body;

  if (!resource_id || !document_text) {
    return NextResponse.json({ error: 'resource_id and document_text required' }, { status: 400 });
  }

  try {
    // Ensure the vector index exists
    await ensureVectorIndex();

    // Chunk the document
    const chunks = chunkText(document_text, 1000, 200);
    console.log(`[Vector] Chunked document into ${chunks.length} pieces`);

    if (chunks.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No chunks to embed',
        chunks_count: 0 
      });
    }

    // Generate embeddings for all chunks
    console.log('[Vector] Generating embeddings...');
    const embeddings = await generateEmbeddings(chunks);
    console.log(`[Vector] Generated ${embeddings.length} embeddings`);

    // Prepare vectors for storage
    const vectors = chunks.map((chunk, index) => ({
      key: `${resource_id}-chunk-${index}`,
      data: {
        float32: embeddings[index],
      },
      metadata: {
        resource_id,
        user_id,
        chunk_index: index,
        chunk_count: chunks.length,
        ...metadata,
      },
    }));

    // Store vectors in the Vector Bucket
    // Note: Vector Buckets API might not be available in all Supabase SDK versions
    // This will gracefully fail if not available
    try {
      // Check if storage.vectors is available
      if (!supabase.storage.vectors) {
        throw new Error('Vector Buckets not available in this Supabase SDK version');
      }

      const index = supabase.storage.vectors
        .from(VECTOR_BUCKET_NAME)
        .index(VECTOR_INDEX_NAME);

      const { error: vectorError } = await index.putVectors({ vectors });

      if (vectorError) {
        console.error('[Vector] Error storing vectors:', vectorError);
        throw new Error(`Failed to store vectors: ${vectorError.message}`);
      }

      console.log(`[Vector] Successfully stored ${vectors.length} vectors`);
    } catch (vectorError: any) {
      console.warn('[Vector] Vector Buckets not available or error:', vectorError.message);
      // Store chunk metadata in database as fallback
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
            embedded: false,
            chunk_count: chunks.length,
            embedding_error: vectorError.message,
            chunks: chunks.map((chunk, idx) => ({
              index: idx,
              text: chunk.substring(0, 500), // Store first 500 chars of each chunk
            })),
          }
        })
        .eq('id', resource_id);
      
      // Don't throw - allow the system to work without vectors
      return NextResponse.json({
        success: true,
        resource_id,
        chunks_count: chunks.length,
        vectors_stored: 0,
        warning: 'Vector Buckets not available, chunks stored in database',
      });
    }

    // Update resource to mark as embedded
    // Get existing extracted_data first to preserve it
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
          embedded: true,
          chunk_count: chunks.length,
          embedded_at: new Date().toISOString(),
        }
      })
      .eq('id', resource_id);

    return NextResponse.json({
      success: true,
      resource_id,
      chunks_count: chunks.length,
      vectors_stored: vectors.length,
    });

  } catch (error: any) {
    console.error('Document embedding error:', error);
    return NextResponse.json({ 
      error: error.message || 'Embedding failed' 
    }, { status: 500 });
  }
}

/**
 * Ensure the vector index exists, create if it doesn't
 */
async function ensureVectorIndex() {
  if (!supabase) return;

  try {
    const bucket = supabase.storage.vectors.from(VECTOR_BUCKET_NAME);
    
    // Try to create the index (will fail if it already exists, which is fine)
    try {
      await bucket.createIndex(VECTOR_INDEX_NAME, {
        dimension: EMBEDDING_DIMENSION,
        distanceMetric: 'cosine',
      });
      console.log(`[Vector] Created index: ${VECTOR_INDEX_NAME}`);
    } catch (error: any) {
      // Index might already exist, which is fine
      if (!error.message?.includes('already exists')) {
        console.warn('[Vector] Index creation check:', error.message);
      }
    }
  } catch (error: any) {
    console.warn('[Vector] Could not ensure index exists:', error.message);
    // Continue anyway - index might already exist
  }
}
