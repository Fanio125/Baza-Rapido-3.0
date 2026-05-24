import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  User, 
  Bell, 
  Globe, 
  Trash2, 
  MapPin, 
  Info,
  FileText,
  Shield,
  Tag,
  ChevronRight
} from 'lucide-react';
import type { ViewState } from '../types';
import DeleteAccountModal from './DeleteAccountModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface SettingsSectionProps {
  onNavigate: (view: ViewState) => void;
}

export default function SettingsSection({ onNavigate }: SettingsSectionProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { user, signOut, isDemo } = useAuth();

  const handleDeleteAccount = async () => {
    try {
      if (isDemo) {
        // Para utilizador demo, apenas limpar os dados locais e sair
        await signOut();
        onNavigate('home');
        return;
      }

      if (user?.id) {
        console.log('Iniciando eliminação de todos os dados do utilizador:', user.id);

        // 1. Apagar todas as localizações guardadas do utilizador em saved_locations
        const { error: locationsError } = await supabase
          .from('saved_locations')
          .delete()
          .eq('user_id', user.id);

        if (locationsError) {
          console.error('Erro ao eliminar localizações do utilizador:', locationsError);
        } else {
          console.log('Todas as localizações do utilizador do banco de dados foram apagadas.');
        }

        // 2. Apagar o perfil do utilizador da tabela profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id);

        if (profileError) {
          console.error('Erro ao eliminar perfil do utilizador:', profileError);
        } else {
          console.log('O perfil do utilizador na tabela profiles foi apagado.');
        }

        // 3. Opcional: tentar chamar uma RPC customizada se disponível no banco de dados para limpar a conta auth.users
        try {
          await supabase.rpc('delete_user');
          console.log('Chamada RPC de exclusão de conta realizada com sucesso.');
        } catch (rpcErr) {
          console.warn('RPC delete_user não disponível no servidor, continuando com sign out:', rpcErr);
        }

        // 4. Efetuar o sign out da sessão atual do utilizador para terminar a sessão localmente e no supabase
        await signOut();
        console.log('Conta e dados eliminados com sucesso!');
        onNavigate('home');
      } else {
        // Sem user autenticado, efetuar apenas sign out defensivo
        await signOut();
        onNavigate('home');
      }
    } catch (err) {
      console.error('Erro inesperado no processo de eliminação da conta:', err);
      throw err;
    }
  };
  const sections = [
    {
      items: [
        { icon: User, label: 'Editar perfil', description: 'Nome, foto, número de telefone', color: 'text-blue-500', bg: 'bg-blue-50', view: 'edit-profile' as ViewState },
        { icon: Bell, label: 'Notificações', description: 'Ativar ou desativar alertas', color: 'text-amber-500', bg: 'bg-amber-50' },
        { icon: Globe, label: 'Idioma', description: 'Português (AO)', color: 'text-emerald-500', bg: 'bg-emerald-50', view: 'languages' as ViewState },
        { icon: MapPin, label: 'Cidade', description: 'Luanda, Angola', color: 'text-purple-500', bg: 'bg-purple-50', view: 'cities' as ViewState },
      ]
    },
    {
      title: 'Sobre o app',
      items: [
        { icon: Tag, label: 'Versão do aplicativo', description: 'v1.0.0', color: 'text-gray-500', bg: 'bg-gray-50', view: 'version' as ViewState },
        { icon: FileText, label: 'Termos de uso', color: 'text-gray-500', bg: 'bg-gray-50', view: 'terms' as ViewState },
        { icon: Shield, label: 'Política de privacidade', color: 'text-gray-500', bg: 'bg-gray-50', view: 'privacy' as ViewState },
      ]
    },
    {
      items: [
        { icon: Trash2, label: 'Apagar conta', color: 'text-red-500', bg: 'bg-red-50', isDestructive: true },
      ]
    }
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => onNavigate('profile')}
          className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft />
        </button>
        <h2 className="text-xl font-bold font-display tracking-tight text-gray-900">Configurações</h2>
      </div>

      <div className="space-y-8">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-3">
            {section.title && (
              <h3 className="px-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {section.title}
              </h3>
            )}
            <div className="space-y-2">
              {section.items.map((item, iIdx) => (
                <motion.button
                  key={iIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (sIdx * 0.1) + (iIdx * 0.05) }}
                  onClick={() => {
                    if (item.isDestructive) {
                      setIsDeleteModalOpen(true);
                    } else if (item.view) {
                      onNavigate(item.view);
                    }
                  }}
                  className="w-full flex items-center justify-between p-4 premium-card border-none hover:bg-gray-50 shadow-none transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                      <item.icon size={20} />
                    </div>
                    <div className="text-left">
                      <div className={`font-bold ${item.isDestructive ? 'text-red-500' : 'text-gray-900'}`}>
                        {item.label}
                      </div>
                      {item.description && (
                        <div className="text-[10px] font-medium text-gray-400">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>
                  {!item.isDestructive && (
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-primary transition-colors" />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center pt-8">
         <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Feito com ❤️ em Luanda</p>
      </div>

      <DeleteAccountModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}
