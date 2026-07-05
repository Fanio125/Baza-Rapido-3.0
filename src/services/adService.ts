import { supabase } from '../lib/supabase';

export interface Ad {
  id: string;
  title: string;
  category: string;
  city: string;
  price?: number;
  status: 'Pendente' | 'Aprovado' | 'Rejeitado';
  advertiser: string;
  advertiser_email: string;
  company_name?: string; // Nome da empresa
  date: string;
  expiry_date?: string; // Data de expiração opcional
  description: string;
  phone: string;
  whatsapp?: string; // Contacto WhatsApp
  type: 'Normal' | 'Patrocinado' | 'Premium'; // Identificação
  images: string[]; // Todas as imagens
}

const LOCAL_STORAGE_KEY = 'br_admin_ads';

// Base mock advertisements to populate if empty
const defaultMockAds: Ad[] = [
  {
    id: 'ad-1',
    title: 'Corrida Diária Kilamba - Talatona (Partilhado)',
    category: 'Conforto',
    city: 'Talatona',
    price: 1500,
    status: 'Aprovado',
    advertiser: 'Sebastião Antunes',
    advertiser_email: 'sebastiao.ant@gmail.com',
    company_name: 'Antunes Carpooling',
    date: '2026-06-28',
    description: 'Procuro 2 passageiros para dividir despesas de combustível de Segunda a Sexta, saída às 07:00.',
    phone: '931224455',
    whatsapp: '931224455',
    type: 'Normal',
    images: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'ad-2',
    title: 'Fretes e Entregas Rápidas Viana',
    category: 'Carrinha/Entregas',
    city: 'Viana',
    price: 8000,
    status: 'Pendente',
    advertiser: 'Mateus Catraio',
    advertiser_email: 'mateus.cat@gmail.com',
    company_name: 'Viana Express Fretes',
    date: '2026-07-01',
    description: 'Serviço de fretes com carrinha fechada. Preço negociável consoante a distância e volume.',
    phone: '912550099',
    whatsapp: '912550099',
    type: 'Normal',
    images: [
      'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'ad-3',
    title: 'Moto-táxi Rápido Cacuaco/Talatona',
    category: 'Moto-táxi',
    city: 'Cacuaco',
    price: 800,
    status: 'Aprovado',
    advertiser: 'Isabel de Carvalho',
    advertiser_email: 'isabel.carv@hotmail.com',
    company_name: 'Isabel Moto-táxis Lda',
    date: '2026-06-30',
    description: 'Serviço profissional de moto-táxi rápido e seguro. Capacete higienizado disponível.',
    phone: '925334400',
    whatsapp: '925334400',
    type: 'Patrocinado',
    images: [
      'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'ad-4',
    title: 'Aluguer de Carro com Motorista - Executivo',
    category: 'Executivo',
    city: 'Luanda',
    price: 35000,
    status: 'Aprovado',
    advertiser: 'Frank Manuel',
    advertiser_email: 'frankmanuel123.com@gmail.com',
    company_name: 'Baza Rápido Premium',
    date: '2026-06-29',
    description: 'Viatura luxuosa com motorista profissional para eventos corporativos, casamentos ou turismo.',
    phone: '923000123',
    whatsapp: '923000123',
    type: 'Premium',
    images: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'ad-5',
    title: 'Táxi Particular Aeroporto - Central Luanda',
    category: 'Económico',
    city: 'Belas',
    price: 5000,
    status: 'Rejeitado',
    advertiser: 'Mateus Catraio',
    advertiser_email: 'mateus.cat@gmail.com',
    company_name: 'Aeroporto Connect',
    date: '2026-06-24',
    description: 'Preço fixo sem taxas ocultas. Água e ar condicionado incluídos.',
    phone: '912550099',
    whatsapp: '912550099',
    type: 'Normal',
    images: [
      'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=600&q=80'
    ]
  }
];

export const adService = {
  getAds(): Ad[] {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Map images to array of strings if they are parsed differently
        return parsed.map((ad: any) => ({
          ...ad,
          images: Array.isArray(ad.images) ? ad.images : (ad.image ? [ad.image] : []),
          type: ad.type || 'Normal',
          company_name: ad.company_name || ad.advertiser || 'Empresa Geral',
          whatsapp: ad.whatsapp || ad.phone || ''
        }));
      }
    } catch (e) {
      console.error('Error loading ads:', e);
    }
    
    // Seed and return default mock ads
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultMockAds));
    return defaultMockAds;
  },

  saveAds(ads: Ad[]) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(ads));
      window.dispatchEvent(new CustomEvent('ads-updated'));
    } catch (e) {
      console.error('Error saving ads:', e);
    }
  },

  getActiveApprovedAds(): Ad[] {
    const all = this.getAds();
    // Filter active (Aprovado / active / approved)
    return all.filter(ad => ad.status === 'Aprovado' || (ad.status as string) === 'active' || (ad.status as string) === 'approved');
  },

  createAd(adData: Omit<Ad, 'id' | 'date'>): Ad {
    const ads = this.getAds();
    const newAd: Ad = {
      ...adData,
      id: `ad-${Date.now()}`,
      date: new Date().toISOString().split('T')[0]
    };
    ads.push(newAd);
    this.saveAds(ads);
    return newAd;
  },

  updateAd(id: string, adData: Partial<Ad>): Ad | null {
    const ads = this.getAds();
    const idx = ads.findIndex(ad => ad.id === id);
    if (idx === -1) return null;
    
    const updatedAd = { ...ads[idx], ...adData };
    ads[idx] = updatedAd;
    this.saveAds(ads);
    return updatedAd;
  },

  deleteAd(id: string): boolean {
    const ads = this.getAds();
    const filtered = ads.filter(ad => ad.id !== id);
    if (filtered.length === ads.length) return false;
    this.saveAds(filtered);
    return true;
  }
};
