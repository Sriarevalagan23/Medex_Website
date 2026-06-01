export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string; // ISO string
  type: 'reminder' | 'prediction' | 'general';
  read: boolean;
}

type NotificationChannel = 'reminder' | 'prediction' | 'general';

type NotificationSettings = {
  notifs?: boolean;
  reminders?: boolean;
  reports?: boolean;
};

const PROMOTION_LAST_SENT_KEY = 'medex_promo_last_sent';
const PROMOTION_COOLDOWN_MS = 6 * 60 * 60 * 1000;
const PROMOTIONAL_MESSAGES = [
  {
    title: 'Keep your care on track',
    body: 'Set up medicine reminders so every dose shows up exactly when you need it.',
  },
  {
    title: 'Review your health trends',
    body: 'Save prediction results to spot changes in your risk profile over time.',
  },
  {
    title: 'Organize medical reports',
    body: 'Upload scans and lab results to keep your records in one place.',
  },
  {
    title: 'Try voice assistance',
    body: 'Use Medex chat to get quick help with reports, reminders, and next steps.',
  },
] as const;

export function getInAppNotifications(): InAppNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = window.localStorage.getItem('medex_notifications_log');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function getNotificationSettings(): NotificationSettings {
  if (typeof window === 'undefined') return {};

  try {
    const saved = window.localStorage.getItem('medex_settings');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function canUsePromotions() {
  const settings = getNotificationSettings();
  return settings.notifs !== false;
}

function getLastPromotionTimestamp() {
  if (typeof window === 'undefined') return 0;

  const raw = window.localStorage.getItem(PROMOTION_LAST_SENT_KEY);
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function markPromotionSent(timestamp: number) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PROMOTION_LAST_SENT_KEY, String(timestamp));
}

function pickPromotionalMessage() {
  const index = Math.floor(Math.random() * PROMOTIONAL_MESSAGES.length);
  return PROMOTIONAL_MESSAGES[index];
}

export function isBrowserNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getBrowserNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

export function canSendPushNotification(channel: NotificationChannel = 'general') {
  if (!isBrowserNotificationSupported()) return false;

  const settings = getNotificationSettings();
  if (settings.notifs === false) return false;
  if (channel === 'reminder' && settings.reminders === false) return false;

  return Notification.permission === 'granted';
}

export function logInAppNotification(title: string, body: string, type: 'reminder' | 'prediction' | 'general') {
  if (typeof window === 'undefined') return;
  try {
    const logs = getInAppNotifications();
    const newNotif: InAppNotification = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      body,
      timestamp: new Date().toISOString(),
      type,
      read: false,
    };
    logs.unshift(newNotif);
    window.localStorage.setItem('medex_notifications_log', JSON.stringify(logs.slice(0, 50)));

    window.dispatchEvent(new CustomEvent('medex_new_notification', { detail: newNotif }));
  } catch {
    // ignore
  }
}

export function markNotificationsAsRead() {
  if (typeof window === 'undefined') return;
  try {
    const logs = getInAppNotifications();
    const updated = logs.map(n => ({ ...n, read: true }));
    window.localStorage.setItem('medex_notifications_log', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('medex_new_notification'));
  } catch {
    // ignore
  }
}

export function clearNotifications() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem('medex_notifications_log', JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('medex_new_notification'));
  } catch {
    // ignore
  }
}

export function sendPushNotification(title: string, body?: string, channel: NotificationChannel = 'general') {
  if (!canSendPushNotification(channel)) return false;

  new Notification(title, { body, icon: '/medex_logo.png' });
  return true;
}

export function maybeSendPromotionalNotification() {
  if (typeof window === 'undefined' || !canUsePromotions()) return false;

  const now = Date.now();
  const lastSent = getLastPromotionTimestamp();
  if (lastSent && now - lastSent < PROMOTION_COOLDOWN_MS) return false;
  if (Math.random() > 0.18) return false;

  const promo = pickPromotionalMessage();
  markPromotionSent(now);
  sendPushNotification(promo.title, promo.body, 'general');
  logInAppNotification(promo.title, promo.body, 'general');
  return true;
}
