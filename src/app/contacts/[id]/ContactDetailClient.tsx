'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft, Building, Mail, MapPin, Phone, MessageSquare,
  Link as LinkIcon, Edit3, X, Save, Loader2, Copy, Check,
  Sparkles, StickyNote,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DeleteContactButton from '../DeleteContactButton';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Contact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  website: string | null;
  linkedin_url: string | null;
  conference_name: string | null;
  location: string | null;
  notes: string | null;
  where_met: string | null;
  talking_points: string | null;
  follow_up: string | null;
}

interface EmailResult {
  subject: string;
  body: string;
  to: string | null;
}

// ─── Email Modal ───────────────────────────────────────────────────────────────
function EmailModal({ result, onClose }: { result: EmailResult; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const fullEmail = `To: ${result.to ?? ''}\nSubject: ${result.subject}\n\n${result.body}`;

  const handleCopy = async () => {
    try {
      // Modern API — works on localhost and HTTPS
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullEmail);
      } else {
        // Fallback for non-HTTPS origins (e.g. local network IP)
        const el = document.createElement('textarea');
        el.value = fullEmail;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleMailto = () => {
    const mailto = `mailto:${result.to ?? ''}?subject=${encodeURIComponent(result.subject)}&body=${encodeURIComponent(result.body)}`;
    window.open(mailto, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-card rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col"
        style={{ maxHeight: '82vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-magenta" />
            <h2 className="font-bold text-lg text-primary">AI Follow-up Email</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-surface-tinted text-muted-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-2">
          <div className="bg-surface-tinted rounded-xl p-3 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Subject</p>
            <p className="font-semibold text-primary">{result.subject}</p>
          </div>
          <div className="bg-surface-tinted rounded-xl p-3 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Body</p>
            <p className="text-secondary-foreground text-sm leading-relaxed whitespace-pre-wrap">{result.body}</p>
          </div>
        </div>

        {/* Actions — pinned above nav bar */}
        <div className="flex gap-3 px-6 pt-3 pb-24 flex-shrink-0 border-t border-border">
          <Button
            onClick={handleCopy}
            variant="outline"
            className="flex-1 rounded-xl py-5"
          >
            {copied ? <Check className="mr-2 w-4 h-4" /> : <Copy className="mr-2 w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          {result.to && (
            <Button
              onClick={handleMailto}
              variant="accent"
              className="flex-1 rounded-xl py-5"
            >
              <Mail className="mr-2 w-4 h-4" />
              Open in Mail
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── Main Component ────────────────────────────────────────────────────────────
export default function ContactDetailClient({ contact: initialContact }: { contact: Contact }) {
  const router = useRouter();
  const [contact, setContact] = useState<Contact>(initialContact);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<Contact>(initialContact);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<EmailResult | null>(null);

  const timersRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  useEffect(() => {
    // Sync state if props change (e.g. after router.refresh())
    setContact(initialContact);
    setEditDraft(initialContact);
    setNotes({
      where_met: initialContact.where_met ?? '',
      talking_points: initialContact.talking_points ?? '',
      follow_up: initialContact.follow_up ?? '',
      notes: initialContact.notes ?? '',
    });
  }, [initialContact]);

  useEffect(() => {
    let isMounted = true;
    // Cleanup all pending timers on unmount
    return () => {
      isMounted = false;
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);


  // ─── Notes state (live-editable, not tied to edit mode) ───────────────────
  const [notes, setNotes] = useState({
    where_met: initialContact.where_met ?? '',
    talking_points: initialContact.talking_points ?? '',
    follow_up: initialContact.follow_up ?? '',
    notes: initialContact.notes ?? '',
  });
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  // ─── Edit handlers ────────────────────────────────────────────────────────
  const handleEditToggle = () => {
    setEditDraft(contact);
    setIsEditing(true);
    setSaveError('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSaveError('');
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    setSaveError('');
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDraft),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? 'Save failed');
      setContact(json.data);
      setIsEditing(false);
      router.refresh();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Notes save ───────────────────────────────────────────────────────────
  const handleSaveNotes = async () => {
    setNotesSaving(true);
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...notes }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? 'Save failed');
      setContact((prev) => ({ ...prev, ...notes }));
      setNotesSaved(true);
      if (timersRef.current.notes) clearTimeout(timersRef.current.notes);
      timersRef.current.notes = setTimeout(() => setNotesSaved(false), 2000);
    } catch (err) {
      console.error('Notes save error:', err);
    } finally {
      setNotesSaving(false);
    }
  };

  // ─── Generate email ───────────────────────────────────────────────────────
  const handleGenerateEmail = async () => {
    // Save latest notes first so the AI has current context
    await handleSaveNotes();
    setIsGeneratingEmail(true);
    try {
      const res = await fetch(`/api/contacts/${contact.id}/email`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? 'Generation failed');
      setEmailResult({ subject: json.subject, body: json.body, to: json.to });
    } catch (err) {
      console.error('Email generation error:', err);
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const displayName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unknown';
  const initials = `${contact.first_name?.[0] ?? ''}${contact.last_name?.[0] ?? ''}`;

  return (
    <>
      <div className="p-4 space-y-5 pb-28 max-w-lg mx-auto">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <Link href="/contacts" className="flex items-center text-secondary-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span>Back</span>
          </Link>
          {!isEditing ? (
            <div className="flex gap-2">
              <DeleteContactButton 
                contactId={contact.id} 
                contactName={`${contact.first_name} ${contact.last_name}`}
                variant="button"
                size="lg"
                className="px-4"
              />
              <Button
                onClick={handleEditToggle}
                variant="outline"
                size="lg"
                className="px-4"
              >
                <Edit3 className="w-4 h-4 mr-1" /> Edit
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleCancelEdit}
                variant="outline"
                className="border-border text-muted-foreground hover:bg-surface-tinted"
              >
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={isSaving}
                variant="accent"
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Save
              </Button>
            </div>
          )}
        </div>

        {saveError && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-2">{saveError}</p>
        )}

        {/* ── Profile Card ── */}
        <Card className="border-t-4 border-t-magenta shadow-card">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-card-fill flex items-center justify-center text-primary font-bold text-2xl mb-4 shadow-sm">
              {initials}
            </div>

            {isEditing ? (
              <div className="w-full space-y-3 text-left">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>First Name</Label>
                    <Input value={editDraft.first_name ?? ''} onChange={(e) => setEditDraft((p) => ({ ...p, first_name: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Last Name</Label>
                    <Input value={editDraft.last_name ?? ''} onChange={(e) => setEditDraft((p) => ({ ...p, last_name: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Job Title</Label>
                  <Input value={editDraft.job_title ?? ''} onChange={(e) => setEditDraft((p) => ({ ...p, job_title: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Company</Label>
                  <Input value={editDraft.company ?? ''} onChange={(e) => setEditDraft((p) => ({ ...p, company: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Conference / Event</Label>
                  <Input value={editDraft.conference_name ?? ''} onChange={(e) => setEditDraft((p) => ({ ...p, conference_name: e.target.value }))} />
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-primary">{displayName}</h1>
                <p className="text-secondary-foreground font-medium mt-1">
                  {contact.job_title}{contact.company && ` @ ${contact.company}`}
                </p>
                {contact.conference_name && (
                  <div className="flex items-center text-sm text-muted-foreground mt-2 bg-surface-tinted px-3 py-1 rounded-full">
                    <MapPin className="w-3 h-3 mr-1" />
                    {contact.conference_name}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Contact Info ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-primary">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input type="email" value={editDraft.email ?? ''} onChange={(e) => setEditDraft((p) => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input type="tel" value={editDraft.phone ?? ''} onChange={(e) => setEditDraft((p) => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Website</Label>
                  <Input type="url" value={editDraft.website ?? ''} onChange={(e) => setEditDraft((p) => ({ ...p, website: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>LinkedIn URL</Label>
                  <Input type="url" value={editDraft.linkedin_url ?? ''} onChange={(e) => setEditDraft((p) => ({ ...p, linkedin_url: e.target.value }))} />
                </div>
              </div>
            ) : (
              <>
                {contact.email && (
                  <div className="flex items-center space-x-3 text-secondary-foreground">
                    <Mail className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <a href={`mailto:${contact.email}`} className="hover:text-magenta transition-colors break-all">{contact.email}</a>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center space-x-3 text-secondary-foreground">
                    <Phone className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <a href={`tel:${contact.phone}`} className="hover:text-magenta transition-colors">{contact.phone}</a>
                  </div>
                )}
                {contact.website && (
                  <div className="flex items-center space-x-3 text-secondary-foreground">
                    <Building className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <a href={contact.website} target="_blank" rel="noreferrer" className="hover:text-magenta transition-colors break-all">{contact.website}</a>
                  </div>
                )}
                {contact.linkedin_url && (
                  <div className="flex items-center space-x-3 text-secondary-foreground">
                    <LinkIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <a href={contact.linkedin_url} target="_blank" rel="noreferrer" className="hover:text-magenta transition-colors">LinkedIn Profile</a>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Notes Section (always editable) ── */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-primary flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-magenta" />
                Meeting Notes
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Where did you meet?
              </Label>
              <Input
                placeholder="e.g. iORGANBIO Summit, networking dinner…"
                value={notes.where_met}
                onChange={(e) => setNotes((p) => ({ ...p, where_met: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                What did you talk about?
              </Label>
              <Textarea
                placeholder="e.g. organ-on-chip collaboration, their new product launch…"
                rows={3}
                value={notes.talking_points}
                onChange={(e) => setNotes((p) => ({ ...p, talking_points: e.target.value }))}
                className="resize-none bg-card"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Follow-up action
              </Label>
              <Input
                placeholder="e.g. Send them the white paper, schedule a call…"
                value={notes.follow_up}
                onChange={(e) => setNotes((p) => ({ ...p, follow_up: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Additional notes
              </Label>
              <Textarea
                placeholder="Anything else worth remembering…"
                rows={2}
                value={notes.notes}
                onChange={(e) => setNotes((p) => ({ ...p, notes: e.target.value }))}
                className="resize-none bg-card"
              />
            </div>

            <Button
              onClick={handleSaveNotes}
              disabled={notesSaving}
              variant="outline"
              className="w-full rounded-xl py-5"
            >
              {notesSaving ? (
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              ) : notesSaved ? (
                <Check className="mr-2 w-4 h-4 text-success" />
              ) : (
                <Save className="mr-2 w-4 h-4" />
              )}
              {notesSaving ? 'Saving…' : notesSaved ? 'Notes Saved!' : 'Save Notes'}
            </Button>
          </CardContent>
        </Card>

        {/* ── AI Email ── */}
        <Button
          onClick={handleGenerateEmail}
          disabled={isGeneratingEmail}
          className="w-full bg-primary hover:bg-dark-plum text-primary-foreground py-6 text-md rounded-xl shadow-sm transition-all"
        >
          {isGeneratingEmail ? (
            <Loader2 className="mr-2 w-5 h-5 animate-spin" />
          ) : (
            <Sparkles className="mr-2 w-5 h-5" />
          )}
          {isGeneratingEmail ? 'Generating…' : 'Generate Follow-up Email'}
        </Button>
      </div>

      {/* ── Email Modal ── */}
      {emailResult && (
        <EmailModal result={emailResult} onClose={() => setEmailResult(null)} />
      )}
    </>
  );
}
