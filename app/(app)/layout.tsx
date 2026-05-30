import { WebShell } from '@/components/web-shell';

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <WebShell>{children}</WebShell>;
}