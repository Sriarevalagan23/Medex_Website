'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/medex';
import { supabase } from '@/lib/supabase';
import { getReminders, Reminder } from '@/lib/reminders';
import { logInAppNotification } from '@/lib/notifications';

const tabs = [
  { href: '/home', label: 'Home', icon: 'home' },
  { href: '/reports', label: 'Reports', icon: 'page' },
  { href: '/ai-chat', label: 'AI Chat', icon: 'mic' },
  { href: '/health-trends', label: 'Predict', icon: 'heart' },
];

function TabGlyph({ name, className }: { name: string; className?: string }) {
  const common = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, className };

  if (name === 'home') {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M6.5 9.5V21h11V9.5" />
        <path d="M10 21v-6h4v6" />
      </svg>
    );
  }

  if (name === 'page') {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M7 3.5h7l5 5V20a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5Z" />
        <path d="M14 3.5V9h5" />
        <path d="M9 13h6M9 16h6" />
      </svg>
    );
  }

  if (name === 'mic') {
    return (
      <svg {...common} aria-hidden="true">
        <rect x="9" y="4" width="6" height="10" rx="3" />
        <path d="M6.5 11a5.5 5.5 0 0 0 11 0" />
        <path d="M12 15.5V20" />
        <path d="M9 20h6" />
      </svg>
    );
  }

  return (
    <svg {...common} aria-hidden="true">
      <path d="M12 21s-7-4.4-9.2-8.6A5.2 5.2 0 0 1 12 6.8a5.2 5.2 0 0 1 9.2 5.6C19 16.6 12 21 12 21Z" />
    </svg>
  );
}

function isProtectedPath(pathname: string) {
  return pathname !== '/login' && pathname !== '/register' && pathname !== '/forgot-password' && pathname !== '/';
}

export function WebShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(isProtectedPath(pathname));
  const [profileName, setProfileName] = useState('...');
  const [todaysTip, setTodaysTip] = useState<{
    title?: string;
    tip?: string;
    emoji?: string;
    category?: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    async function checkSession() {
      if (!isProtectedPath(pathname)) {
        setCheckingAuth(false);
        return;
      }
      try {
        const { data } = await supabase.auth.getSession();
        if (!active) return;
        if (!data.session) {
          router.replace('/login');
          return;
        }
      } catch {
        if (!active) return;
      }
      setCheckingAuth(false);
    }
    checkSession();
    return () => {
      active = false;
    };
  }, [pathname, router]);

  useEffect(() => {
    let active = true;
    async function fetchTip() {
      try {
        if (pathname !== '/home') return;

        const todayStr = new Date().toISOString().split('T')[0];
        const cachedDate = typeof window !== 'undefined' ? window.localStorage.getItem('health_tip_cache_date') : null;
        const cachedTipStr = typeof window !== 'undefined' ? window.localStorage.getItem('health_tip_cached_data') : null;

        if (cachedDate === todayStr && cachedTipStr) {
          if (active) setTodaysTip(JSON.parse(cachedTipStr));
          return;
        }

        const { data: dbTips, error } = await supabase
          .from('health_tips')
          .select('title, tip, emoji, category')
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (dbTips && dbTips.length > 0) {
          const now = new Date();
          const localTimeMs = now.getTime() - now.getTimezoneOffset() * 60 * 1000;
          const daysSinceEpoch = Math.floor(localTimeMs / (24 * 60 * 60 * 1000));
          const tipIndex = daysSinceEpoch % dbTips.length;
          const selectedTip = dbTips[tipIndex];

          if (typeof window !== 'undefined') {
            window.localStorage.setItem('health_tip_cache_date', todayStr);
            window.localStorage.setItem('health_tip_cached_data', JSON.stringify(selectedTip));
          }

          if (active) setTodaysTip(selectedTip as any);
        }
      } catch (err) {
        // swallow error and keep default content
        // eslint-disable-next-line no-console
        console.error('Error loading health tip:', err);
      }
    }

    fetchTip();
    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    let active = true;

    async function loadProfileName() {
      if (pathname !== '/home') {
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !active) return;

        const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        if (!active) return;

        setProfileName(data?.full_name || '...');
      } catch {
        if (active) setProfileName('...');
      }
    }

    loadProfileName();
    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    let timerId: NodeJS.Timeout;
    const notifiedKeys = new Set<string>();

    async function checkReminders() {
      let allowed = true;
      try {
        const saved = window.localStorage.getItem('medex_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.notifs === false || parsed.reminders === false) {
            allowed = false;
          }
        }
      } catch (e) {
        // ignore
      }

      if (!allowed || typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !active) return;

        const reminderList = await getReminders(user.id);
        if (!active) return;

        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentDayName = now.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = now.toDateString();

        reminderList.forEach((reminder) => {
          if (!reminder.active) return;

          if (reminder.frequency.startsWith('Weekly')) {
            const matchDays = reminder.frequency.match(/\((.+)\)/);
            if (matchDays) {
              const days = matchDays[1].split(', ').map(d => d.trim());
              if (!days.includes(currentDayName)) {
                return;
              }
            }
          }

          let parsedTimes: Record<string, string> = {};
          try {
            parsedTimes = typeof reminder.time === 'string' ? JSON.parse(reminder.time) : reminder.time;
          } catch {
            parsedTimes = { Morning: reminder.time || '08:00 AM' };
          }

          Object.entries(parsedTimes).forEach(([slot, timeStr]) => {
            const match = timeStr.trim().match(/^(\d+):(\d+)\s+(AM|PM)$/i);
            if (!match) return;

            let hr = parseInt(match[1], 10);
            const min = parseInt(match[2], 10);
            const period = match[3].toUpperCase();

            if (period === 'PM' && hr !== 12) {
              hr += 12;
            } else if (period === 'AM' && hr === 12) {
              hr = 0;
            }

            if (currentHours === hr && currentMinutes === min) {
              const key = `${reminder.id}-${slot}-${dateStr}`;
              if (!notifiedKeys.has(key)) {
                notifiedKeys.add(key);
                new Notification(`Medicine Reminder: ${reminder.name}`, {
                  body: `Time to take your ${reminder.dosage} (${reminder.mealTime}).`,
                  icon: '/medex_logo.png',
                });
                logInAppNotification(
                  `Medicine Reminder: ${reminder.name}`,
                  `Time to take your ${reminder.dosage} (${reminder.mealTime}).`,
                  'reminder'
                );
              }
            }
          });
        });
      } catch (err) {
        console.error('Error checking reminders:', err);
      }
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      checkReminders();
      timerId = setInterval(checkReminders, 20000);
    }

    return () => {
      active = false;
      if (timerId) clearInterval(timerId);
    };
  }, []);

  const activeTab = useMemo(() => tabs.find((tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`)), [pathname]);
  const isChat = pathname === '/ai-chat' || pathname === '/voice-chat';

  if (checkingAuth && isProtectedPath(pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="rounded-3xl border border-[#e5e7eb] bg-white px-5 py-4 text-sm font-semibold text-[#374151] shadow-lg">Loading Medex…</div>
      </div>
    );
  }

  if (!isProtectedPath(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className={cn("medex-shell flex min-h-screen flex-col bg-white text-[#1f2937]", isChat ? "overflow-hidden" : "")}>
      <header className={cn('sticky top-0 z-40 w-full border-b border-[#f1f1f1] bg-white', pathname === '/home' ? '' : 'hidden md:block')}>
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/home" className="inline-flex items-center gap-3">
              <Image src="/medex_logo.png" alt="Medex" width={40} height={40} className="hidden h-10 w-10 rounded-[10px] object-cover md:block" priority />
              {pathname === '/home' ? <span className="text-lg font-extrabold tracking-tight text-[#151717] md:hidden">Hello, {profileName}</span> : null}
              <span className="hidden md:inline text-lg font-bold text-[#151717]">MEDEX</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {tabs.map((tab) => {
                if (tab.href === '/home') return null;
                const active = activeTab?.href === tab.href;
                return (
                  <Link key={tab.href} href={tab.href} className={cn('inline-flex items-center text-sm font-semibold transition', active ? 'text-[#151717]' : 'text-[#4b5563] hover:text-[#151717]')}>
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <input placeholder="Search" className="md:w-80 rounded-full border border-[#eef2e9] bg-white px-4 py-2 text-sm outline-none placeholder:text-[#9ca3af] shadow-sm" />
            </div>
            <Link
              href="/notifications"
              aria-label="Open notifications"
              className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#151717] shadow-sm ring-1 ring-[#e5e7eb] transition hover:scale-105 hover:bg-[#f8fafc]"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </Link>
            <Link
              href="/profile"
              aria-label="Open profile"
              className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#151717] shadow-sm ring-1 ring-[#e5e7eb] transition hover:scale-105 hover:bg-[#f8fafc]"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
                <path d="M20 21a8 8 0 0 0-16 0" />
                <circle cx="12" cy="8" r="3.5" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {!isChat && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#222222] bg-[#0f0f0f]/98 backdrop-blur md:hidden">
          <div className="mx-auto grid max-w-7xl grid-cols-4 gap-1 px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
            {tabs.map((tab) => {
              const active = activeTab?.href === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  style={{ color: '#fff' }}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-semibold transition',
                    active ? 'text-[#9fcc3b]' : 'text-white hover:bg-white/5 hover:text-white',
                  )}
                >
                  <span className="h-5 w-5 leading-none">
                    <TabGlyph name={tab.icon} className={cn('h-5 w-5', active ? 'text-[#9fcc3b]' : 'text-white')} />
                  </span>
                  <span className={cn('mt-1 truncate', active ? 'text-[#9fcc3b]' : 'text-white')}>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      <div className={cn(
        "mx-auto w-full max-w-7xl flex-1",
        isChat 
          ? "px-0 pt-0 pb-0 sm:px-6 lg:px-8" 
          : pathname === '/home'
            ? "px-2 pt-0 pb-0 sm:px-6 sm:pt-6 sm:pb-0 lg:px-8 md:pt-6 md:pb-0"
            : "px-2 pt-0 pb-24 sm:px-6 sm:pt-6 sm:pb-6 lg:px-8 md:pt-6 md:pb-6"
      )}>
        <main className={isChat ? "min-h-0" : "min-h-[70vh]"}>{children}</main>
      </div>
    </div>
  );
}