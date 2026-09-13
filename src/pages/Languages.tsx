import React from 'react';
import { useNavigate } from 'react-router-dom';
import LanguageSelection from '../components/LanguageSelection';

const LanguagesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <LanguageSelection 
      onNavigate={(view) => {
        if (view === 'home') navigate('/');
        else navigate(`/${view}`);
      }} 
    />
  );
};

export default LanguagesPage;
