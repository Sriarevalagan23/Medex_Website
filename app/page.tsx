import Image from 'next/image';
import { BtnPrimary, BtnSecondary } from '@/components/ui/medex-ui';

export default function IndexPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex w-full max-w-2xl flex-col items-center text-center">
          <Image
            src="/medex_logo.png"
            alt="Medex logo"
            width={110}
            height={110}
            className="h-24 w-24 rounded-[24px] object-cover shadow-[0_10px_30px_rgba(17,24,39,0.12)] sm:h-28 sm:w-28"
            priority
          />

          <div className="mt-8 space-y-5">
            <h1 className="text-3xl font-bold tracking-tight text-[#151717] sm:text-4xl lg:text-5xl">
              Medical records, predictions, reminders, and AI support in one place.
            </h1>
            <p className="mx-auto max-w-xl text-base leading-7 text-[#4b5563] sm:text-lg">
              Securely manage reports, health predictions, reminders, and Medex AI from the web.
            </p>
            <p className="text-[11px] font-bold uppercase tracking-[0.42em] text-[#7ba428]">
              Store.Analyse.Predict
            </p>
          </div>

          <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <BtnPrimary href="/login" className="w-full sm:w-auto sm:min-w-40">Login</BtnPrimary>
            <BtnSecondary href="/register" className="w-full sm:w-auto sm:min-w-40">Create account</BtnSecondary>
          </div>
        </div>
      </div>
    </div>
  );
}
