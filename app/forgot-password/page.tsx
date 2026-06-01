'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BtnPrimary, Card, InputField } from '@/components/ui/medex-ui';
import { supabase } from '@/lib/supabase';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetPasswordRedirectUrl = 'https://medex-email-verify.netlify.app/auth/reset-password';

  const handleSendResetLink = async () => {
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetPasswordRedirectUrl,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center bg-white px-4 py-10 sm:px-6 lg:px-8">
      <Card className="w-full p-6 sm:p-8">
        <div className="space-y-3 text-center">
          <p className="text-[11px] font-bold tracking-[0.24em] text-[#6b7280]">RECOVERY</p>
          <h1 className="text-3xl font-black tracking-tight text-[#151717]">Forgot password?</h1>
          <p className="text-sm leading-6 text-[#6b7280]">Enter your email and we’ll send you a reset link.</p>
        </div>
        <div className="mx-auto mt-8 max-w-lg space-y-4">
          <InputField label="Email address" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          {error ? <p className="text-sm font-semibold text-[#dc2626]">{error}</p> : null}
          {sent ? <p className="rounded-2xl border border-[#d6eea5] bg-[#f7faef] px-4 py-3 text-sm font-semibold text-[#35413d]">If an account exists for that email, a reset link has been sent. Check your inbox.</p> : null}
          <BtnPrimary onClick={handleSendResetLink} disabled={loading} className="w-full">{loading ? 'Sending…' : 'Send reset link'}</BtnPrimary>
          <button type="button" onClick={() => router.push('/login')} className="mx-auto block text-sm font-bold text-[#7ba428]">Back to sign in</button>
        </div>
      </Card>
    </div>
  );
}