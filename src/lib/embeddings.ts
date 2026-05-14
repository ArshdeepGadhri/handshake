import OpenAI from 'openai';

const openai = new OpenAI();

/**
 * Generates a 1536-dimensional embedding vector for the given text using OpenAI's text-embedding-3-small model.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Clean the text: remove extra newlines and trim
  const input = text.replace(/\n/g, ' ').trim();

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input,
      encoding_format: 'float',
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

/**
 * Combines contact fields into a single string for embedding.
 */
export function createContactSearchText(contact: {
  first_name?: string | null;
  last_name?: string | null;
  company?: string | null;
  job_title?: string | null;
  notes?: string | null;
  conference_name?: string | null;
  city?: string | null;
  tags?: string[] | null;
}): string {
  const parts = [
    contact.first_name,
    contact.last_name,
    contact.company,
    contact.job_title,
    contact.conference_name,
    contact.city,
    contact.notes,
    contact.tags?.join(', '),
  ].filter(Boolean);

  return parts.join(' ');
}
