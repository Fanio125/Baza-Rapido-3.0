import React from 'react';
import { useNavigate } from 'react-router-dom';
import SettingsSection from '../components/SettingsSection';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <SettingsSection 
      onNavigate={(view) => {
        if (view === 'home') navigate('/');
        else navigate(`/${view}`);
      }} 
    />
  );
};

export default SettingsPage;
