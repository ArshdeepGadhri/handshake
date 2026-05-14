'use client';

import React, { useState } from 'react';
import { Share2, Mail, MessageSquare, X, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ShareCardButtonProps {
  businessCardUrl?: string | null;
  userEmail?: string | null;
}

export default function ShareCardButton({ businessCardUrl, userEmail }: ShareCardButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!businessCardUrl) {
    return (
      <Link href="/profile/digital-card" className="block w-full">
        <Button variant="outline" className="w-full border-magenta text-magenta hover:bg-surface-tinted py-6 rounded-xl">
          <Share2 className="mr-2 w-5 h-5" />
          Upload Card to Share
        </Button>
      </Link>
    );
  }

  const shareText = `Hey! Here is my digital business card: ${businessCardUrl}`;
  const mailSubject = `Digital Business Card from ${userEmail?.split('@')[0] || 'me'}`;
  
  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);
      } else {
        // Fallback for non-secure contexts (e.g. local network IP)
        const el = document.createElement('textarea');
        el.value = shareText;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleEmail = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(shareText)}`;
  };

  const handleSMS = () => {
    window.location.href = `sms:?body=${encodeURIComponent(shareText)}`;
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="w-full bg-magenta hover:bg-orchid text-white py-6 text-lg rounded-xl shadow-md transition-all active:scale-95"
      >
        <Share2 className="mr-2 w-5 h-5" />
        Share My Card
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div 
            className="w-full max-w-lg bg-card rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col p-6 pb-12"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-6">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-primary">Share Your Card</h2>
              <button onClick={() => setIsOpen(false)} className="p-2 text-muted-foreground hover:text-primary transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Button 
                onClick={handleEmail}
                variant="outline"
                className="w-full py-8 text-lg flex flex-col h-auto gap-2 border-border hover:border-magenta hover:bg-surface-tinted"
              >
                <div className="w-10 h-10 rounded-full bg-magenta/10 flex items-center justify-center text-magenta">
                  <Mail className="w-6 h-6" />
                </div>
                <span>Send via Email</span>
              </Button>

              <Button 
                onClick={handleSMS}
                variant="outline"
                className="w-full py-8 text-lg flex flex-col h-auto gap-2 border-border hover:border-magenta hover:bg-surface-tinted"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <span>Send via Text</span>
              </Button>

              <Button 
                onClick={handleCopy}
                variant="outline"
                className="w-full py-8 text-lg flex flex-col h-auto gap-2 border-border hover:border-magenta hover:bg-surface-tinted"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${copied ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                  {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                </div>
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
