import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, User, MapPin, Phone, Headphones } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProximasAtividades } from '@/hooks/useForecast';
import { cn } from '@/lib/utils';

const TIPO_ICON: Record<string, React.ElementType> = {
  visita: MapPin,
  ligacao: Phone,
  reuniao: User,
  atendimento: Headphones,
};

interface ProximasAtividadesProps {
  gestorId?: string;
  empreendimentoIds?: string[];
}

export function ProximasAtividades({ gestorId, empreendimentoIds }: ProximasAtividadesProps) {
  const { data: atividades, isLoading } = useProximasAtividades(10, gestorId, empreendimentoIds);

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-5 w-5 text-primary" />
            Próximas Atividades
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-5 w-5 text-primary" />
          Próximas Atividades
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {!atividades || atividades.length === 0 ? (
          <div className="text-center py-8 px-6 text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhuma atividade agendada</p>
          </div>
        ) : (
        <ScrollArea className="h-[300px]">
            <div className="px-6 pb-4 space-y-2">
              {atividades.map((atividade: any, index: number) => {
                const Icon = TIPO_ICON[atividade.tipo] || Calendar;
                const isToday = format(new Date(atividade.data_hora), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                return (
                  <div
                    key={atividade.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-accent/50',
                      isToday && 'bg-primary/5 border border-primary/10'
                    )}
                  >
                    <div className={cn(
                      'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
                      isToday ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{atividade.titulo}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <Clock className="h-3 w-3" />
                        <span>
                          {format(new Date(atividade.data_hora), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </span>
                        {atividade.cliente && (
                          <>
                            <span className="text-muted-foreground/50">•</span>
                            <span className="truncate">{atividade.cliente.nome}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {atividade.tipo === 'atendimento' && atividade.categoria && (
                        <Badge variant="secondary" className="text-xs">
                          {atividade.categoria === 'retorno' ? 'Retorno' : 'Novo'}
                        </Badge>
                      )}
                      {isToday && (
                        <Badge variant="default" className="text-xs">
                          Hoje
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
