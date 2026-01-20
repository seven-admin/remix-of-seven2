import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNegociacaoHistorico, NegociacaoHistoricoItem } from '@/hooks/useNegociacaoHistorico';
import { Negociacao, ETAPA_FUNIL_LABELS, ETAPA_FUNIL_COLORS, EtapaFunil } from '@/types/negociacoes.types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowRight, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NegociacaoHistoricoTimelineProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  negociacao: Negociacao | null;
}

// Helper to get stage name and color from dynamic or legacy data
function getEtapaInfo(item: NegociacaoHistoricoItem, tipo: 'anterior' | 'nova') {
  if (tipo === 'anterior') {
    if (item.etapa_anterior_info) {
      return { nome: item.etapa_anterior_info.nome, cor: item.etapa_anterior_info.cor };
    }
    if (item.etapa_anterior) {
      return { 
        nome: ETAPA_FUNIL_LABELS[item.etapa_anterior as EtapaFunil] || item.etapa_anterior, 
        cor: ETAPA_FUNIL_COLORS[item.etapa_anterior as EtapaFunil] || 'bg-gray-500' 
      };
    }
    return null;
  } else {
    if (item.etapa_nova_info) {
      return { nome: item.etapa_nova_info.nome, cor: item.etapa_nova_info.cor };
    }
    if (item.etapa_nova) {
      return { 
        nome: ETAPA_FUNIL_LABELS[item.etapa_nova as EtapaFunil] || item.etapa_nova, 
        cor: ETAPA_FUNIL_COLORS[item.etapa_nova as EtapaFunil] || 'bg-gray-500' 
      };
    }
    return null;
  }
}

export function NegociacaoHistoricoTimeline({
  open,
  onOpenChange,
  negociacao
}: NegociacaoHistoricoTimelineProps) {
  const { data: historico = [], isLoading } = useNegociacaoHistorico(negociacao?.id);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Histórico da Negociação</SheetTitle>
          <SheetDescription>
            {negociacao?.codigo} - {negociacao?.cliente?.nome}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : historico.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum histórico encontrado
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border" />

              <div className="space-y-6">
                {historico.map((item) => {
                  const etapaAnterior = getEtapaInfo(item, 'anterior');
                  const etapaNova = getEtapaInfo(item, 'nova');
                  
                  return (
                    <div key={item.id} className="relative pl-8">
                      {/* Timeline dot */}
                      <div 
                        className="absolute left-0 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: etapaNova?.cor || '#6b7280' }}
                      >
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>

                      <div className="bg-card border rounded-lg p-3">
                        {/* Movement */}
                        <div className="flex items-center gap-2 text-sm font-medium mb-1 flex-wrap">
                          {etapaAnterior && (
                            <>
                              <span 
                                className="px-2 py-0.5 rounded text-xs text-white"
                                style={{ backgroundColor: etapaAnterior.cor }}
                              >
                                {etapaAnterior.nome}
                              </span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            </>
                          )}
                          {etapaNova && (
                            <span 
                              className="px-2 py-0.5 rounded text-xs text-white"
                              style={{ backgroundColor: etapaNova.cor }}
                            >
                              {etapaNova.nome}
                            </span>
                          )}
                        </div>

                        {/* Observation */}
                        {item.observacao && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {item.observacao}
                          </p>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{item.user?.full_name || 'Sistema'}</span>
                          </div>
                          <span>
                            {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
