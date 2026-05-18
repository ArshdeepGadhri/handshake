import AppLayout from '@/components/shared/AppLayout';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import ExportButton from './ExportButton';
import { createClient } from '@/utils/supabase/server';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import SearchInput from './SearchInput';
import FilterDropdowns from './FilterDropdowns';
import ContactCard from './ContactCard';
import { generateEmbedding } from '@/lib/embeddings';

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    company?: string;
    conference?: string;
    city?: string;
    tag?: string;
  }>;
}) {
  const { page: pageStr, q, company, conference, city, tag } = await searchParams;
  const page = parseInt(pageStr || '1', 10);
  const pageSize = 5;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  let displayContacts: any[] = [];
  let totalCount = 0;
  let error: any = null;

  // Hybrid Search Logic
  if (q || company || conference || city || tag) {
    let embedding = null;
    if (q) {
      try {
        embedding = await generateEmbedding(q);
      } catch (err) {
        console.error('Embedding error:', err);
      }
    }

    const { data, error: searchError } = await supabase.rpc('match_contacts', {
      query_embedding: embedding,
      match_threshold: 0.2,
      match_count: 50,
      company_filter: company || null,
      conference_filter: conference || null,
      city_filter: city || null,
      tag_filter: tag || null,
    });

    if (searchError) {
      error = searchError;
    } else {
      displayContacts = data || [];
      totalCount = displayContacts.length;
      displayContacts = displayContacts.slice(from, to + 1);
    }
  } else {
    // Regular listing
    const { data, error: fetchError, count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    displayContacts = data || [];
    totalCount = count || 0;
    error = fetchError;
  }

  // Fetch unique companies for filtering
  const { data: companiesData } = await supabase
    .from('contacts')
    .select('company')
    .not('company', 'is', null)
    .order('company');
  const companies = Array.from(new Set(companiesData?.map(c => c.company) || []));

  // Fetch unique conferences for filtering
  const { data: conferencesData } = await supabase
    .from('contacts')
    .select('conference_name')
    .not('conference_name', 'is', null)
    .order('conference_name');
  const conferences = Array.from(new Set(conferencesData?.map(c => c.conference_name) || []));

  // Fetch unique tags for filtering
  const { data: tagsData } = await supabase
    .from('contacts')
    .select('tags')
    .not('tags', 'is', null);
  const tags = Array.from(new Set(tagsData?.flatMap(c => c.tags || []) || [])).sort();

  if (error) {
    console.error('Error fetching contacts:', error);
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <AppLayout>
      <div className="p-4 space-y-6 max-w-lg mx-auto pb-24">
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-primary">Your Contacts</h1>
            <ExportButton contacts={displayContacts} />
          </div>
          <p className="text-secondary-foreground text-sm">
            Manage your networks ({totalCount} total).
          </p>
        </div>

        <SearchInput />

        <FilterDropdowns
          companies={companies}
          conferences={conferences}
          tags={tags}
        />



        {displayContacts.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <p>{page > 1 ? "No more contacts on this page." : "No contacts found. Start scanning!"}</p>
            {page > 1 && (
              <Link href="/contacts?page=1" className={cn(buttonVariants({ variant: "outline" }), "mt-4")}>
                Go back to page 1
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {displayContacts.map((contact) => (
                <ContactCard key={contact.id} contact={contact} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <Link
                  href={{
                    pathname: '/contacts',
                    query: { page: page - 1, q, company, conference, city, tag }
                  }}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "flex items-center gap-1",
                    page <= 1 && "pointer-events-none opacity-50"
                  )}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Link>

                <span className="text-sm font-medium text-muted-foreground">
                  Page {page} of {totalPages}
                </span>

                <Link
                  href={{
                    pathname: '/contacts',
                    query: { page: page + 1, q, company, conference, city, tag }
                  }}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "flex items-center gap-1",
                    page >= totalPages && "pointer-events-none opacity-50"
                  )}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
