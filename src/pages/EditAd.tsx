import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Upload, Sparkles, Building2, Phone, 
  MapPin, Tag, Plus, Trash2, Calendar, AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { adService, Ad } from '../services/adService';
import { isAdminAuthenticated, getAdminAuthStatus } from '../utils/authHelper';

const LUANDA_MUNICIPALITIES = [
  'Belas', 'Cacuaco', 'Cazenga', 'Icolo e Bengo', 
  'Luanda', 'Quiçama', 'Kilamba Kiaxi', 'Talatona', 'Viana'
];

const PRESET_CATEGORIES = [
  'Económico', 'Conforto', 'Executivo', 'Moto-táxi', 'Carrinha/Entregas'
];

export default function EditAd() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  // Security Gate
  useEffect(() => {
    if (!loading) {
      const status = getAdminAuthStatus(user);
      if (status.needsRedirectToProfile) {
        navigate('/profile', { replace: true });
      } else if (!status.isAdmin) {
        navigate('/', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  // Form State
  const [ad, setAd] = useState<Ad | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(PRESET_CATEGORIES[0]);
  const [city, setCity] = useState(LUANDA_MUNICIPALITIES[4]);
  const [price, setPrice] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [type, setType] = useState<'Normal' | 'Patrocinado' | 'Premium'>('Normal');
  const [images, setImages] = useState<string[]>([]);
  const [expiryDate, setExpiryDate] = useState('');
  const [status, setStatus] = useState<'Pendente' | 'Aprovado' | 'Rejeitado'>('Aprovado');
  const [imageInput, setImageInput] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (id) {
      const ads = adService.getAds();
      const found = ads.find(a => a.id === id);
      if (found) {
        setAd(found);
        setTitle(found.title);
        setCategory(found.category);
        setCity(found.city);
        setPrice(found.price === undefined ? '' : found.price);
        setDescription(found.description);
        setCompanyName(found.company_name || found.advertiser || '');
        setPhone(found.phone);
        setWhatsapp(found.whatsapp || found.phone || '');
        setType(found.type || 'Normal');
        setImages(found.images || []);
        setExpiryDate(found.expiry_date || '');
        setStatus(found.status || 'Aprovado');
      } else {
        alert('Anúncio não encontrado.');
        navigate('/admin');
      }
    }
  }, [id, navigate]);

  // Handle local image file upload (Base64 conversion)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);

    const promises = Array.from(files).map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises)
      .then(base64Images => {
        setImages(prev => [...prev, ...base64Images]);
      })
      .catch(err => console.error('Error reading files:', err))
      .finally(() => setUploading(false));
  };

  const addImageUrl = () => {
    if (imageInput.trim()) {
      setImages(prev => [...prev, imageInput.trim()]);
      setImageInput('');
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !title || !description || !phone || !companyName) {
      alert('Por favor preencha todos os campos obrigatórios (Título, Descrição, Contacto, Nome da Empresa).');
      return;
    }

    const defaultImages = images.length > 0 ? images : [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80'
    ];

    adService.updateAd(id, {
      title,
      category,
      city,
      price: price === '' ? undefined : Number(price),
      company_name: companyName,
      expiry_date: expiryDate || undefined,
      description,
      phone,
      whatsapp: whatsapp || phone,
      type,
      status,
      images: defaultImages
    });

    // Redirect to admin panel ads tab
    navigate('/admin');
  };

  if (loading || !isAdminAuthenticated(user) || !ad) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-full" />
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">A carregar segurança...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24 pt-6">
      <div className="max-w-md mx-auto px-4 space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/admin')}
            className="p-2.5 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
          >
            <ArrowLeft size={18} className="text-gray-700" />
          </button>
          <div>
            <h1 className="text-2xl font-black font-display tracking-tight text-gray-900">
              Editar Anúncio
            </h1>
            <p className="text-xs font-medium text-gray-500">Alterar propriedades de publicação</p>
          </div>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-gray-100/80 shadow-xl shadow-gray-200/40 space-y-5">
          
          {/* Ad Type Identifier */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-gray-400 tracking-wider">Identificação do Anúncio</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Normal', 'Patrocinado', 'Premium'] as const).map(t => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setType(t)}
                  className={`py-3.5 rounded-2xl text-xs font-extrabold border transition-all cursor-pointer ${
                    type === t
                      ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                      : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Moderation Status */}
          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-gray-400 tracking-wider">Estado de Publicação / Moderação</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold text-gray-700 focus:outline-none transition-all"
            >
              <option value="Aprovado">Aprovado (Ativo no Feed)</option>
              <option value="Pendente">Pendente (Oculto / Moderação)</option>
              <option value="Rejeitado">Rejeitado (Oculto)</option>
            </select>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-gray-400 tracking-wider">Título do Anúncio *</label>
            <input 
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>

          {/* Company Name */}
          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-gray-400 tracking-wider">Nome da Empresa / Negócio *</label>
            <div className="relative">
              <input 
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
              <Building2 size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
            </div>
          </div>

          {/* Category & Municipality */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-gray-400 tracking-wider">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold text-gray-700 focus:outline-none transition-all"
              >
                {PRESET_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-gray-400 tracking-wider">Município (Local)</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold text-gray-700 focus:outline-none transition-all"
              >
                {LUANDA_MUNICIPALITIES.map(mun => (
                  <option key={mun} value={mun}>{mun}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Price & Expiry Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-gray-400 tracking-wider">Preço (Opcional, Kz)</label>
              <input 
                type="number"
                placeholder="Ex: 15000"
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-gray-400 tracking-wider">Expira em (Opcional)</label>
              <input 
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold text-gray-700 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Contacts (Phone & WhatsApp) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-gray-400 tracking-wider">Telefone *</label>
              <div className="relative">
                <input 
                  type="tel"
                  required
                  placeholder="Ex: 923000123"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                />
                <Phone size={14} className="absolute left-3.5 top-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-gray-400 tracking-wider">WhatsApp</label>
              <div className="relative">
                <input 
                  type="tel"
                  placeholder="Ex: 923000123"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                />
                <Phone size={14} className="absolute left-3.5 top-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-gray-400 tracking-wider">Descrição Detalhada *</label>
            <textarea 
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>

          {/* Image Upload Gallery */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-1">
              <Upload size={14} /> Imagens do Anúncio ({images.length})
            </label>
            
            {/* Direct file select Base64 */}
            <div className="flex items-center gap-3">
              <label className="flex-1 flex flex-col items-center justify-center px-4 py-6 bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-200 rounded-2xl cursor-pointer transition-all">
                <Upload className="text-gray-400 mb-2" size={20} />
                <span className="text-xs font-bold text-gray-600">
                  {uploading ? 'A carregar ficheiro...' : 'Upload de Imagens'}
                </span>
                <span className="text-[10px] text-gray-400 mt-1">PNG, JPG, WEBP de qualquer tamanho</span>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </label>
            </div>

            {/* URL input alternate */}
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="Ou cole o link de uma imagem da web..."
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
              <button
                type="button"
                onClick={addImageUrl}
                className="px-3.5 bg-amber-50 hover:bg-amber-100 border border-amber-200/30 text-amber-600 rounded-xl text-xs font-black transition-all cursor-pointer"
              >
                Adicionar
              </button>
            </div>

            {/* Image Thumbnail List */}
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2.5 pt-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-full h-16 rounded-xl overflow-hidden border border-gray-100 bg-gray-100 group">
                    <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 cursor-pointer"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="flex gap-3 pt-3 border-t border-gray-50">
            <button
              type="submit"
              className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 text-white font-black text-sm rounded-2xl transition-all shadow-md shadow-amber-500/10 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              Guardar Alterações
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-sm rounded-2xl transition-all cursor-pointer"
            >
              Cancelar
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
