import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

const UserHistory: React.FC = () => {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4"
    >
      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-4xl mb-2 grayscale opacity-50">🧭</div>
      <h2 className="text-xl font-bold font-display">Sem viagens recentes</h2>
      <p className="text-gray-500 text-sm">Suas viagens salvas aparecerão aqui para busca rápida.</p>
      <button onClick={() => navigate('/')} className="btn-primary mt-4 px-8 py-3 bg-primary text-white rounded-xl font-bold w-full">Pedir agora</button>
    </motion.div>
  );
};

export default UserHistory;
