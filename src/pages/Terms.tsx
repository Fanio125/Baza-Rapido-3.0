import React from 'react';
import { useNavigate } from 'react-router-dom';
import TermsSection from '../components/TermsSection';

const TermsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <TermsSection 
      onNavigate={(view) => {
        if (view === 'home') navigate('/');
        else navigate(`/${view}`);
      }} 
    />
  );
};

export default TermsPage;
