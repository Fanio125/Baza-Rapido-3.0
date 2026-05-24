import React from 'react';
import { useNavigate } from 'react-router-dom';
import LanguageSelection from '../components/LanguageSelection';

const LanguagesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <LanguageSelection 
        onNavigate={(view) => {
          if (view === 'home') navigate('/');
          else navigate(`/${view}`);
        }} 
      />
    </div>
  );
};

export default LanguagesPage;
