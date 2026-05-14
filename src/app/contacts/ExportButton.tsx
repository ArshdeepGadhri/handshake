'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { generateHubSpotCSV, triggerDownload } from '@/lib/export';

export default function ExportButton({ contacts }: { contacts: any[] }) {
  const handleExport = () => {
    const csvContent = generateHubSpotCSV(contacts);
    triggerDownload(csvContent, 'iorganbio_contacts.csv');
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="w-4 h-4 mr-2" />
      Export
    </Button>
  );
}
