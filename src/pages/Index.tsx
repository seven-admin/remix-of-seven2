import { Navigate } from 'react-router-dom';
import { DashboardIncorporador } from '@/components/dashboard/DashboardIncorporador';
import { useAuth } from '@/contexts/AuthContext';
import { useDefaultRoute } from '@/hooks/useDefaultRoute';

const Index = () => {
  const { role } = useAuth();
  const { getDefaultRoute } = useDefaultRoute();

  // Dashboard específico para incorporadores
  if (role === 'incorporador') {
    return <DashboardIncorporador />;
  }

  const defaultRoute = getDefaultRoute();
  
  // Se a rota padrão é "/" (este componente), redireciona para marketing para evitar loop
  if (defaultRoute === '/') {
    return <Navigate to="/marketing" replace />;
  }

  return <Navigate to={defaultRoute} replace />;
};

export default Index;
