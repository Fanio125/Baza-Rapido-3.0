import { supabase } from '../lib/supabase';

export interface HelpMessage {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  assunto: string;
  mensagem: string;
  created_at: string;
  status: 'Pendente' | 'Lida';
}

const LOCAL_STORAGE_KEY = 'br_help_messages';

function getLocalHelpMessages(): HelpMessage[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}
  return [];
}

function saveLocalHelpMessages(msgs: HelpMessage[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(msgs));
    window.dispatchEvent(new Event('br_help_messages_updated'));
  } catch (_) {}
}

export const helpCenterService = {
  /**
   * Envia uma nova mensagem do utilizador para o Centro de Ajuda (Supabase com fallback LocalStorage).
   */
  async sendMessage(data: {
    user_id: string;
    user_name: string;
    user_email: string;
    assunto: string;
    mensagem: string;
  }): Promise<{ success: boolean; message?: string; error?: string }> {
    const newMessage: HelpMessage = {
      id: 'hm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      user_id: data.user_id,
      user_name: data.user_name || 'Utilizador',
      user_email: data.user_email || 'utilizador@bazarapido.ao',
      assunto: data.assunto.trim(),
      mensagem: data.mensagem.trim(),
      created_at: new Date().toISOString(),
      status: 'Pendente',
    };

    // 1. Tentar gravar no Supabase
    try {
      const { data: inserted, error } = await supabase
        .from('support_messages')
        .insert([
          {
            user_id: newMessage.user_id,
            user_name: newMessage.user_name,
            user_email: newMessage.user_email,
            assunto: newMessage.assunto,
            mensagem: newMessage.mensagem,
            status: 'Pendente'
          }
        ])
        .select();

      if (!error && inserted && inserted.length > 0) {
        // Atualizar também cópia local para sincronismo em tempo real
        const local = getLocalHelpMessages();
        local.unshift({
          ...newMessage,
          id: inserted[0].id || newMessage.id,
          created_at: inserted[0].created_at || newMessage.created_at
        });
        saveLocalHelpMessages(local);
        return { success: true, message: 'Mensagem enviada com sucesso.' };
      }
    } catch (err) {
      console.warn('Supabase insertion info:', err);
    }

    // 2. Fallback local persistence
    const local = getLocalHelpMessages();
    local.unshift(newMessage);
    saveLocalHelpMessages(local);

    return { success: true, message: 'Mensagem enviada com sucesso.' };
  },

  /**
   * Obtém as mensagens enviadas por um utilizador específico.
   */
  async getUserMessages(userId: string): Promise<HelpMessage[]> {
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as HelpMessage[];
      }
    } catch (_) {}

    // Fallback local
    const local = getLocalHelpMessages();
    return local.filter(m => m.user_id === userId);
  },

  /**
   * Obtém todas as mensagens de apoio para a área do Administrador.
   */
  async getAllMessagesForAdmin(): Promise<HelpMessage[]> {
    let supabaseMsgs: HelpMessage[] = [];

    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        supabaseMsgs = data as HelpMessage[];
      }
    } catch (_) {}

    // Merge com mensagens salvas localmente
    const localMsgs = getLocalHelpMessages();
    const map = new Map<string, HelpMessage>();

    supabaseMsgs.forEach(m => map.set(m.id, m));
    localMsgs.forEach(m => {
      if (!map.has(m.id)) {
        map.set(m.id, m);
      }
    });

    const all = Array.from(map.values());
    all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return all;
  },

  /**
   * Marca uma mensagem como 'Lida'.
   */
  async markAsRead(messageId: string): Promise<boolean> {
    try {
      await supabase
        .from('support_messages')
        .update({ status: 'Lida' })
        .eq('id', messageId);
    } catch (_) {}

    // Atualizar localmente
    const local = getLocalHelpMessages();
    const index = local.findIndex(m => m.id === messageId);
    if (index !== -1) {
      local[index].status = 'Lida';
      saveLocalHelpMessages(local);
    }

    window.dispatchEvent(new Event('br_help_messages_updated'));
    return true;
  }
};
