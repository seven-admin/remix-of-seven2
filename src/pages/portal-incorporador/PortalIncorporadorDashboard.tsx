import { useIncorporadorEmpreendimentos } from '@/hooks/useIncorporadorEmpreendimentos';
import { useDashboardExecutivo } from '@/hooks/useDashboardExecutivo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import {
  Building2,
  Home,
  DollarSign,
  TrendingUp,
  BarChart3,
  Palette,
  ArrowRight,
} from 'lucide-react';

export default function PortalIncorporadorDashboard() {
  const { empreendimentoIds, empreendimentos, isLoading: loadingEmps } = useIncorporadorEmpreendimentos();
  const { data: dashData, isLoading: loadingDash } = useDashboardExecutivo(undefined, empreendimentoIds);

  const isLoading = loadingEmps || loadingDash;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empreendimentos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{empreendimentos.length}</div>
            <p className="text-xs text-muted-foreground">vinculados à sua conta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unidades Disponíveis</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashData?.unidades.disponiveis || 0}</div>
            <p className="text-xs text-muted-foreground">
              de {dashData?.unidades.total || 0} unidades totais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VGV Vendido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashData?.unidades.vgvVendido || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {dashData?.unidades.vendidas || 0} unidades vendidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashData?.vendas.vendasMesAtual || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {dashData?.vendas.variacaoMensal > 0 ? '+' : ''}{dashData?.vendas.variacaoMensal.toFixed(1)}% vs mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Links Rápidos */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/portal-incorporador/executivo">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Dashboard Executivo</h3>
                <p className="text-sm text-muted-foreground">KPIs e métricas detalhadas</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/portal-incorporador/forecast">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Forecast</h3>
                <p className="text-sm text-muted-foreground">Previsões e atividades</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/portal-incorporador/marketing">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Palette className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Marketing</h3>
                <p className="text-sm text-muted-foreground">Tickets de criação</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Lista de Empreendimentos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seus Empreendimentos</CardTitle>
        </CardHeader>
        <CardContent>
          {empreendimentos.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum empreendimento vinculado à sua conta.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {empreendimentos.map((emp) => {
                const unidadesEmp = dashData?.unidades.porEmpreendimento.find(
                  (u) => u.nome === emp.nome
                );
                
                return (
                  <div
                    key={emp.id}
                    className="p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{emp.nome}</h4>
                        {(emp.endereco_cidade || emp.endereco_uf) && (
                          <p className="text-sm text-muted-foreground">
                            {[emp.endereco_cidade, emp.endereco_uf].filter(Boolean).join(' - ')}
                          </p>
                        )}
                      </div>
                      <Badge variant={emp.status === 'ativo' ? 'default' : 'secondary'}>
                        {emp.status}
                      </Badge>
                    </div>
                    {unidadesEmp && (
                      <div className="mt-3 flex gap-4 text-sm">
                        <span className="text-green-600 dark:text-green-400">
                          {unidadesEmp.disponiveis} disponíveis
                        </span>
                        <span className="text-blue-600 dark:text-blue-400">
                          {unidadesEmp.vendidas} vendidas
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
