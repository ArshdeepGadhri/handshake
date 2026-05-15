'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get('q') || '');

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set('q', value.trim());
    } else {
      params.delete('q');
    }
    params.set('page', '1');
    router.push(`/contacts?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="AI Search: 'investors from Boston'..."
          className="pl-9 pr-10 bg-card rounded-xl text-xs sm:text-base"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              setValue('');
              const params = new URLSearchParams(searchParams.toString());
              params.delete('q');
              router.push(`/contacts?${params.toString()}`);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-muted-foreground hover:text-primary" />
          </button>
        )}
      </div>
      <Button type="submit" variant="accent" size="icon" className="rounded-xl flex-shrink-0">
        <ArrowRight className="w-4 h-4" />
      </Button>
    </form>
  );
}
