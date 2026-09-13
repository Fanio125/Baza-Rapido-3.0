export interface AdminNotification {
  id: string;
  category: 'API' | 'Erros' | 'Segurança' | 'Sistema' | 'Manutenção';
  title: string;
  description: string;
  timestamp: string; // ISO String
  read: boolean;
}

const STORAGE_KEY = 'br_admin_notifications';

// Helper to get notifications
export function getAdminNotifications(): AdminNotification[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    return [];
  }
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Helper to add a notification
export function addAdminNotification(
  category: AdminNotification['category'],
  title: string,
  description: string
): AdminNotification {
  const notifications = getAdminNotifications();
  const newNotif: AdminNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    category,
    title,
    description,
    timestamp: new Date().toISOString(),
    read: false
  };
  
  notifications.unshift(newNotif);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  
  // Dispatch a global event so any active dashboard can receive it in real-time
  window.dispatchEvent(new CustomEvent('br_admin_notification_added', { detail: newNotif }));
  
  return newNotif;
}

// Helper to mark one as read
export function markAsRead(id: string): AdminNotification[] {
  const notifications = getAdminNotifications();
  const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('br_admin_notifications_updated'));
  return updated;
}

// Helper to mark all as read
export function markAllAsRead(): AdminNotification[] {
  const notifications = getAdminNotifications();
  const updated = notifications.map(n => ({ ...n, read: true }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('br_admin_notifications_updated'));
  return updated;
}

// Helper to clear notifications history
export function clearNotificationsHistory(): AdminNotification[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  window.dispatchEvent(new CustomEvent('br_admin_notifications_updated'));
  return [];
}
