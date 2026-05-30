'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { BtnPrimary, Card, EyeIcon, EyeOffIcon, InputField, LockIcon, MailIcon } from '@/components/ui/medex-ui';
import { supabase } from '@/lib/supabase';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/home');
    });
  }, [router]);

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