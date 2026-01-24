import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertCircle, ChevronDown, CheckCircle, Phone, Users, MapPin, Headphones, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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

interface VencidasCardProps {
  atividades: Atividade[];
  isLoading: boolean;
  onAtividadeClick: (id: string) => void;
  onConcluir: (atividade: Atividade) => void;
}

export function VencidasCard({ 
  atividades, 
  isLoading, 
  onAtividadeClick, 
  onConcluir 
}: VencidasCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const count = atividades.length;
  const hasVencidas = count > 0;

  const handleConcluirClick = (e: React.MouseEvent, atividade: Atividade) => {
    e.stopPropagation();
    onConcluir(atividade);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-9 w-12" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        'transition-all duration-200 cursor-pointer',
        hasVencidas && 'border-destructive/50 bg-destructive/5 hover:bg-destructive/10',
        !hasVencidas && 'hover:bg-muted/50'
      )}
      onClick={() => hasVencidas && setExpanded(!expanded)}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
          <div className="flex items-center gap-2">
            <AlertCircle className={cn('h-4 w-4', hasVencidas ? 'text-destructive' : 'text-muted-foreground')} />
            Vencidas
          </div>
          {hasVencidas && (
            <ChevronDown 
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform duration-200',
                expanded && 'rotate-180'
              )} 
            />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className={cn(
          'text-3xl font-bold',
          hasVencidas ? 'text-destructive' : 'text-muted-foreground'
        )}>
          {count}
        </div>
        
        {/* Lista expansível */}
        <div 
          className={cn(
            'overflow-hidden transition-all duration-300 ease-in-out',
            expanded ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <ScrollArea className="h-full max-h-[280px] pr-2">
            <div className="space-y-2 pt-2 border-t border-destructive/20">
              {atividades.map((atividade) => {
                const TipoIcon = TIPO_ICONS[atividade.tipo];
                const dataHora = new Date(atividade.data_hora);
                const tempoVencida = formatDistanceToNow(dataHora, { 
                  addSuffix: true, 
                  locale: ptBR 
                });
                
                return (
                  <div 
                    key={atividade.id}
                    className="flex items-center gap-3 p-2 rounded-md bg-background/80 hover:bg-background border border-border/50 cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAtividadeClick(atividade.id);
                    }}
                  >
                    <div className="flex-shrink-0">
                      <TipoIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{atividade.titulo}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="text-destructive font-medium">{tempoVencida}</span>
                        {atividade.cliente && (
                          <>
                            <span className="text-muted-foreground/50">•</span>
                            <span className="truncate">{atividade.cliente.nome}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-shrink-0 h-7 px-2 text-primary hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleConcluirClick(e, atividade)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Concluir</span>
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
        
        {/* Hint para expandir */}
        {hasVencidas && !expanded && (
          <p className="text-xs text-destructive/70">
            Clique para ver detalhes
          </p>
        )}
      </CardContent>
    </Card>
  );
}
