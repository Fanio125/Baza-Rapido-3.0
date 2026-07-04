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
    // Return default mock notifications requested by the user
    const now = new Date();
    const mockNotifications: AdminNotification[] = [
      {
        id: 'notif-1',
        category: 'API',
        title: 'API conectada com sucesso',
        description: 'Conexão estabelecida com os servidores de mapas e estimativas de tarifas.',
        timestamp: now.toISOString(),
        read: false
      },
      {
        id: 'notif-2',
        category: 'Erros',
        title: 'Falha ao carregar anúncios',
        description: 'Erro HTTP 500 ao tentar sincronizar as listagens de viagens do motorista.',
        timestamp: new Date(now.getTime() - 2 * 60000).toISOString(),
        read: false
      },
      {
        id: 'notif-3',
        category: 'Segurança',
        title: 'Tentativa de acesso não autorizado',
        description: 'Utilizador comum tentou aceder diretamente à rota restrita /admin.',
        timestamp: new Date(now.getTime() - 5 * 60000).toISOString(),
        read: false
      },
      {
        id: 'notif-4',
        category: 'Sistema',
        title: 'Base de dados sincronizada',
        description: 'Atualização concluída da tabela de utilizadores e cache local de tarifas.',
        timestamp: new Date(now.getTime() - 10 * 60000).toISOString(),
        read: true
      }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockNotifications));
    return mockNotifications;
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
