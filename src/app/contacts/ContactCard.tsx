'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Building, MapPin, Mail, Phone, ChevronRight } from 'lucide-react';
import DeleteContactButton from './DeleteContactButton';

interface Contact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  conference_name: string | null;
  city: string | null;
  tags: string[] | null;
}

export default function ContactCard({ contact }: { contact: Contact }) {
  const router = useRouter();

  const handleSubLink = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(href);
  };

  const initials = `${contact.first_name?.[0] || ''}${contact.last_name?.[0] || ''}`;

  return (
    <Link href={`/contacts/${contact.id}`} className="block group">
      <Card className="cursor-pointer hover:border-magenta transition-colors min-h-[100px]">
        <CardContent className="p-4 flex items-center h-full">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-full bg-card-fill flex-shrink-0 flex items-center justify-center text-primary font-bold text-lg group-hover:bg-magenta/10 group-hover:text-magenta transition-colors">
              {initials}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h3 className="font-semibold text-primary truncate leading-tight">
                {contact.first_name} {contact.last_name}
              </h3>
              <div className="space-y-0.5 mt-0.5">
                {contact.company && (
                  <button
                    onClick={(e) => handleSubLink(e, `/contacts?company=${encodeURIComponent(contact.company!)}`)}
                    className="flex items-center text-xs text-secondary-foreground font-medium truncate hover:text-magenta transition-colors text-left"
                  >
                    <Building className="w-3 h-3 mr-1.5 flex-shrink-0" />
                    <span className="truncate">{contact.company}</span>
                  </button>
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

              {(contact.conference_name || (contact.tags && contact.tags.length > 0)) && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {contact.conference_name && (
                    <button
                      onClick={(e) => handleSubLink(e, `/contacts?conference=${encodeURIComponent(contact.conference_name!)}`)}
                      className="flex items-center text-[9px] bg-surface-tinted text-primary px-1.5 py-0.5 rounded-full border border-border hover:border-magenta transition-colors"
                    >
                      <MapPin className="w-2.5 h-2.5 mr-1 flex-shrink-0" />
                      <span className="truncate max-w-[80px]">{contact.conference_name}</span>
                    </button>
                  )}
                  {contact.tags?.slice(0, 2).map((tag, i) => (
                    <button
                      key={i}
                      onClick={(e) => handleSubLink(e, `/contacts?tag=${encodeURIComponent(tag)}`)}
                      className="text-[9px] bg-magenta/10 text-magenta px-1.5 py-0.5 rounded-full font-bold uppercase hover:bg-magenta/20 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
            <DeleteContactButton 
              contactId={contact.id} 
              contactName={`${contact.first_name} ${contact.last_name}`} 
            />
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-magenta transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
