import React, { useEffect } from 'react';
import { useLocation, useNavigate, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { Car } from 'lucide-react';
import Navbar from '../components/Navbar';
import { ViewState } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { isAdminAuthenticated, isUserAdmin } from '../utils/authHelper';
import { analyticsService } from '../services/analyticsService';

const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 10,
    filter: 'blur(2px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.28,
      ease: [0.25, 1, 0.5, 1] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: 'blur(2px)',
    transition: {
      duration: 0.18,
      ease: [0.25, 1, 0.5, 1] as [number, number, number, number],
    },
  },
};

const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentOutlet = useOutlet();
  
  // Real-time Analytics & Presence Tracking
  useEffect(() => {
    const currentPath = location.pathname || '/';
    analyticsService.trackPageAccess(currentPath, user?.id);
    analyticsService.initPresence(currentPath, user?.id);
  }, [location.pathname, user?.id]);

  useEffect(() => {
    if (isUserAdmin(user)) {
      if (isAdminAuthenticated(user)) {
        if (sessionStorage.getItem('bypass_admin_redirect') !== 'true') {
          navigate('/admin');
        }
      } else {
        // Force redirect to profile because data is incomplete
        if (location.pathname !== '/profile') {
          console.warn("Utilizador admin detetado com dados incompletos. Redirecionando para /profile.");
          navigate('/profile');
        }
      }
    }
  }, [user, navigate, location.pathname]);
  
  // Map current path to ViewState for the Navbar
  const getCurrentView = (): ViewState => {
    const path = location.pathname.substring(1);
    if (!path) return 'home';
    return path as ViewState;
  };

  const handleNavigate = (view: ViewState) => {
    if (view === 'home') {
      navigate('/');
    } else {
      navigate(`/${view}`);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Mobile Top Header - Clean & Native */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl px-5 py-3.5 flex items-center justify-center border-b border-gray-100/80 mb-4 transition-colors">
        <div 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2.5 cursor-pointer active:scale-98 transition-transform select-none"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-orange-600 rounded-xl flex items-center justify-center shadow-md shadow-primary/25">
            <svg 
              className="w-5 h-5 text-white" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" fill="currentColor" />
            </svg>
          </div>
          <div>
            <span className="text-lg font-black font-display tracking-tight text-gray-900 block leading-tight">
              Baza <span className="text-primary">Barato</span>
            </span>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block -mt-0.5">
              Angola
            </span>
          </div>
        </div>
      </header>

      <main className="px-6 max-w-md mx-auto relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full"
          >
            {currentOutlet}
          </motion.div>
        </AnimatePresence>
      </main>

      <Navbar 
        currentView={getCurrentView()} 
        onNavigate={handleNavigate} 
      />
    </div>
  );
};

export default MainLayout;
