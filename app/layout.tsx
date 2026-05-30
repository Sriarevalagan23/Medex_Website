import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Medex',
  description: 'Medex web experience for medical reports, predictions, reminders, and AI support.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white">{children}</body>
    </html>
  );
}
