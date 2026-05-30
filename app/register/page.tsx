'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { BtnPrimary, Card, EyeIcon, EyeOffIcon, InputField, LockIcon, MailIcon } from '@/components/ui/medex-ui';
import { supabase } from '@/lib/supabase';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function parseDob(raw: string) {
  const cleaned = raw.replace(/\s/g, '');
  const parts = cleaned.split('/');
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts;
  if (dd.length !== 2 || mm.length !== 2 || yyyy.length !== 4) return null;
  return `${yyyy}-${mm}-${dd}`;
}

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [dob, setDob] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/home');
    });
  }, [router]);

  const handleDobChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    const part1 = digits.slice(0, 2);
    const part2 = digits.slice(2, 4);
    const part3 = digits.slice(4, 8);
    if (digits.length <= 2) return setDob(part1);
    if (digits.length <= 4) return setDob(`${part1} / ${part2}`);
    setDob(`${part1} / ${part2} / ${part3}`);
  };

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      setError('Please fill in name, email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    const dobFormatted = dob ? parseDob(dob) : null;
    if (dob && !dobFormatted) {
      setError('Please enter date as DD / MM / YYYY.');
      return;
    }

    setError('');
    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          dob: dobFormatted,
          blood_group: bloodGroup || null,
        },
      },
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    setSuccess(`We sent a confirmation link to ${email}.`);
  };

  return (
    <div className="min-h-screen bg-white px-4 py-10 sm:px-6 lg:px-8">
      <Card className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-2xl items-center justify-center p-6 shadow-[0_18px_50px_rgba(17,24,39,0.08)] sm:p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-4 text-center">
            <div className="mx-auto inline-flex items-center gap-3 rounded-full border border-[#d6eea5] bg-white px-4 py-2 text-[11px] font-bold tracking-[0.22em] text-[#35413d] shadow-[0_4px_20px_rgba(17,24,39,0.06)]">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm">
                <Image src="/medex_logo.png" alt="Medex logo" width={36} height={36} className="h-9 w-9 rounded-full object-cover" priority />
              </span>
              MEDEX
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-[#151717] sm:text-4xl">Create your Medex account</h1>
              <p className="text-sm leading-6 text-[#4b5563] sm:text-base">Set up your profile once to organize health records, reminders, and predictions on the web.</p>
            </div>
          </div>

          <div className="space-y-4">
            <InputField
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              icon={<span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f7faef] text-[11px] font-black text-[#6b7280]">M</span>}
            />
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
            <InputField
              placeholder="DD / MM / YYYY"
              value={dob}
              onChange={(e) => handleDobChange(e.target.value)}
              icon={<span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f7faef] text-[11px] font-black text-[#6b7280]">D</span>}
            />
            <div>
              <p className="mb-2 text-[10px] font-bold tracking-[0.18em] text-[#6b7280]">BLOOD GROUP</p>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                {bloodGroups.map((group) => (
                  <button
                    key={group}
                    type="button"
                    onClick={() => setBloodGroup(group)}
                    className={`rounded-full border px-3 py-2 text-sm font-bold transition ${bloodGroup === group ? 'border-[#9fcc3b] bg-[#f7faef] text-[#151717]' : 'border-[#e5e7eb] bg-white text-[#374151]'}`}
                  >
                    {group}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error ? <p className="text-sm font-semibold text-[#dc2626]">{error}</p> : null}
          {success ? <p className="rounded-2xl border border-[#d6eea5] bg-[#f7faef] px-4 py-3 text-sm font-semibold text-[#35413d]">{success}</p> : null}

          <BtnPrimary onClick={handleRegister} disabled={loading} className="w-full">{loading ? 'Creating account…' : 'Create account →'}</BtnPrimary>

          <p className="text-center text-sm text-[#4b5563]">
            Have an account?{' '}
            <button type="button" onClick={() => router.push('/login')} className="font-bold text-[#7ba428]">Sign in</button>
          </p>
        </div>
      </Card>
    </div>
  );
}