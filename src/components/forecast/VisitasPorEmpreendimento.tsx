import { Building2, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useVisitasPorEmpreendimento } from '@/hooks/useForecast';
import { ForecastBarChart, type ForecastChartDataItem } from './ForecastBarChart';

const CORES_RANKING = [
  '#F59E0B',  // Amarelo/Dourado (1º lugar)
  '#94A3B8',  // Prata (2º)
  '#F97316',  // Laranja/Bronze (3º)
  '#3B82F6',  // Azul (4º)
  '#EC4899',  // Rosa (5º)
];

interface VisitasPorEmpreendimentoProps {
  onEmpreendimentoClick?: (empreendimentoId: string) => void;
}

export function VisitasPorEmpreendimento({ onEmpreendimentoClick }: VisitasPorEmpreendimentoProps) {
  const { data: visitas, isLoading } = useVisitasPorEmpreendimento();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Visitas por Empreendimento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const total = visitas?.reduce((acc, v) => acc + v.total_visitas, 0) || 0;

  const dadosGrafico: (ForecastChartDataItem & { 
    nomeCompleto: string; 
    mes_atual: number; 
    id: string 
  })[] = visitas?.slice(0, 5).map((item, index) => ({
    nome: item.empreendimento_nome.length > 15 
      ? item.empreendimento_nome.substring(0, 15) + '...' 
      : item.empreendimento_nome,
    nomeCompleto: item.empreendimento_nome,
    valor: item.total_visitas,
    cor: CORES_RANKING[index % CORES_RANKING.length],
    mes_atual: item.visitas_mes_atual,
    id: item.empreendimento_id
  })) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-base">
            <MapPin className="h-5 w-5 text-primary" />
            Visitas por Empreendimento
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            Total: {total}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!visitas || visitas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma visita registrada</p>
          </div>
        ) : (
          <ForecastBarChart
            data={dadosGrafico}
            height={160}
            barSize={24}
            showLabels
            tooltipFormatter={(value, payload) => {
              const p = payload as unknown as { nomeCompleto: string; mes_atual: number };
              return [`${value} visitas (${p.mes_atual} este mês)`, p.nomeCompleto];
            }}
            onBarClick={(data) => {
              const d = data as unknown as { id: string };
              onEmpreendimentoClick?.(d.id);
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
