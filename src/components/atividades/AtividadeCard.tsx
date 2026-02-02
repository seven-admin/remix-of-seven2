import { Phone, Users, MapPin, MessageSquare, Clock, Building2, Calendar } from 'lucide-react';
import { format, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { Atividade, AtividadeTipo } from '@/types/atividades.types';
import { ATIVIDADE_TIPO_LABELS, ATIVIDADE_STATUS_COLORS } from '@/types/atividades.types';
import { CLIENTE_TEMPERATURA_COLORS } from '@/types/clientes.types';

const TIPO_ICONS: Record<AtividadeTipo, typeof Phone> = {
  ligacao: Phone,
  reuniao: Users,
  visita: MapPin,
  atendimento: MessageSquare,
};

const TIPO_COLORS: Record<AtividadeTipo, string> = {
  ligacao: 'bg-blue-500',
  reuniao: 'bg-purple-500',
  visita: 'bg-green-500',
  atendimento: 'bg-orange-500',
};

// Formatar intervalo de datas para exibição
function formatDateRange(dataInicio: string, dataFim: string): string {
  const inicio = parseISO(dataInicio);
  const fim = parseISO(dataFim);
  
  if (isSameDay(inicio, fim)) {
    return format(inicio, 'dd/MM/yyyy', { locale: ptBR });
  }
  
  // Se mesmo mês e ano, simplifica
  if (inicio.getMonth() === fim.getMonth() && inicio.getFullYear() === fim.getFullYear()) {
    return `${format(inicio, 'dd', { locale: ptBR })} - ${format(fim, 'dd/MM/yyyy', { locale: ptBR })}`;
  }
  
  return `${format(inicio, 'dd/MM', { locale: ptBR })} - ${format(fim, 'dd/MM/yyyy', { locale: ptBR })}`;
}

// Formatar hora removendo segundos se existirem
function formatarHora(hora?: string | null): string | null {
  return hora ? hora.substring(0, 5) : null;
}

interface AtividadeCardProps {
  atividade: Atividade;
  compact?: boolean;
  onClick?: () => void;
}

export function AtividadeCard({ atividade, compact = false, onClick }: AtividadeCardProps) {
  const Icon = TIPO_ICONS[atividade.tipo];
  const isVencida = atividade.status === 'pendente' && new Date(atividade.data_fim) < new Date();

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          'flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors',
          'hover:bg-accent/50',
          isVencida && 'border-l-2 border-destructive bg-destructive/5'
        )}
      >
        <div className={cn('p-1.5 rounded-md shrink-0', TIPO_COLORS[atividade.tipo])}>
          <Icon className="h-3 w-3 text-white" />
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2">
            <p className="text-[11px] text-muted-foreground">
              {ATIVIDADE_TIPO_LABELS[atividade.tipo]}
            </p>
            <p className="text-[11px] text-muted-foreground ml-auto whitespace-nowrap">
              {formatDateRange(atividade.data_inicio, atividade.data_fim)}
              {atividade.hora_inicio && (
                <span className="ml-1 text-primary font-medium">
                  {formatarHora(atividade.hora_inicio)}
                </span>
              )}
            </p>
          </div>

          <p className="text-[13px] font-normal leading-snug line-clamp-2">{atividade.titulo}</p>

          <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
            <Building2 className="h-3 w-3 shrink-0" />
            <span className="truncate">{atividade.empreendimento?.nome || '—'}</span>
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn(
            'text-[9px] px-1 py-0 shrink-0 self-start',
            ATIVIDADE_STATUS_COLORS[atividade.status]
          )}
        >
          {atividade.status === 'pendente' 
            ? (isVencida ? 'Venc.' : 'Pend.') 
            : atividade.status === 'concluida' ? 'OK' : 'Canc.'
          }
        </Badge>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-4 rounded-lg border bg-card cursor-pointer transition-all',
        'hover:shadow-md hover:border-primary/30',
        isVencida && 'border-destructive/50 bg-destructive/5'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg', TIPO_COLORS[atividade.tipo])}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-medium text-sm">{atividade.titulo}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {ATIVIDADE_TIPO_LABELS[atividade.tipo]}
              </p>
            </div>
            <Badge 
              variant="outline" 
              className={cn('text-xs shrink-0', ATIVIDADE_STATUS_COLORS[atividade.status])}
            >
              {atividade.status === 'pendente' ? (isVencida ? 'Vencida' : 'Pendente') : 
               atividade.status === 'concluida' ? 'Concluída' : 'Cancelada'}
            </Badge>
          </div>

          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {formatDateRange(atividade.data_inicio, atividade.data_fim)}
                {atividade.hora_inicio && (
                  <span className="ml-1 text-primary font-medium">
                    às {formatarHora(atividade.hora_inicio)}
                    {atividade.hora_fim && ` - ${formatarHora(atividade.hora_fim)}`}
                  </span>
                )}
              </span>
            </div>

            {atividade.cliente && (
              <div className="flex items-center gap-1.5 text-xs">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="text-foreground">{atividade.cliente.nome}</span>
                <Badge 
                  variant="outline" 
                  className={cn('text-[10px] px-1 py-0', CLIENTE_TEMPERATURA_COLORS[atividade.cliente.temperatura])}
                >
                  {atividade.cliente.temperatura}
                </Badge>
              </div>
            )}

            {atividade.empreendimento && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3" />
                <span>{atividade.empreendimento.nome}</span>
              </div>
            )}

            {atividade.corretor && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{atividade.corretor.nome_completo}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
