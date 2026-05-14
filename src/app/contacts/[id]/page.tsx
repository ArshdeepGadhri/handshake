import AppLayout from '@/components/shared/AppLayout';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import ContactDetailClient from './ContactDetailClient';

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: contact, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !contact) {
    return notFound();
  }

  return (
    <AppLayout>
      <ContactDetailClient contact={contact} />
    </AppLayout>
  );
}
