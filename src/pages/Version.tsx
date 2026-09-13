import React from 'react';
import { useNavigate } from 'react-router-dom';
import VersionSection from '../components/VersionSection';

const VersionPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <VersionSection 
      onNavigate={(view) => {
        if (view === 'home') navigate('/');
        else navigate(`/${view}`);
      }} 
    />
  );
};

export default VersionPage;
