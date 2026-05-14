'use client';

import React, { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface DeleteContactButtonProps {
  contactId: string;
  contactName?: string;
  variant?: 'icon' | 'button';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  onDelete?: () => void;
}

export default function DeleteContactButton({
  contactId,
  contactName,
  variant = 'icon',
  size = 'default',
  className = '',
  onDelete
}: DeleteContactButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirming) {
      setConfirming(true);
      // Reset confirmation state after 3 seconds if not clicked again
      setTimeout(() => setConfirming(false), 3000);
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete contact');

      if (onDelete) {
        onDelete();
      } else {
        router.refresh();
        // If we are on the detail page, we should navigate back
        if (window.location.pathname.includes(`/contacts/${contactId}`)) {
          router.push('/contacts');
        }
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete contact. Please try again.');
      setConfirming(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (variant === 'button') {
    return (
      <Button
        onClick={handleDelete}
        disabled={isDeleting}
        size={size}
        variant={confirming ? 'destructive' : 'outline'}
        className={`transition-all duration-200 ${confirming ? 'bg-destructive text-white border-destructive' : 'text-destructive border-destructive hover:bg-destructive/10'} ${className}`}
      >
        {isDeleting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4 mr-2" />
        )}
        {isDeleting ? 'Deleting...' : confirming ? 'Confirm Delete?' : 'Delete Contact'}
      </Button>
    );
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={`p-2 transition-all duration-200 rounded-full flex items-center gap-1 ${
        confirming 
          ? 'bg-destructive text-white px-3' 
          : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
      } ${className}`}
      title={confirming ? "Click again to confirm delete" : "Delete contact"}
    >
      {isDeleting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
      {confirming && !isDeleting && <span className="text-xs font-bold whitespace-nowrap">Confirm?</span>}
    </button>
  );
}
