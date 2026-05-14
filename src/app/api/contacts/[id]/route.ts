import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// PATCH /api/contacts/[id] — update contact fields + notes
export async function PATCH(
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

    const body = await request.json();

    // Only allow updating safe fields — never user_id
    const {
      first_name,
      last_name,
      email,
      phone,
      company,
      job_title,
      website,
      linkedin_url,
      conference_name,
      location,
      notes,
      where_met,
      talking_points,
      follow_up,
    } = body;

    const { data, error } = await supabase
      .from('contacts')
      .update({
        first_name,
        last_name,
        email,
        phone,
        company,
        job_title,
        website,
        linkedin_url,
        conference_name,
        location,
        notes,
        where_met,
        talking_points,
        follow_up,
      })
      .eq('id', id)
      .eq('user_id', user.id) // ensures users can only edit their own contacts
      .select()
      .single();

    if (error) {
      console.error('[contacts/patch] Error:', error);
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[contacts/patch] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update contact.' },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts/[id] — delete contact
export async function DELETE(
  _request: Request,
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

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[contacts/delete] Error:', error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[contacts/delete] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete contact.' },
      { status: 500 }
    );
  }
}
