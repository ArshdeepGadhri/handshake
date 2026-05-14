'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
