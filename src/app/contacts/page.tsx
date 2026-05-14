import AppLayout from '@/components/shared/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Building, ChevronRight, Mail, Phone, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import ExportButton from './ExportButton';
import DeleteContactButton from './DeleteContactButton';
import { createClient } from '@/utils/supabase/server';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = parseInt(pageStr || '1', 10);
  const pageSize = 5;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();

  // Fetch contacts from Supabase with range and count
  const { data: contacts, error, count } = await supabase
    .from('contacts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Error fetching contacts:', error);
  }

  const displayContacts = contacts || [];
  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <AppLayout>
      <div className="p-4 space-y-6 max-w-lg mx-auto pb-24">
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary">Your Contacts</h1>
            <ExportButton contacts={displayContacts} />
          </div>
          <p className="text-secondary-foreground text-sm">
            Manage your networks ({totalCount} total).
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, company, or conference..."
            className="pl-9 bg-card"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <div className="px-3 py-1 bg-magenta text-primary-foreground text-xs font-semibold rounded-full whitespace-nowrap">
            All
          </div>
          <div className="px-3 py-1 bg-surface-tinted text-primary text-xs font-semibold rounded-full whitespace-nowrap border border-border">
            Needs Follow-up
          </div>
        </div>

        {displayContacts.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <p>{page > 1 ? "No more contacts on this page." : "No contacts found. Start scanning!"}</p>
            {page > 1 && (
              <Link href="/contacts?page=1" className="text-magenta mt-2 block">
                Go back to page 1
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {displayContacts.map((contact) => (
                <Link href={`/contacts/${contact.id}`} key={contact.id} className="block">
                  <Card className="cursor-pointer hover:border-magenta transition-colors h-[100px]">
                    <CardContent className="p-4 flex items-center h-full">
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <div className="w-14 h-14 rounded-full bg-card-fill flex-shrink-0 flex items-center justify-center text-primary font-bold text-lg">
                          {contact.first_name?.[0] || ''}{contact.last_name?.[0] || ''}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h3 className="font-bold text-primary truncate leading-tight">
                            {contact.first_name} {contact.last_name}
                          </h3>
                          <div className="space-y-0.5 mt-0.5">
                            {contact.company && (
                              <div className="flex items-center text-xs text-secondary-foreground font-medium truncate">
                                <Building className="w-3 h-3 mr-1.5 flex-shrink-0" />
                                <span className="truncate">{contact.company}</span>
                              </div>
                            )}
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                              {contact.email && (
                                <div className="flex items-center text-[10px] text-muted-foreground truncate">
                                  <Mail className="w-2.5 h-2.5 mr-1 flex-shrink-0" />
                                  <span className="truncate">{contact.email}</span>
                                </div>
                              )}
                              {contact.phone && (
                                <div className="flex items-center text-[10px] text-muted-foreground truncate">
                                  <Phone className="w-2.5 h-2.5 mr-1 flex-shrink-0" />
                                  <span className="truncate">{contact.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                        <DeleteContactButton 
                          contactId={contact.id} 
                          contactName={`${contact.first_name} ${contact.last_name}`} 
                        />
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <Link
                  href={`/contacts?page=${page - 1}`}
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
                  href={`/contacts?page=${page + 1}`}
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
