import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import OpenAI from 'openai';

// Singleton OpenAI client to avoid recreating on every request
const openai = new OpenAI();

// POST /api/contacts/[id]/email — generate a follow-up email using GPT-4o
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the contact to get their name, company, and notes
    const { data: contact, error: fetchError } = await supabase
      .from('contacts')
      .select('first_name, last_name, email, company, job_title, notes, where_met, talking_points, follow_up')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !contact) {
      return NextResponse.json({ success: false, error: 'Contact not found.' }, { status: 404 });
    }

    // Get sender's name from their auth email (best-effort)
    const senderName = user.email?.split('@')[0] ?? 'a colleague';

    const contextParts: string[] = [];
    if (contact.where_met) contextParts.push(`We met at: ${contact.where_met}`);
    if (contact.talking_points) contextParts.push(`What we discussed: ${contact.talking_points}`);
    if (contact.follow_up) contextParts.push(`Follow-up actions: ${contact.follow_up}`);
    if (contact.notes) contextParts.push(`Additional notes: ${contact.notes}`);

    const context = contextParts.length > 0
      ? contextParts.join('\n')
      : 'We had a brief networking conversation.';

    const chat = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: [
            'You are a professional networking assistant.',
            'Write warm, concise, personalized follow-up emails from one professional to another.',
            'Keep it under 150 words. Sound genuine — not templated or salesy.',
            'Do NOT use placeholder brackets like [Your Name] — use the actual values provided.',
            'Do not use em dashes, no closing, no signature, no farewell line.'
          ].join(' '),
        },
        {
          role: 'user',
          content: [
            `Write a follow-up email from ${senderName} to ${contact.first_name} ${contact.last_name}`,
            contact.company ? `who works at ${contact.company} as ${contact.job_title ?? 'a professional'}` : '',
            `\n\nContext:\n${context}`,
            `\n\nReturn ONLY the email body (no subject line, no headers). Start with a greeting.`,
          ].join(' '),
        },
      ],
    });

    const emailBody = chat.choices[0].message.content?.trim() ?? '';

    // Auto-generate a subject line
    const subjectChat = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Generate a short, professional email subject line (max 8 words) for this follow-up email:\n\n${emailBody}\n\nReturn ONLY the subject line text, nothing else.`,
        },
      ],
    });

    const subject = subjectChat.choices[0].message.content?.trim().replace(/^["']|["']$/g, '') ?? 'Great connecting with you';

    return NextResponse.json({
      success: true,
      subject,
      body: emailBody,
      to: contact.email,
    });
  } catch (error) {
    console.error('[email-generate] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate email.' },
      { status: 500 }
    );
  }
}
