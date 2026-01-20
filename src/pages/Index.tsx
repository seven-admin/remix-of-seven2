import { Navigate } from 'react-router-dom';
import { DashboardIncorporador } from '@/components/dashboard/DashboardIncorporador';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { role } = useAuth();

  // Dashboard específico para incorporadores
  if (role === 'incorporador') {
    return <DashboardIncorporador />;
  }

  // Redireciona para o Dashboard Executivo consolidado
  return <Navigate to="/dashboard-executivo" replace />;
};

export default Index;
