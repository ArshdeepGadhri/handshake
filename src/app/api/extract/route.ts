import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import OpenAI from 'openai';
import { generateEmbedding, createContactSearchText } from '@/lib/embeddings';

const openai = new OpenAI();

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ── Read the image from the multipart form ──────────────────────────────
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json(
        { success: false, error: 'No image provided.' },
        { status: 400 }
      );
    }

    // ── TODO: Replace this block with a real OCR / Vision API call ──────────
    //
    //  Option A – OpenAI Vision (GPT-4o):
    const bytes = await imageFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = imageFile.type; // e.g. "image/jpeg"

    console.log('[extract] Received image:', imageFile.name, imageFile.type, imageFile.size, 'bytes');

    const chat = await openai.chat.completions.create({
      model: 'gpt-4o',
      // Forces the model to output raw JSON — no markdown fences
      response_format: { type: 'json_object' },
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
          {
            type: 'text',
            text: [
              'Extract all contact information visible on this business card or conference badge.',
              'Respond with ONLY a JSON object — no markdown, no code fences, no explanation.',
              'Use null for any field that is not present on the card.',
              'Required keys: first_name, last_name, email, phone, company, job_title, website, linkedin_url, city, tags',
              'For tags, provide an array of relevant industry or professional keywords found (e.g. ["Biotech", "Investor", "CEO"]).',
            ].join(' '),
          },
        ],
      }],
    });

    // Belt-and-suspenders: strip markdown fences in case the model ignores response_format
    const raw = (chat.choices[0].message.content ?? '{}').trim();
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const extracted = JSON.parse(cleaned);


    // ── Ensure the profile row exists (satisfies contacts → profiles FK) ──────
    // Uses the service-role (admin) client to bypass RLS on the profiles table.
    // This is a no-op if the profile already exists.
    const adminClient = createAdminClient();
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({ id: user.id, email: user.email }, { onConflict: 'id', ignoreDuplicates: true });

    if (profileError) {
      console.error('[extract] Profile upsert error:', profileError);
      return NextResponse.json(
        { success: false, error: 'Could not initialize user profile.' },
        { status: 500 }
      );
    }

    // ── Duplicate Detection & Merging ────────────────────────────────────────
    const { email, phone } = extracted;
    let existingContact = null;

    if (email || phone) {
      let query = supabase.from('contacts').select('*').eq('user_id', user.id);
      
      if (email && phone) {
        query = query.or(`email.eq.${email},phone.eq.${phone}`);
      } else if (email) {
        query = query.eq('email', email);
      } else {
        query = query.eq('phone', phone);
      }

      const { data: matches } = await query;
      if (matches && matches.length > 0) {
        existingContact = matches[0];
      }
    }

    let finalContact;

    if (existingContact) {
      console.log('[extract] Duplicate found, merging with existing contact:', existingContact.id);
      
      // Merge: only update null/empty fields
      const mergeData: any = {};
      for (const key in extracted) {
        if (!existingContact[key] && extracted[key]) {
          mergeData[key] = extracted[key];
        }
      }

      // Append notes if needed (optional logic)
      const newNote = `[Scanned again on ${new Date().toLocaleDateString()}]`;
      mergeData.notes = existingContact.notes 
        ? `${existingContact.notes}\n\n${newNote}` 
        : newNote;

      // Generate new embedding for the merged contact
      const combinedText = createContactSearchText({ ...existingContact, ...mergeData });
      mergeData.embedding = await generateEmbedding(combinedText);

      const { data, error } = await supabase
        .from('contacts')
        .update(mergeData)
        .eq('id', existingContact.id)
        .select()
        .single();

      if (error) throw error;
      finalContact = data;
    } else {
      // ── New Contact Creation ────────────────────────────────────────────────
      const contactData = { 
        user_id: user.id, 
        ...extracted,
        notes: `[Scanned on ${new Date().toLocaleDateString()}]`
      };
      
      // Generate embedding for new contact
      const combinedText = createContactSearchText(contactData);
      contactData.embedding = await generateEmbedding(combinedText);

      const { data, error } = await supabase
        .from('contacts')
        .insert([contactData])
        .select()
        .single();

      if (error) throw error;
      finalContact = data;
    }

    return NextResponse.json({ success: true, data: finalContact });
  } catch (error) {
    console.error('[extract] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to extract data from image.' },
      { status: 500 }
    );
  }
}
