import React from 'react';
import { useNavigate } from 'react-router-dom';
import HelpCenterSection from '../components/HelpCenterSection';

const HelpCenterPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <HelpCenterSection 
      onNavigate={(view) => {
        if (view === 'home') navigate('/');
        else navigate(`/${view}`);
      }} 
    />
  );
};

export default HelpCenterPage;
