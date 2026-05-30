'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BtnPrimary, Card, InputField } from '@/components/ui/medex-ui';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

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
          <BtnPrimary onClick={() => setSent(true)} className="w-full">Send reset link</BtnPrimary>
          {sent ? <p className="rounded-2xl border border-[#d6eea5] bg-[#f7faef] px-4 py-3 text-sm font-semibold text-[#35413d]">Reset email sent. Check your inbox.</p> : null}
          <button type="button" onClick={() => router.push('/login')} className="mx-auto block text-sm font-bold text-[#7ba428]">Back to sign in</button>
        </div>
      </Card>
    </div>
  );
}