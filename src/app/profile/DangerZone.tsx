'use client';

import React, { useState } from 'react';
import { Trash2, UserX, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { deleteAllContactsAction, deleteAccountAction } from '@/app/actions/profile';

type ActionType = 'contacts' | 'account' | null;

export default function DangerZone() {
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [confirmText, setConfirmText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetAction = () => {
    setActiveAction(null);
    setConfirmText('');
    setError(null);
  };

  const handleDeleteAllContacts = async () => {
    if (confirmText.toLowerCase() !== 'delete') return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await deleteAllContactsAction();
      if (result.success) {
        resetAction();
      } else {
        setError(result.error || 'Failed to delete contacts');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText.toLowerCase() !== 'delete') return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await deleteAccountAction();
      if (result?.success === false) {
        setError(result.error || 'Failed to delete account');
      }
      // Redirect happens on server if successful
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-destructive/20 bg-destructive/5 mt-8">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-destructive flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        {!activeAction ? (
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-between text-destructive border-destructive/20 hover:bg-destructive/10"
              onClick={() => setActiveAction('contacts')}
            >
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                <span>Delete All Contacts</span>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between text-destructive border-destructive/20 hover:bg-destructive/10"
              onClick={() => setActiveAction('account')}
            >
              <div className="flex items-center gap-2">
                <UserX className="w-4 h-4" />
                <span>Delete Account</span>
              </div>
            </Button>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary">
                Are you absolutely sure? This action cannot be undone.
              </p>
              <p className="text-xs text-muted-foreground">
                Type <span className="font-bold text-destructive">delete</span> below to confirm.
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type 'delete' here"
                className="bg-card border-destructive/30 focus-visible:ring-destructive"
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={resetAction}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={confirmText.toLowerCase() !== 'delete' || isLoading}
                onClick={activeAction === 'contacts' ? handleDeleteAllContacts : handleDeleteAccount}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Confirm'
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
