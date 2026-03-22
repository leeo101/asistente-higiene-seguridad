
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import ModulePreview from './ModulePreview';

export default function ModuleGuard({ children }) {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!currentUser) {
    return (
      <ModulePreview 
        path={location.pathname} 
        onBack={() => navigate('/')} 
      />
    );
  }

  return children;
}
