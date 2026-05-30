import Link from 'next/link';
import { ReactNode } from 'react';
import { cn, MEDexColors } from '@/lib/medex';

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
};

export function BtnPrimary({ children, onClick, href, className, type = 'button', disabled }: ButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-full px-5 py-4 text-sm font-bold text-white transition active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60',
    'bg-[#151717] shadow-[0_10px_24px_rgba(21,23,23,0.18)]',
    className,
  );
  if (href) {
    return <Link href={href} className={classes} style={{ color: '#ffffff' }}>{children}</Link>;
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes} style={{ color: '#ffffff' }}>
      {children}
    </button>
  );
}

export function BtnSecondary({ children, onClick, href, className, type = 'button', disabled }: ButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-full border border-[#e2ebc4] bg-[#f7faef] px-5 py-4 text-sm font-bold text-[#2f3a34] transition active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60',
    className,
  );
  if (href) {
    return <Link href={href} className={classes}>{children}</Link>;
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}

export function EyeIcon({ size = 18, color = MEDexColors.gray[500] }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color }}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3.25" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function EyeOffIcon({ size = 18, color = MEDexColors.gray[500] }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color }}>
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M2 12s3.5-6 10-6c1.1 0 2.15.12 3.1.34" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21.5 12s-3.5 6-9.5 6c-1.37 0-2.66-.21-3.84-.59" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MailIcon({ size = 18, color = MEDexColors.gray[500] }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color }}>
      <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 7.5L12 13l7.5-5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LockIcon({ size = 18, color = MEDexColors.gray[500] }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color }}>
      <rect x="5" y="10" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 10V7.5A4 4 0 0 1 12 3.5a4 4 0 0 1 4 4V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-[20px] border border-[#e5e7eb] bg-white shadow-[0_10px_30px_rgba(17,24,39,0.06)]', className)}>{children}</div>;
}

export function Badge({ label, tone = 'blue' }: { label: string; tone?: 'blue' | 'green' | 'yellow' | 'red' | 'gray' }) {
  const palette = {
    blue: { bg: MEDexColors.cloud[50], text: MEDexColors.cloud[700], border: MEDexColors.cloud[200] },
    green: { bg: MEDexColors.emerald[50], text: MEDexColors.emerald[700], border: MEDexColors.emerald[200] },
    yellow: { bg: MEDexColors.amber[50], text: MEDexColors.amber[700], border: MEDexColors.amber[200] },
    red: { bg: MEDexColors.red[50], text: MEDexColors.red[600], border: MEDexColors.red[200] },
    gray: { bg: MEDexColors.gray[100], text: MEDexColors.gray[600], border: MEDexColors.gray[200] },
  }[tone];

  return <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: palette.bg, color: palette.text, borderColor: palette.border }}>{label}</span>;
}

export function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className={cn('flex h-6 w-11 items-center rounded-full p-0.5 transition', on ? 'bg-[#9fcc3b]' : 'bg-[#d1d5db]')} aria-pressed={on}>
      <span className={cn('h-5 w-5 rounded-full bg-white shadow-sm transition', on ? 'translate-x-5' : 'translate-x-0')} />
    </button>
  );
}

type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> & {
  label?: string;
  icon?: ReactNode;
  rightIcon?: ReactNode;
  multiline?: boolean;
};

export function InputField({ label, icon, rightIcon, multiline, className, ...props }: InputFieldProps) {
  const base = 'w-full bg-transparent text-[#1f2937] outline-none transition placeholder:text-[#9ca3af]';
  return (
    <label className="block space-y-1.5">
      {label ? <span className="text-[10px] font-bold tracking-[0.18em] text-[#6b7280]">{label.toUpperCase()}</span> : null}
      <span className="flex min-h-14 items-center gap-3 rounded-2xl border border-[#e5e7eb] bg-white px-5 py-3.5 shadow-[0_4px_16px_rgba(17,24,39,0.02)]">
        {icon ? <span className="pointer-events-none flex shrink-0 items-center justify-center text-[#374151]">{icon}</span> : null}
        {multiline ? (
          <textarea {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} className={cn(base, 'min-h-28 flex-1 resize-none py-0 text-sm', className)} />
        ) : (
          <input {...(props as React.InputHTMLAttributes<HTMLInputElement>)} className={cn(base, 'flex-1 py-0 text-sm', className)} />
        )}
        {rightIcon ? <span className="pointer-events-auto flex shrink-0 items-center justify-center">{rightIcon}</span> : null}
      </span>
    </label>
  );
}

export function TopBar({ title, onBack, rightLabel, onRight, hideMobileRightAction = false }: { title: string; onBack?: () => void; rightLabel?: string; onRight?: () => void; hideMobileRightAction?: boolean }) {
  return (
    <div className="sticky top-0 z-20 border-b border-[#e5e7eb] bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {onBack ? <button type="button" onClick={onBack} aria-label="Go back" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#f7faef] text-2xl leading-none text-[#151717]">‹</button> : null}
          <div className="min-w-0">
            <h1 className="truncate text-left text-sm font-semibold text-[#1f2937] sm:text-base">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {rightLabel ? (
            <>
              <BtnPrimary onClick={onRight} className="hidden md:inline-flex px-3 h-9 py-0.5 text-sm shadow-none">{rightLabel}</BtnPrimary>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-[#e5e7eb]', className)} />;
}