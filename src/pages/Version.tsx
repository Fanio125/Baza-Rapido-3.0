import React from 'react';
import { useNavigate } from 'react-router-dom';
import VersionSection from '../components/VersionSection';

const VersionPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <VersionSection 
        onNavigate={(view) => {
          if (view === 'home') navigate('/');
          else navigate(`/${view}`);
        }} 
      />
    </div>
  );
};

export default VersionPage;
