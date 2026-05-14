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
      <div className="p-4 space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold text-primary">Your Profile</h1>
          <p className="text-secondary-foreground text-sm">Manage your account and digital card.</p>
        </div>

        {/* User Info Card */}
        <Card className="overflow-hidden">
          <div className="h-20 bg-magenta/10 w-full" />
          <CardContent className="pt-0 -mt-10 flex flex-col items-center text-center pb-6">
            <div className="w-20 h-20 rounded-full bg-card border-4 border-background flex items-center justify-center text-primary font-bold text-2xl mb-4 shadow-md">
              {userInitial}
            </div>
            <h2 className="text-xl font-bold text-primary">{user.email?.split('@')[0]}</h2>
            <p className="text-secondary-foreground text-sm flex items-center mt-1">
              <Mail className="w-3 h-3 mr-1" /> {user.email}
            </p>
          </CardContent>
        </Card>

        {/* Digital Card Preview (if exists) */}
        {profile?.business_card_url && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">Your Digital Card</p>
            <Card className="overflow-hidden bg-surface-tinted/30 border-magenta/20">
              <CardContent className="p-2">
                <div className="relative aspect-[3/2] w-full">
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
