import { KanbanBoard, KanbanColumnType } from '@/components/ui/kanban';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjetosMarketing } from '@/hooks/useProjetosMarketing';
import { useTicketEtapas, TicketEtapa } from '@/hooks/useTicketEtapas';
import { ProjetoCard } from './ProjetoCard';
import { 
  ProjetoMarketing, 
  StatusProjeto, 
  STATUS_LABELS, 
  STATUS_COLORS,
  KANBAN_COLUMNS 
} from '@/types/marketing.types';
import { useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface MarketingKanbanProps {
  projetos: ProjetoMarketing[];
  isLoading: boolean;
  categoria?: string;
}

export function MarketingKanban({ projetos, isLoading, categoria }: MarketingKanbanProps) {
  const { moveProjetoKanban } = useProjetosMarketing();
  const { data: etapasDinamicas = [], isLoading: etapasLoading } = useTicketEtapas(categoria);

  // Usar etapas dinâmicas se disponíveis, senão fallback para constantes
  const columns: KanbanColumnType[] = useMemo(() => {
    if (etapasDinamicas.length > 0) {
      return etapasDinamicas.map(etapa => ({
        id: etapa.id,
        title: etapa.nome,
        color: etapa.cor || '#6b7280',
        bgColor: etapa.cor_bg || undefined,
      }));
    }
    // Fallback para constantes hardcoded
    return KANBAN_COLUMNS.map(status => ({
      id: status,
      title: STATUS_LABELS[status],
      color: STATUS_COLORS[status],
    }));
  }, [etapasDinamicas]);

  // Criar mapeamento de status legado para etapa dinâmica
  const statusToEtapaMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (etapasDinamicas.length > 0) {
      // Mapear por nome similar
      etapasDinamicas.forEach(etapa => {
        const statusKey = etapa.nome.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '_');
        
        // Mapeamentos específicos
        if (etapa.nome.toLowerCase().includes('aguardando') || etapa.nome.toLowerCase().includes('analise')) {
          map['aguardando_analise'] = etapa.id;
          map['briefing'] = etapa.id;
        }
        if (etapa.nome.toLowerCase().includes('produ')) {
          map['em_producao'] = etapa.id;
        }
        if (etapa.nome.toLowerCase().includes('revis')) {
          map['revisao'] = etapa.id;
        }
        if (etapa.nome.toLowerCase().includes('aprova')) {
          map['aprovacao_cliente'] = etapa.id;
        }
        if (etapa.nome.toLowerCase().includes('ajuste') || etapa.nome.toLowerCase().includes('triagem')) {
          map['ajuste'] = etapa.id;
          map['triagem'] = etapa.id;
        }
        if (etapa.nome.toLowerCase().includes('conclu')) {
          map['concluido'] = etapa.id;
        }
        if (etapa.nome.toLowerCase().includes('arquiv')) {
          map['arquivado'] = etapa.id;
        }
      });
    }
    return map;
  }, [etapasDinamicas]);

  // Determinar a coluna de um projeto
  const getProjectColumn = useCallback((projeto: ProjetoMarketing) => {
    // Se projeto tem ticket_etapa_id, usar diretamente
    if ((projeto as any).ticket_etapa_id) {
      return (projeto as any).ticket_etapa_id;
    }
    // Se temos etapas dinâmicas, mapear status legado
    if (etapasDinamicas.length > 0) {
      return statusToEtapaMap[projeto.status] || etapasDinamicas[0]?.id || projeto.status;
    }
    // Fallback para status string
    return projeto.status;
  }, [etapasDinamicas, statusToEtapaMap]);

  // Memoizar callback de movimento para evitar re-renders
  const handleMove = useCallback((
    projeto: ProjetoMarketing, 
    sourceColumn: string, 
    destinationColumn: string
  ) => {
    if (sourceColumn === destinationColumn) return;

    // Se usando etapas dinâmicas, encontrar o status correspondente ou usar ID
    let novoStatus: StatusProjeto;
    
    if (etapasDinamicas.length > 0) {
      const etapaDestino = etapasDinamicas.find(e => e.id === destinationColumn);
      if (etapaDestino) {
        // Tentar mapear para status legado por nome
        const nome = etapaDestino.nome.toLowerCase();
        if (nome.includes('aguardando') || nome.includes('analise')) {
          novoStatus = 'aguardando_analise';
        } else if (nome.includes('produ')) {
          novoStatus = 'em_producao';
        } else if (nome.includes('revis')) {
          novoStatus = 'revisao';
        } else if (nome.includes('aprova')) {
          novoStatus = 'aprovacao_cliente';
        } else if (nome.includes('ajuste')) {
          novoStatus = 'ajuste';
        } else if (nome.includes('conclu')) {
          novoStatus = 'concluido';
        } else if (nome.includes('arquiv')) {
          novoStatus = 'arquivado';
        } else {
          novoStatus = 'em_producao'; // fallback
        }
      } else {
        novoStatus = destinationColumn as StatusProjeto;
      }
    } else {
      novoStatus = destinationColumn as StatusProjeto;
    }

    const projetosNaColuna = projetos.filter(p => getProjectColumn(p) === destinationColumn);
    const novaOrdem = projetosNaColuna.length;

    moveProjetoKanban.mutate({
      projetoId: projeto.id,
      novoStatus,
      novaOrdem
    });
  }, [projetos, moveProjetoKanban, etapasDinamicas, getProjectColumn]);

  if (isLoading || etapasLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="min-h-[500px]">
            <CardContent className="p-3">
              <Skeleton className="h-5 w-24 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <KanbanBoard<ProjetoMarketing>
      columns={columns}
      items={projetos}
      getItemId={(projeto) => projeto.id}
      getItemColumn={getProjectColumn}
      emptyMessage="Arraste projetos aqui"
      onMove={() => {}}
      onMoveWithData={handleMove}
      renderColumnHeader={(column, itemCount) => (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: column.color }}
            />
            <h3 className="font-medium text-sm">{column.title}</h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            {itemCount}
          </Badge>
        </div>
      )}
      renderCard={(projeto, isDragging) => (
        <ProjetoCard projeto={projeto} isDragging={isDragging} />
      )}
    />
  );
}
