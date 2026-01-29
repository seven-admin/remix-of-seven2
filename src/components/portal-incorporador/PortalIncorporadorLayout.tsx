import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, LogOut } from 'lucide-react';
import logo from '@/assets/logo.png';

const routeTitles: Record<string, { title: string; subtitle?: string }> = {
  '/portal-incorporador': { 
    title: 'Dashboard', 
    subtitle: 'Visão geral dos seus empreendimentos' 
  },
  '/portal-incorporador/executivo': { 
    title: 'Dashboard Executivo', 
    subtitle: 'KPIs e métricas consolidadas' 
  },
  '/portal-incorporador/forecast': { 
    title: 'Forecast', 
    subtitle: 'Previsões e atividades comerciais' 
  },
  '/portal-incorporador/marketing': { 
    title: 'Produção de Marketing', 
    subtitle: 'Acompanhe os tickets de criação' 
  },
};

export function PortalIncorporadorLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const { title, subtitle } = routeTitles[location.pathname] || { title: 'Portal' };
  const isInternalPage = location.pathname !== '/portal-incorporador';

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Simplified */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/portal-incorporador" className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="h-8" />
          </Link>
          
          {/* User Info + Logout */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground">Contratante</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6">
        <div className="mb-6">
          {/* Back link for internal pages */}
          {isInternalPage && (
            <Link 
              to="/portal-incorporador" 
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          )}
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
        <Outlet />
      </main>
    </div>
  );
}
