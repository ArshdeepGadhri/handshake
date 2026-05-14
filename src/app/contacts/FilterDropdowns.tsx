'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building, MapPin, Tag, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterDropdownsProps {
  companies: string[];
  conferences: string[];
  tags: string[];
}

export default function FilterDropdowns({ companies, conferences, tags }: FilterDropdownsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.set('page', '1');
    router.push(`/contacts?${params.toString()}`);
  };

  const FilterSelect = ({ 
    label, 
    value, 
    options, 
    icon: Icon, 
    paramKey 
  }: { 
    label: string, 
    value: string, 
    options: string[], 
    icon: any, 
    paramKey: string 
  }) => (
    <div className="relative flex-1 min-w-[120px]">
      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <select
        value={value || 'all'}
        onChange={(e) => handleFilterChange(paramKey, e.target.value)}
        className={cn(
          "w-full pl-8 pr-8 py-2 text-xs font-semibold rounded-xl appearance-none bg-surface-tinted border border-border focus:outline-none focus:ring-1 focus:ring-magenta transition-all cursor-pointer",
          value && value !== 'all' ? "text-magenta border-magenta bg-magenta/5" : "text-primary"
        )}
      >
        <option value="all">{label}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
        <ChevronDown className="w-3.5 h-3.5" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-wrap gap-2 w-full">
      <FilterSelect 
        label="All Events" 
        value={searchParams.get('conference') || ''} 
        options={conferences} 
        icon={MapPin} 
        paramKey="conference" 
      />
      <FilterSelect 
        label="All Companies" 
        value={searchParams.get('company') || ''} 
        options={companies} 
        icon={Building} 
        paramKey="company" 
      />
      <FilterSelect 
        label="All Tags" 
        value={searchParams.get('tag') || ''} 
        options={tags} 
        icon={Tag} 
        paramKey="tag" 
      />
    </div>
  );
}
