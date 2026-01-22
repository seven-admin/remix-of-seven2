import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Phone, Users, MapPin, Headphones, Calendar, Clock, User, Building2, MessageSquare, ThermometerSun, CalendarCheck } from 'lucide-react';
import type { Atividade, AtividadeTipo, AtividadeStatus } from '@/types/atividades.types';
import { ATIVIDADE_TIPO_LABELS, ATIVIDADE_STATUS_LABELS } from '@/types/atividades.types';
import { cn } from '@/lib/utils';

interface AtividadeDetalheDialogProps {
  atividade: Atividade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIPO_ICONS: Record<AtividadeTipo, typeof Phone> = {
  ligacao: Phone,
  reuniao: Users,
  visita: MapPin,
  atendimento: Headphones,
};

const STATUS_COLORS: Record<AtividadeStatus, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  concluida: 'bg-green-100 text-green-800 border-green-200',
  cancelada: 'bg-gray-100 text-gray-600 border-gray-200',
};

const TIPO_COLORS: Record<AtividadeTipo, string> = {
  ligacao: 'bg-blue-100 text-blue-800 border-blue-200',
  reuniao: 'bg-purple-100 text-purple-800 border-purple-200',
  visita: 'bg-orange-100 text-orange-800 border-orange-200',
  atendimento: 'bg-cyan-100 text-cyan-800 border-cyan-200',
};

const TEMPERATURA_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
  frio: { label: 'Frio', color: 'bg-blue-100 text-blue-800', emoji: '❄️' },
  morno: { label: 'Morno', color: 'bg-yellow-100 text-yellow-800', emoji: '🌤️' },
  quente: { label: 'Quente', color: 'bg-orange-100 text-orange-800', emoji: '🔥' },
};

export function AtividadeDetalheDialog({ atividade, open, onOpenChange }: AtividadeDetalheDialogProps) {
  if (!atividade) return null;

  const TipoIcon = TIPO_ICONS[atividade.tipo];
  const temperatura = atividade.temperatura_cliente 
    ? TEMPERATURA_LABELS[atividade.temperatura_cliente] 
    : null;

  const isAtrasada = (() => {
    if (atividade.status !== 'pendente') return false;
    if (!atividade.deadline_date) return false;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const prazo = new Date(`${atividade.deadline_date}T00:00:00`);
    prazo.setHours(0, 0, 0, 0);
    return prazo < hoje;
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">Detalhes da Atividade</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Título e Badges */}
          <div>
            <h3 className="font-semibold text-lg mb-3">{atividade.titulo}</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={cn('border', TIPO_COLORS[atividade.tipo])}>
                <TipoIcon className="h-3 w-3 mr-1" />
                {ATIVIDADE_TIPO_LABELS[atividade.tipo]}
              </Badge>
              <Badge variant="outline" className={cn('border', STATUS_COLORS[atividade.status])}>
                {ATIVIDADE_STATUS_LABELS[atividade.status]}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Informações principais */}
          <div className="grid grid-cols-2 gap-4">
            {atividade.cliente && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="font-medium">{atividade.cliente.nome}</p>
                </div>
              </div>
            )}

            {atividade.corretor && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Corretor</p>
                  <p className="font-medium">{atividade.corretor.nome_completo}</p>
                </div>
              </div>
            )}

            {atividade.empreendimento && (
              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Empreendimento</p>
                  <p className="font-medium">{atividade.empreendimento.nome}</p>
                </div>
              </div>
            )}

            {atividade.gestor && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Gestor</p>
                  <p className="font-medium">{atividade.gestor.full_name}</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Data e Hora */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(atividade.data_hora), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(atividade.data_hora), 'HH:mm')}</span>
            </div>
            {atividade.duracao_minutos && (
              <span className="text-sm text-muted-foreground">
                ({atividade.duracao_minutos} min)
              </span>
            )}
          </div>

          {/* Prazo (deadline) */}
          {atividade.deadline_date && (
            <div className={cn(
              'flex items-center justify-between gap-3 p-3 rounded-lg border',
              isAtrasada ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-muted/30'
            )}>
              <div className="flex items-center gap-2">
                <Calendar className={cn('h-4 w-4', isAtrasada ? 'text-destructive' : 'text-muted-foreground')} />
                <span className="text-sm text-muted-foreground">Prazo:</span>
                <strong className={cn('text-sm', isAtrasada ? 'text-destructive' : 'text-foreground')}>
                  {format(new Date(`${atividade.deadline_date}T00:00:00`), 'dd/MM/yyyy', { locale: ptBR })}
                </strong>
              </div>
              {isAtrasada && (
                <Badge variant="outline" className="border-destructive text-destructive">
                  Atrasada
                </Badge>
              )}
            </div>
          )}

          {/* Observações */}
          {atividade.observacoes && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm font-medium">Observações</span>
              </div>
              <p className="text-sm bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                {atividade.observacoes}
              </p>
            </div>
          )}

          {/* Resultado (se concluída) */}
          {atividade.status === 'concluida' && atividade.resultado && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600">
                <CalendarCheck className="h-4 w-4" />
                <span className="text-sm font-medium">Resultado</span>
              </div>
              <p className="text-sm bg-green-50 p-3 rounded-lg border border-green-200 whitespace-pre-wrap">
                {atividade.resultado}
              </p>
            </div>
          )}

          {/* Temperatura do Cliente */}
          {temperatura && (
            <div className="flex items-center gap-2">
              <ThermometerSun className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Temperatura:</span>
              <Badge variant="outline" className={cn('border', temperatura.color)}>
                {temperatura.emoji} {temperatura.label}
              </Badge>
            </div>
          )}

          {/* Follow-up */}
          {atividade.requer_followup && atividade.data_followup && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <Calendar className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-800">
                Follow-up agendado para{' '}
                <strong>
                  {format(new Date(atividade.data_followup), "dd/MM/yyyy", { locale: ptBR })}
                </strong>
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
