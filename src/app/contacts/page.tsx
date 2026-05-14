import AppLayout from '@/components/shared/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Building, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import ExportButton from './ExportButton';
import DeleteContactButton from './DeleteContactButton';
import { createClient } from '@/utils/supabase/server';

export default async function ContactsPage() {
  const supabase = await createClient();

  // Fetch contacts from Supabase
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching contacts:', error);
  }

  const displayContacts = contacts || [];
  return (
    <AppLayout>
      <div className="p-4 space-y-6 max-w-lg mx-auto">
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary">Your Contacts</h1>
            <ExportButton contacts={displayContacts} />
          </div>
          <p className="text-secondary-foreground text-sm">Manage your networks.</p>
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
            <p>No contacts found. Start scanning!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayContacts.map((contact) => (
              <Link href={`/contacts/${contact.id}`} key={contact.id} className="block">
                <Card className="cursor-pointer hover:border-magenta transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-card-fill flex items-center justify-center text-primary font-bold">
                        {contact.first_name?.[0] || ''}{contact.last_name?.[0] || ''}
                      </div>
                      <div>
                        <h3 className="font-semibold text-primary">
                          {contact.first_name} {contact.last_name}
                        </h3>
                        <div className="flex items-center text-xs text-secondary-foreground mt-1 space-x-2">
                          {contact.company && <span className="flex items-center"><Building className="w-3 h-3 mr-1" />{contact.company}</span>}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground mt-1 space-x-2">
                          {contact.conference_name && <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" />{contact.conference_name}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
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
        )}
      </div>
    </AppLayout>
  );
}
