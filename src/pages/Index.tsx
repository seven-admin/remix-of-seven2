import { Navigate } from 'react-router-dom';
import { DashboardIncorporador } from '@/components/dashboard/DashboardIncorporador';
import { useAuth } from '@/contexts/AuthContext';
import { useDefaultRoute } from '@/hooks/useDefaultRoute';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { role, isLoading: authLoading } = useAuth();
  const { getDefaultRoute, isLoading: permLoading } = useDefaultRoute();

  // Aguardar TODAS as informações carregarem antes de decidir redirecionamento
  if (authLoading || permLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Dashboard específico para incorporadores
  if (role === 'incorporador') {
    return <DashboardIncorporador />;
  }

  // Agora as permissões estão carregadas, getDefaultRoute() retorna valor correto
  const defaultRoute = getDefaultRoute();
  
  // Se a rota padrão é "/" (este componente), redireciona para marketing para evitar loop
  if (defaultRoute === '/') {
    return <Navigate to="/marketing" replace />;
  }

  return <Navigate to={defaultRoute} replace />;
};

export default Index;
