import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  History, 
  Settings, 
  LogOut, 
  User as UserIcon, 
  Heart, 
  HelpCircle, 
  MessageCircle,
  ChevronRight,
  ShieldCheck,
  Mail,
  Lock,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

import { LucideIcon } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

import type { ViewState } from '../types';

interface ProfileSectionProps {
  user: User | null;
  onNavigate: (view: ViewState) => void;
}

interface MenuItem {
  icon: LucideIcon;
  label: string;
  color: string;
  bg: string;
  view?: ViewState;
  badge?: string;
  url?: string;
}

export default function ProfileSection({ user, onNavigate }: ProfileSectionProps) {
  const { signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const baseMenuItems: MenuItem[] = [
    { icon: History, label: 'Histórico de Corridas', color: 'text-blue-500', bg: 'bg-blue-50', view: 'history' as ViewState },
    { icon: HelpCircle, label: 'Centro de Ajuda', color: 'text-purple-500', bg: 'bg-purple-50' },
    { icon: MessageCircle, label: 'Suporte via WhatsApp', color: 'text-emerald-500', bg: 'bg-emerald-50', url: 'https://wa.me/975151548' },
    { icon: Settings, label: 'Configurações', color: 'text-gray-500', bg: 'bg-gray-50', view: 'settings' as ViewState },
  ];

  const isAdmin = user?.email === 'frankmanuel123.com@gmail.com';
  const menuItems = isAdmin
    ? [
        { icon: ShieldCheck, label: 'Painel de Administração', color: 'text-amber-500', bg: 'bg-amber-50', view: 'admin' as any, badge: 'MÁSTER' },
        ...baseMenuItems
      ]
    : baseMenuItems;

  const handleItemClick = (item: MenuItem) => {
    if (item.url) {
      window.open(item.url, '_blank');
    } else if (item.view) {
      onNavigate(item.view);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    const cleanFullName = fullName.trim();
    const cleanPhone = phone.trim();

    if (mode === 'signup' && (!cleanFullName || !cleanPhone)) {
      setError('Por favor, preenche o teu nome e número de telefone.');
      setIsLoading(false);
      return;
    }

    if (!cleanEmail || !cleanPassword) {
      setError('Por favor, preenche todos os campos.');
      setIsLoading(false);
      return;
    }

    console.log(`Iniciando tentativa de ${mode} para ${cleanEmail}...`);

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email: cleanEmail, 
          password: cleanPassword 
        });
        
        if (error) {
          console.log("Erro Supabase (Login):", {
            message: error.message,
            status: error.status,
            name: error.name
          });
          throw error;
        }
        
        console.log("Login realizado com sucesso! User ID:", data.user?.id);
        // Não é necessário processar mais nada aqui, o App.tsx via onAuthStateChange vai detetar a mudança
      } else {
        const { data, error } = await supabase.auth.signUp({ 
          email: cleanEmail, 
          password: cleanPassword,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: cleanFullName,
              phone: cleanPhone,
            }
          }
        });
        
        if (error) {
          console.error("Erro Supabase (Registo):", {
            message: error.message,
            status: error.status,
            name: error.name,
            details: error
          });
          throw error;
        }

        // Verificação de utilizador já existente (o Supabase retorna sucesso mas sem identidades se já existir)
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          throw new Error('Este email já está registado. Tenta fazer login ou recuperar a palavra-passe.');
        }

        if (data.user && !data.session) {
          setError('Conta criada! Por favor, verifica o teu email para ativar a conta.');
        } else {
          console.log("Registo realizado com sucesso!");
        }
      }
    } catch (err: unknown) {
      // Log detalhado e explícito para evitar {} no console
      const errorDetails = err instanceof Error ? err.message : String(err);
      
      console.log(`Falha detalhada em ${mode}:`, errorDetails);
      
      let msg = 'Ocorreu um erro inesperado.';
      let details = '';

      if (err && typeof err === 'object') {
        const authErr = err as { message?: string, error_description?: string, error?: string, msg?: string, status?: number | string, code?: string };
        // Obter propriedades do erro (Supabase Auth retorna objetos densos)
        msg = authErr.message || authErr.error_description || authErr.error || authErr.msg || msg;
        
        const status = authErr.status || authErr.code || '';
        if (status) details = ` [${status}]`;
      } else if (typeof err === 'string') {
        msg = err;
      }

      // Map technical errors to user-friendly Portuguese messages
      const lowerMsg = msg.toLowerCase();
      let isTranslated = false;

      if (lowerMsg.includes('invalid login credentials') || lowerMsg.includes('invalid_credentials') || lowerMsg.includes('invalid credentials')) {
        msg = 'Senha incorreta.';
        isTranslated = true;
      } else if (lowerMsg.includes('rate limit')) {
        msg = 'Demasiadas tentativas num curto período de tempo. Por favor, aguarda uns minutos.';
        isTranslated = true;
      } else if (lowerMsg.includes('email not confirmed')) {
        msg = 'O teu email ainda não foi confirmado. Por favor, verifica a tua caixa de entrada para ativar a conta.';
        isTranslated = true;
      } else if (lowerMsg.includes('error sending confirmation email')) {
        // NOTA: Este erro geralmente significa que o SMTP não está configurado no painel do Supabase.
        msg = 'Não foi possível enviar o email de confirmação. O serviço pode estar temporariamente indisponível ou o limite diário foi atingido.';
        isTranslated = true;
      } else if (lowerMsg.includes('user already registered') || lowerMsg.includes('user already exists')) {
        msg = 'Este endereço de email já está associado a uma conta. Tenta entrar ou recuperar a palavra-passe.';
        isTranslated = true;
      } else if (msg === '{}' || (err && typeof err === 'object' && Object.keys(err).length === 0 && msg === 'Ocorreu um erro inesperado.')) {
        msg = 'Erro de ligação ao servidor. Por favor, verifica a tua internet e tenta novamente.';
        isTranslated = true;
      }

      // Only show technical codes if we haven't translated to a friendly message
      const status = (!isTranslated && (err as any)?.status) || (err as any)?.code || '';
      if (status && !isTranslated) details = ` [${status}]`;

      setError(`${msg}${details}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  if (!user) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-4 rotate-12">
            <UserIcon size={40} />
          </div>
          <h2 className="text-2xl font-black font-display tracking-tight text-gray-900">Bem-vindo!</h2>
          <p className="text-gray-500 text-sm px-8">Entra na tua conta para guardar locais e ver o teu histórico.</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nome Completo</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="João Silva"
                    className="w-full h-14 pl-12 pr-4 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Número de Telefone</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                    +244
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="900 000 000"
                    className="w-full h-14 pl-16 pr-4 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teu@email.com"
                className="w-full h-14 pl-12 pr-4 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Palavra-passe</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-14 pl-12 pr-4 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                required
              />
            </div>
          </div>

          {error && (
            <div className={cn(
              "p-4 rounded-2xl text-[10px] font-bold text-center",
              error.includes('Verifica') ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
            )}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : (mode === 'login' ? 'Entrar' : 'Criar Conta')}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="w-full text-center text-xs font-bold text-gray-400 hover:text-primary transition-colors py-1"
          >
            {mode === 'login' ? 'Não tens conta? Cria uma aqui' : 'Já tens conta? Entra aqui'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Header Card */}
      <div className="premium-card p-6 bg-dark overflow-hidden relative group">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all duration-700" />
        <div className="relative z-10 flex justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white ring-4 ring-white/10 shadow-lg group-hover:scale-105 transition-all overflow-hidden">
              {user.user_metadata?.avatar_url || user.user_metadata?.photo_url ? (
                <img 
                  src={user.user_metadata.avatar_url || user.user_metadata.photo_url} 
                  alt="Foto de perfil" 
                  className="w-full h-full object-cover animate-in fade-in duration-300"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <UserIcon size={32} />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-orange-500 font-display truncate max-w-[170px]">
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </h3>
              <p className="text-gray-400 text-sm font-medium">
                {user.user_metadata?.phone ? `+244 ${user.user_metadata.phone}` : 'Nível Diamante'} • Angola
              </p>
            </div>
          </div>
          
          <button
            onClick={() => onNavigate('edit-profile')}
            className="px-4 py-2 bg-orange-500 text-white hover:bg-orange-600 active:scale-95 transition-all rounded-xl text-xs font-bold shadow-sm"
          >
            Editar
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="text-center">
            <div className="text-sm font-bold text-orange-500">124</div>
            <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Buscas</div>
          </div>
          <div className="text-center border-x border-white/10">
            <div className="text-sm font-bold text-orange-500">42</div>
            <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Economia</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-orange-500">4.9</div>
            <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Avaliação</div>
          </div>
        </div>
      </div>

      {/* Menu List */}
      <div className="space-y-2">
        {menuItems.map((item, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleItemClick(item)}
            className="w-full flex items-center justify-between p-4 premium-card hover:bg-gray-100 border-none shadow-none group"
          >
            <div className="flex items-center gap-4">
              <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110 shadow-sm", item.bg, item.color)}>
                <item.icon size={20} />
              </div>
              <span className="font-bold text-gray-700">{item.label}</span>
              {item.badge && (
                <span className="bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                  {item.badge}
                </span>
              )}
            </div>
            <ChevronRight size={18} className="text-gray-300 group-hover:text-primary transition-colors" />
          </motion.button>
        ))}
      </div>

      <button 
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 p-4 text-red-500 font-bold text-sm bg-red-50 rounded-2xl hover:bg-red-100 active:scale-[0.98] transition-all mt-4 shadow-sm shadow-red-100"
      >
        <LogOut size={18} />
        <span>Sair da Conta</span>
      </button>

      <div className="text-center mt-8">
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[.3em]">Baza Rápido • Conforto e Segurança</p>
      </div>
    </div>
  );
}
