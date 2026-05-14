import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { generateEmbedding } from '@/lib/embeddings';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const company = searchParams.get('company') || null;
    const conference = searchParams.get('conference') || null;
    const city = searchParams.get('city') || null;
    const tag = searchParams.get('tag') || null;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const threshold = parseFloat(searchParams.get('threshold') || '0.3');

    let embedding = null;
    if (query && query.trim().length > 0) {
      try {
        embedding = await generateEmbedding(query);
      } catch (err) {
        console.error('Search embedding error:', err);
      }
    }

    // Call the match_contacts RPC function
    const { data: contacts, error } = await supabase.rpc('match_contacts', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit,
      company_filter: company,
      conference_filter: conference,
      city_filter: city,
      tag_filter: tag,
    });

    if (error) {
      console.error('Search RPC error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: contacts });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
