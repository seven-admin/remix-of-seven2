import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Calendar,
  Users,
  LogOut,
} from 'lucide-react';
import logo from '@/assets/logo.png';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/portal-corretor' },
  { icon: Building2, label: 'Empreendimentos', path: '/portal-corretor/empreendimentos' },
  { icon: Calendar, label: 'Minhas Solicitações', path: '/portal-corretor/solicitacoes' },
  { icon: Users, label: 'Meus Clientes', path: '/portal-corretor/clientes' },
];

const routeTitles: Record<string, { title: string; subtitle?: string }> = {
  '/portal-corretor': { 
    title: 'Dashboard', 
    subtitle: 'Bem-vindo ao Portal do Corretor' 
  },
  '/portal-corretor/empreendimentos': { 
    title: 'Empreendimentos', 
    subtitle: 'Veja os empreendimentos disponíveis e solicite reservas' 
  },
  '/portal-corretor/solicitacoes': { 
    title: 'Minhas Solicitações', 
    subtitle: 'Acompanhe o status das suas solicitações de reserva' 
  },
  '/portal-corretor/clientes': { 
    title: 'Meus Clientes', 
    subtitle: 'Gerencie seus clientes e leads' 
  },
};

export function PortalLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const { title, subtitle } = routeTitles[location.pathname] || { title: 'Portal' };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/portal-corretor" className="flex items-center gap-2">
              <img src={logo} alt="Logo" className="h-8" />
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground">Corretor</p>
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

      {/* Mobile Navigation */}
      <nav className="md:hidden border-b bg-background overflow-x-auto">
        <div className="container flex gap-1 py-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
        <Outlet />
      </main>
    </div>
  );
}
