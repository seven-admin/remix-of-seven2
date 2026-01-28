import { useIncorporadorEmpreendimentos } from '@/hooks/useIncorporadorEmpreendimentos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FunilTemperatura } from '@/components/forecast/FunilTemperatura';
import { VisitasPorEmpreendimento } from '@/components/forecast/VisitasPorEmpreendimento';
import { AtividadesPorTipo } from '@/components/forecast/AtividadesPorTipo';
import { ProximasAtividades } from '@/components/forecast/ProximasAtividades';
import { AtendimentosResumo } from '@/components/forecast/AtendimentosResumo';
import {
  useResumoAtividades,
} from '@/hooks/useForecast';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export default function PortalIncorporadorForecast() {
  const { empreendimentoIds, isLoading: loadingEmps } = useIncorporadorEmpreendimentos();
  
  // Os hooks de forecast atualmente filtram por gestor_id
  // Por enquanto mostraremos dados consolidados
  const { data: resumoAtividades, isLoading: loadingResumo } = useResumoAtividades();

  const isLoading = loadingEmps || loadingResumo;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (empreendimentoIds.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum empreendimento vinculado à sua conta.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs de Atividades */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resumoAtividades?.total || 0}</p>
                <p className="text-sm text-muted-foreground">Total de Atividades</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-2/10">
                <CheckCircle2 className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resumoAtividades?.concluidas || 0}</p>
                <p className="text-sm text-muted-foreground">Concluídas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-3/10">
                <Clock className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resumoAtividades?.pendentes || 0}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resumoAtividades?.vencidas || 0}</p>
                <p className="text-sm text-muted-foreground">Vencidas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funil e Visitas */}
      <div className="grid gap-4 lg:grid-cols-2">
        <FunilTemperatura />
        <VisitasPorEmpreendimento />
      </div>

      {/* Atividades e Próximas */}
      <div className="grid gap-4 lg:grid-cols-2">
        <AtividadesPorTipo />
        <ProximasAtividades />
      </div>

      {/* Atendimentos */}
      <AtendimentosResumo />
    </div>
  );
}
