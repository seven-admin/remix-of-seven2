import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Clock, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AtividadeCard } from '@/components/atividades/AtividadeCard';
import type { Atividade } from '@/types/atividades.types';

interface AgendaDiaProps {
  data: Date;
  atividades: Atividade[];
  onAtividadeClick?: (atividade: Atividade) => void;
  onNovaAtividade?: () => void;
}

export function AgendaDia({
  data,
  atividades,
  onAtividadeClick,
  onNovaAtividade,
}: AgendaDiaProps) {
  // Agrupar por hora
  const atividadesPorHora = atividades.reduce((acc, ativ) => {
    const hora = format(new Date(ativ.data_hora), 'HH:00');
    if (!acc[hora]) {
      acc[hora] = [];
    }
    acc[hora].push(ativ);
    return acc;
  }, {} as Record<string, Atividade[]>);

  const horas = Object.keys(atividadesPorHora).sort();

  return (
    <div className="bg-card rounded-lg border h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-medium capitalize text-sm">
              {format(data, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </h3>
            <p className="text-xs text-muted-foreground">
              {atividades.length} {atividades.length === 1 ? 'atividade' : 'atividades'}
            </p>
          </div>
        </div>
        {onNovaAtividade && (
          <Button size="sm" onClick={onNovaAtividade}>
            <Plus className="h-4 w-4 mr-1" />
            Nova
          </Button>
        )}
      </div>

      {/* Timeline */}
      <ScrollArea className="flex-1">
        {atividades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <CalendarDays className="h-12 w-12 mb-4 opacity-50" />
            <p>Nenhuma atividade para este dia</p>
            {onNovaAtividade && (
              <Button variant="link" onClick={onNovaAtividade} className="mt-2">
                Agendar atividade
              </Button>
            )}
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {horas.map((hora) => (
              <div key={hora} className="flex gap-3">
                {/* Hora */}
                <div className="w-12 flex-shrink-0">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{hora}</span>
                  </div>
                </div>

                {/* Linha do tempo */}
                <div className="relative flex-shrink-0 w-px bg-border">
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary" />
                </div>

                {/* Atividades */}
                <div className="flex-1 space-y-1.5 pb-3">
                  {atividadesPorHora[hora].map((atividade) => (
                    <AtividadeCard
                      key={atividade.id}
                      atividade={atividade}
                      compact
                      onClick={() => onAtividadeClick?.(atividade)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
