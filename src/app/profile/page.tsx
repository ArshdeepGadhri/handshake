import AppLayout from '@/components/shared/AppLayout';
import { createClient } from '@/utils/supabase/server';
import { Button } from '@/components/ui/button';
import { LogOut, User, Mail, CreditCard, ChevronRight, Upload } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { logOut } from '@/app/actions/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ShareCardButton from './ShareCardButton';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const userInitial = user.email ? user.email[0].toUpperCase() : 'U';

  return (
    <AppLayout>
      <div className="p-4 space-y-6 max-w-lg mx-auto">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold text-primary">Your Profile</h1>
          <p className="text-secondary-foreground text-sm">Manage your account and digital card.</p>
        </div>

        {/* Digital Card Preview (if exists) */}
        {profile?.business_card_url && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">Your Digital Card</p>
            <Card className="overflow-hidden bg-surface-tinted/30 border-magenta/20 mx-auto">
              <CardContent className="p-2 flex justify-center">
                <div className="relative aspect-[3/2] w-full max-w-sm">
                  <Image
                    src={profile.business_card_url}
                    alt="Your business card"
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Share Action */}
        <div className="px-2">
          <ShareCardButton
            businessCardUrl={profile?.business_card_url}
            userEmail={user.email}
          />
        </div>

        {/* Menu Options */}
        <div className="space-y-3">
          <Link href="/profile/digital-card" className="block">
            <Card className="hover:border-magenta transition-colors cursor-pointer group">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-tinted flex items-center justify-center text-magenta">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-primary">Digital Business Card</p>
                    <p className="text-xs text-muted-foreground">Upload and manage your own card</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-magenta transition-colors" />
              </CardContent>
            </Card>
          </Link>

          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-0">
              <form action={logOut}>
                <button
                  type="submit"
                  className="w-full flex items-center justify-between p-4 text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-primary">Logout</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
