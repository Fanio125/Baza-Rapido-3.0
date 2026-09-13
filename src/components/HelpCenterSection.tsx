import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Send, CheckCircle2, AlertCircle, HelpCircle, MessageSquare, Clock } from 'lucide-react';
import type { ViewState } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { helpCenterService, HelpMessage } from '../services/helpCenterService';

interface HelpCenterSectionProps {
  onNavigate: (view: ViewState) => void;
}

export default function HelpCenterSection({ onNavigate }: HelpCenterSectionProps) {
  const { user } = useAuth();
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userMessages, setUserMessages] = useState<HelpMessage[]>([]);

  useEffect(() => {
    loadUserMessages();
  }, [user]);

  const loadUserMessages = async () => {
    if (!user?.id) return;
    const list = await helpCenterService.getUserMessages(user.id);
    setUserMessages(list);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const cleanAssunto = assunto.trim();
    const cleanMensagem = mensagem.trim();

    if (!cleanAssunto || !cleanMensagem) {
      setErrorMsg('Por favor, preenche o assunto e a mensagem.');
      return;
    }

    setIsLoading(true);

    try {
      const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Utilizador';
      const userEmail = user?.email || 'utilizador@bazarapido.ao';

      const res = await helpCenterService.sendMessage({
        user_id: user?.id || 'guest-' + Date.now(),
        user_name: userName,
        user_email: userEmail,
        assunto: cleanAssunto,
        mensagem: cleanMensagem,
      });

      if (res.success) {
        setSuccessMsg('Mensagem enviada com sucesso.');
        setAssunto('');
        setMensagem('');
        await loadUserMessages();
      } else {
        setErrorMsg('Não foi possível enviar a mensagem. Tenta novamente.');
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setErrorMsg('Ocorreu um erro ao enviar a mensagem.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onNavigate('settings')}
          className="p-2.5 bg-gray-50 dark:bg-slate-800 rounded-2xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          <ChevronLeft className="text-gray-700 dark:text-gray-200" size={20} />
        </button>
        <div>
          <h2 className="text-xl font-bold font-display tracking-tight text-gray-900 dark:text-white">
            Centro de Ajuda
          </h2>
          <p className="text-xs text-gray-400 font-medium">Contacta a equipa do Baza Rápido</p>
        </div>
      </div>

      {/* Intro Card */}
      <div className="p-5 bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 rounded-3xl flex items-start gap-3.5">
        <div className="p-2.5 bg-purple-500 text-white rounded-2xl shrink-0 shadow-md shadow-purple-500/20">
          <HelpCircle size={22} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-purple-950 dark:text-purple-200">Como podemos ajudar?</h3>
          <p className="text-xs text-purple-700 dark:text-purple-300 mt-1 leading-relaxed">
            Escreve a tua dúvida, problema ou sugestão. A nossa equipa analisará e atualizará o estado no teu painel.
          </p>
        </div>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm"
          >
            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-300 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm"
          >
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl space-y-4 shadow-xs">
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
            Assunto
          </label>
          <input
            type="text"
            value={assunto}
            onChange={(e) => setAssunto(e.target.value)}
            placeholder="Ex: Dúvida sobre estimativas de preços"
            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
            Mensagem
          </label>
          <textarea
            rows={5}
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder="Descreve detalhadamente a tua dúvida ou mensagem..."
            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-6 bg-primary hover:bg-orange-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send size={16} />
              <span>Enviar Mensagem</span>
            </>
          )}
        </button>
      </form>

      {/* Sent messages history */}
      {userMessages.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
            <MessageSquare size={14} /> As Minhas Mensagens Enviadas
          </h3>

          <div className="space-y-3">
            {userMessages.map((msg) => (
              <div
                key={msg.id}
                className="p-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{msg.assunto}</span>
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-black ${
                      msg.status === 'Lida'
                        ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600'
                        : 'bg-amber-100 dark:bg-amber-950/40 text-amber-600'
                    }`}
                  >
                    {msg.status}
                  </span>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-800/60 p-3 rounded-xl italic">
                  "{msg.mensagem}"
                </p>

                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium pt-1">
                  <Clock size={12} />
                  <span>{new Date(msg.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
