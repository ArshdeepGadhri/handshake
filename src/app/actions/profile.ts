'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

/**
 * Deletes all contacts for the current user.
 */
export async function deleteAllContactsAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting contacts:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/contacts');
  return { success: true };
}

/**
 * Deletes the user's account and all associated data.
 */
export async function deleteAccountAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  // 1. Delete user data (contacts, etc.)
  // Note: Depending on your DB schema, you might have cascades set up.
  // But we'll be explicit here for contacts.
  await supabase
    .from('contacts')
    .delete()
    .eq('user_id', user.id);
  
  // 2. Delete profile
  await supabase
    .from('profiles')
    .delete()
    .eq('id', user.id);

  // 3. Delete auth user using admin client
  const adminClient = createAdminClient();
  const { error: adminError } = await adminClient.auth.admin.deleteUser(user.id);

  if (adminError) {
    console.error('Error deleting auth user:', adminError);
    return { success: false, error: adminError.message };
  }

  // 4. Redirect to login
  redirect('/login');
}
