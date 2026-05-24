import React from 'react';
import { useNavigate } from 'react-router-dom';
import TermsSection from '../components/TermsSection';

const TermsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <TermsSection 
        onNavigate={(view) => {
          if (view === 'home') navigate('/');
          else navigate(`/${view}`);
        }} 
      />
    </div>
  );
};

export default TermsPage;
