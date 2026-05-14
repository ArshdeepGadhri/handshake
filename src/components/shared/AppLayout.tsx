'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home, ScanLine, Search, Settings, Users, LogOut } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { logOut } from '@/app/actions/auth';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [userInitial, setUserInitial] = useState('U');

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (isMounted && user?.email) {
          setUserInitial(user.email[0].toUpperCase());
        }
      } catch (error) {
        console.error('Error fetching user for layout:', error);
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  return (
    <div className="min-h-full flex flex-col bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-primary px-4 py-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/contacts">
            <Image
              src="/Iorganbio-logo_big.png"
              alt="iORGANBIO Handshake"
              width={150}
              height={36}
              priority
            />
          </Link>
        </div>
        <div className="flex items-center space-x-2 text-primary-foreground relative">
          <Link
            href="/profile"
            className="w-8 h-8 rounded-full bg-card-fill/20 border border-primary-foreground/20 flex items-center justify-center text-sm font-bold hover:bg-card-fill/30 transition-colors"
          >
            {userInitial}
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation for Mobile - Simplified to only Scan */}
      <nav className="fixed bottom-0 z-50 w-full border-t border-border bg-card pb-safe h-16 flex items-center justify-center">
        <Link href="/scan" className="flex items-center justify-center w-14 h-14 bg-magenta rounded-full shadow-lg text-primary-foreground hover:bg-orchid transition-colors -mt-10">
          <ScanLine className="w-7 h-7" />
        </Link>
      </nav>
    </div>
  );
}
