// Mock Data interface (will match Supabase later)
export interface ContactExportData {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  notes: string | null;
  website: string | null;
  lifecycle_stage?: string;
  lead_source?: string;
}

export function generateHubSpotCSV(contacts: ContactExportData[]): string {
  // HubSpot Required/Recommended Headers
  const headers = [
    'First Name',
    'Last Name',
    'Email',
    'Phone Number',
    'Company Name',
    'Job Title',
    'Notes',
    'Website',
    'Lifecycle Stage',
    'Lead Source'
  ];

  const escapeCSV = (str: string | null | undefined) => {
    if (!str) return '';
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const rows = contacts.map(contact => [
    escapeCSV(contact.first_name),
    escapeCSV(contact.last_name),
    escapeCSV(contact.email),
    escapeCSV(contact.phone),
    escapeCSV(contact.company),
    escapeCSV(contact.job_title),
    escapeCSV(contact.notes),
    escapeCSV(contact.website),
    escapeCSV(contact.lifecycle_stage || 'Lead'), // Default to Lead
    escapeCSV(contact.lead_source || 'Conference') // Default to Conference
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

export function triggerDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
