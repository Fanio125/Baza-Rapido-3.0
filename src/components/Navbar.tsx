import { motion } from 'motion/react';
import { Home, History, Heart, User } from 'lucide-react';
import { cn } from '../lib/utils';
import type { ViewState } from '../types';

interface NavbarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
}

export default function Navbar({ currentView, onNavigate }: NavbarProps) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Início' },
    { id: 'history', icon: History, label: 'Histórico' },
    { id: 'favorites', icon: Heart, label: 'Favoritos' },
    { id: 'profile', icon: User, label: 'Perfil' },
  ];

  return (
    <nav 
      aria-label="Navegação inferior"
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.04)]"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
    >
      <div className="max-w-md mx-auto px-4 pt-2.5 pb-1 flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = currentView === tab.id || 
            (tab.id === 'home' && (currentView === 'comparing' || currentView === 'results')) ||
            (tab.id === 'profile' && ['settings', 'edit-profile', 'languages', 'cities', 'terms', 'privacy', 'version', 'help', 'statistics'].includes(currentView));
          
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id as ViewState)}
              className="relative flex flex-col items-center justify-center py-1 px-3 min-w-[64px] min-h-[48px] rounded-2xl transition-all select-none active:scale-95 group"
            >
              {/* Active Glow Pill on Top */}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute -top-2.5 w-8 h-1 bg-primary rounded-full shadow-sm shadow-primary/40"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}

              <div className={cn(
                "p-1.5 rounded-xl transition-all duration-200 flex items-center justify-center",
                isActive 
                  ? "text-primary scale-105" 
                  : "text-gray-400 group-hover:text-gray-600"
              )}>
                <tab.icon 
                  size={22} 
                  className={cn(
                    "transition-transform",
                    isActive ? "stroke-[2.5]" : "stroke-[1.8]"
                  )} 
                />
              </div>

              <span className={cn(
                "text-[11px] font-semibold tracking-tight transition-colors mt-0.5",
                isActive ? "text-primary font-bold" : "text-gray-500"
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

