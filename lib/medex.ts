export const MEDexColors = {
  cloud: {
    50: '#eaf0e87e',
    100: '#E3F5C7',
    200: '#D6EEA5',
    300: '#C0E285',
    400: '#AAD963',
    500: '#9FCC3B',
    600: '#7BA428',
    700: '#35413D',
    800: '#151717ff',
    900: '#0D1C1A',
  },
  emerald: {
    50: '#ecfdf5',
    200: '#a7f3d0',
    400: '#34d399',
    500: '#10b981',
    700: '#047857',
  },
  amber: {
    50: '#fffbeb',
    200: '#fde68a',
    400: '#fbbf24',
    500: '#f59e0b',
    700: '#b45309',
  },
  red: {
    50: '#fef2f2',
    200: '#fecaca',
    500: '#ef4444',
    600: '#dc2626',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    950: '#030712',
  },
  white: '#ffffff',
  background: '#EAF0E8',
} as const;

export const MEDexGradients = {
  default: ['#151717', '#151717', '#151717'] as const,
} as const;

export const MEDexLinks = {
  supabaseUrl: 'https://eoogmrwzzrhwxtctyxer.supabase.co',
  mlApi: 'https://medex-ml-models.onrender.com',
  edgeChat: 'https://eoogmrwzzrhwxtctyxer.supabase.co/functions/v1/medex-chat',
  edgeReportInsight: 'https://eoogmrwzzrhwxtctyxer.supabase.co/functions/v1/Medex-AI',
} as const;

export const MEDexRoutes = {
  auth: ['/login', '/register', '/forgot-password', '/index'] as const,
  protectedTabs: ['/home', '/reports', '/ai-chat', '/health-trends', '/profile'] as const,
} as const;

export type ProtectedRoute = (typeof MEDexRoutes.protectedTabs)[number] | '/upload' | '/voice-chat' | '/report-detail' | '/report-insight' | '/edit-profile' | '/settings' | '/change-password' | '/search' | '/about' | '/help' | '/notifications' | '/medicine-reminder' | '/ocr-preview' | '/health-predict' | '/predict-heart' | '/predict-diabetes' | '/predict-bp';

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}