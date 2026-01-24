import { useMemo } from 'react';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Phone, Users, MapPin, Headphones, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Atividade, AtividadeTipo } from '@/types/atividades.types';
import { ATIVIDADE_TIPO_LABELS } from '@/types/atividades.types';

const TIPO_ICONS: Record<AtividadeTipo, typeof Phone> = {
  ligacao: Phone,
  reuniao: Users,
  visita: MapPin,
  atendimento: Headphones,
};

interface PendenciasTabProps {
  atividades: Atividade[];
  isLoading: boolean;
  onAtividadeClick: (id: string) => void;
  onConcluir: (atividade: Atividade) => void;
}

export function PendenciasTab({ 
  atividades, 
  isLoading, 
  onAtividadeClick, 
  onConcluir 
}: PendenciasTabProps) {
  // Ordenar por urgência (mais antigas primeiro)
  const atividadesOrdenadas = useMemo(() => {
    return [...atividades].sort((a, b) => {
      const dateA = new Date(a.data_hora).getTime();
      const dateB = new Date(b.data_hora).getTime();
      return dateA - dateB; // Mais antigas primeiro
    });
  }, [atividades]);

  const handleConcluirClick = (e: React.MouseEvent, atividade: Atividade) => {
    e.stopPropagation();
    onConcluir(atividade);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (atividades.length === 0) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="h-12 w-12 text-primary mb-4" />
          <h3 className="text-lg font-medium text-foreground">Tudo em dia!</h3>
          <p className="text-muted-foreground text-center mt-1">
            Não há atividades vencidas ou atrasadas no momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span className="font-medium text-destructive">
                {atividades.length} pendência{atividades.length !== 1 ? 's' : ''}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              Atividades que já passaram da data/hora agendada
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Lista de atividades */}
      <div className="space-y-3">
        {atividadesOrdenadas.map((atividade) => {
          const TipoIcon = TIPO_ICONS[atividade.tipo];
          const dataHora = new Date(atividade.data_hora);
          const diasVencida = differenceInDays(new Date(), dataHora);
          const tempoVencida = formatDistanceToNow(dataHora, { 
            addSuffix: true, 
            locale: ptBR 
          });
          
          // Determinar cor baseado na urgência
          const urgencyClass = diasVencida > 7 
            ? 'border-l-4 border-l-destructive bg-destructive/10' 
            : diasVencida > 3 
              ? 'border-l-4 border-l-destructive/70 bg-destructive/5' 
              : 'border-l-4 border-l-warning bg-warning/5';

          return (
            <Card
              key={atividade.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                urgencyClass
              )}
              onClick={() => onAtividadeClick(atividade.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Ícone do tipo */}
                  <div className="flex-shrink-0 p-2 rounded-lg bg-background border">
                    <TipoIcon className="h-5 w-5 text-muted-foreground" />
                  </div>

                  {/* Conteúdo principal */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Título e tipo */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-medium text-foreground truncate">
                          {atividade.titulo}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {ATIVIDADE_TIPO_LABELS[atividade.tipo]}
                          </Badge>
                          <Badge 
                            variant="destructive" 
                            className={cn(
                              'text-xs',
                              diasVencida > 7 && 'bg-destructive',
                              diasVencida <= 7 && diasVencida > 3 && 'bg-destructive/80',
                              diasVencida <= 3 && 'bg-warning text-warning-foreground'
                            )}
                          >
                            {tempoVencida}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Botão concluir */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-shrink-0 text-primary border-primary/30 hover:bg-primary/10"
                        onClick={(e) => handleConcluirClick(e, atividade)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1.5" />
                        Concluir
                      </Button>
                    </div>

                    {/* Detalhes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-muted-foreground">
                      {/* Data/hora original */}
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {format(dataHora, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>

                      {/* Cliente */}
                      {atividade.cliente?.nome && (
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{atividade.cliente.nome}</span>
                        </div>
                      )}

                      {/* Empreendimento */}
                      {atividade.empreendimento?.nome && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{atividade.empreendimento.nome}</span>
                        </div>
                      )}

                      {/* Corretor */}
                      {atividade.corretor?.nome_completo && (
                        <div className="flex items-center gap-1.5">
                          <Headphones className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{atividade.corretor.nome_completo}</span>
                        </div>
                      )}
                    </div>

                    {/* Prazo se existir */}
                    {atividade.deadline_date && (
                      <div className="flex items-center gap-1.5 text-xs text-destructive/80">
                        <Clock className="h-3 w-3" />
                        Prazo: {format(new Date(`${atividade.deadline_date}T00:00:00`), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
