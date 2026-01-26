import { usePermissions } from './usePermissions';
import { useAuth } from '@/contexts/AuthContext';

// Ordem de prioridade para redirecionamento
// Admin/Super Admin vão direto para dashboard, outros seguem prioridade
const routePriority = [
  { path: '/', module: 'dashboard' },
  { path: '/marketing', module: 'projetos_marketing' },
  { path: '/empreendimentos', module: 'empreendimentos' },
  { path: '/clientes', module: 'clientes' },
  { path: '/negociacoes', module: 'negociacoes' },
  { path: '/atividades', module: 'atividades' },
  { path: '/contratos', module: 'contratos' },
  { path: '/comissoes', module: 'comissoes' },
  { path: '/portal-corretor', module: 'portal_corretor' },
];

export function useDefaultRoute() {
  const { canAccessModule, isLoading, isAdmin } = usePermissions();
  const { role } = useAuth();

  const getDefaultRoute = (): string => {
    // Admin e Super Admin sempre vão para o dashboard
    if (isAdmin() || role === 'super_admin' || role === 'admin') {
      return '/';
    }
    
    for (const route of routePriority) {
      if (canAccessModule(route.module, 'view')) {
        return route.path;
      }
    }
    // Fallback - retorna a primeira rota mesmo sem permissão
    // O ProtectedRoute vai lidar com o acesso negado
    return '/';
  };

  const canAccessDashboard = (): boolean => {
    return canAccessModule('dashboard', 'view');
  };

  return {
    getDefaultRoute,
    canAccessDashboard,
    isLoading,
  };
}
