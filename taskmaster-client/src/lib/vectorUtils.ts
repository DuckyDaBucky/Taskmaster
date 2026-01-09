/**
 * Vector Utilities for RAG Pipeline
 * Handles chunking, embedding generation, and vector storage
 */

// Azure config would go here if/when embedding model is added
// const AZURE_EMBEDDING_ENDPOINT = ...

/**
 * Chunk text into smaller pieces for embedding
 */
export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  if (text.length <= chunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    let chunk = text.slice(start, end);

    // Try to break at sentence boundaries
    if (end < text.length) {
      const lastPeriod = chunk.lastIndexOf('.');
      const lastNewline = chunk.lastIndexOf('\n');
      const breakPoint = Math.max(lastPeriod, lastNewline);

      if (breakPoint > chunkSize * 0.5) {
        chunk = chunk.slice(0, breakPoint + 1);
        start += breakPoint + 1;
      } else {
        start = end - overlap;
      }
    } else {
      start = end;
    }

    chunks.push(chunk.trim());
  }

  return chunks.filter(chunk => chunk.length > 0);
}

/**
 * Generate embedding using Azure OpenAI (TODO: Configure Azure Embedding Model)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Placeholder until Azure Embedding Model is deployed/configured
  console.warn('Azure OpenAI Embeddings not yet configured. Returning empty vector.');
  throw new Error('Embeddings not currently supported in Azure pipeline. Please deploy an embedding model (e.g., text-embedding-3-small) and update vectorUtils.ts');
}

/**
 * Generate embeddings for multiple chunks in batch
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  // Process in batches to avoid rate limits
  const batchSize = 5;
  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchEmbeddings = await Promise.all(
      batch.map(text => generateEmbedding(text))
    );
    embeddings.push(...batchEmbeddings);

    // Small delay between batches
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return embeddings;
}
