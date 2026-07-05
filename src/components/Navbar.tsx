import { motion } from 'motion/react';
import { Home, BarChart2, User, Search, Map, Megaphone } from 'lucide-react';
import { cn } from '../lib/utils';
import type { ViewState } from '../types';

interface NavbarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
}

export default function Navbar({ currentView, onNavigate }: NavbarProps) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Início' },
    { id: 'history', icon: Map, label: 'Viagens' },
    { id: 'comparing', icon: Search, label: 'Baza' },
    { id: 'ads', icon: Megaphone, label: 'Anúncios' },
    { id: 'statistics', icon: BarChart2, label: 'Preços' },
    { id: 'profile', icon: User, label: 'Perfil' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pb-8 pt-3 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {tabs.map((tab) => {
          const isActive = currentView === tab.id || 
            (tab.id === 'comparing' && currentView === 'results') ||
            (tab.id === 'profile' && ['settings', 'edit-profile', 'languages', 'cities', 'terms', 'privacy', 'version'].includes(currentView));
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id as ViewState)}
              className="relative flex flex-col items-center gap-1 p-2 transition-all group"
            >
              <div className={cn(
                "p-2 rounded-xl transition-all duration-300",
                isActive ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" : "text-gray-400 hover:text-gray-600"
              )}>
                <tab.icon size={20} className={cn(isActive && "fill-current")} />
              </div>
              <span className={cn(
                "text-[10px] font-bold tracking-tight lowercase transition-all",
                isActive ? "text-primary opacity-100" : "text-gray-400 opacity-0 group-hover:opacity-100"
              )}>
                {tab.label}
              </span>
              
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-3 w-1 h-1 bg-primary rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
