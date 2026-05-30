'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Badge, BtnPrimary, BtnSecondary, Card, Divider, InputField, Toggle, TopBar } from '@/components/ui/medex-ui';
import { MEDexLinks, cn } from '@/lib/medex';
import { supabase } from '@/lib/supabase';
import { createReminder, deleteReminder, getReminders, Reminder } from '@/lib/reminders';
import { getUserDocuments, saveUserDocument, uploadDocumentFile, UserDocument } from '@/lib/documents';
import { predictBP, predictDiabetes, predictHeart, savePredictionResult, PredictResponse } from '@/lib/predictions';

type Message = { from: 'user' | 'ai'; text: string };

type ProfileRecord = {
  full_name?: string;
  email?: string;
  dob?: string;
  blood_group?: string;
  phone?: string;
  height?: number | null;
  weight?: number | null;
  allergies?: string;
};

type RecognitionAlternative = { transcript: string };
type RecognitionResult = { isFinal?: boolean; 0: RecognitionAlternative };
type RecognitionEvent = { results: ArrayLike<RecognitionResult> };

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: RecognitionEvent) => void) | null;
  start: () => void;
  abort: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionCtor;
    SpeechRecognition?: SpeechRecognitionCtor;
  }
}

const REPORT_TYPES = [
  { key: 'Blood Test', label: 'Blood Test Reports', desc: 'CBC, lipid panel, glucose & more', icon: 'blood' },
  { key: 'General Medical', label: 'General Medical Reports', desc: 'Diagnostic tests, immunization records', icon: 'medical' },
  { key: 'ECG', label: 'ECG Reports', desc: 'Electrocardiogram & cardiac records', icon: 'ecg' },
  { key: 'X-ray / Scan', label: 'X-ray / Scan', desc: 'MRI, CT, X-ray & ultrasound reports', icon: 'scan' },
  { key: 'Prescription', label: 'Prescriptions', desc: 'Doctor-issued medication orders', icon: 'prescription' },
  { key: 'Other', label: 'Other Reports', desc: "Anything that doesn't fit above", icon: 'other' },
];

const healthActions = [
  { href: '/upload', title: 'Upload Reports', desc: 'Add medical documents', iconBg: '#E3F5C7', iconColor: '#5A8A2E', icon: 'upload' },
  { href: '/voice-chat', title: 'Talk to Medex', desc: 'AI health assistant', iconBg: '#E8F4FF', iconColor: '#2E6FAA', icon: 'mic' },
  { href: '/health-predict', title: 'Predict Health Risk', desc: 'Heart, BP and diabetes', iconBg: '#FFF3E3', iconColor: '#AA6A2E', icon: 'trend' },
  { href: '/medicine-reminder', title: 'Medicine Reminder', desc: 'Set daily reminders', iconBg: '#F3E3FF', iconColor: '#7A2EAA', icon: 'pill' },
];

function formatDate(raw?: string) {
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
}

function formatReminderField(value: unknown, fallback: string) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    const normalized = value
      .map((item) => (typeof item === 'string' || typeof item === 'number' ? String(item) : ''))
      .filter(Boolean);
    return normalized.length ? normalized.join(', ') : fallback;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, v]) => {
        if (typeof v === 'string' || typeof v === 'number') {
          return `${key}: ${v}`;
        }
        return key;
      })
      .filter(Boolean);
    return entries.length ? entries.join(' · ') : fallback;
  }
  return fallback;
}

async function safeGetUser() {
  try {
    return await supabase.auth.getUser();
  } catch {
    return { data: { user: null } } as const;
  }
}

async function safeGetSession() {
  try {
    return await supabase.auth.getSession();
  } catch {
    return { data: { session: null } } as const;
  }
}

function ActionGlyph({ name, className }: { name: string; className?: string }) {
  const common = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, className };

  if (name === 'upload') {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M12 16V6" />
        <path d="m8.5 9.5 3.5-3.5 3.5 3.5" />
        <path d="M5 16.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1.5" />
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

  if (name === 'trend') {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M4 17 9.5 11.5 13 15l7-7" />
        <path d="M15.5 8H20v4.5" />
      </svg>
    );
  }

  return (
    <svg {...common} aria-hidden="true">
      <rect x="8" y="4" width="8" height="4" rx="2" />
      <rect x="7" y="7" width="10" height="13" rx="3" />
      <path d="M10 12h4M10 15h4" />
    </svg>
  );
}

function ReportTypeGlyph({ name, className }: { name: string; className?: string }) {
  const common = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, className };

  if (name === 'blood') {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M12 3s4 4.8 4 8.2A4 4 0 1 1 8 11.2C8 7.8 12 3 12 3Z" />
        <path d="M12 8v8" />
        <path d="M8 12h8" />
      </svg>
    );
  }

  if (name === 'medical') {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M9.5 5.5h5A2.5 2.5 0 0 1 17 8v9A2.5 2.5 0 0 1 14.5 19.5h-5A2.5 2.5 0 0 1 7 17V8A2.5 2.5 0 0 1 9.5 5.5Z" />
        <path d="M10.5 5.5V4.25A1.25 1.25 0 0 1 11.75 3h.5A1.25 1.25 0 0 1 13.5 4.25V5.5" />
        <path d="M12 9v5M9.5 11.5h5" />
      </svg>
    );
  }

  if (name === 'ecg') {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M4 12h3l1.5-3 2 6 2-4 1.5 2H20" />
        <path d="M5 6h14M5 18h14" opacity="0.5" />
      </svg>
    );
  }

  if (name === 'scan') {
    return (
      <svg {...common} aria-hidden="true">
        <rect x="5" y="5" width="14" height="14" rx="2.5" />
        <path d="M9 5v14M15 5v14" />
      </svg>
    );
  }

  if (name === 'prescription') {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M7 5h10v14H7z" />
        <path d="M10 9h4M10 12h4M10 15h2.8" />
        <path d="M8.5 18.5 15.5 11.5" />
      </svg>
    );
  }

  return (
    <svg {...common} aria-hidden="true">
      <path d="M8 5h8v14H8z" />
      <path d="M9.5 8h5M9.5 11h5M9.5 14h5" />
    </svg>
  );
}

function parseClockToMinutes(raw: string): number | null {
  const match = raw.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();
  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
  const hour24 = (hour % 12) + (period === 'PM' ? 12 : 0);
  return hour24 * 60 + minute;
}

function extractClockTimes(value: unknown): string[] {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    // Handle serialized JSON payloads when reminders were saved as text.
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return extractClockTimes(JSON.parse(trimmed));
      } catch {
        // Fall through to regex extraction.
      }
    }

    const matches = trimmed.match(/\b\d{1,2}:\d{2}\s*(?:AM|PM)\b/gi);
    return matches ? matches.map((t) => t.toUpperCase()) : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => extractClockTimes(entry));
  }

  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap((entry) => extractClockTimes(entry));
  }

  return [];
}

function getNextUpcomingReminderTime(value: unknown, fallback = '8:00 AM'): string {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const uniqueTimes = Array.from(new Set(extractClockTimes(value)));
  if (!uniqueTimes.length) return `Tomorrow, ${fallback}`;

  const parsed = uniqueTimes
    .map((time) => ({ time, minutes: parseClockToMinutes(time) }))
    .filter((item): item is { time: string; minutes: number } => item.minutes !== null);

  if (!parsed.length) return `Tomorrow, ${fallback}`;

  let best = parsed[0];
  let bestDelta = ((best.minutes - nowMinutes) + 1440) % 1440;

  for (const candidate of parsed.slice(1)) {
    const delta = ((candidate.minutes - nowMinutes) + 1440) % 1440;
    if (delta < bestDelta) {
      best = candidate;
      bestDelta = delta;
    }
  }

  const dayLabel = best.minutes >= nowMinutes ? 'Today' : 'Tomorrow';
  return `${dayLabel}, ${best.time}`;
}



function shortCategory(category?: string) {
  if (!category) return 'Other';
  if (category.includes('Blood')) return 'Blood Test';
  if (category.includes('ECG')) return 'ECG';
  if (category.includes('Scan')) return 'X-ray / Scan';
  if (category.includes('Prescription')) return 'Prescription';
  if (category.includes('General')) return 'General Medical';
  return 'Other';
}

function ScreenPage() {
  const params = useParams<{ screen: string }>();
  const searchParams = useSearchParams();
  const screen = params.screen;

  if (screen === 'home') return <HomeScreen />;
  if (screen === 'reports') return <ReportsScreen />;
  if (screen === 'profile') return <ProfileScreen />;
  if (screen === 'ai-chat') return <ChatScreen mode="chat" />;
  if (screen === 'voice-chat') return <ChatScreen mode="voice" />;
  if (screen === 'health-trends') return <HealthPredictLanding />;
  if (screen === 'upload') return <UploadScreen />;
  if (screen === 'settings') return <SettingsScreen />;
  if (screen === 'about') return <AboutScreen />;
  if (screen === 'help') return <HelpScreen />;
  if (screen === 'edit-profile') return <EditProfileScreen />;
  if (screen === 'change-password') return <ChangePasswordScreen />;
  if (screen === 'medicine-reminder') return <MedicineReminderScreen />;
  if (screen === 'notifications') return <NotificationsScreen />;
  if (screen === 'search') return <SearchScreen />;
  if (screen === 'health-predict') return <HealthPredictLanding />;
  if (screen === 'predict-heart') return <PredictionScreen model="heart" />;
  if (screen === 'predict-diabetes') return <PredictionScreen model="diabetes" />;
  if (screen === 'predict-bp') return <PredictionScreen model="bp" />;
  if (screen === 'report-detail') return <ReportDetailScreen id={searchParams.get('id') || ''} />;
  if (screen === 'report-insight') return <ReportInsightScreen id={searchParams.get('id') || ''} />;
  if (screen === 'ocr-preview') return <OcrPreviewScreen />;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4 py-10">
      <Card className="w-full p-6 text-center">
        <h1 className="text-2xl font-black text-[#151717]">Screen not found</h1>
        <p className="mt-2 text-sm text-[#6b7280]">{screen}</p>
        <BtnPrimary href="/home" className="mt-6">Go home</BtnPrimary>
      </Card>
    </div>
  );
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-[#151717]">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-[#6b7280]">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

function PageShell({ title, children, onBack, rightLabel, onRight, hideMobileRightAction }: { title: string; children: React.ReactNode; onBack?: () => void; rightLabel?: string; onRight?: () => void; hideMobileRightAction?: boolean }) {
  const pathname = usePathname();
  function formatPath(p?: string) {
    if (!p) return title;
    if (p === '/') return 'Home';
    if (p === '/health-trends' || p === '/health-predict') return 'Predict Health Risk';
    const parts = p.split('/').filter(Boolean).map((seg) => decodeURIComponent(seg.replace(/-/g, ' ')));
    return parts.map((s) => s.split(' ').map((w) => w[0]?.toUpperCase() + w.slice(1)).join(' ')).join(' / ');
  }
  const pathLabel = formatPath(pathname) || title;
  return (
    <div className="mx-auto w-full max-w-6xl">
      <TopBar title={pathLabel} onBack={onBack} rightLabel={rightLabel} onRight={onRight} hideMobileRightAction={hideMobileRightAction} />
      <div className="px-2 py-5 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}

function HomeScreen() {
  const [profileName, setProfileName] = useState('...');
  const [docs, setDocs] = useState<UserDocument[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [todaysTip, setTodaysTip] = useState<{ title?: string; tip?: string; emoji?: string } | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) return;
      const [{ data: profile }, documents, reminderList] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        getUserDocuments(user.id),
        getReminders(user.id),
      ]);
      if (!active) return;
      setProfileName(profile?.full_name || 'User');
      setDocs(documents.slice(0, 3));
      setReminders(reminderList.slice(0, 3));
    }
    load();
    // read cached health tip (saved by WebShell) for mobile view
    try {
      if (typeof window !== 'undefined') {
        const cached = window.localStorage.getItem('health_tip_cached_data');
        if (cached) setTodaysTip(JSON.parse(cached));
      }
    } catch (e) {
      // ignore
    }
    return () => { active = false; };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-2 py-5 sm:px-6 lg:px-8">
      <div className="grid gap-4 grid-cols-1">
        <div className="hidden md:block">
          <h1 className="mt-0 text-3xl font-bold tracking-tight text-[#151717] sm:text-[2.15rem]">Hello, {profileName}</h1>
        </div>

        {/* Health tip big card */}
        <div className="rounded-[32px] bg-[#eaf6db] px-5 py-6 sm:px-6 sm:py-7 shadow-[0_10px_30px_rgba(17,24,39,0.06)]">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-white grid place-items-center text-2xl shadow-sm">
              <span className="text-[#5A8A2E]">{todaysTip?.emoji || '🍃'}</span>
            </div>
            <div className="text-[11px] font-bold tracking-[0.16em] text-[#6b7280] uppercase sm:text-xs sm:tracking-[0.18em]">TODAY'S HEALTH TIP</div>
          </div>

          <div className="mt-4">
            <h3 className="text-xl font-black leading-[1.12] text-[#151717] sm:text-2xl">{todaysTip?.title || 'Choose Whole Grains'}</h3>
            <p className="mt-3 max-w-2xl text-[13px] leading-7 text-[#4b5563] sm:text-sm sm:leading-8">{todaysTip?.tip || 'Whole grains contain fiber that may support heart and digestive health.'}</p>
          </div>

          <div className="mt-6 border-t border-[#e6f1de] pt-4 text-xs text-[#6b7280] sm:text-sm">
            <div>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          </div>
        </div>

        {/* Action tiles 2x2 */}
        <div className="grid grid-cols-2 gap-4">
          {healthActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-2xl bg-white p-4 shadow-md transition hover:shadow-lg flex flex-col min-h-[120px]"
            >
              <div className="h-10 w-10 rounded-lg grid place-items-center" style={{ background: action.iconBg, color: action.iconColor }}>
                <ActionGlyph name={action.icon} className="h-5 w-5" />
              </div>
              <div className="mt-3 text-sm font-bold text-[#151717] sm:text-base">{action.title}</div>
              <div className="mt-1 text-xs leading-5 text-[#4b5563] sm:text-sm sm:leading-6">{action.desc}</div>
            </Link>
          ))}
        </div>

        </div>

      <div className="mt-6 w-full bg-transparent">
        <div className="mx-auto w-full max-w-6xl px-0 py-6">
          <div className="grid gap-6 grid-cols-1">
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black tracking-tight text-[#151717] sm:text-[2rem]">Next scheduled reminders</h2>
                <Link href="/medicine-reminder" className="text-xs font-bold text-[#151717] sm:text-sm">Manage →</Link>
              </div>

              <div className="space-y-3">
                {reminders.length ? reminders.map((reminder) => {
                  const reminderTime = getNextUpcomingReminderTime(reminder.time, '8:00 AM');
                  return (
                    <div key={reminder.id} className="rounded-[22px] border border-[#e5e7eb] bg-white px-3 py-3 shadow-[0_6px_18px_rgba(17,24,39,0.08)]">
                      <div className="flex items-center gap-3">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#e5e7eb] bg-white text-[#9cc63d]">
                            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
                              <circle cx="12" cy="12" r="8.2" />
                              <path d="M12 8.5v4l2.8 1.7" />
                              <path d="M9.5 3.8 8 5.8" />
                              <path d="M14.5 3.8 16 5.8" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="truncate text-sm font-black text-[#151717] sm:text-base">{reminder.name}</div>
                              <div className="shrink-0 rounded-full bg-[#e4f4c9] px-2.5 py-0.5 text-[10px] font-bold leading-5 text-[#6a9430] sm:text-xs">{reminderTime}</div>
                            </div>
                            <div className="mt-0.5 text-xs text-[#6b7280] sm:text-sm">{formatReminderField(reminder.dosage, '1 tablet')} · {formatReminderField(reminder.mealTime, 'After meal')}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }) : <p className="text-sm text-[#6b7280]">No reminders yet.</p>}
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black tracking-tight text-[#151717] sm:text-[2rem]">Recent reports</h2>
                <Link href="/reports" className="text-xs font-bold text-[#151717] sm:text-sm">See all →</Link>
              </div>

              <div className="overflow-hidden rounded-[26px] border border-[#e5e7eb] bg-white shadow-[0_8px_22px_rgba(17,24,39,0.08)]">
                {docs.length ? docs.map((doc, index) => (
                  <Link
                    key={doc.id}
                    href={`/report-detail?id=${doc.id}`}
                    className={cn('flex items-center justify-between gap-3 px-4 py-4 hover:bg-[#fafcf6]', index > 0 ? 'border-t border-[#edf0f2]' : '')}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#e5e7eb] bg-white text-lg">📄</div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-[#151717] sm:text-base">{doc.report_name}</div>
                        <div className="mt-1 text-xs text-[#8b919d] sm:text-sm">{formatDate(doc.created_at)}</div>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full border border-[#bde9d8] bg-[#e9faf3] px-3 py-1 text-[11px] font-bold text-[#1d8d68] sm:text-xs">{shortCategory(doc.report_category)}</span>
                  </Link>
                )) : <div className="px-4 py-5 text-sm text-[#6b7280]">No reports yet.</div>}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportsScreen() {
  const router = useRouter();
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [showDateFilters, setShowDateFilters] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const docs = await getUserDocuments(user.id);
      if (active) {
        setDocuments(docs);
        setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const shown = useMemo(() => documents.filter((doc) => {
    const categoryLabel = shortCategory(doc.report_category);
    const matchesCategory = filter === 'All' || categoryLabel === filter;
    const matchesSearch = !search || doc.report_name?.toLowerCase().includes(search.toLowerCase());
    // parse date from report_date (YYYY-MM-DD) or created_at
    const dateStr = doc.report_date || doc.created_at || '';
    let year = '';
    let month = '';
    if (dateStr) {
      const parts = dateStr.split('T')[0].split('-');
      if (parts.length >= 3) {
        year = parts[0];
        month = parts[1];
      }
    }

    const matchesYear = selectedYear === 'All' || (year && year === selectedYear);
    const matchesMonth = selectedMonth === 'All' || (month && month === selectedMonth);

    return matchesCategory && matchesSearch && matchesYear && matchesMonth;
  }), [documents, filter, search, selectedMonth, selectedYear]);

  const groupedShown = useMemo(() => {
    const groups = new Map<string, typeof shown>();
    shown.forEach((doc) => {
      const rawDate = doc.report_date || doc.created_at || '';
      const groupLabel = rawDate
        ? new Date(rawDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'Unknown';
      const current = groups.get(groupLabel) || [];
      current.push(doc);
      groups.set(groupLabel, current);
    });
    return Array.from(groups.entries());
  }, [shown]);

  const hasActiveDateFilters = selectedMonth !== 'All' || selectedYear !== 'All';

  return (
    <PageShell title="Reports" onBack={() => supabase.auth.signOut()} rightLabel="Upload" onRight={() => router.push('/upload')} hideMobileRightAction>
      <div className="space-y-3 md:hidden">
        <div>
          <label className="flex items-center gap-3 rounded-[20px] border border-[#e7e7e7] bg-[#f8f8f4] px-3 py-3 text-[#9ca3af] shadow-sm">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <span className="text-sm font-medium">Search reports...</span>
          </label>

          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setShowDateFilters((prev) => !prev)}
              className={cn(
                'grid h-10 w-10 shrink-0 place-items-center rounded-full border bg-white transition',
                showDateFilters || hasActiveDateFilters ? 'border-[#9fcc3b] text-[#9fcc3b]' : 'border-[#e5e7eb] text-[#6b7280]',
              )}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 fill-none stroke-current stroke-[1.8]">
                <path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z" />
              </svg>
            </button>
            {['All', 'Blood Test', 'General Medical', 'ECG', 'X-ray / Scan', 'Prescription', 'Other'].map((item) => (
              <button key={item} type="button" onClick={() => setFilter(item)} className={cn('whitespace-nowrap rounded-full border px-3 py-2 text-xs font-bold transition', filter === item ? 'border-[#9fcc3b] bg-[#a7cf3d] text-white' : 'border-[#e5e7eb] bg-white text-[#6b7280]')}>
                {item}
              </button>
            ))}
          </div>

          {showDateFilters ? (
            <div className="mt-3 flex items-center gap-2">
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="h-10 w-1/2 rounded-full border border-[#e5e7eb] bg-white px-3 text-sm text-[#1f2937] outline-none">
                <option value="All">All months</option>
                <option value="01">Jan</option>
                <option value="02">Feb</option>
                <option value="03">Mar</option>
                <option value="04">Apr</option>
                <option value="05">May</option>
                <option value="06">Jun</option>
                <option value="07">Jul</option>
                <option value="08">Aug</option>
                <option value="09">Sep</option>
                <option value="10">Oct</option>
                <option value="11">Nov</option>
                <option value="12">Dec</option>
              </select>

              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="h-10 w-1/2 rounded-full border border-[#e5e7eb] bg-white px-3 text-sm text-[#1f2937] outline-none">
                <option value="All">All years</option>
                {(() => {
                  const yearsSet = new Set<string>();
                  documents.forEach((d) => {
                    const ds = d.report_date || d.created_at || '';
                    const y = ds.split('T')[0].split('-')[0];
                    if (y) yearsSet.add(y);
                  });
                  return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a)).map((y) => <option key={y} value={y}>{y}</option>);
                })()}
              </select>
            </div>
          ) : null}
        </div>

        {loading ? <p className="text-sm text-[#6b7280]">Loading reports…</p> : null}

        <div className="space-y-6">
          {groupedShown.map(([monthLabel, items]) => (
            <section key={monthLabel} className="space-y-3">
              <h3 className="text-xl font-black tracking-tight text-[#151717]">{monthLabel}</h3>
              <div className="grid grid-cols-3 gap-2">
                {items.map((doc) => {
                  const previewUrl = doc.file_url ? supabase.storage.from('user_docs').getPublicUrl(doc.file_url).data.publicUrl : null;
                  const showImage = Boolean(previewUrl && doc.file_type?.startsWith('image/'));
                  return (
                    <Link key={doc.id} href={`/report-detail?id=${doc.id}`} className="group overflow-hidden rounded-[20px] bg-white shadow-[0_6px_18px_rgba(17,24,39,0.08)] transition active:scale-[0.99]">
                      <div className="relative aspect-[1/1.15] overflow-hidden bg-[#f3f4f6]">
                        {showImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={previewUrl || ''} alt={doc.report_name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f3f4f6] to-[#e9edf1] text-2xl text-[#9ca3af]">📄</div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-black/40 px-2 py-1 text-left text-[10px] font-bold leading-tight text-white backdrop-blur-sm">
                          <div className="truncate">{doc.report_name}</div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className="hidden space-y-4 md:block">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {['All', 'Blood Test', 'General Medical', 'ECG', 'X-ray / Scan', 'Prescription', 'Other'].map((item) => (
              <button key={item} type="button" onClick={() => setFilter(item)} className={cn('rounded-full border px-3 py-2 text-sm font-semibold', filter === item ? 'border-[#9fcc3b] bg-[#f7faef] text-[#151717]' : 'border-[#e5e7eb] bg-white text-[#4b5563]')}>
                {item}
              </button>
            ))}
          </div>

          <div className="sm:ml-auto flex items-center gap-3">
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="rounded-full border border-[#e5e7eb] bg-white px-3 py-1.5 text-sm w-28 sm:w-32">
              <option value="All">All months</option>
              <option value="01">Jan</option>
              <option value="02">Feb</option>
              <option value="03">Mar</option>
              <option value="04">Apr</option>
              <option value="05">May</option>
              <option value="06">Jun</option>
              <option value="07">Jul</option>
              <option value="08">Aug</option>
              <option value="09">Sep</option>
              <option value="10">Oct</option>
              <option value="11">Nov</option>
              <option value="12">Dec</option>
            </select>

            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="rounded-full border border-[#e5e7eb] bg-white px-3 py-1.5 text-sm w-28 sm:w-32">
              <option value="All">All years</option>
              {(() => {
                const yearsSet = new Set<string>();
                documents.forEach((d) => {
                  const ds = d.report_date || d.created_at || '';
                  const y = ds.split('T')[0].split('-')[0];
                  if (y) yearsSet.add(y);
                });
                return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a)).map((y) => <option key={y} value={y}>{y}</option>);
              })()}
            </select>
          </div>
        </div>

        {loading ? <p className="text-sm text-[#6b7280]">Loading reports…</p> : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((doc) => (
            <Link key={doc.id} href={`/report-detail?id=${doc.id}`} className="rounded-[20px] border border-[#e5e7eb] bg-white p-4 shadow-sm transition hover:-translate-y-0.5">
              <div className="text-xs font-bold tracking-[0.2em] text-[#6b7280]">{shortCategory(doc.report_category)}</div>
              <div className="mt-2 text-base font-bold text-[#1f2937]">{doc.report_name}</div>
              <div className="mt-2 text-sm text-[#6b7280]">{doc.hospital_name || 'Hospital not set'}</div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-[#6b7280]">{formatDate(doc.report_date || doc.created_at)}</span>
                <Badge label="Open" tone="blue" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
    });
  }, []);

  const initials = useMemo(() => {
    const name = profile?.full_name || 'User';
    const parts = name.trim().split(/\s+/);
    return parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
  }, [profile]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <PageShell title="My Profile">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="p-6 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-[28px] bg-[#e3f5c7] text-2xl font-black text-[#18332f]">{initials}</div>
          <div className="mt-4 text-2xl font-bold text-[#1f2937]">{profile?.full_name || 'User'}</div>
          <div className="mt-1 text-sm text-[#6b7280]">{profile?.email || ''}</div>
          <div className="mt-4"><Badge label="Patient" tone="blue" /></div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <BtnSecondary href="/edit-profile">Edit profile</BtnSecondary>
            <BtnSecondary href="/settings">Settings</BtnSecondary>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xs font-bold tracking-[0.2em] text-[#6b7280]">PERSONAL INFO</h2>
          <div className="mt-4 space-y-3 text-sm">
            {[
              ['Date of birth', profile?.dob || '-'],
              ['Blood group', profile?.blood_group || '-'],
              ['Phone', profile?.phone || '-'],
              ['Height', profile?.height ? `${profile.height} cm` : '-'],
              ['Weight', profile?.weight ? `${profile.weight} kg` : '-'],
              ['Allergies', profile?.allergies || '-'],
            ].map(([label, value]) => (
              <div key={label as string} className="flex items-center justify-between rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3">
                <span className="font-semibold text-[#4b5563]">{label as string}</span>
                <span className="font-bold text-[#1f2937]">{value as string}</span>
              </div>
            ))}
          </div>
          <BtnPrimary onClick={handleSignOut} className="mt-5 w-full">Sign out</BtnPrimary>
        </Card>
      </div>
    </PageShell>
  );
}

function HealthPredictLanding() {
  const router = useRouter();
  const models = [
    { href: '/predict-heart', title: 'Heart Risk', subtitle: 'Predict heart attack risk using age, BP, cholesterol and lifestyle data.', confidence: '95%', inputs: '9 inputs', icon: '❤' },
    { href: '/predict-diabetes', title: 'Diabetes Risk', subtitle: 'Assess diabetes likelihood from glucose, BMI, family history and more.', confidence: '97%', inputs: '7 inputs', icon: '◌' },
    { href: '/predict-bp', title: 'Blood Pressure Risk', subtitle: 'Evaluate hypertension risk from BP readings, stress and sleep patterns.', confidence: '93%', inputs: '11 inputs', icon: '◒' },
  ];

  return (
    <PageShell title="Predict Health Risk" onBack={() => router.back()}>
      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-3">
          {models.map((model) => (
            <Link key={model.href} href={model.href} className="rounded-[20px] border border-[#e5e7eb] bg-white p-5 transition hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e3f5c7] text-xl">{model.icon}</div>
                <Badge label={`${model.confidence} accuracy`} tone="green" />
              </div>
              <div className="mt-4 text-lg font-bold text-[#1f2937]">{model.title}</div>
              <div className="mt-1 text-sm leading-6 text-[#6b7280]">{model.subtitle}</div>
              <div className="mt-4 text-xs font-bold tracking-[0.18em] text-[#6b7280]">{model.inputs}</div>
            </Link>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

function PredictionScreen({ model }: { model: 'heart' | 'diabetes' | 'bp' }) {
  const router = useRouter();
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const fieldConfigs = useMemo(() => {
    if (model === 'heart') {
      return ['age', 'gender', 'chest_pain_type', 'blood_pressure', 'cholesterol', 'heart_rate', 'exercise_chest_pain', 'diabetes', 'smoking'];
    }
    if (model === 'diabetes') {
      return ['age', 'glucose', 'blood_pressure', 'height', 'weight', 'pregnancies', 'family_history'];
    }
    return ['age', 'gender', 'height', 'weight', 'systolic_bp', 'diastolic_bp', 'heart_rate', 'smoking', 'stress_level', 'sleep_hours', 'physical_activity'];
  }, [model]);

  const submit = async () => {
    setLoading(true);
    try {
      let response: PredictResponse;
      const numeric = (key: string) => Number(form[key] || 0);
      if (model === 'heart') {
        response = await predictHeart({
          age: numeric('age'), gender: numeric('gender'), chest_pain_type: numeric('chest_pain_type'), blood_pressure: numeric('blood_pressure'), cholesterol: numeric('cholesterol'), heart_rate: numeric('heart_rate'), exercise_chest_pain: numeric('exercise_chest_pain'), diabetes: numeric('diabetes'), smoking: numeric('smoking'),
        });
      } else if (model === 'diabetes') {
        response = await predictDiabetes({
          age: numeric('age'), glucose: numeric('glucose'), blood_pressure: numeric('blood_pressure'), height: numeric('height'), weight: numeric('weight'), pregnancies: numeric('pregnancies'), family_history: form.family_history === 'true',
        });
      } else {
        response = await predictBP({
          age: numeric('age'), gender: numeric('gender'), height: numeric('height'), weight: numeric('weight'), systolic_bp: numeric('systolic_bp'), diastolic_bp: numeric('diastolic_bp'), heart_rate: numeric('heart_rate'), smoking: numeric('smoking'), stress_level: numeric('stress_level'), sleep_hours: numeric('sleep_hours'), physical_activity: numeric('physical_activity'),
        });
      }
      await savePredictionResult(model, form, response);
      setResult(response);
    } finally {
      setLoading(false);
    }
  };

  const titleMap = { heart: 'Heart Risk', diabetes: 'Diabetes Risk', bp: 'Blood Pressure Risk' } as const;

  return (
    <PageShell title={titleMap[model]} onBack={() => router.back()}>
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {fieldConfigs.map((field) => (
              <InputField key={field} label={field.replace(/_/g, ' ')} placeholder={field.replace(/_/g, ' ')} value={form[field] || ''} onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))} />
            ))}
          </div>
          <BtnPrimary onClick={submit} disabled={loading} className="mt-5 w-full">{loading ? 'Predicting…' : 'Predict'}</BtnPrimary>
        </Card>

        <Card className="p-5">
          <h2 className="text-xs font-bold tracking-[0.2em] text-[#6b7280]">RESULT</h2>
          {result ? (
            <div className="mt-4 space-y-3">
              <div className="text-3xl font-black text-[#151717]">{result.risk}</div>
              <p className="text-sm leading-7 text-[#4b5563]">{result.description}</p>
              <div className="rounded-2xl border border-[#e5e7eb] bg-[#f7faef] p-4 text-sm text-[#374151]">{result.disclaimer}</div>
              <div className="space-y-2">
                {result.tips?.map((tip) => <div key={tip} className="rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm">{tip}</div>)}
              </div>
            </div>
          ) : <p className="mt-4 text-sm text-[#6b7280]">Run the model to see the prediction summary.</p>}
        </Card>
      </div>
    </PageShell>
  );
}

function ChatScreen({ mode }: { mode: 'chat' | 'voice' }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([{ from: 'ai', text: 'Hi! I am Medex AI. How can I help you today?' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const sessionId = useMemo(() => crypto.randomUUID(), []);

  const speakReply = async (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#+ /g, '').replace(/`/g, ''));
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const sendText = async (text: string) => {
    if (!text.trim() || loading) return;
    const value = text.trim();
    setMessages((prev) => [...prev, { from: 'user', text: value }]);
    setInput('');
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const response = await fetch(MEDexLinks.edgeChat, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ message: value, session_id: sessionId }),
      });
      const json = await response.json();
      const reply = json.message || 'Sorry, I could not process that request.';
      setMessages((prev) => [...prev, { from: 'ai', text: reply }]);
      speakReply(reply);
    } catch {
      setMessages((prev) => [...prev, { from: 'ai', text: 'Sorry, I could not reach the server right now.' }]);
    } finally {
      setLoading(false);
    }
  };

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event: RecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      if (event.results[0]?.isFinal && transcript.trim()) sendText(transcript.trim());
    };
    recognition.start();
  };

  return (
    <PageShell title="Health assistant" onBack={() => router.back()}>
      <div className="grid gap-4">
        <Card className="flex min-h-[60vh] flex-col p-4">
          <div className="flex-1 space-y-3 overflow-y-auto pb-3">
            {messages.map((message, index) => (
              <div key={`${message.from}-${index}`} className={cn('flex items-end gap-2', message.from === 'user' ? 'justify-end' : 'justify-start')}>
                {message.from === 'ai' ? <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#151717] text-sm font-bold text-white">M</div> : null}
                <div className={cn('max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6', message.from === 'user' ? 'rounded-br-sm bg-[#e3f5c7] text-[#1f2937]' : 'rounded-bl-sm border border-[#e5e7eb] bg-white text-[#1f2937]')}>
                  {message.text}
                </div>
              </div>
            ))}
            {loading ? <div className="text-sm text-[#6b7280]">Medex is typing…</div> : null}
          </div>
          <div className="border-t border-[#e5e7eb] pt-4">
            <div className="flex items-center gap-3">
              {mode === 'voice' && listening ? <Badge label="Listening" tone="green" /> : null}
              {speaking ? <Badge label="Speaking" tone="blue" /> : null}
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendText(input); }} placeholder="Ask about your health records…" className="min-w-0 flex-1 rounded-full border border-[#e5e7eb] bg-white px-4 py-3 text-sm outline-none placeholder:text-[#9ca3af]" />
              {mode === 'voice' && !input.trim() ? <BtnSecondary onClick={startVoice}>Mic</BtnSecondary> : null}
              <BtnPrimary onClick={() => sendText(input)} disabled={loading}>Send</BtnPrimary>
            </div>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

function UploadScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState('');
  const [reportName, setReportName] = useState('');
  const [hospital, setHospital] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const currentType = REPORT_TYPES.find((item) => item.key === selectedType);

  const submit = async () => {
    if (!file || !currentType || !reportName.trim()) return;
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to upload documents.');
      const timestamp = Date.now();
      const safeName = file.name || 'document';
      const cleanFileName = safeName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const filePath = `${user.id}/${timestamp}_${cleanFileName}`;
      await uploadDocumentFile(user.id, file, filePath);
      await saveUserDocument({
        user_id: user.id,
        report_category: currentType.label,
        report_name: reportName.trim(),
        hospital_name: hospital.trim(),
        report_date: date || undefined,
        additional_notes: notes.trim(),
        file_url: filePath,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
      });
      router.back();
    } finally {
      setUploading(false);
    }
  };

  if (step === 1) {
    return (
      <PageShell title="Upload report" onBack={() => router.back()}>
        <div className="space-y-4">
          <SectionHeader title="What are you uploading?" subtitle="Select the report type to get started." />
          <div className="grid gap-3">
            {REPORT_TYPES.map((type) => (
              <button key={type.key} type="button" onClick={() => { setSelectedType(type.key); setStep(2); }} className="flex items-center gap-4 rounded-[20px] border border-[#e5e7eb] bg-white p-4 text-left transition hover:-translate-y-0.5">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e3f5c7] text-[#5A8A2E]">
                  <ReportTypeGlyph name={type.icon} className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[#1f2937]">{type.label}</div>
                  <div className="mt-1 text-xs text-[#6b7280]">{type.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Upload report" onBack={() => setStep(1)}>
      <div className="space-y-4">
        {currentType ? <Card className="flex items-center gap-4 p-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e3f5c7] text-[#5A8A2E]"><ReportTypeGlyph name={currentType.icon} className="h-6 w-6" /></div><div><div className="font-bold text-[#1f2937]">{currentType.label}</div><div className="text-xs text-[#6b7280]">{currentType.desc}</div></div></Card> : null}
        <Card className="p-5">
          <div className="grid gap-4">
            <InputField label="Report name" placeholder="e.g. CBC, Lipid profile, ECG…" value={reportName} onChange={(e) => setReportName(e.target.value)} />
            <InputField label="Hospital / Clinic" placeholder="e.g. Apollo Hospital" value={hospital} onChange={(e) => setHospital(e.target.value)} />
            <div>
              <label className="block text-sm font-semibold text-[#374151]">Date of report</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-2 w-full rounded-md border border-[#e5e7eb] px-4 py-3 text-sm outline-none shadow-sm"
              />
            </div>
            <InputField label="Additional notes" placeholder="Add any relevant context or observations…" value={notes} onChange={(e) => setNotes(e.target.value)} multiline />
            <label className="rounded-[20px] border-2 border-dashed border-[#d1d5db] bg-[#f8fbff] p-5 text-center">
              <div className="text-sm font-bold text-[#7ba428]">Tap to pick a PDF or image</div>
              <input type="file" accept="application/pdf,image/png,image/jpeg" className="mt-4 block w-full text-sm" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              {file ? <div className="mt-2 text-xs text-[#6b7280]">Selected: {file.name}</div> : null}
            </label>
          </div>
        </Card>
        <BtnPrimary onClick={submit} disabled={uploading} className="w-full">{uploading ? 'Uploading…' : 'Upload Document'}</BtnPrimary>
      </div>
    </PageShell>
  );
}

function ReportDetailScreen({ id }: { id: string }) {
  const router = useRouter();
  const [doc, setDoc] = useState<UserDocument | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!id) return;
      const { data } = await supabase.from('user_documents').select('*').eq('id', id).single();
      if (!active) return;
      setDoc(data || null);
      if (data?.file_url) {
        const { data: urlData } = supabase.storage.from('user_docs').getPublicUrl(data.file_url);
        setPublicUrl(urlData?.publicUrl || null);
      }
    }
    load();
    return () => { active = false; };
  }, [id]);

  if (!doc) {
    return <PageShell title="Report detail" onBack={() => router.back()}><Card className="p-6 text-sm text-[#6b7280]">Loading report…</Card></PageShell>;
  }

  return (
    <PageShell title="Report detail" onBack={() => router.back()}>
      <div className="space-y-4">
        <Card className="overflow-hidden">
          {publicUrl ? <iframe title="Report preview" src={publicUrl} className="h-[420px] w-full border-0" /> : <div className="p-8 text-center text-sm text-[#6b7280]">No preview available</div>}
        </Card>
        <Card className="p-5">
          <div className="text-2xl font-black text-[#151717]">{doc.report_name}</div>
          <div className="mt-2 text-sm text-[#6b7280]">{doc.file_name || 'Unnamed file'}</div>
          <Divider className="my-4" />
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e3f5c7] text-[#5a8a2e]">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
                    <path d="M5 7.5h14M5 12h14M5 16.5h14" strokeLinecap="round" />
                    <path d="M8 4.5v15" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <div className="text-[10px] font-bold tracking-[0.2em] text-[#6b7280]">CATEGORY</div>
                  <div className="mt-2 font-bold text-[#1f2937]">{doc.report_category || '—'}</div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e3f5c7] text-[#5a8a2e]">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
                    <path d="M7 11.5V8.75A5.25 5.25 0 0 1 12.25 3.5h.5A5.25 5.25 0 0 1 18 8.75v2.75" strokeLinecap="round" />
                    <path d="M6 11.5h12v7H6z" />
                    <path d="M10 11.5V9.75A2.25 2.25 0 0 1 12.25 7.5h.5A2.25 2.25 0 0 1 15 9.75v1.75" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <div className="text-[10px] font-bold tracking-[0.2em] text-[#6b7280]">HOSPITAL</div>
                  <div className="mt-2 font-bold text-[#1f2937]">{doc.hospital_name || '—'}</div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e3f5c7] text-[#5a8a2e]">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
                    <circle cx="12" cy="12" r="8" />
                    <path d="M12 8.5v4l2.75 1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div className="text-[10px] font-bold tracking-[0.2em] text-[#6b7280]">DATE</div>
                  <div className="mt-2 font-bold text-[#1f2937]">{doc.report_date || '—'}</div>
                </div>
              </div>
            </div>
          </div>
          {doc.additional_notes ? <p className="mt-4 rounded-2xl border border-[#e5e7eb] bg-[#f7faef] p-4 text-sm leading-7 text-[#374151]">{doc.additional_notes}</p> : null}
          <BtnPrimary href={`/report-insight?id=${doc.id}`} className="mt-5">Ask AI about this report</BtnPrimary>
        </Card>
      </div>
    </PageShell>
  );
}

function ReportInsightScreen({ id }: { id: string }) {
  const router = useRouter();
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function analyze() {
      if (!id) return;
      const { data: doc } = await supabase.from('user_documents').select('*').eq('id', id).single();
      if (!doc) return;
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(MEDexLinks.edgeReportInsight, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: session ? `Bearer ${session.access_token}` : '' },
        body: JSON.stringify({ message: `Analyze this report: ${doc.report_name}`, document_id: id }),
      });
      const json = await response.json();
      if (active) {
        setOutput(json.message || json.output || 'No insight returned.');
        setLoading(false);
      }
    }
    analyze();
    return () => { active = false; };
  }, [id]);

  return (
    <PageShell title="Report insight" onBack={() => router.back()}>
      <Card className="p-5">
        {loading ? <p className="text-sm text-[#6b7280]">Analyzing report…</p> : <div className="space-y-3 text-sm leading-7 text-[#374151] whitespace-pre-wrap">{output}</div>}
      </Card>
    </PageShell>
  );
}

function MedicineReminderScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [time, setTime] = useState('08:00 AM');
  const [frequency, setFrequency] = useState('Daily');
  const [mealTime, setMealTime] = useState<Reminder['mealTime']>('After meal');

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setReminders(await getReminders(user.id));
    });
  }, []);

  const addReminder = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const created = await createReminder({ name, dosage, time, frequency, mealTime, active: true }, user.id);
    setReminders((prev) => [created, ...prev]);
    setName('');
    setDosage('');
  };

  return (
    <PageShell title="Medicine reminder">
      <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
        <Card className="p-5">
          <div className="grid gap-3">
            <InputField label="Medicine name" value={name} onChange={(e) => setName(e.target.value)} />
            <InputField label="Dosage" value={dosage} onChange={(e) => setDosage(e.target.value)} />
            <InputField label="Time" value={time} onChange={(e) => setTime(e.target.value)} />
            <InputField label="Frequency" value={frequency} onChange={(e) => setFrequency(e.target.value)} />
            <InputField label="Meal time" value={mealTime} onChange={(e) => setMealTime(e.target.value as Reminder['mealTime'])} />
          </div>
          <BtnPrimary onClick={addReminder} className="mt-4 w-full">Add reminder</BtnPrimary>
        </Card>
        <Card className="p-5">
          <h2 className="text-xs font-bold tracking-[0.2em] text-[#6b7280]">REMINDERS</h2>
          <div className="mt-4 space-y-3">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="flex items-center justify-between rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3">
                <div>
                  <div className="font-bold text-[#1f2937]">{reminder.name}</div>
                  <div className="text-xs text-[#6b7280]">{reminder.dosage} · {reminder.time}</div>
                </div>
                <button type="button" onClick={async () => { await deleteReminder(reminder.id); setReminders((prev) => prev.filter((item) => item.id !== reminder.id)); }} className="text-sm font-bold text-[#dc2626]">Delete</button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

function SettingsScreen() {
  const router = useRouter();
  const [toggles, setToggles] = useState({ notifs: true, reminders: true, reports: false });
  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };
  return (
    <PageShell title="Settings" onBack={() => router.back()}>
      <div className="space-y-4">
        <Card className="p-5">
          <div className="space-y-4">
            {[
              ['Push notifications', 'notifs'],
              ['Health reminders', 'reminders'],
              ['Weekly summary reports', 'reports'],
            ].map(([label, key]) => (
              <div key={label as string} className="flex items-center justify-between gap-4 rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3">
                <div className="font-semibold text-[#374151]">{label as string}</div>
                <Toggle on={toggles[key as keyof typeof toggles]} onToggle={() => setToggles((prev) => ({ ...prev, [key]: !prev[key as keyof typeof toggles] }))} />
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <div className="space-y-3">
            <BtnSecondary href="/change-password" className="w-full">Change password</BtnSecondary>
            <button type="button" onClick={signOut} className="w-full rounded-full border border-[#fecaca] bg-white px-5 py-4 text-sm font-bold text-[#dc2626]">Sign out</button>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

function AboutScreen() {
  return (
    <PageShell title="About Medex" onBack={() => window.history.back()}>
      <div className="space-y-4">
        <Card className="p-6 text-center">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-[28px] bg-[#151717] text-2xl font-black text-white">M</div>
          <h1 className="mt-4 text-2xl font-black text-[#151717]">Medex</h1>
          <p className="mt-2 text-sm text-[#6b7280]">Version 1.0.0</p>
        </Card>
        <Card className="p-5 text-sm leading-7 text-[#4b5563]">Medex is a healthcare platform designed to bring proactive risk assessment, report storage, AI support, and reminders directly to your fingertips.</Card>
      </div>
    </PageShell>
  );
}

function HelpScreen() {
  const [expanded, setExpanded] = useState<string | null>('how-to');
  const items = [
    { id: 'how-to', title: 'How to use the app', content: 'Use the Predict page, upload reports, talk to Medex AI, and store reminders in one workflow.' },
    { id: 'privacy', title: 'Privacy policy', content: 'Health data is associated only with your authenticated account and stored in Supabase.' },
    { id: 'security', title: 'Data security', content: 'The app uses Supabase auth, row-level security, and browser session persistence.' },
    { id: 'contact', title: 'Contact support', content: 'Need help? Reach out to support@medex.in.' },
  ];
  return (
    <PageShell title="Help & Support" onBack={() => window.history.back()}>
      <Card className="overflow-hidden">
        {items.map((item) => (
          <div key={item.id} className="border-b border-[#e5e7eb] last:border-b-0">
            <button type="button" className="flex w-full items-center justify-between px-5 py-4 text-left" onClick={() => setExpanded(expanded === item.id ? null : item.id)}>
              <span className="font-semibold text-[#374151]">{item.title}</span>
              <span className="text-[#9ca3af]">{expanded === item.id ? '−' : '+'}</span>
            </button>
            {expanded === item.id ? <div className="px-5 pb-4 text-sm leading-7 text-[#4b5563]">{item.content}</div> : null}
          </div>
        ))}
      </Card>
    </PageShell>
  );
}

function EditProfileScreen() {
  const [form, setForm] = useState({ full_name: '', phone: '', blood_group: '', height: '', weight: '', allergies: '' });
  const save = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').update({ ...form, height: form.height ? Number(form.height) : null, weight: form.weight ? Number(form.weight) : null }).eq('id', user.id);
  };
  return (
    <PageShell title="Edit profile" onBack={() => window.history.back()}>
      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-2">
          {Object.keys(form).map((key) => <InputField key={key} label={key.replace(/_/g, ' ')} value={form[key as keyof typeof form]} onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))} />)}
        </div>
        <BtnPrimary onClick={save} className="mt-5 w-full">Save changes</BtnPrimary>
      </Card>
    </PageShell>
  );
}

function ChangePasswordScreen() {
  const [password, setPassword] = useState('');
  const save = async () => {
    await supabase.auth.updateUser({ password });
  };
  return (
    <PageShell title="Change password" onBack={() => window.history.back()}>
      <Card className="p-5">
        <InputField label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <BtnPrimary onClick={save} className="mt-5 w-full">Update password</BtnPrimary>
      </Card>
    </PageShell>
  );
}

function NotificationsScreen() {
  return (
    <PageShell title="Notifications" onBack={() => window.history.back()}>
      <Card className="p-5 text-sm text-[#4b5563]">Notifications parity will be wired to browser push and in-app alerts in the next slice.</Card>
    </PageShell>
  );
}

function SearchScreen() {
  const [query, setQuery] = useState('');
  return (
    <PageShell title="Search" onBack={() => window.history.back()}>
      <div className="space-y-4">
        <InputField placeholder="Search reports or reminders" value={query} onChange={(e) => setQuery(e.target.value)} icon={<span>⌕</span>} />
        <Card className="p-5 text-sm text-[#6b7280]">Search results will surface documents, reminders, and profile data.</Card>
      </div>
    </PageShell>
  );
}

function OcrPreviewScreen() {
  return (
    <PageShell title="OCR preview" onBack={() => window.history.back()}>
      <Card className="p-5 text-sm text-[#6b7280]">OCR preview is available as a report upload step in the mobile app; the web version will mirror it in the next pass.</Card>
    </PageShell>
  );
}

export default function ScreenRouter() {
  return <ScreenPage />;
}