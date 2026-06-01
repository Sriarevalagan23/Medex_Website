'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BtnPrimary, Card, InputField, LockIcon } from '@/components/ui/medex-ui';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [recoveryChecking, setRecoveryChecking] = useState(true);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [confirmRecoveryPassword, setConfirmRecoveryPassword] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');

  useEffect(() => {
    let active = true;

    async function syncSession() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      if (data.session) {
        setRecoveryReady(true);
      }

      setRecoveryChecking(false);
    }

    syncSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryReady(true);
        setRecoveryChecking(false);
        return;
      }

      if (session) {
        setRecoveryReady(true);
      }
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleUpdatePassword = async () => {
    if (!recoveryPassword || !confirmRecoveryPassword) {
      setRecoveryError('Please enter and confirm your new password.');
      return;
    }
    if (recoveryPassword.length < 6) {
      setRecoveryError('Password must be at least 6 characters.');
      return;
    }
    if (recoveryPassword !== confirmRecoveryPassword) {
      setRecoveryError('Passwords do not match.');
      return;
    }

    setRecoveryError('');
    setRecoveryLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password: recoveryPassword });

    setRecoveryLoading(false);

    if (updateError) {
      setRecoveryError(updateError.message);
      return;
    }

    setRecoverySuccess('Password updated successfully. Redirecting to sign in...');
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <div className="min-h-screen bg-white px-4 py-10 sm:px-6 lg:px-8">
      <Card className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-2xl items-center justify-center p-6 shadow-[0_18px_50px_rgba(17,24,39,0.08)] sm:p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-4 text-center">
            <div className="mx-auto inline-flex items-center gap-3 rounded-full border border-[#d6eea5] bg-white px-4 py-2 text-[11px] font-bold tracking-[0.22em] text-[#35413d] shadow-[0_4px_20px_rgba(17,24,39,0.06)]">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white shadow-sm">
                <Image src="/medex_logo.png" alt="Medex logo" width={28} height={28} className="h-7 w-7 rounded-full object-cover" priority />
              </span>
              MEDEX
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-[#151717] sm:text-4xl">Set a new password</h1>
              <p className="text-sm leading-6 text-[#4b5563] sm:text-base">Use the recovery link from your email to create a new password.</p>
            </div>
          </div>

          <div className="space-y-4">
            {recoveryChecking ? <p className="rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3 text-sm font-semibold text-[#4b5563]">Preparing your recovery session…</p> : null}
            {!recoveryChecking && !recoveryReady ? <p className="rounded-2xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm font-semibold text-[#991b1b]">This recovery link is missing a valid session. Please request a new reset email.</p> : null}
            <InputField
              placeholder="New password"
              type="password"
              value={recoveryPassword}
              onChange={(e) => setRecoveryPassword(e.target.value)}
              icon={<LockIcon />}
            />
            <InputField
              placeholder="Confirm new password"
              type="password"
              value={confirmRecoveryPassword}
              onChange={(e) => setConfirmRecoveryPassword(e.target.value)}
              icon={<LockIcon />}
            />
            {recoveryError ? <p className="text-sm font-semibold text-[#dc2626]">{recoveryError}</p> : null}
            {recoverySuccess ? <p className="rounded-2xl border border-[#d6eea5] bg-[#f7faef] px-4 py-3 text-sm font-semibold text-[#35413d]">{recoverySuccess}</p> : null}
          </div>

          <BtnPrimary onClick={handleUpdatePassword} disabled={recoveryLoading || recoveryChecking || !recoveryReady} className="w-full">
            {recoveryLoading ? 'Updating…' : 'Update password'}
          </BtnPrimary>

          <button type="button" onClick={() => router.push('/login')} className="mx-auto block text-sm font-bold text-[#7ba428]">Back to sign in</button>
        </div>
      </Card>
    </div>
  );
}