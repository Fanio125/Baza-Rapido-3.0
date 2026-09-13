import React from 'react';
import { useNavigate } from 'react-router-dom';
import CitySelection from '../components/CitySelection';

const CitiesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <CitySelection 
      onNavigate={(view) => {
        if (view === 'home') navigate('/');
        else navigate(`/${view}`);
      }} 
    />
  );
};

export default CitiesPage;
