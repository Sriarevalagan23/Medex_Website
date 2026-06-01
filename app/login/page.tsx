'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { BtnPrimary, Card, EyeIcon, EyeOffIcon, InputField, LockIcon, MailIcon } from '@/components/ui/medex-ui';
import { supabase } from '@/lib/supabase';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRecoveryMode = searchParams.get('mode') === 'recovery';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [confirmRecoveryPassword, setConfirmRecoveryPassword] = useState('');
  const [recoveryChecking, setRecoveryChecking] = useState(isRecoveryMode);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');

  useEffect(() => {
    let active = true;

    async function syncSession() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      if (data.session && !isRecoveryMode) {
        router.replace('/home');
        return;
      }

      if (isRecoveryMode && data.session) {
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

      if (!isRecoveryMode && session) {
        router.replace('/home');
      }
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [isRecoveryMode, router]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message.includes('Email not confirmed') ? 'Please confirm your email first.' : 'Incorrect email or password.');
      return;
    }
    router.replace('/home');
  };

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

  if (isRecoveryMode) {
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
              <h1 className="text-3xl font-bold tracking-tight text-[#151717] sm:text-4xl">Welcome back to Medex</h1>
              <p className="text-sm leading-6 text-[#4b5563] sm:text-base">Sign in to access your reports, predictions, reminders, and Medex AI from the web.</p>
            </div>
          </div>

          <div className="space-y-4">
            <InputField placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} icon={<MailIcon />} />
            <InputField
              placeholder="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<LockIcon />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password visibility">
                  {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                </button>
              }
            />
            {error ? <p className="text-sm font-semibold text-[#dc2626]">{error}</p> : null}
            <button type="button" onClick={() => router.push('/forgot-password')} className="ml-auto block text-sm font-bold text-[#7ba428]">Forgot password?</button>
          </div>

          <BtnPrimary onClick={handleLogin} disabled={loading} className="w-full">{loading ? 'Signing in…' : 'Sign in →'}</BtnPrimary>

          <p className="text-center text-sm text-[#4b5563]">
            No account?{' '}
            <button type="button" onClick={() => router.push('/register')} className="font-bold text-[#7ba428]">Register</button>
          </p>
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white px-4 py-10 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border border-[#d6eea5] bg-white p-2 shadow-sm">
            <div className="h-full w-full rounded-full bg-[#a7cf3d]" />
          </div>
          <div className="text-sm font-bold tracking-wider text-[#35413d] uppercase">Loading Medex...</div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}