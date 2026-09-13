import React from 'react';
import { useNavigate } from 'react-router-dom';
import EditProfileSection from '../components/EditProfileSection';

const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <EditProfileSection 
      onNavigate={(view) => {
        if (view === 'home') navigate('/');
        else navigate(`/${view}`);
      }} 
    />
  );
};

export default EditProfilePage;
