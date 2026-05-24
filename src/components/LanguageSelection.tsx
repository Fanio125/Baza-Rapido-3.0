import { motion } from 'motion/react';
import { ChevronLeft, Check } from 'lucide-react';
import type { ViewState } from '../types';

interface LanguageSelectionProps {
  onNavigate: (view: ViewState) => void;
  currentLanguage?: string;
}

export default function LanguageSelection({ onNavigate, currentLanguage = 'pt' }: LanguageSelectionProps) {
  const languages = [
    { id: 'pt', label: 'Português', flag: '🇵🇹' },
    { id: 'en', label: 'English', flag: '🇬🇧' },
    { id: 'fr', label: 'Français', flag: '🇫🇷' },
    { id: 'es', label: 'Español', flag: '🇪🇸' },
    { id: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { id: 'it', label: 'Italiano', flag: '🇮🇹' },
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
        <h2 className="text-xl font-bold font-display tracking-tight text-gray-900">Idioma</h2>
      </div>

      <div className="space-y-2">
        {languages.map((lang, index) => (
          <motion.button
            key={lang.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`w-full flex items-center justify-between p-4 premium-card border-none hover:bg-gray-50 shadow-none transition-colors group ${currentLanguage === lang.id ? 'bg-primary/5 ring-1 ring-primary/20' : ''}`}
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">{lang.flag}</span>
              <span className={`font-bold ${currentLanguage === lang.id ? 'text-primary' : 'text-gray-900'}`}>
                {lang.label}
              </span>
            </div>
            {currentLanguage === lang.id && (
              <Check size={18} className="text-primary" />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
