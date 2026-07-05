import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, MapPin, Sparkles, Phone, ArrowLeft, 
  ChevronLeft, ChevronRight, MessageSquare, Tag, 
  Building2, Calendar, Share2, Compass, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adService, Ad } from '../services/adService';

export default function Ads() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedType, setSelectedType] = useState('Todos');
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    // Load approved ads
    setAds(adService.getActiveApprovedAds());

    // Listen to updates
    const handleUpdate = () => {
      setAds(adService.getActiveApprovedAds());
    };
    window.addEventListener('ads-updated', handleUpdate);
    return () => window.removeEventListener('ads-updated', handleUpdate);
  }, []);

  // Filter ads
  const filteredAds = ads.filter(ad => {
    const matchesSearch = 
      ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ad.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ad.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ad.company_name || ad.advertiser).toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'Todas' || ad.category === selectedCategory;
    const matchesType = selectedType === 'Todos' || ad.type === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  // Extract unique categories
  const categories = ['Todas', ...Array.from(new Set(ads.map(ad => ad.category)))];

  const handleOpenAd = (ad: Ad) => {
    setSelectedAd(ad);
    setActiveImageIndex(0);
  };

  const handleContact = (ad: Ad, type: 'phone' | 'whatsapp') => {
    if (type === 'whatsapp') {
      const formattedPhone = ad.whatsapp?.replace(/\D/g, '') || ad.phone.replace(/\D/g, '');
      const text = encodeURIComponent(`Olá! Vi o vosso anúncio "${ad.title}" no Baza Rápido e gostaria de obter mais informações.`);
      window.open(`https://wa.me/244${formattedPhone}?text=${text}`, '_blank');
    } else {
      window.open(`tel:+244${ad.phone.replace(/\D/g, '')}`, '_self');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6 pb-24"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')}
            className="p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} className="text-gray-700" />
          </button>
          <div>
            <h1 className="text-2xl font-black font-display tracking-tight text-gray-900">
              Anúncios e Serviços
            </h1>
            <p className="text-xs font-medium text-gray-500">Parceiros recomendados Baza Rápido</p>
          </div>
        </div>
        {user?.email === 'frankmanuel123.com@gmail.com' && (
          <button 
            onClick={() => navigate('/admin')}
            className="px-3.5 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/50 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Painel Admin
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <input 
            type="text"
            placeholder="Pesquise anúncios, serviços ou empresas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          <Search size={18} className="absolute left-4 top-3.5 text-gray-400" />
        </div>

        {/* Categories scroll */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                selectedCategory === cat 
                  ? 'bg-primary border-primary text-white shadow-sm' 
                  : 'bg-gray-50/70 border-gray-100 text-gray-600 hover:bg-gray-100/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Feed list */}
      <div className="space-y-4">
        {filteredAds.length === 0 ? (
          <div className="p-8 text-center bg-gray-50/50 border border-dashed border-gray-200 rounded-3xl space-y-3">
            <AlertCircle size={32} className="text-gray-400 mx-auto" />
            <p className="text-sm font-bold text-gray-700">Nenhum anúncio encontrado</p>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">Tente ajustar a sua pesquisa ou limpe os filtros selecionados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredAds.map((ad) => {
              const mainImg = ad.images?.[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80';
              return (
                <motion.div
                  key={ad.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleOpenAd(ad)}
                  className={`relative p-4 rounded-3xl border transition-all cursor-pointer bg-white overflow-hidden flex flex-col md:flex-row gap-4 shadow-xs ${
                    ad.type === 'Premium'
                      ? 'border-amber-200 shadow-md shadow-amber-500/5 ring-1 ring-amber-400/20'
                      : ad.type === 'Patrocinado'
                      ? 'border-primary/20 shadow-xs'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  {/* Badge de Destaque */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${
                      ad.type === 'Premium'
                        ? 'bg-amber-500 text-white'
                        : ad.type === 'Patrocinado'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {ad.type === 'Premium' && <Sparkles size={10} className="fill-current" />}
                      {ad.type}
                    </span>
                  </div>

                  {/* Image Container */}
                  <div className="w-full md:w-36 h-36 rounded-2xl overflow-hidden shrink-0 bg-gray-100 relative">
                    <img 
                      src={mainImg} 
                      alt={ad.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Content details */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                        <span className="truncate">{ad.category}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <MapPin size={10} />
                          {ad.city}
                        </span>
                      </div>
                      <h3 className="font-extrabold font-display text-gray-900 text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {ad.title}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {ad.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Building2 size={13} className="text-gray-400 shrink-0" />
                        <span className="text-xs font-bold text-gray-700 truncate">
                          {ad.company_name || ad.advertiser}
                        </span>
                      </div>
                      {ad.price !== undefined && ad.price > 0 ? (
                        <div className="text-right shrink-0">
                          <span className="text-xs text-gray-400 font-medium">Tarifa</span>
                          <p className="text-sm font-black text-primary leading-none">
                            {ad.price.toLocaleString('pt-AO')} Kz
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-gray-400">Preço Sob Consulta</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ad Details Overlay Drawer / Modal */}
      <AnimatePresence>
        {selectedAd && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAd(null)}
              className="fixed inset-0 bg-black z-50"
            />
            
            {/* Drawer */}
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[32px] z-50 overflow-y-auto max-h-[90vh] shadow-2xl pb-10"
            >
              {/* Top notch */}
              <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto my-3" />

              {/* Close and Share Header */}
              <div className="flex items-center justify-between px-6 pb-2">
                <button 
                  onClick={() => setSelectedAd(null)}
                  className="px-3 py-1.5 bg-gray-100 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-200 transition-all cursor-pointer"
                >
                  Fechar
                </button>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                    selectedAd.type === 'Premium'
                      ? 'bg-amber-100 text-amber-700'
                      : selectedAd.type === 'Patrocinado'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {selectedAd.type}
                  </span>
                </div>
              </div>

              {/* Images Carousel */}
              <div className="relative h-64 bg-gray-100 px-6 my-2">
                <div className="w-full h-full rounded-2xl overflow-hidden relative group">
                  <img 
                    src={selectedAd.images[activeImageIndex] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80'} 
                    alt={selectedAd.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Left arrow */}
                  {selectedAd.images.length > 1 && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex(prev => prev === 0 ? selectedAd.images.length - 1 : prev - 1);
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-md text-gray-700 hover:bg-white transition-all cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                  )}

                  {/* Right arrow */}
                  {selectedAd.images.length > 1 && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex(prev => prev === selectedAd.images.length - 1 ? 0 : prev + 1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-md text-gray-700 hover:bg-white transition-all cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  )}

                  {/* Image indicator count dots */}
                  {selectedAd.images.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full">
                      {selectedAd.images.map((_, i) => (
                        <span 
                          key={i} 
                          className={`w-1.5 h-1.5 rounded-full transition-all ${
                            activeImageIndex === i ? 'bg-white scale-125' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Content body */}
              <div className="px-6 py-4 space-y-6">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-primary uppercase tracking-wider bg-primary/5 px-2.5 py-1 rounded-lg">
                      {selectedAd.category}
                    </span>
                    <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                      <Calendar size={12} />
                      {selectedAd.date}
                    </span>
                  </div>
                  
                  <h2 className="text-xl font-black font-display text-gray-950 mt-2 tracking-tight leading-snug">
                    {selectedAd.title}
                  </h2>

                  {/* Price banner */}
                  <div className="mt-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500">Valor Estimado</span>
                    <span className="text-lg font-black text-primary">
                      {selectedAd.price && selectedAd.price > 0 
                        ? `${selectedAd.price.toLocaleString('pt-AO')} Kz` 
                        : 'Sob Consulta'}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest">Descrição Completa</h4>
                  <p className="text-sm font-medium text-gray-600 leading-relaxed bg-white">
                    {selectedAd.description}
                  </p>
                </div>

                {/* Corporate Information */}
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-3">
                  <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest">Empresa e Anunciante</h4>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-gray-900">
                        {selectedAd.company_name || selectedAd.advertiser}
                      </h5>
                      <p className="text-xs text-gray-400">Responsável: {selectedAd.advertiser}</p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <MapPin size={12} />
                        {selectedAd.city}, Angola
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons (Call & WhatsApp) */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => handleContact(selectedAd, 'phone')}
                    className="flex items-center justify-center gap-2 py-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-sm rounded-2xl transition-all cursor-pointer"
                  >
                    <Phone size={16} />
                    Ligar
                  </button>
                  <button
                    onClick={() => handleContact(selectedAd, 'whatsapp')}
                    className="flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
                  >
                    <MessageSquare size={16} />
                    WhatsApp
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
