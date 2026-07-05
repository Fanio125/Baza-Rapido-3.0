import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Car } from 'lucide-react';
import Navbar from '../components/Navbar';
import { ViewState } from '../types';
import { useAuth } from '../contexts/AuthContext';

const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    if (user?.email === 'frankmanuel123.com@gmail.com' && sessionStorage.getItem('bypass_admin_redirect') !== 'true') {
      navigate('/admin');
    }
  }, [user, navigate]);
  
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
      {/* Mobile Top Header - Floating */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl px-6 py-4 flex items-center justify-center border-b border-gray-50 mb-6">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 rotate-12">
               <Car size={20} className="text-white fill-white" />
            </div>
            <span className="text-xl font-black font-display tracking-tighter text-gray-900 capitalize">
                Baza <span className="text-primary">Rápido</span>
            </span>
        </div>
      </div>

      <main className="px-6 max-w-md mx-auto">
        <Outlet />
      </main>

      <Navbar 
        currentView={getCurrentView()} 
        onNavigate={handleNavigate} 
      />
    </div>
  );
};

export default MainLayout;
