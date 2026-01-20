import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Building2, UserCog, ArrowRight, History, Edit, Trash2, FileText, Send, Check, X } from 'lucide-react';
import { Negociacao, STATUS_PROPOSTA_LABELS, STATUS_PROPOSTA_COLORS } from '@/types/negociacoes.types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface NegociacaoCardProps {
  negociacao: Negociacao;
  isDragging?: boolean;
  onMover: (negociacao: Negociacao) => void;
  onEditar: (negociacao: Negociacao) => void;
  onHistorico: (negociacao: Negociacao) => void;
  onExcluir: (negociacao: Negociacao) => void;
  onGerarProposta?: (negociacao: Negociacao) => void;
  onEnviarProposta?: (negociacao: Negociacao) => void;
  onAceitarProposta?: (negociacao: Negociacao) => void;
  onRecusarProposta?: (negociacao: Negociacao) => void;
}

export function NegociacaoCard({ 
  negociacao, 
  isDragging = false,
  onMover, 
  onEditar, 
  onHistorico, 
  onExcluir,
  onGerarProposta,
  onEnviarProposta,
  onAceitarProposta,
  onRecusarProposta
}: NegociacaoCardProps) {
  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const diasNaEtapa = formatDistanceToNow(new Date(negociacao.updated_at), {
    locale: ptBR,
    addSuffix: false
  });

  const valorExibido = negociacao.valor_proposta || negociacao.valor_negociacao;

  return (
    <Card
      className={cn(
        "p-3 cursor-grab active:cursor-grabbing transition-all hover:shadow-md",
        isDragging && "opacity-80 shadow-lg rotate-1 ring-2 ring-primary"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{negociacao.cliente?.nome || 'Cliente'}</p>
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-muted-foreground">{negociacao.codigo}</p>
            {negociacao.numero_proposta && (
              <Badge variant="outline" className="text-[10px] px-1 py-0">
                {negociacao.numero_proposta}
              </Badge>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onMover(negociacao)}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Mover
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditar(negociacao)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onHistorico(negociacao)}>
              <History className="h-4 w-4 mr-2" />
              Histórico
            </DropdownMenuItem>
            
            {/* Proposal Actions */}
            <DropdownMenuSeparator />
            {!negociacao.numero_proposta && onGerarProposta && (
              <DropdownMenuItem onClick={() => onGerarProposta(negociacao)}>
                <FileText className="h-4 w-4 mr-2" />
                Gerar Proposta
              </DropdownMenuItem>
            )}
            {negociacao.status_proposta === 'rascunho' && onEnviarProposta && (
              <DropdownMenuItem onClick={() => onEnviarProposta(negociacao)}>
                <Send className="h-4 w-4 mr-2" />
                Enviar Proposta
              </DropdownMenuItem>
            )}
            {negociacao.status_proposta === 'enviada' && (
              <>
                {onAceitarProposta && (
                  <DropdownMenuItem onClick={() => onAceitarProposta(negociacao)}>
                    <Check className="h-4 w-4 mr-2" />
                    Aceitar Proposta
                  </DropdownMenuItem>
                )}
                {onRecusarProposta && (
                  <DropdownMenuItem onClick={() => onRecusarProposta(negociacao)}>
                    <X className="h-4 w-4 mr-2" />
                    Recusar Proposta
                  </DropdownMenuItem>
                )}
              </>
            )}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onExcluir(negociacao)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Simplified content: Empreendimento, Gestor, Unidades, Value */}
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Building2 className="h-3 w-3 shrink-0" />
          <span className="truncate">{negociacao.empreendimento?.nome}</span>
        </div>

        {negociacao.gestor?.full_name && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <UserCog className="h-3 w-3 shrink-0" />
            <span className="truncate">{negociacao.gestor.full_name}</span>
          </div>
        )}

        {negociacao.unidades && negociacao.unidades.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {negociacao.unidades.slice(0, 3).map((u) => (
              <Badge key={u.id} variant="secondary" className="text-[10px] px-1.5 py-0">
                {u.unidade?.bloco?.nome ? `${u.unidade.bloco.nome}-` : ''}
                {u.unidade?.numero}
              </Badge>
            ))}
            {negociacao.unidades.length > 3 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                +{negociacao.unidades.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>

      {valorExibido && (
        <div className="mt-2 pt-2 border-t">
          <span className="text-sm font-semibold text-primary">
            {formatCurrency(valorExibido)}
          </span>
        </div>
      )}
    </Card>
  );
}