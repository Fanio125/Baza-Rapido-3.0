import React from 'react';
import { useNavigate } from 'react-router-dom';
import PrivacySection from '../components/PrivacySection';

const PrivacyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PrivacySection 
        onNavigate={(view) => {
          if (view === 'home') navigate('/');
          else navigate(`/${view}`);
        }} 
      />
    </div>
  );
};

export default PrivacyPage;
