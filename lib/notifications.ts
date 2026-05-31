export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string; // ISO string
  type: 'reminder' | 'prediction' | 'general';
  read: boolean;
}

export function getInAppNotifications(): InAppNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = window.localStorage.getItem('medex_notifications_log');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
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
    
    // Dispatch custom event to refresh UI
    window.dispatchEvent(new CustomEvent('medex_new_notification'));
  } catch (e) {
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
  } catch (e) {
    // ignore
  }
}

export function clearNotifications() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem('medex_notifications_log', JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('medex_new_notification'));
  } catch (e) {
    // ignore
  }
}

export function sendPushNotification(title: string, body?: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  let allowed = true;
  try {
    const saved = window.localStorage.getItem('medex_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.notifs === false) allowed = false;
    }
  } catch (e) {
    // ignore
  }
  if (allowed && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/medex_logo.png' });
  }
}
