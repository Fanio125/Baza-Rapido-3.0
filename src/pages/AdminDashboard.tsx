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
  DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
  status: 'Ativo' | 'Bloqueado';
  registered_at: string;
  last_access: string;
  ads_count: number;
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'ads' | 'complaints' | 'messages' | 'categories' | 'stats' | 'config'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // --- Admin Entities States ---
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
  const [adSearch, setAdSearch] = useState('');
  const [adCatFilter, setAdCatFilter] = useState('all');
  const [adCityFilter, setAdCityFilter] = useState('all');
  const [adStatusFilter, setAdStatusFilter] = useState('all');

  // --- Toast/Status Alert State ---
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showAlert = (type: 'success' | 'error' | 'info', text: string) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 4000);
  };

  // --- Security Check ---
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/');
      } else if (user.email !== 'frankmanuel123.com@gmail.com') {
        console.warn("Acesso negado: Utilizador comum tentou aceder ao painel de administração.");
        navigate('/');
      }
    }
  }, [user, loading, navigate]);

  // --- Load Initial Mock/Persisted Data ---
  useEffect(() => {
    // 1. App Config
    const savedConfig = localStorage.getItem('br_admin_config');
    if (savedConfig) {
      try { setConfig(JSON.parse(savedConfig)); } catch (_) {}
    }

    // 2. Users
    const savedUsers = localStorage.getItem('br_admin_users');
    if (savedUsers) {
      try { setUsers(JSON.parse(savedUsers)); } catch (_) {}
    } else {
      const mockUsers: AdminUser[] = [
        { id: 'usr-1', name: 'Frank Manuel', email: 'frankmanuel123.com@gmail.com', phone: '923000123', status: 'Ativo', registered_at: '2026-05-10', last_access: 'Hoje, 10:24', ads_count: 5 },
        { id: 'usr-2', name: 'Sebastião Antunes', email: 'sebastiao.ant@gmail.com', phone: '931224455', status: 'Ativo', registered_at: '2026-06-12', last_access: 'Ontem, 18:45', ads_count: 12 },
        { id: 'usr-3', name: 'Zandrina Mendes', email: 'zandrina.m@outlook.com', phone: '942881122', status: 'Ativo', registered_at: '2026-06-20', last_access: '28 de Junho, 12:10', ads_count: 0 },
        { id: 'usr-4', name: 'Mateus Catraio', email: 'mateus.cat@gmail.com', phone: '912550099', status: 'Bloqueado', registered_at: '2026-06-01', last_access: '05 de Junho, 09:30', ads_count: 2 },
        { id: 'usr-5', name: 'Isabel de Carvalho', email: 'isabel.carv@hotmail.com', phone: '925334400', status: 'Ativo', registered_at: '2026-06-25', last_access: 'Hoje, 08:15', ads_count: 8 }
      ];
      setUsers(mockUsers);
      localStorage.setItem('br_admin_users', JSON.stringify(mockUsers));
    }

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

  const handleSaveUser = () => {
    if (!editingUser) return;
    const updated = users.map(user => user.id === editingUser.id ? editingUser : user);
    setUsers(updated);
    saveStateToLocalStorage('br_admin_users', updated);
    setEditingUser(null);
    showAlert('success', 'Utilizador atualizado com sucesso.');
  };

  const handleToggleBlockUser = (userId: string) => {
    const updated = users.map(user => {
      if (user.id === userId) {
        const newStatus = user.status === 'Ativo' ? 'Bloqueado' : 'Ativo';
        showAlert('info', `Utilizador ${user.name} foi ${newStatus === 'Bloqueado' ? 'bloqueado' : 'desbloqueado'}.`);
        return { ...user, status: newStatus as 'Ativo' | 'Bloqueado' };
      }
      return user;
    });
    setUsers(updated);
    saveStateToLocalStorage('br_admin_users', updated);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Tem a certeza que deseja eliminar permanentemente este utilizador?')) {
      const updated = users.filter(user => user.id !== userId);
      setUsers(updated);
      saveStateToLocalStorage('br_admin_users', updated);
      showAlert('success', 'Utilizador eliminado com sucesso.');
    }
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
  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q);
  });

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
              onClick={() => navigate('/')}
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
            {activeTab === 'users' && (
              <div className="space-y-6">
                
                {/* Search Bar & Stats */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Pesquisar por nome, e-mail ou telefone..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border text-sm font-bold tracking-tight focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        isAdminDarkMode ? 'bg-[#1e293b] border-slate-700 text-white focus:border-amber-500' : 'bg-white border-gray-100 text-gray-800'
                      }`}
                    />
                  </div>
                  <div className="text-xs font-bold text-gray-400">
                    A mostrar <span className="text-amber-500">{filteredUsers.length}</span> de <span className="text-gray-900 dark:text-white">{users.length}</span> utilizadores
                  </div>
                </div>

                {/* Users Table */}
                <div className={`rounded-3xl border shadow-sm overflow-hidden ${
                  isAdminDarkMode ? 'bg-[#1e293b] border-slate-800' : 'bg-white border-gray-100'
                }`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`border-b text-xs font-black uppercase text-gray-400 ${
                          isAdminDarkMode ? 'border-slate-800 bg-slate-900/40' : 'border-gray-50 bg-gray-50/50'
                        }`}>
                          <th className="px-6 py-4.5">Utilizador</th>
                          <th className="px-6 py-4.5">Contacto</th>
                          <th className="px-6 py-4.5">Anúncios</th>
                          <th className="px-6 py-4.5">Último Acesso</th>
                          <th className="px-6 py-4.5">Estado</th>
                          <th className="px-6 py-4.5 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50/40 dark:hover:bg-slate-800/20 transition-all">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black text-sm">
                                  {u.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                  <h4 className="text-sm font-black tracking-tight">{u.name}</h4>
                                  <span className="text-[10px] text-gray-400 font-bold">Registo: {u.registered_at}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col text-xs font-bold gap-0.5">
                                <span className="flex items-center gap-1.5"><Mail size={12} className="text-gray-400" />{u.email}</span>
                                <span className="flex items-center gap-1.5 text-gray-400"><Phone size={12} />+244 {u.phone}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-black text-sm">
                              {u.ads_count}
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-gray-400">
                              {u.last_access}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] px-2.5 py-1 rounded-full font-black ${
                                u.status === 'Ativo' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500' : 'bg-red-100 dark:bg-red-950/40 text-red-500'
                              }`}>
                                {u.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button 
                                  onClick={() => setSelectedUser(u)}
                                  className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-200 rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                  title="Ver Perfil Completo"
                                >
                                  <Eye size={13} />
                                </button>
                                <button 
                                  onClick={() => handleEditUser(u)}
                                  className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                  title="Editar Informações"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button 
                                  onClick={() => handleToggleBlockUser(u.id)}
                                  className={`p-2 rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                                    u.status === 'Ativo' ? 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-500' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500'
                                  }`}
                                  title={u.status === 'Ativo' ? 'Bloquear Utilizador' : 'Desbloquear Utilizador'}
                                >
                                  {u.status === 'Ativo' ? <UserX size={13} /> : <UserCheck size={13} />}
                                </button>
                                <button 
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                  title="Eliminar Conta"
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

            {/* ==================== TAB: GESTÃO DE ANÚNCIOS ==================== */}
            {activeTab === 'ads' && (
              <div className="space-y-6">
                
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
                                  onClick={() => handleEditAd(a)}
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
