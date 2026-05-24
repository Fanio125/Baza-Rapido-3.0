import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  User, 
  Phone, 
  Mail,
  MapPin, 
  Camera, 
  Check,
  Loader2,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import type { ViewState } from '../types';
import { profileService } from '../services/profileService';
import { useAuth } from '../contexts/AuthContext';

interface EditProfileSectionProps {
  onNavigate: (view: ViewState) => void;
  initialData?: {
    id?: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    photo?: string;
  };
}

export default function EditProfileSection({ 
  onNavigate, 
  initialData = { 
    id: 'user-default-id', 
    name: '', 
    email: '', 
    phone: '', 
    city: 'Luanda' 
  } 
}: EditProfileSectionProps) {
  const { user, updateUserMetadata, isDemo } = useAuth();
  const [name, setName] = useState(user?.user_metadata?.full_name || initialData.name);
  const [email, setEmail] = useState(user?.email || initialData.email);
  const [phone, setPhone] = useState(user?.user_metadata?.phone || initialData.phone);
  const [city, setCity] = useState(user?.user_metadata?.city || initialData.city);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Carregar dados ao montar o componente
  useEffect(() => {
    async function loadData() {
      try {
        if (!isDemo && user?.id) {
          const data = await profileService.getProfile(user.id);
          if (data) {
            setName(data.name || user?.user_metadata?.full_name || '');
            setEmail(data.email || user?.email || '');
            setPhone(data.phone || user?.user_metadata?.phone || '');
            setCity(data.city || user?.user_metadata?.city || 'Luanda');
          }
        }
      } catch (error) {
        console.warn('Erro ao carregar dados do banco (usando dados de login/demo como fallback):', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user?.id, isDemo, user?.user_metadata, user?.email]);

  const angolanCities = [
    'Luanda', 'Cacuaco', 'Viana', 'Benguela', 'Lobito', 'Huambo', 'Lubango', 'Cabinda', 'Uíge', 'Malanje', 'Sumbe', 'Ndalatando', 'Kuito', 'Luena', 'Menongue', 'Moçâmedes', 'Dundo', 'Saurimo', 'Mbanza Congo'
  ].sort();

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      // 1. Atualizar o metadado no AuthContext (funciona para Real e Demo)
      await updateUserMetadata({
        full_name: name,
        phone: phone,
        city: city
      });

      // 2. Se não for demo, tenta guardar na tabela profiles da base de dados
      if (!isDemo && user?.id) {
        try {
          await profileService.updateProfile(user.id, {
            name,
            email,
            phone,
            city
          });
        } catch (dbErr) {
          console.warn('Erro ao atualizar tabela de profiles, porém o metadado auth já foi guardado:', dbErr);
        }
      }

      setMessage({ type: 'success', text: 'Alterações guardadas com sucesso!' });
      setTimeout(() => onNavigate('profile'), 1500);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setMessage({ type: 'error', text: 'Erro ao guardar alterações. Tenta novamente.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => onNavigate('settings')}
          className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft />
        </button>
        <h2 className="text-xl font-bold font-display tracking-tight text-gray-900">Editar Perfil</h2>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm font-bold text-gray-400">A carregar os teus dados...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Photo Upload Section */}
        <div className="flex flex-col items-center">
          <div className="relative group">
            <div className="w-32 h-32 bg-gray-100 rounded-[40px] overflow-hidden border-4 border-white shadow-xl shadow-gray-200">
              <img 
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200" 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <button 
              onClick={() => setShowPhotoOptions(!showPhotoOptions)}
              className="absolute -bottom-2 -right-2 p-3 bg-primary text-white rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all"
            >
              <Camera size={20} />
            </button>
          </div>

          {showPhotoOptions && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex gap-3"
            >
              <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                <Camera size={14} />
                Tirar foto
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                <ImageIcon size={14} />
                Galeria
              </button>
            </motion.div>
          )}
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="px-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Nome Completo
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <User size={18} />
              </div>
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João Silva"
                className="w-full h-14 pl-12 pr-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-300"
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label className="px-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              E-mail
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail size={18} />
              </div>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: joao@email.com"
                className="w-full h-14 pl-12 pr-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-300"
              />
            </div>
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <label className="px-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Número de Telefone
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Phone size={18} />
              </div>
              <input 
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+244 000 000 000"
                className="w-full h-14 pl-12 pr-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-300"
              />
            </div>
          </div>

          {/* City Selection */}
          <div className="space-y-2">
            <label className="px-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Cidade
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <MapPin size={18} />
              </div>
              <select 
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full h-14 pl-12 pr-10 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-900 appearance-none focus:ring-2 focus:ring-primary/20 transition-all"
              >
                {angolanCities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">
                <Check size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-6 space-y-4">
          {message && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-4 rounded-2xl text-sm font-bold text-center ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              }`}
            >
              {message.text}
            </motion.div>
          )}

          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full h-14 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-primary/20 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSaving ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Check size={20} />
            )}
            {isSaving ? 'A guardar...' : 'Guardar alterações'}
          </button>
        </div>
      </div>
      )}
    </div>
  );
}
