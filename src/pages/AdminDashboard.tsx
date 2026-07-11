import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  ShoppingBag, 
  AlertTriangle, 
  MessageSquare, 
  Grid, 
  BarChart3, 
  Settings2, 
  ShieldAlert, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  ArrowLeft, 
  Sun, 
  Moon, 
  MoreVertical, 
  Filter, 
  LogOut, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  UserX, 
  UserCheck, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Tag, 
  Save, 
  Compass,
  DollarSign,
  Bell,
  CheckCheck,
  Database,
  AlertCircle,
  ShieldCheck,
  Terminal,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { isAdminAuthenticated, getAdminAuthStatus } from '../utils/authHelper';
import { 
  AdminNotification,
  getAdminNotifications,
  addAdminNotification,
  markAsRead,
  markAllAsRead,
  clearNotificationsHistory
} from '../utils/adminNotifications';
import {
  fetchLogsFromSupabase,
  clearSupabaseLogs,
  getLocalLogsCache,
  logSystemEvent,
  SystemLog
} from '../utils/supabaseLogger';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// --- Types ---
interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Ativo' | 'Bloqueado' | 'Suspenso';
  registered_at: string;
  last_access: string;
  ads_count: number;
  avatar_url?: string;
  city: string;
  role: 'Utilizador' | 'Administrador';
}

interface AdminAd {
  id: string;
  title: string;
  category: string;
  city: string;
  price: number;
  status: 'Pendente' | 'Aprovado' | 'Rejeitado';
  advertiser: string;
  advertiser_email: string;
  date: string;
  description: string;
  phone: string;
  image?: string;
}

interface Complaint {
  id: string;
  target_id: string;
  target_name: string;
  target_type: 'Anúncio' | 'Utilizador';
  reason: string;
  reporter: string;
  date: string;
  status: 'Pendente' | 'Resolvido';
}

interface SupportMessage {
  id: string;
  sender_name: string;
  sender_email: string;
  subject: string;
  content: string;
  date: string;
  replied: boolean;
  reply_content: string | null;
}

interface AdminCategory {
  id: string;
  name: string;
  icon: string;
  ads_count: number;
}

interface AppConfig {
  appName: string;
  logoUrl: string;
  heroBanner: string;
  primaryColor: string;
  terms: string;
  privacy: string;
}

// Pre-defined available Lucide icon list for categories
const AVAILABLE_ICONS = [
  { name: 'Carro', value: 'Car' },
  { name: 'Moto', value: 'Compass' },
  { name: 'Shopping', value: 'ShoppingBag' },
  { name: 'Estrela', value: 'Star' },
  { name: 'Etiqueta', value: 'Tag' },
  { name: 'Mapa', value: 'MapPin' },
  { name: 'Escola', value: 'GraduationCap' },
  { name: 'Trabalho', value: 'Briefcase' },
  { name: 'Casa', value: 'Home' }
];

const LUANDA_MUNICIPALITIES = [
  'Luanda', 'Talatona', 'Belas', 'Viana', 'Cazenga', 'Cacuaco', 'Kilamba Kiaxi'
];

export default function AdminDashboard() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  // --- Theme State ---
  const [isAdminDarkMode, setIsAdminDarkMode] = useState(() => {
    return localStorage.getItem('admin_dark_mode') === 'true';
  });

  // --- Active Tab ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'ads' | 'complaints' | 'messages' | 'categories' | 'stats' | 'config' | 'notifications'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // --- Admin Entities States ---
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);

  const [ads, setAds] = useState<AdminAd[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [config, setConfig] = useState<AppConfig>({
    appName: 'Baza Rápido',
    logoUrl: 'https://pbcoftqdqyitgzwyadjc.supabase.co/storage/v1/object/public/Imagens/Fotos%20imagens/ChatGPT%20Image%2018%20de%20mai.%20de%202026,%2009_49_11.png',
    heroBanner: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=1200',
    primaryColor: '#F59E0B',
    terms: 'O Baza Rápido é um agregador de serviços de transporte privado que permite comparar tarifas de táxis em tempo real em Angola.',
    privacy: 'A tua privacidade é nossa prioridade absoluta. Recolhemos coordenadas estritamente para o cálculo imediato de tarifas de rota.'
  });

  // --- Modals State ---
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [viewingUserAds, setViewingUserAds] = useState<AdminUser | null>(null);
  const [viewingUserComplaints, setViewingUserComplaints] = useState<AdminUser | null>(null);
  const [messagingUser, setMessagingUser] = useState<AdminUser | null>(null);
  const [adminMessageText, setAdminMessageText] = useState('');
  const [selectedAd, setSelectedAd] = useState<AdminAd | null>(null);
  const [editingAd, setEditingAd] = useState<AdminAd | null>(null);
  const [replyingMessage, setReplyingMessage] = useState<SupportMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  
  // Category management temp state
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Car');
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);

  // --- Search and Filters ---
  const [userSearch, setUserSearch] = useState('');
  const [userCityFilter, setUserCityFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userRegDateFilter, setUserRegDateFilter] = useState('all');
  const [userSortColumn, setUserSortColumn] = useState<'name' | 'email' | 'registered_at' | 'last_access' | 'ads_count' | 'city' | 'status' | 'role'>('name');
  const [userSortDirection, setUserSortDirection] = useState<'asc' | 'desc'>('asc');
  const [userPage, setUserPage] = useState(1);

  const [adSearch, setAdSearch] = useState('');
  const [adCatFilter, setAdCatFilter] = useState('all');
  const [adCityFilter, setAdCityFilter] = useState('all');
  const [adStatusFilter, setAdStatusFilter] = useState('all');
  
  // Notifications filter states
  const [notifStatusFilter, setNotifStatusFilter] = useState<string>('all');
  const [notifCatFilter, setNotifCatFilter] = useState<string>('all');

  // Supabase central logging state
  const [supabaseLogs, setSupabaseLogs] = useState<SystemLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [supabaseTableExists, setSupabaseTableExists] = useState(true);
  const [supabaseErrorMsg, setSupabaseErrorMsg] = useState('');
  const [selectedLogsTab, setSelectedLogsTab] = useState<'local' | 'supabase'>('local');
  const [expandedLogId, setExpandedLogId] = useState<string | number | null>(null);
  const [logSearchQuery, setLogSearchQuery] = useState('');


  // --- Toast/Status Alert State ---
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showAlert = (type: 'success' | 'error' | 'info', text: string) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 4000);
  };

  // --- Security Check ---
  useEffect(() => {
    if (!loading) {
      const status = getAdminAuthStatus(user);
      if (status.needsRedirectToProfile) {
        console.warn("Redirecionando admin: sessão expirada ou dados incompletos.");
        navigate('/profile');
      } else if (!status.isAdmin && user) {
        console.warn("Acesso negado: Utilizador comum tentou aceder ao painel de administração.");
        navigate('/');
      }
    }
  }, [user, loading, navigate]);

  // --- Real-time Notifications Synchronizer ---
  useEffect(() => {
    setNotifications(getAdminNotifications());

    const handleNewNotification = (e: Event) => {
      const customEvent = e as CustomEvent<AdminNotification>;
      if (customEvent.detail) {
        setNotifications(prev => [customEvent.detail, ...prev]);
      }
    };

    const handleNotificationsUpdated = () => {
      setNotifications(getAdminNotifications());
    };

    window.addEventListener('br_admin_notification_added', handleNewNotification);
    window.addEventListener('br_admin_notifications_updated', handleNotificationsUpdated);

    return () => {
      window.removeEventListener('br_admin_notification_added', handleNewNotification);
      window.removeEventListener('br_admin_notifications_updated', handleNotificationsUpdated);
    };
  }, []);

  // --- Supabase Logs Fetcher & Syncer ---
  const loadSupabaseLogs = async () => {
    setIsLoadingLogs(true);
    const { logs, tableExists, errorMsg } = await fetchLogsFromSupabase();
    setSupabaseLogs(logs);
    setSupabaseTableExists(tableExists);
    setSupabaseErrorMsg(errorMsg || '');
    setIsLoadingLogs(false);
  };

  useEffect(() => {
    if (activeTab === 'notifications') {
      loadSupabaseLogs();
    }
  }, [activeTab]);

  useEffect(() => {
    const handleLogsCacheUpdated = () => {
      if (activeTab === 'notifications') {
        loadSupabaseLogs();
      }
    };
    window.addEventListener('br_supabase_logs_updated', handleLogsCacheUpdated);
    return () => {
      window.removeEventListener('br_supabase_logs_updated', handleLogsCacheUpdated);
    };
  }, [activeTab]);


  const loadAndSyncUsers = async () => {
    try {
      const { data: dbProfiles, error } = await supabase
        .from('profiles')
        .select('*');
      
      let mergedUsers: AdminUser[] = [];
      const savedUsersStr = localStorage.getItem('br_admin_users');
      let localUsers: AdminUser[] = [];
      if (savedUsersStr) {
        try { localUsers = JSON.parse(savedUsersStr); } catch (_) {}
      }

      // Base mock users with detailed properties
      const defaultMockUsers: AdminUser[] = [
        { id: 'usr-1', name: 'Frank Manuel', email: 'frankmanuel123.com@gmail.com', phone: '923000123', status: 'Ativo', registered_at: '2026-05-10', last_access: 'Hoje, 10:24', ads_count: 5, avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150', city: 'Luanda', role: 'Administrador' },
        { id: 'usr-2', name: 'Sebastião Antunes', email: 'sebastiao.ant@gmail.com', phone: '931224455', status: 'Ativo', registered_at: '2026-06-12', last_access: 'Ontem, 18:45', ads_count: 12, avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150', city: 'Talatona', role: 'Utilizador' },
        { id: 'usr-3', name: 'Zandrina Mendes', email: 'zandrina.m@outlook.com', phone: '942881122', status: 'Ativo', registered_at: '2026-06-20', last_access: '28 de Junho, 12:10', ads_count: 0, avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150', city: 'Cazenga', role: 'Utilizador' },
        { id: 'usr-4', name: 'Mateus Catraio', email: 'mateus.cat@gmail.com', phone: '912550099', status: 'Bloqueado', registered_at: '2026-06-01', last_access: '05 de Junho, 09:30', ads_count: 2, avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150', city: 'Viana', role: 'Utilizador' },
        { id: 'usr-5', name: 'Isabel de Carvalho', email: 'isabel.carv@hotmail.com', phone: '925334400', status: 'Suspenso', registered_at: '2026-06-25', last_access: 'Hoje, 08:15', ads_count: 8, avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150', city: 'Belas', role: 'Utilizador' },
        { id: 'usr-6', name: 'Manuel Ventura', email: 'manuel.ventura@gmail.com', phone: '924112233', status: 'Ativo', registered_at: '2026-07-02', last_access: 'Hoje, 11:02', ads_count: 1, avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150', city: 'Cacuaco', role: 'Utilizador' },
        { id: 'usr-7', name: 'Domingos Neto', email: 'domingos.neto@hotmail.com', phone: '933556677', status: 'Ativo', registered_at: '2026-06-30', last_access: '02 de Julho, 14:20', ads_count: 4, avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150', city: 'Kilamba Kiaxi', role: 'Utilizador' }
      ];

      if (error) {
        console.warn('Could not load profiles from Supabase. Using local storage.', error.message);
        mergedUsers = localUsers.length > 0 ? localUsers : defaultMockUsers;
      } else if (!dbProfiles || dbProfiles.length === 0) {
        console.log('Supabase profiles table is empty. Seeding with mock users...');
        mergedUsers = defaultMockUsers;
        
        // Seed database
        for (const u of defaultMockUsers) {
          try {
            await supabase.from('profiles').insert({
              id: u.id,
              name: u.name,
              email: u.email,
              phone: u.phone,
              city: u.city,
              photo_url: u.avatar_url,
              status: u.status,
              role: u.role,
              last_access: u.last_access
            });
          } catch (insertErr) {
            console.warn('Failed to seed user:', u.name, insertErr);
          }
        }
      } else {
        mergedUsers = dbProfiles.map((p: any) => {
          const matchLocal = localUsers.find(lu => lu.id === p.id || lu.email === p.email);
          return {
            id: p.id,
            name: p.name || 'Utilizador Sem Nome',
            email: p.email || 'sem@email.com',
            phone: p.phone || '900000000',
            status: p.status || matchLocal?.status || 'Ativo',
            registered_at: p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : (matchLocal?.registered_at || '2026-06-01'),
            last_access: p.last_access || matchLocal?.last_access || 'Hoje, ' + new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
            ads_count: p.ads_count !== undefined ? p.ads_count : (matchLocal?.ads_count !== undefined ? matchLocal.ads_count : Math.floor(Math.random() * 6)),
            avatar_url: p.photo_url || p.avatar_url || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150`,
            city: p.city || matchLocal?.city || 'Luanda',
            role: p.role || matchLocal?.role || (p.email === 'frankmanuel123.com@gmail.com' ? 'Administrador' : 'Utilizador')
          };
        });

        // Add any missing default mocks
        for (const mu of defaultMockUsers) {
          if (!mergedUsers.some(mu2 => mu2.email === mu.email)) {
            mergedUsers.push(mu);
          }
        }
      }

      setUsers(mergedUsers);
      localStorage.setItem('br_admin_users', JSON.stringify(mergedUsers));
    } catch (e) {
      console.warn('Global error loading users:', e);
      let localUsers: AdminUser[] = [];
      const savedUsersStr = localStorage.getItem('br_admin_users');
      if (savedUsersStr) {
        try { localUsers = JSON.parse(savedUsersStr); } catch (_) {}
      }
      setUsers(localUsers.length > 0 ? localUsers : []);
    }
  };

  // --- Load Initial Mock/Persisted Data ---
  useEffect(() => {
    // 1. App Config
    const savedConfig = localStorage.getItem('br_admin_config');
    if (savedConfig) {
      try { setConfig(JSON.parse(savedConfig)); } catch (_) {}
    }

    // 2. Users
    loadAndSyncUsers();

    // 3. Categories
    const savedCats = localStorage.getItem('br_admin_categories');
    if (savedCats) {
      try { setCategories(JSON.parse(savedCats)); } catch (_) {}
    } else {
      const mockCats: AdminCategory[] = [
        { id: 'cat-1', name: 'Económico', icon: 'Car', ads_count: 24 },
        { id: 'cat-2', name: 'Conforto', icon: 'ShoppingBag', ads_count: 18 },
        { id: 'cat-3', name: 'Executivo', icon: 'Briefcase', ads_count: 9 },
        { id: 'cat-4', name: 'Moto-táxi', icon: 'Compass', ads_count: 42 },
        { id: 'cat-5', name: 'Carrinha/Entregas', icon: 'Home', ads_count: 15 }
      ];
      setCategories(mockCats);
      localStorage.setItem('br_admin_categories', JSON.stringify(mockCats));
    }

    // 4. Ads
    const savedAds = localStorage.getItem('br_admin_ads');
    if (savedAds) {
      try { setAds(JSON.parse(savedAds)); } catch (_) {}
    } else {
      const mockAds: AdminAd[] = [
        { id: 'ad-1', title: 'Corrida Diária Kilamba - Talatona (Partilhado)', category: 'Conforto', city: 'Talatona', price: 1500, status: 'Aprovado', advertiser: 'Sebastião Antunes', advertiser_email: 'sebastiao.ant@gmail.com', date: '2026-06-28', description: 'Procuro 2 passageiros para dividir despesas de combustível de Segunda a Sexta, saída às 07:00.', phone: '931224455' },
        { id: 'ad-2', title: 'Fretes e Entregas Rápidas Viana', category: 'Carrinha/Entregas', city: 'Viana', price: 8000, status: 'Pendente', advertiser: 'Mateus Catraio', advertiser_email: 'mateus.cat@gmail.com', date: '2026-07-01', description: 'Serviço de fretes com carrinha fechada. Preço negociável consoante a distância e volume.', phone: '912550099' },
        { id: 'ad-3', title: 'Moto-táxi Rápido Cacuaco/Talatona', category: 'Moto-táxi', city: 'Cacuaco', price: 800, status: 'Aprovado', advertiser: 'Isabel de Carvalho', advertiser_email: 'isabel.carv@hotmail.com', date: '2026-06-30', description: 'Serviço profissional de moto-táxi rápido e seguro. Capacete higienizado disponível.', phone: '925334400' },
        { id: 'ad-4', title: 'Aluguer de Carro com Motorista - Executivo', category: 'Executivo', city: 'Luanda', price: 35000, status: 'Aprovado', advertiser: 'Frank Manuel', advertiser_email: 'frankmanuel123.com@gmail.com', date: '2026-06-29', description: 'Viatura luxuosa com motorista profissional para eventos corporativos, casamentos ou turismo.', phone: '923000123' },
        { id: 'ad-5', title: 'Táxi Particular Aeroporto - Central Luanda', category: 'Económico', city: 'Belas', price: 5000, status: 'Rejeitado', advertiser: 'Mateus Catraio', advertiser_email: 'mateus.cat@gmail.com', date: '2026-06-24', description: 'Preço fixo sem taxas ocultas. Água e ar condicionado incluídos.', phone: '912550099' }
      ];
      setAds(mockAds);
      localStorage.setItem('br_admin_ads', JSON.stringify(mockAds));
    }

    // 5. Complaints
    const savedComplaints = localStorage.getItem('br_admin_complaints');
    if (savedComplaints) {
      try { setComplaints(JSON.parse(savedComplaints)); } catch (_) {}
    } else {
      const mockComplaints: Complaint[] = [
        { id: 'comp-1', target_id: 'ad-5', target_name: 'Táxi Particular Aeroporto - Central Luanda', target_type: 'Anúncio', reason: 'Preço excessivo e abuso nas tarifas declaradas.', reporter: 'Zandrina Mendes', date: '2026-06-27', status: 'Pendente' },
        { id: 'comp-2', target_id: 'usr-4', target_name: 'Mateus Catraio', target_type: 'Utilizador', reason: 'Contacto telefónico falso e comportamento suspeito.', reporter: 'Sebastião Antunes', date: '2026-06-26', status: 'Pendente' }
      ];
      setComplaints(mockComplaints);
      localStorage.setItem('br_admin_complaints', JSON.stringify(mockComplaints));
    }

    // 6. Support Messages
    const savedMessages = localStorage.getItem('br_admin_messages');
    if (savedMessages) {
      try { setMessages(JSON.parse(savedMessages)); } catch (_) {}
    } else {
      const mockMessages: SupportMessage[] = [
        { id: 'msg-1', sender_name: 'Zandrina Mendes', sender_email: 'zandrina.m@outlook.com', subject: 'Problema no Geocoding', content: 'Ao pesquisar a minha localização atual no Morro Bento, o aplicativo indicou um endereço levemente desviado por 50 metros. Podem verificar a precisão do Google Maps?', date: '2026-07-02', replied: false, reply_content: null },
        { id: 'msg-2', sender_name: 'Sebastião Antunes', sender_email: 'sebastiao.ant@gmail.com', subject: 'Agradecimento Equipa', content: 'Excelente aplicação de comparação de preços! Poupo imenso dinheiro diariamente entre o Yango e o Heetch. Parabéns à equipa de desenvolvimento de Luanda.', date: '2026-06-28', replied: true, reply_content: 'Olá Sebastião! Agradecemos imenso o feedback positivo. Continuamos focados em trazer as melhores estimativas de preço de Luanda!' }
      ];
      setMessages(mockMessages);
      localStorage.setItem('br_admin_messages', JSON.stringify(mockMessages));
    }
  }, []);

  // --- Save states helper ---
  const saveStateToLocalStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // --- Actions ---

  // Theme Toggle
  const toggleTheme = () => {
    const newValue = !isAdminDarkMode;
    setIsAdminDarkMode(newValue);
    localStorage.setItem('admin_dark_mode', String(newValue));
  };

  // User Actions
  const handleEditUser = (u: AdminUser) => {
    setEditingUser({ ...u });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    const updated = users.map(user => user.id === editingUser.id ? editingUser : user);
    setUsers(updated);
    saveStateToLocalStorage('br_admin_users', updated);
    
    // Log event
    await logSystemEvent(
      'Sistema',
      `Perfil de ${editingUser.name} editado`,
      `Informações do utilizador ${editingUser.name} (${editingUser.email}) editadas pelo administrador. Estado: ${editingUser.status}, Função: ${editingUser.role}, Cidade: ${editingUser.city}, Telefone: +244 ${editingUser.phone}`,
      user?.email
    );

    // Sync to Supabase table
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: editingUser.id,
          name: editingUser.name,
          email: editingUser.email,
          phone: editingUser.phone,
          city: editingUser.city,
          photo_url: editingUser.avatar_url,
          status: editingUser.status,
          role: editingUser.role,
          last_access: editingUser.last_access
        });
      if (error) console.warn('Supabase profile update failed:', error.message);
    } catch (err) {
      console.warn('Supabase profile update network error:', err);
    }

    setEditingUser(null);
    showAlert('success', 'Utilizador atualizado com sucesso.');
  };

  const handleChangeUserStatus = async (userId: string, newStatus: 'Ativo' | 'Bloqueado' | 'Suspenso') => {
    const updated = users.map(u => {
      if (u.id === userId) {
        return { ...u, status: newStatus };
      }
      return u;
    });
    setUsers(updated);
    saveStateToLocalStorage('br_admin_users', updated);

    const targetUser = users.find(u => u.id === userId);
    if (targetUser) {
      let msg = '';
      if (newStatus === 'Ativo') msg = `Conta de ${targetUser.name} reativada/desbloqueada`;
      else if (newStatus === 'Bloqueado') msg = `Conta de ${targetUser.name} bloqueada administrativamente`;
      else if (newStatus === 'Suspenso') msg = `Conta de ${targetUser.name} suspensa temporariamente`;

      showAlert('info', `Estado de ${targetUser.name} alterado para ${newStatus}.`);

      // Log action
      await logSystemEvent(
        newStatus === 'Ativo' ? 'Sistema' : 'Segurança',
        msg,
        `O administrador alterou o estado da conta de ${targetUser.name} (${targetUser.email}) para: ${newStatus}.`,
        user?.email
      );

      // Sync to Supabase
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ status: newStatus })
          .eq('id', userId);
        if (error) console.warn('Supabase status update failed:', error.message);
      } catch (err) {
        console.warn('Supabase status update network error:', err);
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    if (window.confirm(`Tem a certeza que deseja eliminar permanentemente o utilizador ${targetUser.name}? Todos os anúncios e dados relacionados serão afetados.`)) {
      const updated = users.filter(u => u.id !== userId);
      setUsers(updated);
      saveStateToLocalStorage('br_admin_users', updated);

      showAlert('success', `Utilizador ${targetUser.name} eliminado com sucesso.`);

      // Log action
      await logSystemEvent(
        'Segurança',
        `Utilizador eliminado: ${targetUser.name}`,
        `O administrador eliminou permanentemente a conta de ${targetUser.name} (${targetUser.email}, telefone: +244 ${targetUser.phone}) do sistema.`,
        user?.email
      );

      // Sync delete to Supabase
      try {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userId);
        if (error) console.warn('Supabase profile delete failed:', error.message);
      } catch (err) {
        console.warn('Supabase profile delete network error:', err);
      }
    }
  };

  const handleSendMessageToUser = async () => {
    if (!messagingUser || !adminMessageText.trim()) return;

    showAlert('success', `Mensagem enviada com sucesso para ${messagingUser.name}.`);

    // Log action to DB and local logs
    await logSystemEvent(
      'Sistema',
      `Mensagem admin enviada para ${messagingUser.name}`,
      `O administrador enviou a seguinte mensagem privada para o utilizador ${messagingUser.name} (${messagingUser.email}): "${adminMessageText}"`,
      user?.email
    );

    setAdminMessageText('');
    setMessagingUser(null);
  };

  // Ad Actions
  const handleApproveAd = (adId: string) => {
    const updated = ads.map(ad => ad.id === adId ? { ...ad, status: 'Aprovado' as const } : ad);
    setAds(updated);
    saveStateToLocalStorage('br_admin_ads', updated);
    showAlert('success', 'Anúncio aprovado com sucesso.');
  };

  const handleRejectAd = (adId: string) => {
    const updated = ads.map(ad => ad.id === adId ? { ...ad, status: 'Rejeitado' as const } : ad);
    setAds(updated);
    saveStateToLocalStorage('br_admin_ads', updated);
    showAlert('info', 'Anúncio rejeitado e notificado.');
  };

  const handleRemoveAd = (adId: string) => {
    if (window.confirm('Eliminar permanentemente este anúncio?')) {
      const updated = ads.filter(ad => ad.id !== adId);
      setAds(updated);
      saveStateToLocalStorage('br_admin_ads', updated);
      showAlert('success', 'Anúncio removido.');
    }
  };

  const handleEditAd = (ad: AdminAd) => {
    setEditingAd({ ...ad });
  };

  const handleSaveAd = () => {
    if (!editingAd) return;
    const updated = ads.map(ad => ad.id === editingAd.id ? editingAd : ad);
    setAds(updated);
    saveStateToLocalStorage('br_admin_ads', updated);
    setEditingAd(null);
    showAlert('success', 'Anúncio modificado com sucesso.');
  };

  // Complaint Actions
  const handleResolveComplaint = (compId: string, action: 'keep' | 'delete') => {
    const comp = complaints.find(c => c.id === compId);
    if (!comp) return;

    if (action === 'delete') {
      if (comp.target_type === 'Anúncio') {
        const updatedAds = ads.filter(a => a.id !== comp.target_id);
        setAds(updatedAds);
        saveStateToLocalStorage('br_admin_ads', updatedAds);
      } else {
        const updatedUsers = users.filter(u => u.id !== comp.target_id);
        setUsers(updatedUsers);
        saveStateToLocalStorage('br_admin_users', updatedUsers);
      }
      showAlert('success', `${comp.target_type} associado foi eliminado.`);
    } else {
      showAlert('info', `Denúncia mantida e arquivada.`);
    }

    const updatedComplaints = complaints.map(c => c.id === compId ? { ...c, status: 'Resolvido' as const } : c);
    setComplaints(updatedComplaints);
    saveStateToLocalStorage('br_admin_complaints', updatedComplaints);
  };

  // Support Message Actions
  const handleSendReply = () => {
    if (!replyingMessage || !replyText.trim()) return;
    const updated = messages.map(msg => {
      if (msg.id === replyingMessage.id) {
        return { ...msg, replied: true, reply_content: replyText };
      }
      return msg;
    });
    setMessages(updated);
    saveStateToLocalStorage('br_admin_messages', updated);
    setReplyingMessage(null);
    setReplyText('');
    showAlert('success', 'Resposta simulada enviada para o utilizador.');
  };

  // Category Actions
  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const newCat: AdminCategory = {
      id: `cat-${Date.now()}`,
      name: newCatName,
      icon: newCatIcon,
      ads_count: 0
    };
    const updated = [...categories, newCat];
    setCategories(updated);
    saveStateToLocalStorage('br_admin_categories', updated);
    setNewCatName('');
    setNewCatIcon('Car');
    showAlert('success', 'Nova categoria criada.');
  };

  const handleEditCategory = (cat: AdminCategory) => {
    setEditingCategory({ ...cat });
  };

  const handleSaveCategory = () => {
    if (!editingCategory) return;
    const updated = categories.map(c => c.id === editingCategory.id ? editingCategory : c);
    setCategories(updated);
    saveStateToLocalStorage('br_admin_categories', updated);
    setEditingCategory(null);
    showAlert('success', 'Categoria alterada.');
  };

  const handleDeleteCategory = (catId: string) => {
    if (window.confirm('Eliminar esta categoria?')) {
      const updated = categories.filter(c => c.id !== catId);
      setCategories(updated);
      saveStateToLocalStorage('br_admin_categories', updated);
      showAlert('success', 'Categoria eliminada.');
    }
  };

  // Config Actions
  const handleSaveConfig = () => {
    localStorage.setItem('br_admin_config', JSON.stringify(config));
    showAlert('success', 'Configurações globais salvas com sucesso.');
  };

  // --- Search Filtering Logic ---
  const userItemsPerPage = 5;

  const filteredUsers = users.filter(u => {
    // 1. Search Query
    const q = userSearch.toLowerCase();
    const matchesSearch = u.name.toLowerCase().includes(q) || 
                          u.email.toLowerCase().includes(q) || 
                          u.phone.includes(q);

    // 2. City Filter
    const matchesCity = userCityFilter === 'all' || u.city === userCityFilter;

    // 3. Status Filter
    const matchesStatus = userStatusFilter === 'all' || u.status === userStatusFilter;

    // 4. Registration Date Filter
    let matchesRegDate = true;
    if (userRegDateFilter !== 'all') {
      const regDate = new Date(u.registered_at);
      const today = new Date();
      if (userRegDateFilter === 'hoje') {
        matchesRegDate = regDate.toDateString() === today.toDateString();
      } else if (userRegDateFilter === 'esta_semana') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);
        matchesRegDate = regDate >= oneWeekAgo && regDate <= today;
      } else if (userRegDateFilter === 'este_mes') {
        matchesRegDate = regDate.getMonth() === today.getMonth() && 
                         regDate.getFullYear() === today.getFullYear();
      }
    }

    return matchesSearch && matchesCity && matchesStatus && matchesRegDate;
  });

  // --- Sorting Logic ---
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let valA = a[userSortColumn];
    let valB = b[userSortColumn];

    if (valA === undefined || valA === null) return 1;
    if (valB === undefined || valB === null) return -1;

    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = (valB as string).toLowerCase();
    }

    if (valA < valB) return userSortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return userSortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // --- Pagination Logic ---
  const totalUserPages = Math.ceil(sortedUsers.length / userItemsPerPage) || 1;
  const paginatedUsers = sortedUsers.slice(
    (userPage - 1) * userItemsPerPage,
    userPage * userItemsPerPage
  );

  const handleSortUsers = (column: typeof userSortColumn) => {
    if (userSortColumn === column) {
      setUserSortDirection(userSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setUserSortColumn(column);
      setUserSortDirection('asc');
    }
    setUserPage(1);
  };

  const filteredAds = ads.filter(a => {
    const q = adSearch.toLowerCase();
    const matchQuery = a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.advertiser.toLowerCase().includes(q);
    const matchCat = adCatFilter === 'all' || a.category === adCatFilter;
    const matchCity = adCityFilter === 'all' || a.city === adCityFilter;
    const matchStatus = adStatusFilter === 'all' || a.status === adStatusFilter;
    return matchQuery && matchCat && matchCity && matchStatus;
  });

  // --- Mock Statistical Charts Data ---
  const statsDailyGrowth = [
    { name: '01/07', users: 2, ads: 3 },
    { name: '02/07', users: 5, ads: 4 },
    { name: '03/07', users: 8, ads: 7 },
    { name: '04/07', users: 12, ads: 11 },
    { name: '05/07', users: 15, ads: 13 },
    { name: '06/07', users: 19, ads: 16 },
    { name: '07/07', users: 24, ads: 20 },
  ];

  const cityAdsData = [
    { name: 'Luanda', value: 45 },
    { name: 'Talatona', value: 30 },
    { name: 'Viana', value: 25 },
    { name: 'Belas', value: 15 },
    { name: 'Cazenga', value: 12 },
    { name: 'Cacuaco', value: 8 }
  ];

  const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#6B7280'];

  // Total Statistics Calculations
  const statsSummary = {
    totalUsers: users.length,
    onlineUsers: users.filter(u => u.last_access.toLowerCase().includes('hoje')).length,
    totalAds: ads.length,
    pendingAds: ads.filter(a => a.status === 'Pendente').length,
    approvedAds: ads.filter(a => a.status === 'Aprovado').length,
    rejectedAds: ads.filter(a => a.status === 'Rejeitado').length,
    totalMessages: messages.length,
    accessCount: 1480
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0) return 'Agora';
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours} h`;
    return `${diffDays} d`;
  };

  const getCategoryDetails = (cat: AdminNotification['category']) => {
    switch (cat) {
      case 'API':
        return { icon: Terminal, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
      case 'Erros':
        return { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' };
      case 'Segurança':
        return { icon: ShieldCheck, color: 'text-orange-500', bg: 'bg-orange-500/10' };
      case 'Sistema':
        return { icon: Database, color: 'text-blue-500', bg: 'bg-blue-500/10' };
      case 'Manutenção':
        return { icon: RefreshCw, color: 'text-purple-500', bg: 'bg-purple-500/10' };
      default:
        return { icon: Bell, color: 'text-gray-500', bg: 'bg-gray-500/10' };
    }
  };

  const filteredNotifications = notifications.filter(n => {
    const matchStatus = 
      notifStatusFilter === 'all' || 
      (notifStatusFilter === 'read' && n.read) || 
      (notifStatusFilter === 'unread' && !n.read);
    const matchCat = notifCatFilter === 'all' || n.category === notifCatFilter;
    return matchStatus && matchCat;
  });


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${isAdminDarkMode ? 'bg-[#0f172a] text-gray-100' : 'bg-gray-50 text-gray-800'}`}>
      
      {/* Alert Banner / Toast notification */}
      <AnimatePresence>
        {alert && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 right-6 z-[9999] flex items-center gap-3 px-6 py-4.5 rounded-2xl shadow-2xl border bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700"
          >
            <div className={`w-3 h-3 rounded-full ${
              alert.type === 'success' ? 'bg-emerald-500' : alert.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
            }`} />
            <span className="text-sm font-black tracking-tight">{alert.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex">

        {/* --- Sidebar Menu --- */}
        <aside className={`fixed lg:sticky top-0 h-screen z-50 border-r transition-all duration-300 flex flex-col shrink-0 ${
          sidebarOpen ? 'w-68' : 'w-0 lg:w-20 overflow-hidden'
        } ${isAdminDarkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-gray-100'}`}>
          
          {/* Sidebar Header */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-inherit">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30 rotate-6">
                <Compass size={20} className="text-white font-black" />
              </div>
              {sidebarOpen && (
                <div className="flex flex-col">
                  <span className="text-lg font-black tracking-tight font-display">BAZA RÁPIDO</span>
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest -mt-1">Painel Admin</span>
                </div>
              )}
            </div>
            {/* Collapse on Mobile */}
            <button 
              onClick={() => setSidebarOpen(false)} 
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              <X size={18} />
            </button>
          </div>

          {/* Sidebar Nav Items */}
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'users', label: 'Utilizadores', icon: Users, badge: users.length },
              { id: 'ads', label: 'Anúncios/Viagens', icon: ShoppingBag, badge: ads.length },
              { id: 'notifications', label: 'Notificações', icon: Bell, badge: notifications.filter(n => !n.read).length || undefined },
              { id: 'complaints', label: 'Denúncias', icon: ShieldAlert, badge: complaints.filter(c => c.status === 'Pendente').length || undefined },
              { id: 'messages', label: 'Mensagens Apoio', icon: MessageSquare, badge: messages.filter(m => !m.replied).length || undefined },
              { id: 'categories', label: 'Categorias', icon: Grid },
              { id: 'stats', label: 'Estatísticas', icon: BarChart3 },
              { id: 'config', label: 'Configurações', icon: Settings2 },
            ].map((item) => {

              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold tracking-tight transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/20' 
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} />
                    {sidebarOpen && <span>{item.label}</span>}
                  </div>
                  {sidebarOpen && item.badge && (
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black ${
                      isActive ? 'bg-white text-amber-600' : 'bg-red-500 text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-inherit">
            <button
              onClick={() => {
                sessionStorage.setItem('bypass_admin_redirect', 'true');
                navigate('/', { replace: true });
              }}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-2xl transition-all cursor-pointer"
            >
              <ArrowLeft size={18} />
              {sidebarOpen && <span>Voltar ao App</span>}
            </button>
          </div>
        </aside>

        {/* --- Main Content Area --- */}
        <div className="flex-1 min-h-screen flex flex-col overflow-x-hidden">
          
          {/* --- Top Bar --- */}
          <header className={`h-20 flex items-center justify-between px-6 lg:px-10 border-b sticky top-0 z-40 backdrop-blur-md ${
            isAdminDarkMode ? 'bg-[#0f172a]/90 border-slate-700/50' : 'bg-white/95 border-gray-100'
          }`}>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 bg-gray-100 dark:bg-slate-800 rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <MoreVertical size={18} className="rotate-90" />
              </button>
              <div className="hidden sm:block">
                <span className="text-xs font-black text-amber-500 uppercase tracking-widest">Painel Administrativo</span>
                <h1 className="text-xl font-black tracking-tight font-display -mt-1 capitalize">{activeTab}</h1>
              </div>
            </div>

            {/* Top Bar actions */}
            <div className="flex items-center gap-4">
              {/* Dark mode Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2.5 bg-gray-100 dark:bg-slate-800 rounded-xl text-gray-600 dark:text-gray-300 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Alternar tema do painel"
              >
                {isAdminDarkMode ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} />}
              </button>

              {/* Profile Card / Signout */}
              <div className="flex items-center gap-3 pl-4 border-l border-gray-100 dark:border-slate-800">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-black tracking-tight">Frank Manuel</p>
                  <p className="text-[10px] font-bold text-emerald-500 -mt-0.5">Administrador Máster</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center font-black text-white text-sm shadow-md">
                  FM
                </div>
              </div>
            </div>
          </header>

          {/* --- Main Contents Container --- */}
          <main className="flex-1 p-6 lg:p-10">

            {/* ==================== TAB: DASHBOARD ==================== */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                
                {/* Stats grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { title: 'Utilizadores Registados', value: statsSummary.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { title: 'Utilizadores Ativos Hoje', value: statsSummary.onlineUsers, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { title: 'Anúncios Publicados', value: statsSummary.totalAds, icon: ShoppingBag, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    { title: 'Anúncios Pendentes', value: statsSummary.pendingAds, icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10', alert: statsSummary.pendingAds > 0 },
                    { title: 'Anúncios Aprovados', value: statsSummary.approvedAds, icon: Check, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { title: 'Anúncios Rejeitados', value: statsSummary.rejectedAds, icon: X, color: 'text-red-500', bg: 'bg-red-500/10' },
                    { title: 'Mensagens Recebidas', value: statsSummary.totalMessages, icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                    { title: 'Visitas/Acessos Totais', value: statsSummary.accessCount, icon: BarChart3, color: 'text-gray-500', bg: 'bg-gray-500/10' }
                  ].map((stat, i) => (
                    <div 
                      key={i} 
                      className={`p-5 rounded-3xl border shadow-sm flex flex-col justify-between relative overflow-hidden transition-all hover:scale-[1.01] ${
                        isAdminDarkMode ? 'bg-[#1e293b] border-slate-800' : 'bg-white border-gray-100'
                      }`}
                    >
                      {stat.alert && (
                        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      )}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-gray-400 tracking-tight">{stat.title}</span>
                        <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                          <stat.icon size={16} />
                        </div>
                      </div>
                      <span className="text-3xl font-black font-display tracking-tight leading-none">
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Growth Chart Section */}
                <div className={`p-6 rounded-3xl border shadow-sm ${
                  isAdminDarkMode ? 'bg-[#1e293b] border-slate-800' : 'bg-white border-gray-100'
                }`}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base font-black tracking-tight font-display">Adesão Diária e Publicações</h3>
                      <p className="text-xs text-gray-400">Estatísticas acumuladas de registo na última semana em Luanda</p>
                    </div>
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 uppercase tracking-widest">Semanal</span>
                  </div>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={statsDailyGrowth}>
                        <defs>
                          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorAds" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isAdminDarkMode ? '#334155' : '#f1f5f9'} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                        <YAxis stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                        <Tooltip />
                        <Area type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" name="Novos Utilizadores" />
                        <Area type="monotone" dataKey="ads" stroke="#F59E0B" strokeWidth={3} fillOpacity={1} fill="url(#colorAds)" name="Novos Anúncios/Viagens" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Two Column Layout for Quick Actions & Flagged Content */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Flagged items brief */}
                  <div className={`p-6 rounded-3xl border shadow-sm ${
                    isAdminDarkMode ? 'bg-[#1e293b] border-slate-800' : 'bg-white border-gray-100'
                  }`}>
                    <h3 className="text-base font-black tracking-tight font-display mb-4 flex items-center gap-2 text-red-500">
                      <ShieldAlert size={18} />
                      Denúncias Recentes Pendentes
                    </h3>
                    <div className="space-y-3.5">
                      {complaints.filter(c => c.status === 'Pendente').map((comp) => (
                        <div 
                          key={comp.id} 
                          className={`p-4 rounded-2xl border flex items-start justify-between ${
                            isAdminDarkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-gray-50 border-gray-100'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                                comp.target_type === 'Anúncio' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-500' : 'bg-blue-100 dark:bg-blue-950/40 text-blue-500'
                              }`}>
                                {comp.target_type}
                              </span>
                              <span className="text-xs font-bold text-gray-400">{comp.date}</span>
                            </div>
                            <h4 className="text-sm font-black tracking-tight mt-1">{comp.target_name}</h4>
                            <p className="text-xs text-red-500 mt-1 font-bold">Motivo: {comp.reason}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Denunciado por: {comp.reporter}</p>
                          </div>
                          <div className="flex gap-1.5 self-center">
                            <button 
                              onClick={() => handleResolveComplaint(comp.id, 'delete')}
                              className="p-1.5 bg-red-500 text-white rounded-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                              title="Remover Conteúdo Denunciado"
                            >
                              <Trash2 size={13} />
                            </button>
                            <button 
                              onClick={() => handleResolveComplaint(comp.id, 'keep')}
                              className="p-1.5 bg-gray-200 dark:bg-slate-700 rounded-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                              title="Ignorar Denúncia"
                            >
                              <Check size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {complaints.filter(c => c.status === 'Pendente').length === 0 && (
                        <div className="text-center py-6 text-gray-400 text-xs font-bold">
                          Nenhuma denúncia pendente! Bom trabalho de moderação.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pending Ads queue brief */}
                  <div className={`p-6 rounded-3xl border shadow-sm ${
                    isAdminDarkMode ? 'bg-[#1e293b] border-slate-800' : 'bg-white border-gray-100'
                  }`}>
                    <h3 className="text-base font-black tracking-tight font-display mb-4 flex items-center gap-2 text-amber-500">
                      <AlertTriangle size={18} />
                      Anúncios Aguardando Aprovação
                    </h3>
                    <div className="space-y-3.5">
                      {ads.filter(a => a.status === 'Pendente').map((ad) => (
                        <div 
                          key={ad.id} 
                          className={`p-4 rounded-2xl border flex items-center justify-between ${
                            isAdminDarkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-gray-50 border-gray-100'
                          }`}
                        >
                          <div>
                            <span className="text-[9px] px-2.5 py-0.5 rounded-full font-black bg-amber-500/10 text-amber-500 uppercase tracking-wider">{ad.category}</span>
                            <h4 className="text-sm font-black tracking-tight mt-1">{ad.title}</h4>
                            <p className="text-xs text-gray-400 mt-0.5">Por: {ad.advertiser} • {ad.city}</p>
                            <p className="text-sm font-black text-amber-500 mt-1">{ad.price.toLocaleString('pt-AO')} Kz</p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleApproveAd(ad.id)}
                              className="p-2 bg-emerald-500 text-white rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                              title="Aprovar Anúncio"
                            >
                              <Check size={14} />
                            </button>
                            <button 
                              onClick={() => handleRejectAd(ad.id)}
                              className="p-2 bg-red-500 text-white rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                              title="Rejeitar Anúncio"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {ads.filter(a => a.status === 'Pendente').length === 0 && (
                        <div className="text-center py-6 text-gray-400 text-xs font-bold">
                          Fila limpa! Todos os anúncios publicados foram moderados.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

               {/* ==================== TAB: GESTÃO DE UTILIZADORES ==================== */}
            {activeTab === 'users' && (() => {
              const totalUsers = users.length;
              const activeToday = users.filter(u => u.last_access.toLowerCase().includes('hoje')).length;
              const newThisWeek = users.filter(u => {
                const reg = new Date(u.registered_at);
                const diffDays = (new Date().getTime() - reg.getTime()) / (1000 * 3600 * 24);
                return diffDays <= 7;
              }).length;
              const blockedUsers = users.filter(u => u.status === 'Bloqueado').length;
              const suspendedUsers = users.filter(u => u.status === 'Suspenso').length;

              const renderSortHeader = (label: string, col: typeof userSortColumn) => {
                const isActive = userSortColumn === col;
                return (
                  <th 
                    onClick={() => handleSortUsers(col)}
                    className="px-5 py-4 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-slate-800/40 transition-all select-none group"
                  >
                    <div className="flex items-center gap-1">
                      <span className={`text-[11px] font-black uppercase tracking-wider ${isActive ? 'text-emerald-500 font-extrabold' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}>
                        {label}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {isActive ? (userSortDirection === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    </div>
                  </th>
                );
              };

              return (
                <div className="space-y-6">
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className={`p-4.5 rounded-2xl border shadow-xs ${isAdminDarkMode ? 'bg-[#1e293b] border-slate-800' : 'bg-white border-gray-100'}`}>
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-wider">Total de Utilizadores</p>
                      <h3 className="text-2xl font-black font-mono tracking-tight text-emerald-500 mt-1">{totalUsers}</h3>
                    </div>
                    <div className={`p-4.5 rounded-2xl border shadow-xs ${isAdminDarkMode ? 'bg-[#1e293b] border-slate-800' : 'bg-white border-gray-100'}`}>
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-wider">Ativos Hoje</p>
                      <h3 className="text-2xl font-black font-mono tracking-tight text-sky-500 mt-1">{activeToday}</h3>
                    </div>
                    <div className={`p-4.5 rounded-2xl border shadow-xs ${isAdminDarkMode ? 'bg-[#1e293b] border-slate-800' : 'bg-white border-gray-100'}`}>
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-wider">Novos esta Semana</p>
                      <h3 className="text-2xl font-black font-mono tracking-tight text-amber-500 mt-1">{newThisWeek}</h3>
                    </div>
                    <div className={`p-4.5 rounded-2xl border shadow-xs ${isAdminDarkMode ? 'bg-[#1e293b] border-slate-800' : 'bg-white border-gray-100'}`}>
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-wider">Contas Bloqueadas</p>
                      <h3 className="text-2xl font-black font-mono tracking-tight text-red-500 mt-1">{blockedUsers}</h3>
                    </div>
                    <div className={`p-4.5 rounded-2xl border shadow-xs ${isAdminDarkMode ? 'bg-[#1e293b] border-slate-800' : 'bg-white border-gray-100'}`}>
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-wider">Contas Suspensas</p>
                      <h3 className="text-2xl font-black font-mono tracking-tight text-orange-500 mt-1">{suspendedUsers}</h3>
                    </div>
                  </div>

                  {/* Filters Bar */}
                  <div className={`p-4 rounded-2xl border shadow-xs grid grid-cols-1 md:grid-cols-4 gap-3 ${isAdminDarkMode ? 'bg-[#1e293b] border-slate-800' : 'bg-white border-gray-100'}`}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input 
                        type="text" 
                        placeholder="Pesquisar por nome, e-mail, telefone..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                          isAdminDarkMode ? 'bg-slate-850 border-slate-700 text-white' : 'bg-gray-50 border-gray-100 text-gray-800'
                        }`}
                      />
                    </div>
                    <div>
                      <select
                        value={userCityFilter}
                        onChange={(e) => setUserCityFilter(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                          isAdminDarkMode ? 'bg-slate-850 border-slate-700 text-white' : 'bg-gray-50 border-gray-100 text-gray-850'
                        }`}
                      >
                        <option value="all">Todas as Cidades/Províncias</option>
                        {LUANDA_MUNICIPALITIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select
                        value={userRegDateFilter}
                        onChange={(e) => setUserRegDateFilter(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                          isAdminDarkMode ? 'bg-slate-850 border-slate-700 text-white' : 'bg-gray-50 border-gray-100 text-gray-850'
                        }`}
                      >
                        <option value="all">Período de Registo (Todos)</option>
                        <option value="hoje">Registados Hoje</option>
                        <option value="esta_semana">Esta Semana</option>
                        <option value="este_mes">Este Mês</option>
                      </select>
                    </div>
                    <div>
                      <select
                        value={userStatusFilter}
                        onChange={(e) => setUserStatusFilter(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                          isAdminDarkMode ? 'bg-slate-850 border-slate-700 text-white' : 'bg-gray-50 border-gray-100 text-gray-850'
                        }`}
                      >
                        <option value="all">Todos os Estados</option>
                        <option value="Ativo">Ativos</option>
                        <option value="Bloqueado">Bloqueados</option>
                        <option value="Suspenso">Suspensos</option>
                      </select>
                    </div>
                  </div>

                  {/* Users Table Card */}
                  <div className={`rounded-3xl border shadow-xs overflow-hidden ${isAdminDarkMode ? 'bg-[#1e293b] border-slate-800' : 'bg-white border-gray-100'}`}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className={`border-b ${isAdminDarkMode ? 'border-slate-800 bg-slate-900/40' : 'border-gray-50 bg-gray-50/50'}`}>
                            {renderSortHeader('Utilizador / Função', 'name')}
                            {renderSortHeader('Contacto', 'email')}
                            {renderSortHeader('Cidade/Província', 'city')}
                            {renderSortHeader('Data de Registo', 'registered_at')}
                            {renderSortHeader('Último Acesso', 'last_access')}
                            {renderSortHeader('Estado', 'status')}
                            {renderSortHeader('Anúncios', 'ads_count')}
                            <th className="px-5 py-4 text-center text-[11px] font-black uppercase text-gray-400">Ações Administrativas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                          {paginatedUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-55/30 dark:hover:bg-slate-800/10 transition-colors">
                              {/* User Info & Avatar */}
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  {u.avatar_url ? (
                                    <img 
                                      src={u.avatar_url} 
                                      alt={u.name} 
                                      referrerPolicy="no-referrer"
                                      className="w-10 h-10 rounded-xl object-cover border border-emerald-500/10"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black text-sm border border-emerald-500/20">
                                      {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <h4 className="text-sm font-black tracking-tight">{u.name}</h4>
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase inline-block mt-0.5 ${
                                      u.role === 'Administrador' 
                                        ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 border border-slate-800 dark:border-white' 
                                        : 'bg-gray-100 dark:bg-slate-800 text-gray-400'
                                    }`}>
                                      {u.role}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Contact Details */}
                              <td className="px-5 py-3.5">
                                <div className="flex flex-col text-xs font-bold gap-0.5">
                                  <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                                    <Mail size={11} className="text-gray-400" />
                                    {u.email}
                                  </span>
                                  <span className="flex items-center gap-1.5 text-gray-400">
                                    <Phone size={11} />
                                    +244 {u.phone}
                                  </span>
                                </div>
                              </td>

                              {/* City */}
                              <td className="px-5 py-3.5 text-xs font-bold text-gray-700 dark:text-gray-300">
                                <span className="flex items-center gap-1">
                                  <MapPin size={11} className="text-emerald-500" />
                                  {u.city}
                                </span>
                              </td>

                              {/* Registered At */}
                              <td className="px-5 py-3.5 text-xs font-bold text-gray-400 font-mono">
                                {u.registered_at}
                              </td>

                              {/* Last Access */}
                              <td className="px-5 py-3.5 text-xs font-bold text-gray-400 font-mono">
                                {u.last_access}
                              </td>

                              {/* Status Badge */}
                              <td className="px-5 py-3.5">
                                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase ${
                                  u.status === 'Ativo' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500 border border-emerald-350' : 
                                  u.status === 'Bloqueado' ? 'bg-red-100 dark:bg-red-950/40 text-red-500 border border-red-350' : 
                                  'bg-orange-100 dark:bg-orange-950/40 text-orange-500 border border-orange-350'
                                }`}>
                                  {u.status === 'Ativo' ? 'Ativa' : u.status === 'Bloqueado' ? 'Bloqueada' : 'Suspensa'}
                                </span>
                              </td>

                              {/* Ads count */}
                              <td className="px-5 py-3.5 font-black text-xs font-mono text-center md:text-left text-gray-800 dark:text-white">
                                {u.ads_count}
                              </td>

                              {/* Administrative Actions */}
                              <td className="px-5 py-3.5">
                                <div className="flex items-center justify-center gap-1.5">
                                  {/* View Profile */}
                                  <button 
                                    onClick={() => setSelectedUser(u)}
                                    className="p-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-300 rounded-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                    title="Ver Perfil Completo"
                                  >
                                    <Eye size={12} />
                                  </button>

                                  {/* Edit Info */}
                                  <button 
                                    onClick={() => handleEditUser(u)}
                                    className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                    title="Editar Informações"
                                  >
                                    <Edit2 size={12} />
                                  </button>

                                  {/* Status Changer trigger */}
                                  <div className="flex gap-1 border-l border-r border-gray-100 dark:border-slate-800 px-1.5">
                                    {u.status !== 'Ativo' && (
                                      <button
                                        onClick={() => handleChangeUserStatus(u.id, 'Ativo')}
                                        className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                        title="Reativar / Desbloquear"
                                      >
                                        <UserCheck size={12} />
                                      </button>
                                    )}
                                    {u.status !== 'Bloqueado' && (
                                      <button
                                        onClick={() => handleChangeUserStatus(u.id, 'Bloqueado')}
                                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                        title="Bloquear Conta"
                                      >
                                        <UserX size={12} />
                                      </button>
                                    )}
                                    {u.status !== 'Suspenso' && (
                                      <button
                                        onClick={() => handleChangeUserStatus(u.id, 'Suspenso')}
                                        className="p-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 rounded-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                        title="Suspender Conta"
                                      >
                                        <AlertTriangle size={12} />
                                      </button>
                                    )}
                                  </div>

                                  {/* View User Ads */}
                                  <button 
                                    onClick={() => setViewingUserAds(u)}
                                    className="p-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 rounded-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                    title="Ver Anúncios Publicados"
                                  >
                                    <ShoppingBag size={12} />
                                  </button>

                                  {/* View complaints */}
                                  <button 
                                    onClick={() => setViewingUserComplaints(u)}
                                    className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                    title="Ver Denúncias Recebidas"
                                  >
                                    <ShieldAlert size={12} />
                                  </button>

                                  {/* Send Message */}
                                  <button 
                                    onClick={() => setMessagingUser(u)}
                                    className="p-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 rounded-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                    title="Enviar Mensagem Privada"
                                  >
                                    <MessageSquare size={12} />
                                  </button>

                                  {/* Delete permanently */}
                                  <button 
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="p-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-600 rounded-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                    title="Eliminar Conta"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}

                          {paginatedUsers.length === 0 && (
                            <tr>
                              <td colSpan={8} className="text-center py-10 text-gray-400 text-xs font-black">
                                Nenhum utilizador encontrado com os filtros selecionados.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className={`px-6 py-4 flex items-center justify-between border-t ${
                      isAdminDarkMode ? 'border-slate-800 bg-slate-900/10' : 'bg-gray-50/20 border-gray-100'
                    }`}>
                      <div className="text-xs text-gray-400 font-bold">
                        A mostrar <span className="text-emerald-500 font-black font-mono">{paginatedUsers.length}</span> de <span className="text-gray-900 dark:text-white font-mono">{sortedUsers.length}</span> resultados filtrados
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setUserPage(p => Math.max(1, p - 1))}
                          disabled={userPage === 1}
                          className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-black rounded-lg disabled:opacity-40 cursor-pointer select-none"
                        >
                          Anterior
                        </button>
                        <span className="text-xs font-black text-gray-400">
                          Página <span className="text-emerald-500 font-mono">{userPage}</span> de <span className="text-gray-900 dark:text-white font-mono">{totalUserPages}</span>
                        </span>
                        <button
                          onClick={() => setUserPage(p => Math.min(totalUserPages, p + 1))}
                          disabled={userPage === totalUserPages}
                          className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-black rounded-lg disabled:opacity-40 cursor-pointer select-none"
                        >
                          Seguinte
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ==================== TAB: GESTÃO DE ANÚNCIOS ==================== */}
            {activeTab === 'ads' && (
              <div className="space-y-6">
                
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black font-display tracking-tight">Gestão de Anúncios</h2>
                  <button
                    onClick={() => navigate('/create-ad')}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-2xl flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                  >
                    <Plus size={14} /> Novo Anúncio
                  </button>
                </div>

                {/* Search, Filter, Stats Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <div className="relative lg:col-span-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Pesquisar anúncios por título, anunciante..."
                      value={adSearch}
                      onChange={(e) => setAdSearch(e.target.value)}
                      className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border text-sm font-bold tracking-tight focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        isAdminDarkMode ? 'bg-[#1e293b] border-slate-700 text-white focus:border-amber-500' : 'bg-white border-gray-100 text-gray-800'
                      }`}
                    />
                  </div>
                  
                  {/* Category Filter */}
                  <div className="relative">
                    <select
                      value={adCatFilter}
                      onChange={(e) => setAdCatFilter(e.target.value)}
                      className={`w-full px-4 py-3.5 rounded-2xl border text-sm font-bold tracking-tight focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        isAdminDarkMode ? 'bg-[#1e293b] border-slate-700 text-white' : 'bg-white border-gray-100 text-gray-800'
                      }`}
                    >
                      <option value="all">Todas as Categorias</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div className="relative">
                    <select
                      value={adStatusFilter}
                      onChange={(e) => setAdStatusFilter(e.target.value)}
                      className={`w-full px-4 py-3.5 rounded-2xl border text-sm font-bold tracking-tight focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        isAdminDarkMode ? 'bg-[#1e293b] border-slate-700 text-white' : 'bg-white border-gray-100 text-gray-800'
                      }`}
                    >
                      <option value="all">Todos os Estados</option>
                      <option value="Aprovado">Aprovado</option>
                      <option value="Pendente">Pendente</option>
                      <option value="Rejeitado">Rejeitado</option>
                    </select>
                  </div>
                </div>

                {/* Ads Table */}
                <div className={`rounded-3xl border shadow-sm overflow-hidden ${
                  isAdminDarkMode ? 'bg-[#1e293b] border-slate-800' : 'bg-white border-gray-100'
                }`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`border-b text-xs font-black uppercase text-gray-400 ${
                          isAdminDarkMode ? 'border-slate-800 bg-slate-900/40' : 'border-gray-50 bg-gray-50/50'
                        }`}>
                          <th className="px-6 py-4.5">Anúncio</th>
                          <th className="px-6 py-4.5">Categoria</th>
                          <th className="px-6 py-4.5">Anunciante</th>
                          <th className="px-6 py-4.5">Preço</th>
                          <th className="px-6 py-4.5">Estado</th>
                          <th className="px-6 py-4.5 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {filteredAds.map((a) => (
                          <tr key={a.id} className="hover:bg-gray-50/40 dark:hover:bg-slate-800/20 transition-all">
                            <td className="px-6 py-4">
                              <div>
                                <h4 className="text-sm font-black tracking-tight">{a.title}</h4>
                                <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5 mt-0.5">
                                  <MapPin size={10} /> {a.city} • Criado em {a.date}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-bold text-gray-500 dark:text-gray-300">
                                {a.category}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-0.5 text-xs font-bold">
                                <span>{a.advertiser}</span>
                                <span className="text-gray-400">{a.advertiser_email}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-black text-amber-500 text-sm">
                              {a.price.toLocaleString('pt-AO')} Kz
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] px-2.5 py-1 rounded-full font-black ${
                                a.status === 'Aprovado' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500' :
                                a.status === 'Pendente' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-500' :
                                'bg-red-100 dark:bg-red-950/40 text-red-500'
                              }`}>
                                {a.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button 
                                  onClick={() => setSelectedAd(a)}
                                  className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-200 rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                  title="Ver Detalhes do Anúncio"
                                >
                                  <Eye size={13} />
                                </button>
                                <button 
                                  onClick={() => navigate(`/edit-ad/${a.id}`)}
                                  className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                  title="Editar Anúncio"
                                >
                                  <Edit2 size={13} />
                                </button>
                                {a.status === 'Pendente' && (
                                  <>
                                    <button 
                                      onClick={() => handleApproveAd(a.id)}
                                      className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                      title="Aprovar"
                                    >
                                      <Check size={13} />
                                    </button>
                                    <button 
                                      onClick={() => handleRejectAd(a.id)}
                                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                      title="Rejeitar"
                                    >
                                      <X size={13} />
                                    </button>
                                  </>
                                )}
                                <button 
                                  onClick={() => handleRemoveAd(a.id)}
                                  className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                  title="Excluir Anúncio"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* ==================== TAB: DENÚNCIAS ==================== */}
            {activeTab === 'complaints' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Flagged Ads List */}
                  <div className={`p-6 rounded-3xl border shadow-sm ${
                    isAdminDarkMode ? 'bg-[#1e293b] border-slate-800' : 'bg-white border-gray-100'
                  }`}>
                    <h3 className="text-base font-black tracking-tight font-display mb-4 flex items-center gap-2">
                      <AlertTriangle className="text-red-500" size={18} />
                      Denúncias de Anúncios / Viagens
                    </h3>
                    <div className="space-y-4">
                      {complaints.filter(c => c.target_type === 'Anúncio').map(comp => (
                        <div 
                          key={comp.id} 
                          className={`p-5 rounded-2xl border flex flex-col justify-between ${
                            isAdminDarkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-gray-50 border-gray-100'
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-start">
                              <span className={`text-[10px] px-2.5 py-1 rounded-full font-black ${
                                comp.status === 'Pendente' ? 'bg-red-500/10 text-red-500' : 'bg-gray-500/10 text-gray-500'
                              }`}>
                                {comp.status}
                              </span>
                              <span className="text-xs font-bold text-gray-400">{comp.date}</span>
                            </div>
                            <h4 className="text-sm font-black tracking-tight mt-3">{comp.target_name}</h4>
                            <p className="text-xs text-red-500 font-bold mt-1.5 bg-red-500/5 p-2 rounded-xl border border-red-500/10">Motivo: {comp.reason}</p>
                            <p className="text-[10px] text-gray-400 mt-2">Denunciante: {comp.reporter}</p>
                          </div>
                          {comp.status === 'Pendente' && (
                            <div className="flex gap-2.5 mt-4 border-t border-gray-100 dark:border-slate-800 pt-3">
                              <button 
                                onClick={() => handleResolveComplaint(comp.id, 'delete')}
                                className="flex-1 flex items-center justify-center gap-1 px-4 py-2 bg-red-500 text-white font-black text-xs rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                              >
                                <Trash2 size={13} /> Eliminar Anúncio
                              </button>
                              <button 
                                onClick={() => handleResolveComplaint(comp.id, 'keep')}
                                className="flex-1 flex items-center justify-center gap-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 font-black text-xs rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                              >
                                <Check size={13} /> Manter Conteúdo
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Flagged Users List */}
                  <div className={`p-6 rounded-3xl border shadow-sm ${
                    isAdminDarkMode ? 'bg-[#1e293b] border-slate-800' : 'bg-white border-gray-100'
                  }`}>
                    <h3 className="text-base font-black tracking-tight font-display mb-4 flex items-center gap-2">
                      <Users className="text-red-500" size={18} />
                      Denúncias de Perfis de Utilizadores
                    </h3>
                    <div className="space-y-4">
                      {complaints.filter(c => c.target_type === 'Utilizador').map(comp => (
                        <div 
                          key={comp.id} 
                          className={`p-5 rounded-2xl border flex flex-col justify-between ${
                            isAdminDarkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-gray-50 border-gray-100'
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-start">
                              <span className={`text-[10px] px-2.5 py-1 rounded-full font-black ${
                                comp.status === 'Pendente' ? 'bg-red-500/10 text-red-500' : 'bg-gray-500/10 text-gray-500'
                              }`}>
                                {comp.status}
                              </span>
                              <span className="text-xs font-bold text-gray-400">{comp.date}</span>
                            </div>
                            <h4 className="text-sm font-black tracking-tight mt-3">{comp.target_name}</h4>
                            <p className="text-xs text-red-500 font-bold mt-1.5 bg-red-500/5 p-2 rounded-xl border border-red-500/10">Motivo: {comp.reason}</p>
                            <p className="text-[10px] text-gray-400 mt-2">Denunciante: {comp.reporter}</p>
                          </div>
                          {comp.status === 'Pendente' && (
                            <div className="flex gap-2.5 mt-4 border-t border-gray-100 dark:border-slate-800 pt-3">
                              <button 
                                onClick={() => handleResolveComplaint(comp.id, 'delete')}
                                className="flex-1 flex items-center justify-center gap-1 px-4 py-2 bg-red-500 text-white font-black text-xs rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                              >
                                <Trash2 size={13} /> Banir Utilizador
                              </button>
                              <button 
                                onClick={() => handleResolveComplaint(comp.id, 'keep')}
                                className="flex-1 flex items-center justify-center gap-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 font-black text-xs rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                              >
                                <Check size={13} /> Arquivar Denúncia
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TAB: MENSAGENS APOIO ==================== */}
            {activeTab === 'messages' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Messages list */}
                  <div className={`lg:col-span-2 p-6 rounded-3xl border shadow-sm space-y-4 ${
                    isAdminDarkMode ? 'bg-[#1e293b] border-slate-800' : 'bg-white border-gray-100'
                  }`}>
                    <h3 className="text-base font-black tracking-tight font-display mb-2">Mensagens de Suporte Recebidas</h3>
                    <div className="space-y-3.5">
                      {messages.map((msg) => (
                        <div 
                          key={msg.id}
                          className={`p-5 rounded-2xl border flex flex-col justify-between ${
                            isAdminDarkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-gray-50 border-gray-100'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black ${
                                msg.replied ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500' : 'bg-amber-100 dark:bg-amber-950/40 text-amber-500'
                              }`}>
                                {msg.replied ? 'Respondido' : 'Pendente'}
                              </span>
                              <h4 className="text-sm font-black tracking-tight mt-2">{msg.subject}</h4>
                              <p className="text-[11px] text-gray-400 font-bold mt-0.5">Por: {msg.sender_name} ({msg.sender_email}) • {msg.date}</p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-300 mt-3 italic bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700">
                            "{msg.content}"
                          </p>
                          {msg.replied && msg.reply_content && (
                            <div className="mt-3 pl-3.5 border-l-2 border-amber-500">
                              <p className="text-[10px] font-black text-amber-500 uppercase tracking-wide">Resposta Enviada:</p>
                              <p className="text-xs text-gray-400 italic mt-0.5">"{msg.reply_content}"</p>
                            </div>
                          )}
                          {!msg.replied && (
                            <button 
                              onClick={() => setReplyingMessage(msg)}
                              className="mt-4 self-end flex items-center gap-1 px-4 py-2 bg-amber-500 text-white font-black text-xs rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                            >
                              <MessageSquare size={13} /> Responder Utilizador
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Simulator Reply Box */}
                  <div className="lg:col-span-1">
                    <AnimatePresence mode="wait">
                      {replyingMessage ? (
                        <motion.div 
                          key="reply-active"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
                            isAdminDarkMode ? 'bg-[#1e293b] border-slate-800' : 'bg-white border-gray-100'
                          }`}
                        >
                          <h3 className="text-sm font-black tracking-tight uppercase text-amber-500">Responder Ticket</h3>
                          <p className="text-xs font-bold text-gray-400">A responder a {replyingMessage.sender_name}</p>
                          
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400">Texto de Resposta</label>
                            <textarea
                              rows={5}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Escreva a resposta que o utilizador irá receber no e-mail..."
                              className={`w-full p-3.5 rounded-2xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                                isAdminDarkMode ? 'bg-[#0f172a] border-slate-700 text-white' : 'bg-gray-50 border-gray-100 text-gray-800'
                              }`}
                            />
                          </div>

                          <div className="flex gap-2">
                            <button 
                              onClick={handleSendReply}
                              className="flex-1 px-4 py-2.5 bg-amber-500 text-white font-black text-xs rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                            >
                              Enviar Email
                            </button>
                            <button 
                              onClick={() => setReplyingMessage(null)}
                              className="px-4 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-400 font-bold text-xs rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        <div className={`p-6 rounded-3xl border shadow-sm text-center py-12 text-gray-400 text-xs font-bold ${
                          isAdminDarkMode ? 'bg-[#1e293b] border-slate-800' : 'bg-white border-gray-100'
                        }`}>
                          Selecione uma mensagem pendente para enviar uma resposta instantânea.
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TAB: CATEGORIAS ==================== */}
            {activeTab === 'categories' && (
              <div className="space-y-6">
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Category editor card */}
                  <div className={`p-6 rounded-3xl border shadow-sm space-y-4 h-fit ${
                    isAdminDarkMode ? 'bg-[#1e293b] border-slate-800' : 'bg-white border-gray-100'
                  }`}>
                    <h3 className="text-base font-black tracking-tight font-display">
                      {editingCategory ? 'Editar Categoria' : 'Criar Nova Categoria'}
                    </h3>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400">Nome da Categoria</label>
                      <input 
                        type="text" 
                        value={editingCategory ? editingCategory.name : newCatName}
                        onChange={(e) => editingCategory ? setEditingCategory({ ...editingCategory, name: e.target.value }) : setNewCatName(e.target.value)}
                        placeholder="Ex: Moto-táxi, Económico, Executivo..."
                        className={`w-full px-4 py-3 rounded-2xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                          isAdminDarkMode ? 'bg-[#0f172a] border-slate-700 text-white' : 'bg-gray-50 border-gray-100 text-gray-800'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400">Escolher Ícone representativo</label>
                      <div className="grid grid-cols-3 gap-2">
                        {AVAILABLE_ICONS.map((ico) => {
                          const currentIcon = editingCategory ? editingCategory.icon : newCatIcon;
                          const isSel = currentIcon === ico.value;
                          return (
                            <button
                              key={ico.value}
                              onClick={() => editingCategory ? setEditingCategory({ ...editingCategory, icon: ico.value }) : setNewCatIcon(ico.value)}
                              className={`p-3 border rounded-xl flex flex-col items-center gap-1 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer ${
                                isSel ? 'border-amber-500 bg-amber-500/10 text-amber-500 font-bold' : 'border-gray-100 dark:border-slate-800 text-gray-400'
                              }`}
                            >
                              <Compass size={16} />
                              <span className="text-[10px] truncate w-full text-center">{ico.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {editingCategory ? (
                      <div className="flex gap-2">
                        <button 
                          onClick={handleSaveCategory}
                          className="flex-1 py-3 bg-amber-500 text-white font-black text-xs rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                        >
                          Salvar Alteração
                        </button>
                        <button 
                          onClick={() => setEditingCategory(null)}
                          className="px-4 py-3 bg-gray-100 dark:bg-slate-800 text-gray-400 font-bold text-xs rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={handleAddCategory}
                        className="w-full py-3 bg-amber-500 text-white font-black text-xs rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                      >
                        Criar Categoria
                      </button>
                    )}
                  </div>

                  {/* List of categories */}
                  <div className={`lg:col-span-2 p-6 rounded-3xl border shadow-sm ${
                    isAdminDarkMode ? 'bg-[#1e293b] border-slate-800' : 'bg-white border-gray-100'
                  }`}>
                    <h3 className="text-base font-black tracking-tight font-display mb-4">Categorias Ativas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categories.map((cat) => (
                        <div 
                          key={cat.id}
                          className={`p-4 rounded-2xl border flex items-center justify-between ${
                            isAdminDarkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-gray-50 border-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black">
                              <Compass size={18} />
                            </div>
                            <div>
                              <h4 className="text-sm font-black tracking-tight">{cat.name}</h4>
                              <p className="text-[10px] text-gray-400 font-bold">Anúncios associados: {cat.ads_count}</p>
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            <button 
                              onClick={() => handleEditCategory(cat)}
                              className="p-2 bg-blue-500/10 text-blue-500 rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                              title="Editar Categoria"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button 
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                              title="Eliminar Categoria"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ==================== TAB: ESTATÍSTICAS ==================== */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Category usage stats */}
                  <div className={`p-6 rounded-3xl border shadow-sm ${
                    isAdminDarkMode ? 'bg-[#1e293b] border-slate-800' : 'bg-white border-gray-100'
                  }`}>
                    <h3 className="text-base font-black tracking-tight font-display mb-4">Volume de Anúncios por Município</h3>
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={cityAdsData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isAdminDarkMode ? '#334155' : '#f1f5f9'} />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                          <YAxis stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                          <Tooltip />
                          <Bar dataKey="value" fill="#F59E0B" radius={[8, 8, 0, 0]}>
                            {cityAdsData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Category breakdown stats (PieChart) */}
                  <div className={`p-6 rounded-3xl border shadow-sm ${
                    isAdminDarkMode ? 'bg-[#1e293b] border-slate-800' : 'bg-white border-gray-100'
                  }`}>
                    <h3 className="text-base font-black tracking-tight font-display mb-4">Distribuição de Categorias</h3>
                    <div className="h-72 w-full flex items-center justify-center relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categories}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="ads_count"
                            nameKey="name"
                          >
                            {categories.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ==================== TAB: CONFIGURAÇÕES ==================== */}
            {activeTab === 'config' && (
              <div className="space-y-6">
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* General settings form */}
                  <div className={`lg:col-span-2 p-6 rounded-3xl border shadow-sm space-y-4 ${
                    isAdminDarkMode ? 'bg-[#1e293b] border-slate-800' : 'bg-white border-gray-100'
                  }`}>
                    <h3 className="text-base font-black tracking-tight font-display">Informações e Imagem do Aplicativo</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400">Nome do Aplicativo</label>
                        <input 
                          type="text"
                          value={config.appName}
                          onChange={(e) => setConfig({ ...config, appName: e.target.value })}
                          className={`w-full px-4 py-3.5 rounded-2xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                            isAdminDarkMode ? 'bg-[#0f172a] border-slate-700 text-white' : 'bg-white border-gray-100 text-gray-800'
                          }`}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400">Cor Principal (Brand Color)</label>
                        <div className="flex items-center gap-3">
                          <input 
                            type="color"
                            value={config.primaryColor}
                            onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                            className="w-11 h-11 border-none bg-transparent rounded-xl cursor-pointer"
                          />
                          <span className="text-sm font-black tracking-tight font-mono">{config.primaryColor}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400">Logótipo do Aplicativo (URL)</label>
                      <input 
                        type="text"
                        value={config.logoUrl}
                        onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                        className={`w-full px-4 py-3.5 rounded-2xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                          isAdminDarkMode ? 'bg-[#0f172a] border-slate-700 text-white' : 'bg-white border-gray-100 text-gray-800'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400">Banner Principal Home (URL)</label>
                      <input 
                        type="text"
                        value={config.heroBanner}
                        onChange={(e) => setConfig({ ...config, heroBanner: e.target.value })}
                        className={`w-full px-4 py-3.5 rounded-2xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                          isAdminDarkMode ? 'bg-[#0f172a] border-slate-700 text-white' : 'bg-white border-gray-100 text-gray-800'
                        }`}
                      />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                      <h4 className="text-sm font-black tracking-tight uppercase text-amber-500">Legal e Termos</h4>
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400">Termos e Condições</label>
                        <textarea 
                          rows={4}
                          value={config.terms}
                          onChange={(e) => setConfig({ ...config, terms: e.target.value })}
                          className={`w-full p-3.5 rounded-2xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                            isAdminDarkMode ? 'bg-[#0f172a] border-slate-700 text-white' : 'bg-[#fcfdfd] border-gray-100 text-gray-800'
                          }`}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400">Política de Privacidade</label>
                        <textarea 
                          rows={4}
                          value={config.privacy}
                          onChange={(e) => setConfig({ ...config, privacy: e.target.value })}
                          className={`w-full p-3.5 rounded-2xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                            isAdminDarkMode ? 'bg-[#0f172a] border-slate-700 text-white' : 'bg-[#fcfdfd] border-gray-100 text-gray-800'
                          }`}
                        />
                      </div>
                    </div>

                    <button 
                      onClick={handleSaveConfig}
                      className="w-full py-4 bg-amber-500 text-white font-black text-sm rounded-2xl hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Save size={16} /> Salvar Alterações Globais
                    </button>
                  </div>

                  {/* App info Preview Card */}
                  <div className="space-y-6">
                    <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
                      isAdminDarkMode ? 'bg-[#1e293b] border-slate-800' : 'bg-white border-gray-100'
                    }`}>
                      <h3 className="text-sm font-black tracking-tight uppercase text-amber-500">Visualização na Home</h3>
                      <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800">
                        <img src={config.heroBanner} className="w-full h-32 object-cover" alt="Banner Preview" />
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 text-center">
                          <img src={config.logoUrl} className="w-12 h-12 rounded-2xl object-cover mx-auto -mt-10 border-4 border-white dark:border-slate-800 bg-white" alt="Logo" />
                          <h4 className="text-base font-black mt-2">{config.appName}</h4>
                          <p className="text-xs text-gray-400 mt-1">Cores: {config.primaryColor}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ==================== TAB: NOTIFICATIONS ==================== */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                
                {/* Header controls with tab switcher */}
                <div className={`p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                  isAdminDarkMode ? 'bg-[#1e293b] border-slate-800' : 'bg-white border-gray-100'
                }`}>
                  <div>
                    <h2 className="text-xl font-black tracking-tight font-display flex items-center gap-2">
                      <Bell size={24} className="text-amber-500" /> Central de Logs & Alertas
                    </h2>
                    <p className="text-xs text-gray-400 font-bold mt-1">
                      Monitorização integrada de eventos disparados no main.tsx e persistidos na base de dados Supabase.
                    </p>
                  </div>
                  
                  {/* Selector Segment */}
                  <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl border border-gray-200/50 dark:border-slate-700/50">
                    <button
                      onClick={() => setSelectedLogsTab('local')}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                        selectedLogsTab === 'local'
                          ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                      }`}
                    >
                      <Bell size={14} /> Alertas de Interface
                    </button>
                    <button
                      onClick={() => {
                        setSelectedLogsTab('supabase');
                        loadSupabaseLogs();
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                        selectedLogsTab === 'supabase'
                          ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                      }`}
                    >
                      <Database size={14} /> Base de Dados Supabase
                    </button>
                  </div>
                </div>

                {selectedLogsTab === 'local' ? (
                  <div className="space-y-6">
                    {/* Local Actions Row */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <h3 className="text-sm font-black tracking-wider uppercase text-amber-500 flex items-center gap-2">
                        <Terminal size={14} /> Notificações Temporárias de Sessão
                      </h3>
                      
                      <div className="flex flex-wrap gap-2.5">
                        <button
                          onClick={() => {
                            const categoriesList: AdminNotification['category'][] = ['API', 'Erros', 'Segurança', 'Sistema', 'Manutenção'];
                            const titlesList = {
                              API: ['API conectada com sucesso', 'Sincronização de Rotas Concluída', 'Ping do servidor do mapa: 24ms'],
                              Erros: ['Falha ao carregar anúncios', 'Serviço de Preços Offline (Erro 503)', 'Erro ao salvar rota local'],
                              Segurança: ['Tentativa de acesso não autorizado', 'Múltiplas tentativas de Login', 'Acesso negado à rota /admin'],
                              Sistema: ['Base de dados sincronizada', 'Cache local purgado com sucesso', 'Backup diário efetuado'],
                              Manutenção: ['Servidor em manutenção programada', 'Limpeza de logs antigos efetuada', 'Otimização de índices concluída']
                            };
                            const category = categoriesList[Math.floor(Math.random() * categoriesList.length)];
                            const titles = titlesList[category];
                            const title = titles[Math.floor(Math.random() * titles.length)];
                            const descriptions = {
                              API: 'A conexão com o endpoint de geolocalização e cálculo de distância está operando normalmente.',
                              Erros: 'Ocorreu um erro ao carregar os dados de anúncios. O sistema retornou código de estado de rede anormal.',
                              Segurança: 'Uma tentativa suspeita de acesso a recursos administrativos foi detetada e bloqueada temporariamente.',
                              Sistema: 'O banco de dados local do Baza Rápido foi sincronizado com os servidores de nuvem.',
                              Manutenção: 'Tarefas de manutenção rotineiras foram aplicadas com sucesso pelo script de automatização do servidor.'
                            };
                            
                            addAdminNotification(category, title, descriptions[category]);
                            showAlert('success', 'Nova notificação técnica simulada em tempo real!');
                          }}
                          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-500/10"
                        >
                          <Plus size={14} /> Simular Alerta Técnico
                        </button>
                        
                        <button
                          onClick={() => {
                            markAllAsRead();
                            showAlert('success', 'Todas as notificações foram marcadas como lidas.');
                          }}
                          className="px-4 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 text-xs font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5 border border-amber-500/20"
                        >
                          <CheckCheck size={14} /> Marcar todas como lidas
                        </button>
                        
                        <button
                          onClick={() => {
                            if (window.confirm('Tem a certeza que deseja limpar todo o histórico de notificações?')) {
                              clearNotificationsHistory();
                              showAlert('info', 'Histórico de notificações limpo.');
                            }
                          }}
                          className="px-4 py-2.5 bg-red-500/15 hover:bg-red-500/25 text-red-500 text-xs font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5 border border-red-500/20"
                        >
                          <Trash2 size={14} /> Limpar Histórico
                        </button>
                      </div>
                    </div>

                    {/* Filters Row */}
                    <div className={`p-4 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                      isAdminDarkMode ? 'bg-[#1e293b] border-slate-800' : 'bg-white border-gray-100'
                    }`}>
                      {/* Read/Unread Filters */}
                      <div className="flex gap-2">
                        {[
                          { id: 'all', label: 'Todas' },
                          { id: 'unread', label: `Não Lidas (${notifications.filter(n => !n.read).length})` },
                          { id: 'read', label: 'Lidas' }
                        ].map(f => (
                          <button
                            key={f.id}
                            onClick={() => setNotifStatusFilter(f.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-tight transition-all cursor-pointer ${
                              notifStatusFilter === f.id
                                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                                : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>

                      {/* Category Filters */}
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'all', label: 'Categorias: Todas' },
                          { id: 'API', label: 'API' },
                          { id: 'Erros', label: 'Erros' },
                          { id: 'Segurança', label: 'Segurança' },
                          { id: 'Sistema', label: 'Sistema' },
                          { id: 'Manutenção', label: 'Manutenção' }
                        ].map(c => (
                          <button
                            key={c.id}
                            onClick={() => setNotifCatFilter(c.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-tight transition-all border cursor-pointer ${
                              notifCatFilter === c.id
                                ? 'bg-gray-900 text-white dark:bg-slate-200 dark:text-gray-900 border-transparent'
                                : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 border-gray-100 dark:border-slate-800'
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Notifications List */}
                    <div className="space-y-3.5">
                      {filteredNotifications.length === 0 ? (
                        <div className={`p-10 rounded-3xl border text-center space-y-3 ${
                          isAdminDarkMode ? 'bg-[#1e293b] border-slate-800' : 'bg-white border-gray-100'
                        }`}>
                          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-gray-400 dark:text-gray-500">
                            <Bell size={20} />
                          </div>
                          <div className="max-w-xs mx-auto">
                            <p className="text-sm font-black tracking-tight">Sem notificações</p>
                            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                              Não foram encontradas notificações correspondentes aos filtros selecionados.
                            </p>
                          </div>
                        </div>
                      ) : (
                        filteredNotifications.map((notif) => {
                          const details = getCategoryDetails(notif.category);
                          const CatIcon = details.icon;
                          
                          return (
                            <motion.div
                              key={notif.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`p-4 rounded-2xl border flex items-start gap-4 transition-all relative ${
                                !notif.read 
                                  ? 'border-amber-500/30 dark:border-amber-500/20 shadow-sm' 
                                  : 'border-gray-100 dark:border-slate-800'
                              } ${
                                isAdminDarkMode 
                                  ? !notif.read ? 'bg-amber-500/5' : 'bg-[#1e293b]' 
                                  : !notif.read ? 'bg-amber-50/20' : 'bg-white'
                              }`}
                            >
                              <div className={`p-2.5 rounded-xl ${details.bg} ${details.color} shrink-0`}>
                                <CatIcon size={18} />
                              </div>

                              <div className="flex-1 min-w-0 pr-12">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${details.bg} ${details.color}`}>
                                    {notif.category}
                                  </span>
                                  <span className="text-[10px] font-bold text-gray-400">
                                    {formatRelativeTime(notif.timestamp)}
                                  </span>
                                  {!notif.read && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  )}
                                </div>
                                <h4 className="text-sm font-black tracking-tight mt-1.5 leading-snug">
                                  {notif.title}
                                </h4>
                                <p className="text-xs text-gray-400 dark:text-gray-400 font-medium leading-relaxed mt-1">
                                  {notif.description}
                                </p>
                              </div>

                              <div className="absolute right-4 top-4 flex items-center gap-1.5">
                                {!notif.read && (
                                  <button
                                    onClick={() => {
                                      markAsRead(notif.id);
                                      showAlert('success', 'Notificação marcada como lida.');
                                    }}
                                    className="p-1.5 bg-gray-100 hover:bg-amber-500 hover:text-white dark:bg-slate-800 dark:hover:bg-amber-500 rounded-lg text-gray-400 transition-all cursor-pointer"
                                    title="Marcar como lida"
                                  >
                                    <Check size={14} />
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Connection Banner Check */}
                    {supabaseTableExists ? (
                      <div className="p-5 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                            <ShieldCheck size={24} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 text-left">
                              <h3 className="text-sm font-black text-emerald-800 dark:text-emerald-400">Ligação Supabase Ativa</h3>
                              <span className="px-2 py-0.5 text-[8px] font-black bg-emerald-500 text-white rounded uppercase tracking-wider animate-pulse">● NUVEM</span>
                            </div>
                            <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 font-bold mt-1 text-left">
                              A tabela <code className="bg-emerald-500/10 px-1 py-0.5 rounded font-mono">system_logs</code> está conectada. Todos os erros de API, erros de fetch e geolocalização do <code className="bg-emerald-500/10 px-1 py-0.5 rounded font-mono">main.tsx</code> estão a ser salvos em tempo real.
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-500/10 px-3 py-1.5 rounded-xl font-bold self-start md:self-auto border border-emerald-500/10">
                          Tabela: system_logs
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-3xl border border-amber-500/30 bg-amber-500/5 space-y-4 text-left">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                            <AlertCircle size={24} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-black text-amber-800 dark:text-amber-500">Tabela 'system_logs' não detetada no Supabase</h3>
                              <span className="px-2 py-0.5 text-[8px] font-black bg-amber-500 text-white rounded uppercase tracking-wider">● EM ATENÇÃO</span>
                            </div>
                            <p className="text-xs text-amber-700/80 dark:text-amber-400/80 font-bold mt-1.5 leading-relaxed">
                              O sistema está a interceptar erros de rede, de APIs e exceções globais com sucesso, guardando-os no <span className="underline">cache local do navegador</span> para não perder dados!
                            </p>
                            <p className="text-xs text-amber-700/60 dark:text-amber-400/60 font-bold mt-1 leading-relaxed">
                              Para ativar a sincronização na nuvem com o seu Supabase, crie uma tabela executando o script abaixo no menu <strong>SQL Editor</strong> do painel Supabase do utilizador:
                            </p>
                          </div>
                        </div>

                        {/* Monospace Code Editor block */}
                        <div className="relative rounded-2xl overflow-hidden border border-amber-500/20 bg-slate-900 text-slate-300 p-4 font-mono text-[11px] leading-relaxed select-all">
                          <div className="absolute top-2 right-2 text-[9px] uppercase font-black tracking-widest text-slate-500 bg-slate-800 px-2 py-1 rounded">SQL Editor</div>
                          <pre className="overflow-x-auto whitespace-pre">
{`CREATE TABLE system_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  details TEXT,
  user_email TEXT
);

-- Configurar RLS e Políticas
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inserção pública para telemetria" ON system_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Apenas leitura permitida" ON system_logs FOR SELECT USING (true);`}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Supabase Logs Actions & Filters Row */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Search Bar */}
                      <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border flex-1 ${
                        isAdminDarkMode ? 'bg-[#1e293b] border-slate-800 text-white' : 'bg-white border-gray-100 text-gray-900'
                      }`}>
                        <Search size={16} className="text-gray-400" />
                        <input
                          type="text"
                          placeholder="Filtrar logs por mensagem, detalhes ou e-mail..."
                          value={logSearchQuery}
                          onChange={(e) => setLogSearchQuery(e.target.value)}
                          className="bg-transparent border-none outline-none text-xs w-full font-bold placeholder-gray-400"
                        />
                        {logSearchQuery && (
                          <button onClick={() => setLogSearchQuery('')} className="text-xs font-bold text-gray-400 hover:text-gray-600">
                            Limpar
                          </button>
                        )}
                      </div>

                      {/* DB Controls */}
                      <div className="flex flex-wrap gap-2.5 self-end lg:self-auto">
                        <button
                          onClick={loadSupabaseLogs}
                          disabled={isLoadingLogs}
                          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-500/10"
                        >
                          <RefreshCw size={14} className={isLoadingLogs ? 'animate-spin' : ''} />
                          {isLoadingLogs ? 'A carregar...' : 'Atualizar Base de Dados'}
                        </button>

                        <button
                          onClick={async () => {
                            if (window.confirm('Tem a certeza que deseja limpar todos os registos de logs na base de dados? Esta ação é irreversível.')) {
                              const ok = await clearSupabaseLogs();
                              if (ok) {
                                showAlert('success', 'Logs eliminados com sucesso!');
                                loadSupabaseLogs();
                              } else {
                                showAlert('error', 'Falha ao apagar logs na nuvem. Limpo localmente.');
                              }
                            }
                          }}
                          className="px-4 py-2.5 bg-red-500/15 hover:bg-red-500/25 text-red-500 text-xs font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5 border border-red-500/20"
                        >
                          <Trash2 size={14} /> Limpar Logs
                        </button>
                      </div>
                    </div>

                    {/* Developer Terminal Display Log Feed */}
                    <div className="space-y-3 text-left">
                      {isLoadingLogs ? (
                        <div className={`p-12 rounded-3xl border text-center space-y-4 ${
                          isAdminDarkMode ? 'bg-[#1e293b] border-slate-800' : 'bg-white border-gray-100'
                        }`}>
                          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                          <p className="text-xs text-gray-400 font-bold">A consultar base de dados centralizada no Supabase...</p>
                        </div>
                      ) : (() => {
                        const sourceLogs = (supabaseTableExists && supabaseLogs.length > 0) ? supabaseLogs : getLocalLogsCache();
                        
                        const filteredLogs = sourceLogs.filter(log => {
                          const query = logSearchQuery.toLowerCase();
                          return (
                            log.message.toLowerCase().includes(query) ||
                            (log.details || '').toLowerCase().includes(query) ||
                            (log.user_email || '').toLowerCase().includes(query) ||
                            log.category.toLowerCase().includes(query)
                          );
                        });

                        if (filteredLogs.length === 0) {
                          return (
                            <div className={`p-10 rounded-3xl border text-center space-y-3 ${
                              isAdminDarkMode ? 'bg-[#1e293b] border-slate-800' : 'bg-white border-gray-100'
                            }`}>
                              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-gray-400">
                                <Database size={20} />
                              </div>
                              <div className="max-w-xs mx-auto">
                                <p className="text-sm font-black tracking-tight">Sem logs guardados</p>
                                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                  Nenhum evento técnico gravado de momento no Supabase ou cache local.
                                </p>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between px-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest font-mono">
                              <span>Feed de Eventos Interceptados</span>
                              <span>Exibindo {filteredLogs.length} registos {(supabaseTableExists && supabaseLogs.length > 0) ? 'da Nuvem' : '(Sessão Local)'}</span>
                            </div>

                            {filteredLogs.map((log, index) => {
                              const uniqueId = log.id || `local-log-${index}`;
                              const isExpanded = expandedLogId === uniqueId;
                              const timestampStr = log.created_at ? new Date(log.created_at).toLocaleString('pt-PT') : new Date().toLocaleString('pt-PT');
                              
                              let catColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
                              if (log.category === 'Erros') catColor = 'text-red-500 bg-red-500/10 border-red-500/20';
                              else if (log.category === 'Segurança') catColor = 'text-rose-600 bg-rose-500/10 border-rose-500/20';
                              else if (log.category === 'API') catColor = 'text-blue-500 bg-blue-500/10 border-blue-500/20';
                              else if (log.category === 'Sistema') catColor = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';

                              return (
                                <div
                                  key={uniqueId}
                                  className={`rounded-2xl border transition-all overflow-hidden ${
                                    isExpanded 
                                      ? 'border-amber-500/40 bg-slate-950 text-slate-100 shadow-xl' 
                                      : `${isAdminDarkMode ? 'bg-[#1e293b] border-slate-800' : 'bg-white border-gray-100'} hover:border-gray-300 dark:hover:border-slate-700`
                                  }`}
                                >
                                  {/* Log Header Row */}
                                  <div
                                    onClick={() => setExpandedLogId(isExpanded ? null : uniqueId)}
                                    className="p-4 flex items-start gap-4 cursor-pointer select-none"
                                  >
                                    <span className={`text-[9px] px-2 py-1 rounded font-black uppercase tracking-wider font-mono border ${catColor}`}>
                                      {log.category}
                                    </span>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap text-[10px] text-gray-400 font-mono">
                                        <span className="font-black text-amber-500/80">{timestampStr}</span>
                                        <span>•</span>
                                        <span>Utilizador: {log.user_email}</span>
                                      </div>
                                      <h4 className={`text-xs font-bold tracking-tight mt-1.5 font-mono ${isExpanded ? 'text-white' : 'text-gray-900 dark:text-slate-100'}`}>
                                        {log.message}
                                      </h4>
                                    </div>

                                    <button className="text-gray-400 hover:text-gray-600 text-[10px] font-black uppercase font-mono px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-800">
                                      {isExpanded ? 'Fechar' : 'Detalhes'}
                                    </button>
                                  </div>

                                  {/* Expanded details */}
                                  {isExpanded && (
                                    <div className="border-t border-slate-800 bg-slate-950 p-4 space-y-3 font-mono text-xs text-left">
                                      <div>
                                        <span className="text-gray-500 text-[10px] uppercase font-black tracking-widest block">Mensagem Técnica:</span>
                                        <p className="text-amber-400 mt-0.5 leading-relaxed">{log.message}</p>
                                      </div>
                                      
                                      <div>
                                        <span className="text-gray-500 text-[10px] uppercase font-black tracking-widest block">Metadados & Detalhes Interceptados:</span>
                                        <pre className="bg-[#0f172a] p-3 rounded-xl text-green-400 overflow-x-auto whitespace-pre-wrap max-h-60 mt-1 leading-relaxed border border-slate-800 text-[11px]">
                                          {log.details || 'Sem detalhes técnicos adicionais.'}
                                        </pre>
                                      </div>

                                      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-slate-900">
                                        <span>Utilizador Afetado: <strong className="text-slate-300">{log.user_email}</strong></span>
                                        <span>ID: <strong className="text-slate-400">{uniqueId}</strong></span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

          </main>
        </div>
      </div>

      {/* ==================== MODALS ==================== */}

      {/* 1. Modal: Ver Perfil Completo de Utilizador */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[999]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-5 m-4 ${
                isAdminDarkMode ? 'bg-[#1e293b] border-slate-800 text-white' : 'bg-white border-gray-100 text-gray-800'
              }`}
            >
              <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
                <h3 className="text-lg font-black tracking-tight font-display flex items-center gap-2">
                  <Users size={20} className="text-amber-500" /> Detalhes do Perfil
                </h3>
                <button onClick={() => setSelectedUser(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 font-black text-xl flex items-center justify-center">
                  {selectedUser.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="text-base font-black tracking-tight leading-none">{selectedUser.name}</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase inline-block mt-1.5 ${
                    selectedUser.status === 'Ativo' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500' : 'bg-red-100 dark:bg-red-950/40 text-red-500'
                  }`}>
                    {selectedUser.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
                <div className={`p-3.5 rounded-2xl ${isAdminDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
                  <p className="text-gray-400">E-mail</p>
                  <p className="text-sm font-black tracking-tight mt-0.5">{selectedUser.email}</p>
                </div>
                <div className={`p-3.5 rounded-2xl ${isAdminDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
                  <p className="text-gray-400">Telefone / WhatsApp</p>
                  <p className="text-sm font-black tracking-tight mt-0.5">+244 {selectedUser.phone}</p>
                </div>
                <div className={`p-3.5 rounded-2xl ${isAdminDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
                  <p className="text-gray-400">Data de Registo</p>
                  <p className="text-sm font-black tracking-tight mt-0.5">{selectedUser.registered_at}</p>
                </div>
                <div className={`p-3.5 rounded-2xl ${isAdminDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
                  <p className="text-gray-400">Último Acesso Registado</p>
                  <p className="text-sm font-black tracking-tight mt-0.5">{selectedUser.last_access}</p>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isAdminDarkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-gray-50/50 border-gray-100'
              }`}>
                <div>
                  <p className="text-xs text-gray-400 font-bold">Total de anúncios ativos</p>
                  <h4 className="text-base font-black tracking-tight mt-0.5">{selectedUser.ads_count} anúncios publicados</h4>
                </div>
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                  <ShoppingBag size={18} />
                </div>
              </div>

              <button 
                onClick={() => setSelectedUser(null)}
                className="w-full py-3 bg-gray-100 dark:bg-slate-800 font-black text-xs rounded-2xl cursor-pointer"
              >
                Fechar Detalhes
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Modal: Editar Perfil de Utilizador */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[999]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-4 m-4 ${
                isAdminDarkMode ? 'bg-[#1e293b] border-slate-800 text-white' : 'bg-white border-gray-100 text-gray-800'
              }`}
            >
              <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
                <h3 className="text-lg font-black tracking-tight font-display flex items-center gap-2">
                  <Edit2 size={18} className="text-blue-500" /> Editar Perfil
                </h3>
                <button onClick={() => setEditingUser(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 text-xs font-bold">
                <div className="space-y-1.5">
                  <label className="text-gray-400">Nome Completo</label>
                  <input 
                    type="text" 
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className={`w-full px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isAdminDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-100'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-gray-400">E-mail</label>
                  <input 
                    type="email" 
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className={`w-full px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isAdminDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-100'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-gray-400">Número de Telefone</label>
                  <input 
                    type="text" 
                    value={editingUser.phone}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className={`w-full px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isAdminDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-100'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-gray-400">Estado da Conta</label>
                  <select 
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}
                    className={`w-full px-4 py-3 rounded-2xl border focus:outline-none ${
                      isAdminDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-100'
                    }`}
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Bloqueado">Bloqueado</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button 
                  onClick={handleSaveUser}
                  className="flex-1 py-3 bg-amber-500 text-white font-black text-xs rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  Salvar Alterações
                </button>
                <button 
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-3 bg-gray-100 dark:bg-slate-800 font-bold text-xs rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Ver Anúncios de Utilizador */}
      <AnimatePresence>
        {viewingUserAds && (() => {
          const userAds = ads.filter(a => a.advertiser === viewingUserAds.name);
          return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[999]">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`w-full max-w-3xl p-6 rounded-3xl border shadow-2xl space-y-4 m-4 overflow-y-auto max-h-[85vh] ${
                  isAdminDarkMode ? 'bg-[#1e293b] border-slate-800 text-white' : 'bg-white border-gray-100 text-gray-800'
                }`}
              >
                <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
                  <h3 className="text-lg font-black tracking-tight font-display flex items-center gap-2">
                    <ShoppingBag size={20} className="text-purple-500" /> Anúncios Publicados por {viewingUserAds.name}
                  </h3>
                  <button onClick={() => setViewingUserAds(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3">
                  {userAds.map(ad => (
                    <div key={ad.id} className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                      isAdminDarkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-gray-50 border-gray-100'
                    }`}>
                      <div className="flex items-center gap-3">
                        {ad.image ? (
                          <img 
                            src={ad.image} 
                            alt={ad.title} 
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-xl object-cover border border-purple-500/10"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-black text-xs">
                            SEM FOTO
                          </div>
                        )}
                        <div>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-500 tracking-wider">
                            {ad.category}
                          </span>
                          <h4 className="text-sm font-black tracking-tight mt-1">{ad.title}</h4>
                          <p className="text-[10px] text-gray-400 font-bold">Local: {ad.city} • {ad.price.toLocaleString('pt-AO')} Kz</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase ${
                          ad.status === 'Aprovado' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500' :
                          ad.status === 'Pendente' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-500' :
                          'bg-red-100 dark:bg-red-950/40 text-red-500'
                        }`}>
                          {ad.status}
                        </span>
                        {ad.status === 'Pendente' && (
                          <button 
                            onClick={() => { handleApproveAd(ad.id); }}
                            className="p-1.5 bg-emerald-500 text-white rounded-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            title="Aprovar"
                          >
                            <Check size={12} />
                          </button>
                        )}
                        {ad.status !== 'Rejeitado' && (
                          <button 
                            onClick={() => { handleRejectAd(ad.id); }}
                            className="p-1.5 bg-red-500 text-white rounded-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            title="Rejeitar"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {userAds.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-xs font-black">
                      Este utilizador ainda não publicou anúncios no Baza Rápido.
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button 
                    onClick={() => setViewingUserAds(null)}
                    className="w-full py-3 bg-gray-100 dark:bg-slate-800 font-black text-xs rounded-2xl cursor-pointer"
                  >
                    Fechar Lista de Anúncios
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Modal: Ver Denúncias de Utilizador */}
      <AnimatePresence>
        {viewingUserComplaints && (() => {
          const userComplaints = complaints.filter(c => 
            c.target_name.toLowerCase().includes(viewingUserComplaints.name.toLowerCase())
          );
          return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[999]">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`w-full max-w-2xl p-6 rounded-3xl border shadow-2xl space-y-4 m-4 overflow-y-auto max-h-[85vh] ${
                  isAdminDarkMode ? 'bg-[#1e293b] border-slate-800 text-white' : 'bg-white border-gray-100 text-gray-800'
                }`}
              >
                <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
                  <h3 className="text-lg font-black tracking-tight font-display flex items-center gap-2">
                    <ShieldAlert size={20} className="text-red-500" /> Denúncias Recebidas contra {viewingUserComplaints.name}
                  </h3>
                  <button onClick={() => setViewingUserComplaints(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3">
                  {userComplaints.map(comp => (
                    <div key={comp.id} className={`p-4 rounded-2xl border flex items-start justify-between gap-4 ${
                      isAdminDarkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-gray-50 border-gray-100'
                    }`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                            comp.target_type === 'Anúncio' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-500' : 'bg-blue-100 dark:bg-blue-950/40 text-blue-500'
                          }`}>
                            {comp.target_type}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold">{comp.date}</span>
                        </div>
                        <h4 className="text-sm font-black tracking-tight mt-1">{comp.target_name}</h4>
                        <p className="text-xs text-red-500 mt-1 font-bold">Motivo: {comp.reason}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Autor da denúncia: {comp.reporter}</p>
                      </div>
                      <div className="flex items-center gap-2 self-center">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase ${
                          comp.status === 'Resolvido' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500' : 'bg-red-100 dark:bg-red-950/40 text-red-500'
                        }`}>
                          {comp.status}
                        </span>
                        {comp.status === 'Pendente' && (
                          <div className="flex gap-1">
                            <button 
                              onClick={() => { handleResolveComplaint(comp.id, 'delete'); }}
                              className="p-1.5 bg-red-500 text-white rounded-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                              title="Remover Conteúdo"
                            >
                              <Trash2 size={12} />
                            </button>
                            <button 
                              onClick={() => { handleResolveComplaint(comp.id, 'keep'); }}
                              className="p-1.5 bg-gray-200 dark:bg-slate-700 rounded-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                              title="Ignorar"
                            >
                              <Check size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {userComplaints.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-xs font-black">
                      Não existem denúncias registadas contra este utilizador.
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button 
                    onClick={() => setViewingUserComplaints(null)}
                    className="w-full py-3 bg-gray-100 dark:bg-slate-800 font-black text-xs rounded-2xl cursor-pointer"
                  >
                    Fechar Lista de Denúncias
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Modal: Enviar Mensagem Direta */}
      <AnimatePresence>
        {messagingUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[999]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-4 m-4 ${
                isAdminDarkMode ? 'bg-[#1e293b] border-slate-800 text-white' : 'bg-white border-gray-100 text-gray-800'
              }`}
            >
              <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
                <h3 className="text-lg font-black tracking-tight font-display flex items-center gap-2">
                  <MessageSquare size={18} className="text-teal-500" /> Enviar Mensagem a {messagingUser.name}
                </h3>
                <button onClick={() => setMessagingUser(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 text-xs font-bold">
                <p className="text-gray-400 leading-relaxed">
                  O utilizador receberá esta mensagem de administração de forma prioritária na sua caixa de entrada e centro de notificações no Baza Rápido.
                </p>

                <div className="space-y-1.5">
                  <label className="text-gray-400">Mensagem Direta</label>
                  <textarea 
                    rows={4}
                    placeholder="Escreve aqui o aviso, alerta de segurança, notificação de manutenção, ou qualquer esclarecimento administrativo..."
                    value={adminMessageText}
                    onChange={(e) => setAdminMessageText(e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs font-medium leading-relaxed ${
                      isAdminDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-100'
                    }`}
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button 
                  onClick={handleSendMessageToUser}
                  className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  Enviar Mensagem Privada
                </button>
                <button 
                  onClick={() => setMessagingUser(null)}
                  className="px-4 py-3 bg-gray-100 dark:bg-slate-800 font-bold text-xs rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Modal: Ver Detalhes do Anúncio */}
      <AnimatePresence>
        {selectedAd && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[999]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-4 m-4 overflow-y-auto max-h-[90vh] ${
                isAdminDarkMode ? 'bg-[#1e293b] border-slate-800 text-white' : 'bg-white border-gray-100 text-gray-800'
              }`}
            >
              <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
                <h3 className="text-lg font-black tracking-tight font-display flex items-center gap-2">
                  <ShoppingBag size={20} className="text-amber-500" /> Detalhes do Anúncio
                </h3>
                <button onClick={() => setSelectedAd(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3.5 text-xs font-bold">
                <div>
                  <span className="text-[10px] px-2.5 py-1 rounded-full font-black bg-amber-500/10 text-amber-500 uppercase tracking-wide inline-block">{selectedAd.category}</span>
                  <h4 className="text-base font-black tracking-tight mt-2 leading-snug">{selectedAd.title}</h4>
                  <p className="text-lg font-black text-amber-500 mt-1">{selectedAd.price.toLocaleString('pt-AO')} Kz</p>
                </div>

                <div className={`p-4 rounded-2xl ${isAdminDarkMode ? 'bg-slate-800' : 'bg-gray-50'} space-y-2`}>
                  <p className="text-gray-400">Descrição do Anúncio</p>
                  <p className="text-sm font-medium leading-relaxed italic">"{selectedAd.description}"</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-xl ${isAdminDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
                    <p className="text-gray-400">Anunciante</p>
                    <p className="text-sm font-black tracking-tight mt-0.5">{selectedAd.advertiser}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${isAdminDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
                    <p className="text-gray-400">Contacto WhatsApp</p>
                    <p className="text-sm font-black tracking-tight mt-0.5">+244 {selectedAd.phone}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${isAdminDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
                    <p className="text-gray-400">Localização / Cidade</p>
                    <p className="text-sm font-black tracking-tight mt-0.5">{selectedAd.city}, Angola</p>
                  </div>
                  <div className={`p-3 rounded-xl ${isAdminDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
                    <p className="text-gray-400">Data de Publicação</p>
                    <p className="text-sm font-black tracking-tight mt-0.5">{selectedAd.date}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center py-2 border-t border-b border-gray-100 dark:border-slate-800">
                  <span className="text-gray-400">Estado de Moderação:</span>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase ${
                    selectedAd.status === 'Aprovado' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500' :
                    selectedAd.status === 'Pendente' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-500' :
                    'bg-red-100 dark:bg-red-950/40 text-red-500'
                  }`}>
                    {selectedAd.status}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {selectedAd.status === 'Pendente' && (
                  <>
                    <button 
                      onClick={() => { handleApproveAd(selectedAd.id); setSelectedAd(null); }}
                      className="flex-1 py-3 bg-emerald-500 text-white font-black text-xs rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                    >
                      Aprovar Anúncio
                    </button>
                    <button 
                      onClick={() => { handleRejectAd(selectedAd.id); setSelectedAd(null); }}
                      className="flex-1 py-3 bg-red-500 text-white font-black text-xs rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                    >
                      Rejeitar Anúncio
                    </button>
                  </>
                )}
                <button 
                  onClick={() => setSelectedAd(null)}
                  className="px-4 py-3 bg-gray-100 dark:bg-slate-800 text-gray-400 font-bold text-xs rounded-2xl cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Modal: Editar Anúncio */}
      <AnimatePresence>
        {editingAd && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[999]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-4 m-4 overflow-y-auto max-h-[90vh] ${
                isAdminDarkMode ? 'bg-[#1e293b] border-slate-800 text-white' : 'bg-white border-gray-100 text-gray-800'
              }`}
            >
              <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
                <h3 className="text-lg font-black tracking-tight font-display flex items-center gap-2">
                  <Edit2 size={18} className="text-blue-500" /> Editar Anúncio
                </h3>
                <button onClick={() => setEditingAd(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3.5 text-xs font-bold">
                <div className="space-y-1.5">
                  <label className="text-gray-400">Título do Anúncio</label>
                  <input 
                    type="text" 
                    value={editingAd.title}
                    onChange={(e) => setEditingAd({ ...editingAd, title: e.target.value })}
                    className={`w-full px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isAdminDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-100'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-gray-400">Categoria</label>
                    <select
                      value={editingAd.category}
                      onChange={(e) => setEditingAd({ ...editingAd, category: e.target.value })}
                      className={`w-full px-4 py-3 rounded-2xl border focus:outline-none ${
                        isAdminDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-100'
                      }`}
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-gray-400">Cidade (Município)</label>
                    <select
                      value={editingAd.city}
                      onChange={(e) => setEditingAd({ ...editingAd, city: e.target.value })}
                      className={`w-full px-4 py-3 rounded-2xl border focus:outline-none ${
                        isAdminDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-100'
                      }`}
                    >
                      {LUANDA_MUNICIPALITIES.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-gray-400">Preço (Kwanza)</label>
                  <input 
                    type="number" 
                    value={editingAd.price}
                    onChange={(e) => setEditingAd({ ...editingAd, price: Number(e.target.value) })}
                    className={`w-full px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isAdminDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-100'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-gray-400">Descrição</label>
                  <textarea 
                    rows={3}
                    value={editingAd.description}
                    onChange={(e) => setEditingAd({ ...editingAd, description: e.target.value })}
                    className={`w-full p-3.5 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isAdminDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-100'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-gray-400">Estado de Moderação</label>
                  <select
                    value={editingAd.status}
                    onChange={(e) => setEditingAd({ ...editingAd, status: e.target.value as any })}
                    className={`w-full px-4 py-3 rounded-2xl border focus:outline-none ${
                      isAdminDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-100'
                    }`}
                  >
                    <option value="Aprovado">Aprovado</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Rejeitado">Rejeitado</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button 
                  onClick={handleSaveAd}
                  className="flex-1 py-3 bg-amber-500 text-white font-black text-xs rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  Salvar Alterações
                </button>
                <button 
                  onClick={() => setEditingAd(null)}
                  className="px-4 py-3 bg-gray-100 dark:bg-slate-800 font-bold text-xs rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
