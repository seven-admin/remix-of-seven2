import { usePermissions } from './usePermissions';

// Ordem de prioridade para redirecionamento
// portal_corretor primeiro para evitar flash de "Acesso Negado" para corretores
const routePriority = [
  { path: '/portal-corretor', module: 'portal_corretor' },
  { path: '/', module: 'dashboard' },
  { path: '/empreendimentos', module: 'empreendimentos' },
  { path: '/clientes', module: 'clientes' },
  { path: '/negociacoes', module: 'negociacoes' },
  { path: '/atividades', module: 'atividades' },
  { path: '/contratos', module: 'contratos' },
  { path: '/comissoes', module: 'comissoes' },
];

export function useDefaultRoute() {
  const { canAccessModule, isLoading } = usePermissions();

  const getDefaultRoute = (): string => {
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
