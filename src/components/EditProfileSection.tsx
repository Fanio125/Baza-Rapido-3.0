import { useState, useEffect, useRef } from 'react';
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
  AlertCircle,
  Trash2,
  Upload
} from 'lucide-react';
import type { ViewState } from '../types';
import { profileService } from '../services/profileService';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Reduzido para 180px para avatares de alta densidade extremamente eficientes
        const MAX_WIDTH = 180;
        const MAX_HEIGHT = 180;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Suavização bilinear de alta qualidade para o redimensionamento
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Comprimido com qualidade de 0.55 para produzir tamanhos reduzidos (~8kb a 15kb)
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.55);
      };
      img.onerror = () => {
        resolve(file);
      };
    };
    reader.onerror = () => {
      resolve(file);
    };
  });
};

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
  
  // Fields state
  const [name, setName] = useState(user?.user_metadata?.full_name || initialData.name);
  const [email, setEmail] = useState(user?.email || initialData.email);
  const [phone, setPhone] = useState(user?.user_metadata?.phone || initialData.phone);
  const [city, setCity] = useState(user?.user_metadata?.city || initialData.city);
  
  // Photo-related state
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    user?.user_metadata?.avatar_url || user?.user_metadata?.photo_url || null
  );
  const [tempPhotoFile, setTempPhotoFile] = useState<File | null>(null);
  const [tempPhotoUrl, setTempPhotoUrl] = useState<string | null>(null);
  
  // Control and UI states
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Camera handling states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [videoTrack, setVideoTrack] = useState<MediaStream | null>(null);

  // References
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load profile data
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
            if (data.photo_url) {
              setPhotoUrl(data.photo_url);
            }
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

  // Cleanup object URLs and camera streams
  useEffect(() => {
    return () => {
      if (tempPhotoUrl) {
        URL.revokeObjectURL(tempPhotoUrl);
      }
      if (videoTrack) {
        videoTrack.getTracks().forEach(track => track.stop());
      }
    };
  }, [tempPhotoUrl, videoTrack]);

  const angolanCities = [
    'Luanda', 'Cacuaco', 'Viana', 'Benguela', 'Lobito', 'Huambo', 'Lubango', 'Cabinda', 'Uíge', 'Malanje', 'Sumbe', 'Ndalatando', 'Kuito', 'Luena', 'Menongue', 'Moçâmedes', 'Dundo', 'Saurimo', 'Mbanza Congo'
  ].sort();

  // Helper stream upload handler
  const uploadPhoto = async (file: File): Promise<string> => {
    const convertToBase64 = (fileObj: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(fileObj);
      });
    };

    if (isDemo) {
      return await convertToBase64(file);
    }

    const fileExt = file.name.split('.').pop() || 'jpg';
    const filePath = `${user?.id || 'public'}/avatar-${Date.now()}.${fileExt}`;

    try {
      // Opt-in check or try creating bucket auto
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        if (!buckets?.some(b => b.name === 'profile-images')) {
          await supabase.storage.createBucket('profile-images', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg'],
            fileSizeLimit: 5242880
          });
        }
      } catch (bucketErr) {
        console.warn('Não foi possível inicializar buckets. Tentando upload direto...', bucketErr);
      }

      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.warn('Upload falhou no Storage do Supabase (A cair de volta para Base64 no Auth):', error.message);
        return await convertToBase64(file);
      }

      const { data: urlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (err: any) {
      console.warn('Exceção ao fazer upload de imagem, a usar Base64 local:', err);
      return await convertToBase64(file);
    }
  };

  // Gallery file select handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      let file = files[0];
      
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setMessage({ type: 'error', text: 'Formato inválido. Usa apenas PNG, JPG ou JPEG.' });
        return;
      }

      try {
        file = await compressImage(file);
      } catch (err) {
        console.warn('Erro ao comprimir imagem:', err);
      }

      if (tempPhotoUrl) {
        URL.revokeObjectURL(tempPhotoUrl);
      }

      const previewUrl = URL.createObjectURL(file);
      setTempPhotoFile(file);
      setTempPhotoUrl(previewUrl);
      setShowPhotoOptions(false);
      setMessage(null);
    }
  };

  // Video feed start
  const startCamera = async () => {
    setIsCameraActive(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 400 }, height: { ideal: 400 } } 
      });
      setVideoTrack(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn("navigator.mediaDevices.getUserMedia falhou. A iniciar câmara nativa com input...", err);
      setCameraError("A carregar câmara nativa do dispositivo...");
      setTimeout(() => {
        setIsCameraActive(false);
        if (cameraInputRef.current) {
          cameraInputRef.current.click();
        }
      }, 1500);
    }
  };

  // Video feed stop
  const stopCamera = () => {
    if (videoTrack) {
      videoTrack.getTracks().forEach(track => track.stop());
      setVideoTrack(null);
    }
    setIsCameraActive(false);
  };

  // Take photo frame
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const size = Math.min(video.videoWidth, video.videoHeight);
        const xOffset = (video.videoWidth - size) / 2;
        const yOffset = (video.videoHeight - size) / 2;
        
        ctx.drawImage(video, xOffset, yOffset, size, size, 0, 0, 400, 400);
        
        canvas.toBlob(async (blob) => {
          if (blob) {
            let file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            
            try {
              file = await compressImage(file);
            } catch (err) {
              console.warn('Erro ao comprimir imagem da câmara:', err);
            }

            if (tempPhotoUrl) {
              URL.revokeObjectURL(tempPhotoUrl);
            }

            const previewUrl = URL.createObjectURL(file);
            setTempPhotoFile(file);
            setTempPhotoUrl(previewUrl);
            setShowPhotoOptions(false);
            setMessage(null);
          }
          stopCamera();
        }, 'image/jpeg', 0.85);
      }
    }
  };

  // Immediate save only picture
  const handleSavePhoto = async () => {
    if (!tempPhotoFile) return;
    setIsUploading(true);
    setMessage(null);

    try {
      const finalUrl = await uploadPhoto(tempPhotoFile);

      // Save to Auth Metadata (covers both Real and Demo)
      await updateUserMetadata({
        avatar_url: finalUrl,
        photo_url: finalUrl
      });

      // Save to profiles database table (Real user only)
      if (!isDemo && user?.id) {
        try {
          await profileService.updateProfile(user.id, {
            photo_url: finalUrl
          });
        } catch (dbErr) {
          console.warn('Erro ao atualizar a URL na tabela de profiles, porém o metadado já foi guardado:', dbErr);
        }
      }

      setPhotoUrl(finalUrl);
      setTempPhotoFile(null);
      setTempPhotoUrl(null);
      setMessage({ type: 'success', text: 'Foto de perfil guardada com sucesso!' });
    } catch (err: any) {
      console.error('Erro ao guardar a foto:', err);
      setMessage({ type: 'error', text: 'Não foi possível guardar a foto. Tente novamente.' });
    } finally {
      setIsUploading(false);
    }
  };

  // Delete current image
  const handleRemovePhoto = async () => {
    setIsUploading(true);
    setMessage(null);

    try {
      // Clear unsaved preview
      if (tempPhotoUrl) {
        setTempPhotoFile(null);
        setTempPhotoUrl(null);
        setIsUploading(false);
        return;
      }

      // Permanent delete: Real or Demo user
      await updateUserMetadata({
        avatar_url: '',
        photo_url: ''
      });

      if (!isDemo && user?.id) {
        try {
          await profileService.updateProfile(user.id, {
            photo_url: ''
          });
        } catch (dbErr) {
          console.warn('Erro ao limpar a foto na tabela de profiles:', dbErr);
        }
      }

      setPhotoUrl(null);
      setMessage({ type: 'success', text: 'Foto de perfil removida com sucesso!' });
    } catch (err: any) {
      console.error('Erro ao remover a foto:', err);
      setMessage({ type: 'error', text: 'Não foi possível remover a foto.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfileData = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      await updateUserMetadata({
        full_name: name,
        phone: phone,
        city: city
      });

      if (!isDemo && user?.id) {
        try {
          await profileService.updateProfile(user.id, {
            name,
            email,
            phone,
            city
          });
        } catch (dbErr) {
          console.warn('Erro ao atualizar perfil na tabela:', dbErr);
        }
      }

      setMessage({ type: 'success', text: 'Alterações guardadas com sucesso!' });
      setTimeout(() => onNavigate('profile'), 1500);
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      setMessage({ type: 'error', text: 'Erro ao guardar as alterações.' });
    } finally {
      setIsSaving(false);
    }
  };

  const activePhotoSrc = tempPhotoUrl || photoUrl;

  return (
    <div className="space-y-6 pb-20">
      {/* Hidden Intrinsic Inputs */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/png, image/jpeg, image/jpg" 
        className="hidden" 
      />
      
      <input 
        type="file" 
        ref={cameraInputRef} 
        onChange={handleFileChange} 
        accept="image/png, image/jpeg, image/jpg" 
        capture="user" 
        className="hidden" 
      />

      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => onNavigate('profile')}
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
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Photo Management Section */}
          <div className="flex flex-col items-center premium-card p-6 border-none shadow-sm space-y-4 bg-gray-50/50">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Foto de Perfil
            </span>
            
            <div className="relative">
              <div className="w-28 h-28 bg-gray-200 rounded-[32px] overflow-hidden border-4 border-white shadow-lg relative flex items-center justify-center text-gray-400">
                {activePhotoSrc ? (
                  <img 
                    src={activePhotoSrc} 
                    alt="Foto de perfil" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User size={48} className="text-gray-300" />
                )}

                {/* Local Preview Badge indicator */}
                {tempPhotoUrl && (
                  <div className="absolute inset-x-0 bottom-0 bg-amber-500 text-[8px] text-white font-black py-0.5 text-center uppercase tracking-wider">
                    Pré-visualização
                  </div>
                )}

                {/* Upload status overlay spinner */}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => setShowPhotoOptions(!showPhotoOptions)}
                type="button"
                className="absolute -bottom-1 -right-1 p-2.5 bg-primary text-white rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all"
                disabled={isUploading}
              >
                <Camera size={16} />
              </button>
            </div>

            {/* Upload & Unsaved Actions list */}
            {tempPhotoUrl && !isUploading && (
              <div className="flex gap-2 w-full max-w-xs justify-center pt-1 animate-in zoom-in-95 duration-200">
                <button
                  type="button"
                  onClick={handleSavePhoto}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold rounded-lg shadow transition-all"
                >
                  <Upload size={13} />
                  Guardar Foto
                </button>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 active:scale-95 text-gray-700 text-xs font-bold rounded-lg transition-all"
                >
                  Cancelar
                </button>
              </div>
            )}

            {/* Permanent Remove button if standard image exists and no temp active */}
            {photoUrl && !tempPhotoUrl && !isUploading && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-xs text-red-500 font-bold hover:text-red-600 hover:underline flex items-center gap-1 transition-all pt-1"
              >
                <Trash2 size={12} />
                Remover Foto
              </button>
            )}

            {showPhotoOptions && (
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2 w-full max-w-xs pt-1 justify-center"
              >
                <button 
                  type="button"
                  onClick={startCamera}
                  className="flex items-center gap-1 px-3 py-2 bg-white rounded-xl border border-gray-100 shadow-sm text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Camera size={13} className="text-gray-400" />
                  Tirar Foto
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-2 bg-white rounded-xl border border-gray-100 shadow-sm text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ImageIcon size={13} className="text-gray-400" />
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
                  disabled={!isDemo} // Prevents editing email on Supabase directly if bound by primary key/auth rules
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: joao@email.com"
                  className={`w-full h-14 pl-12 pr-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-300 ${!isDemo ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                  placeholder="923 456 789"
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

          {/* Messages & Actions Button */}
          <div className="pt-4 space-y-4">
            {message && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-2xl text-sm font-bold text-center flex items-center justify-center gap-2 ${
                  message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                }`}
              >
                {message.type === 'error' && <AlertCircle size={16} />}
                <span>{message.text}</span>
              </motion.div>
            )}

            <button 
              onClick={handleSaveProfileData}
              disabled={isSaving || isUploading}
              className={`w-full h-14 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-primary/20 ${(isSaving || isUploading) ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSaving ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Check size={20} />
              )}
              {isSaving ? 'A guardar...' : 'Guardar alterações de texto'}
            </button>
          </div>
        </div>
      )}

      {/* Real-time Streaming Camera Modal */}
      {isCameraActive && (
        <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-gray-900 rounded-[32px] overflow-hidden border border-white/10 flex flex-col items-center p-6 relative">
            <h3 className="text-white font-bold text-center mb-4 text-sm font-display lowercase tracking-tight">
              Tirar Foto
            </h3>
            
            {cameraError && (
              <div className="absolute inset-x-6 top-16 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl p-3 text-xs font-bold flex items-center gap-2 z-10">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            <div className="w-64 h-64 bg-black rounded-2xl overflow-hidden relative border border-white/5 shadow-inner">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover scale-x-[-1]"
              />
            </div>

            <canvas ref={canvasRef} className="hidden" width="400" height="400" />

            <div className="flex gap-3 w-full mt-6">
              <button 
                type="button"
                onClick={stopCamera}
                className="flex-1 py-3.5 bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all rounded-xl text-xs font-bold border border-white/5"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={capturePhoto}
                className="flex-1 py-3.5 bg-primary text-white hover:opacity-90 active:scale-95 transition-all rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-lg shadow-primary/25"
              >
                <Camera size={14} />
                Capturar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
