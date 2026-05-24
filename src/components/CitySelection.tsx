import { motion } from 'motion/react';
import { ChevronLeft, MapPin } from 'lucide-react';
import type { ViewState } from '../types';

interface CitySelectionProps {
  onNavigate: (view: ViewState) => void;
  currentCity?: string;
}

export default function CitySelection({ onNavigate, currentCity = 'Luanda' }: CitySelectionProps) {
  const provinces = [
    {
      name: 'Província de Luanda',
      emoji: '🇦🇴',
      cities: ['Luanda', 'Cacuaco', 'Viana', 'Kilamba Kiaxi', 'Talatona', 'Belas', 'Icolo e Bengo']
    },
    {
      name: 'Benguela',
      emoji: '🟡',
      cities: ['Benguela', 'Lobito', 'Catumbela', 'Baía Farta', 'Ganda']
    },
    {
      name: 'Huambo',
      emoji: '🟡',
      cities: ['Huambo', 'Caála', 'Bailundo', 'Longonjo']
    },
    {
      name: 'Huíla',
      emoji: '🟡',
      cities: ['Lubango', 'Matala', 'Humpata', 'Chibia']
    },
    {
      name: 'Cabinda',
      emoji: '🟡',
      cities: ['Cabinda', 'Cacongo', 'Buco-Zau', 'Belize']
    },
    {
      name: 'Uíge',
      emoji: '🟡',
      cities: ['Uíge', 'Negage', 'Maquela do Zombo', 'Ambuíla']
    },
    {
      name: 'Malanje',
      emoji: '🟡',
      cities: ['Malanje', 'Cacuso', 'Calandula', 'Kiwaba Nzoji']
    },
    {
      name: 'Kwanza Sul',
      emoji: '🟡',
      cities: ['Sumbe', 'Porto Amboim', 'Libolo', 'Quibala']
    },
    {
      name: 'Kwanza Norte',
      emoji: '🟡',
      cities: ['Ndalatando', 'Cambambe', 'Cazengo', 'Lucala']
    },
    {
      name: 'Bié',
      emoji: '🟡',
      cities: ['Kuito', 'Andulo', 'Camacupa', 'Cunhinga']
    },
    {
      name: 'Moxico',
      emoji: '🟡',
      cities: ['Luena', 'Cazombo']
    },
    {
      name: 'Cuando Cubango',
      emoji: '🟡',
      cities: ['Menongue', 'Cuito Cuanavale']
    },
    {
      name: 'Namibe',
      emoji: '🟡',
      cities: ['Moçâmedes', 'Tombwa']
    },
    {
      name: 'Lunda Norte',
      emoji: '🟡',
      cities: ['Dundo', 'Lucapa']
    },
    {
      name: 'Lunda Sul',
      emoji: '🟡',
      cities: ['Saurimo', 'Cacolo']
    },
    {
      name: 'Zaire',
      emoji: '🟡',
      cities: ['Mbanza Congo', 'Soyo', 'N\'zeto']
    }
  ];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => onNavigate('settings')}
          className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft />
        </button>
        <h2 className="text-xl font-bold font-display tracking-tight text-gray-900">Cidade</h2>
      </div>

      <div className="space-y-8">
        {provinces.map((province, pIdx) => (
          <div key={pIdx} className="space-y-3">
            <h3 className="flex items-center gap-2 px-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <span>{province.emoji}</span>
              {province.name}
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {province.cities.map((city, cIdx) => (
                <motion.button
                  key={cIdx}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (pIdx * 0.05) + (cIdx * 0.02) }}
                  className={`flex items-center justify-between p-4 premium-card border-none hover:bg-gray-50 shadow-none text-left group ${currentCity === city ? 'bg-primary/5 ring-1 ring-primary/20' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className={currentCity === city ? 'text-primary' : 'text-gray-300'} />
                    <span className={`font-bold ${currentCity === city ? 'text-primary' : 'text-gray-900'}`}>
                      {city}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
