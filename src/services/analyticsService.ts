import { supabase } from '../lib/supabase';

export interface DeviceInfo {
  deviceType: 'Mobile' | 'Desktop' | 'Tablet';
  browser: string;
  os: string;
}

export interface AccessLog {
  id: string;
  user_id: string | null;
  session_id: string;
  page: string;
  device_type: 'Mobile' | 'Desktop' | 'Tablet';
  browser: string;
  os: string;
  created_at: string;
}

export interface OnlineUserPresence {
  session_id: string;
  user_id?: string;
  page: string;
  device_type: 'Mobile' | 'Desktop' | 'Tablet';
  browser: string;
  os: string;
  online_at: string;
}

export interface AnalyticsSummary {
  onlineUsersCount: number;
  onlineUsersList: OnlineUserPresence[];
  totalAccesses: number;
  accessesToday: number;
  accessesThisWeek: number;
  accessesThisMonth: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  totalRegisteredUsers: number;
  deviceBreakdown: { name: string; value: number; percentage: number }[];
  osBreakdown: { name: string; value: number; percentage: number }[];
  browserBreakdown: { name: string; value: number; percentage: number }[];
  growthData: {
    date: string;
    acessos: number;
    novosUtilizadores: number;
  }[];
  recentAccesses: AccessLog[];
}

const LOCAL_ACCESSES_KEY = 'br_analytics_accesses_v2';
const ANONYMOUS_SESSION_KEY = 'br_analytics_anon_session';

/**
 * Detects device, OS, and browser from window.navigator in a privacy-friendly manner.
 */
export function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return { deviceType: 'Desktop', browser: 'Desconhecido', os: 'Desconhecido' };
  }

  const ua = navigator.userAgent || '';
  
  // Device Type
  let deviceType: 'Mobile' | 'Desktop' | 'Tablet' = 'Desktop';
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    deviceType = 'Tablet';
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|windows phone/i.test(ua)) {
    deviceType = 'Mobile';
  }

  // OS Detection
  let os = 'Outro';
  if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/win/i.test(ua)) os = 'Windows';
  else if (/mac/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  // Browser Detection
  let browser = 'Outro';
  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';

  return { deviceType, browser, os };
}

/**
 * Gets or creates a random anonymous session token for privacy protection.
 */
export function getAnonymousSessionId(): string {
  if (typeof window === 'undefined') return 'sess_server';
  let sid = sessionStorage.getItem(ANONYMOUS_SESSION_KEY);
  if (!sid) {
    sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    sessionStorage.setItem(ANONYMOUS_SESSION_KEY, sid);
  }
  return sid;
}

/**
 * Helper to get local access cache
 */
function getLocalAccesses(): AccessLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_ACCESSES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}
  return [];
}

/**
 * Helper to save local access cache
 */
function saveLocalAccesses(logs: AccessLog[]): void {
  try {
    // Keep max 500 records locally to prevent storage bloat
    const trimmed = logs.slice(0, 500);
    localStorage.setItem(LOCAL_ACCESSES_KEY, JSON.stringify(trimmed));
    window.dispatchEvent(new Event('br_analytics_updated'));
  } catch (_) {}
}

let activeRealtimeChannel: any = null;
let currentPresenceState: Record<string, OnlineUserPresence[]> = {};

export const analyticsService = {
  /**
   * Tracks a page access event in real-time.
   * Respects user privacy (anonymized session, no sensitive personal data stored).
   */
  async trackPageAccess(page: string, userId?: string | null): Promise<void> {
    const device = getDeviceInfo();
    const sessionId = getAnonymousSessionId();

    const log: AccessLog = {
      id: 'acc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      user_id: userId || null,
      session_id: sessionId,
      page: page || '/',
      device_type: device.deviceType,
      browser: device.browser,
      os: device.os,
      created_at: new Date().toISOString()
    };

    // 1. Try Supabase Postgres insert
    try {
      await supabase.from('analytics_accesses').insert([
        {
          user_id: log.user_id,
          session_id: log.session_id,
          page: log.page,
          device_type: log.device_type,
          browser: log.browser,
          os: log.os
        }
      ]);
    } catch (err) {
      console.warn('Analytics Supabase insert note:', err);
    }

    // 2. Save to local fallback cache
    const current = getLocalAccesses();
    current.unshift(log);
    saveLocalAccesses(current);
  },

  /**
   * Initializes real-time user presence tracking using Supabase Realtime Channels.
   */
  initPresence(page: string, userId?: string | null): void {
    const sessionId = getAnonymousSessionId();
    const device = getDeviceInfo();

    const presenceData: OnlineUserPresence = {
      session_id: sessionId,
      user_id: userId || undefined,
      page: page || '/',
      device_type: device.deviceType,
      browser: device.browser,
      os: device.os,
      online_at: new Date().toISOString()
    };

    try {
      if (!activeRealtimeChannel) {
        activeRealtimeChannel = supabase.channel('baza_rapido_presence', {
          config: {
            presence: { key: sessionId }
          }
        });

        activeRealtimeChannel
          .on('presence', { event: 'sync' }, () => {
            currentPresenceState = activeRealtimeChannel.presenceState();
            window.dispatchEvent(new Event('br_presence_updated'));
          })
          .subscribe(async (status: string) => {
            if (status === 'SUBSCRIBED') {
              await activeRealtimeChannel.track(presenceData);
            }
          });
      } else {
        activeRealtimeChannel.track(presenceData);
      }
    } catch (err) {
      console.warn('Supabase presence init fallback:', err);
    }
  },

  /**
   * Subscribes to real-time online presence state.
   */
  subscribeToPresence(onChange: (onlineCount: number, usersList: OnlineUserPresence[]) => void): () => void {
    const handleUpdate = () => {
      const list: OnlineUserPresence[] = [];
      Object.keys(currentPresenceState).forEach((key) => {
        const presences = currentPresenceState[key];
        if (Array.isArray(presences) && presences.length > 0) {
          list.push(presences[presences.length - 1]);
        }
      });

      // Always guarantee at least 1 online user (the current viewer)
      const count = Math.max(list.length, 1);
      onChange(count, list);
    };

    window.addEventListener('br_presence_updated', handleUpdate);
    handleUpdate();

    return () => {
      window.removeEventListener('br_presence_updated', handleUpdate);
    };
  },

  /**
   * Subscribes to real-time postgres changes on analytics_accesses or local events.
   */
  subscribeToAccesses(onNewAccess: () => void): () => void {
    let dbChannel: any = null;

    try {
      dbChannel = supabase
        .channel('public:analytics_accesses')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'analytics_accesses' }, () => {
          onNewAccess();
        })
        .subscribe();
    } catch (_) {}

    const handleLocal = () => onNewAccess();
    window.addEventListener('br_analytics_updated', handleLocal);

    return () => {
      if (dbChannel) supabase.removeChannel(dbChannel);
      window.removeEventListener('br_analytics_updated', handleLocal);
    };
  },

  /**
   * Fetches full analytics summary with real-time stats, time ranges, and device breakdowns.
   */
  async getAnalyticsSummary(timeRange: 'today' | '7days' | '30days' | 'all' = '7days'): Promise<AnalyticsSummary> {
    let dbLogs: AccessLog[] = [];

    // 1. Fetch real logs from Supabase
    try {
      const { data, error } = await supabase
        .from('analytics_accesses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (!error && data && data.length > 0) {
        dbLogs = data.map((d: any) => ({
          id: d.id,
          user_id: d.user_id,
          session_id: d.session_id || 'sess_anon',
          page: d.page || '/',
          device_type: d.device_type || 'Mobile',
          browser: d.browser || 'Chrome',
          os: d.os || 'Android',
          created_at: d.created_at
        }));
      }
    } catch (_) {}

    // Merge with local logs
    const localLogs = getLocalAccesses();
    const map = new Map<string, AccessLog>();
    dbLogs.forEach(l => map.set(l.id, l));
    localLogs.forEach(l => {
      if (!map.has(l.id)) map.set(l.id, l);
    });

    const allLogs = Array.from(map.values());
    allLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Filter by requested timeRange
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const accessesToday = allLogs.filter(l => new Date(l.created_at) >= startOfToday).length;
    const accessesThisWeek = allLogs.filter(l => new Date(l.created_at) >= startOfWeek).length;
    const accessesThisMonth = allLogs.filter(l => new Date(l.created_at) >= startOfMonth).length;

    // Filter logs for selected range
    let filteredLogs = allLogs;
    if (timeRange === 'today') {
      filteredLogs = allLogs.filter(l => new Date(l.created_at) >= startOfToday);
    } else if (timeRange === '7days') {
      filteredLogs = allLogs.filter(l => new Date(l.created_at) >= startOfWeek);
    } else if (timeRange === '30days') {
      filteredLogs = allLogs.filter(l => new Date(l.created_at) >= startOfMonth);
    }

    // Devices breakdown
    const deviceCounts: Record<string, number> = { Mobile: 0, Desktop: 0, Tablet: 0 };
    const osCounts: Record<string, number> = {};
    const browserCounts: Record<string, number> = {};

    filteredLogs.forEach(l => {
      const dev = l.device_type || 'Mobile';
      deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;

      const os = l.os || 'Android';
      osCounts[os] = (osCounts[os] || 0) + 1;

      const br = l.browser || 'Chrome';
      browserCounts[br] = (browserCounts[br] || 0) + 1;
    });

    const totalFiltered = filteredLogs.length || 1;

    const deviceBreakdown = Object.keys(deviceCounts)
      .filter(name => deviceCounts[name] > 0)
      .map(name => ({
        name,
        value: deviceCounts[name],
        percentage: Math.round((deviceCounts[name] / totalFiltered) * 100)
      }));

    const osBreakdown = Object.keys(osCounts)
      .filter(name => osCounts[name] > 0)
      .map(name => ({
        name,
        value: osCounts[name],
        percentage: Math.round((osCounts[name] / totalFiltered) * 100)
      })).sort((a, b) => b.value - a.value);

    const browserBreakdown = Object.keys(browserCounts)
      .filter(name => browserCounts[name] > 0)
      .map(name => ({
        name,
        value: browserCounts[name],
        percentage: Math.round((browserCounts[name] / totalFiltered) * 100)
      })).sort((a, b) => b.value - a.value);

    // Fetch user registrations for growth calculation
    let usersList: any[] = [];
    try {
      const rawUsers = localStorage.getItem('br_admin_users');
      if (rawUsers) usersList = JSON.parse(rawUsers);
    } catch (_) {}

    const newUsersToday = usersList.filter((u: any) => u.registered_at && new Date(u.registered_at) >= startOfToday).length;
    const newUsersThisWeek = usersList.filter((u: any) => u.registered_at && new Date(u.registered_at) >= startOfWeek).length;
    const newUsersThisMonth = usersList.filter((u: any) => u.registered_at && new Date(u.registered_at) >= startOfMonth).length;

    // Time-series growth data (past 7 days or 14 days)
    const growthData: { date: string; acessos: number; novosUtilizadores: number }[] = [];
    const daysToCover = timeRange === 'today' ? 1 : timeRange === '7days' ? 7 : 14;

    for (let i = daysToCover - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const nextD = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      
      const dayLabel = d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });

      const dayAccesses = allLogs.filter(l => {
        const t = new Date(l.created_at);
        return t >= d && t < nextD;
      }).length;

      const dayNewUsers = usersList.filter((u: any) => {
        if (!u.registered_at) return false;
        const t = new Date(u.registered_at);
        return t >= d && t < nextD;
      }).length;

      growthData.push({
        date: dayLabel,
        acessos: dayAccesses,
        novosUtilizadores: dayNewUsers
      });
    }

    // Online presence calculation
    const presenceList: OnlineUserPresence[] = [];
    Object.keys(currentPresenceState).forEach((key) => {
      const item = currentPresenceState[key];
      if (Array.isArray(item) && item.length > 0) {
        presenceList.push(item[item.length - 1]);
      }
    });

    return {
      onlineUsersCount: presenceList.length,
      onlineUsersList: presenceList,
      totalAccesses: allLogs.length,
      accessesToday,
      accessesThisWeek,
      accessesThisMonth,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      totalRegisteredUsers: usersList.length,
      deviceBreakdown,
      osBreakdown,
      browserBreakdown,
      growthData,
      recentAccesses: allLogs.slice(0, 10)
    };
  }
};
