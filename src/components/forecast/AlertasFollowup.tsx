import { AlertCircle, Phone, MessageSquare, Clock, Check, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  useAtividadesPendentesFollowup, 
  useAtividadesVencidas, 
  useMarcarFollowupRealizado, 
  useCreateAtividade 
} from '@/hooks/useAtividades';
import type { Atividade, AtividadeFormData } from '@/types/atividades.types';

interface AlertasFollowupProps {
  onAtividadeClick?: (atividade: Atividade) => void;
}

export function AlertasFollowup({ onAtividadeClick }: AlertasFollowupProps) {
  const { data: followups, isLoading: loadingFollowups } = useAtividadesPendentesFollowup();
  const { data: vencidas, isLoading: loadingVencidas } = useAtividadesVencidas();
  const marcarRealizado = useMarcarFollowupRealizado();
  const createAtividade = useCreateAtividade();

  const isLoading = loadingFollowups || loadingVencidas;

  // Dispensar follow-up sem criar nova atividade
  const handleDispensarFollowup = (e: React.MouseEvent, atividadeId: string) => {
    e.stopPropagation();
    marcarRealizado.mutate(atividadeId);
  };

  // Criar nova atividade de acompanhamento
  const handleNovoAcompanhamento = (e: React.MouseEvent, atividadeId: string, atividade: Atividade) => {
    e.stopPropagation();
    const novaAtividade: AtividadeFormData = {
      tipo: atividade.tipo,
      titulo: `Acompanhamento: ${atividade.titulo}`,
      cliente_id: atividade.cliente_id || undefined,
      corretor_id: atividade.corretor_id || undefined,
      empreendimento_id: atividade.empreendimento_id || undefined,
      gestor_id: atividade.gestor_id || undefined,
      data_hora: new Date().toISOString(),
    };
    
    // Primeiro marca como realizado, depois cria a nova
    marcarRealizado.mutate(atividadeId, {
      onSuccess: () => {
        createAtividade.mutate(novaAtividade);
      }
    });
  };

  // Combinar e ordenar por urgência
  const alertas = [
    ...(vencidas || []).map((a) => ({ ...a, tipo_alerta: 'vencida' as const })),
    ...(followups || []).map((a) => ({ ...a, tipo_alerta: 'followup' as const })),
  ].sort((a, b) => {
    const dataA = a.tipo_alerta === 'vencida' ? a.data_hora : a.data_followup;
    const dataB = b.tipo_alerta === 'vencida' ? b.data_hora : b.data_followup;
    return new Date(dataA!).getTime() - new Date(dataB!).getTime();
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Alertas de Follow-up
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          Alertas de Follow-up
          {alertas.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {alertas.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alertas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum alerta pendente</p>
            <p className="text-sm mt-1">Todas as atividades estão em dia!</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {alertas.map((alerta) => {
                const dataRef = alerta.tipo_alerta === 'vencida' 
                  ? alerta.data_hora 
                  : alerta.data_followup;
                const atraso = formatDistanceToNow(new Date(dataRef!), {
                  addSuffix: true,
                  locale: ptBR,
                });

                return (
                  <div
                    key={alerta.id}
                    onClick={() => onAtividadeClick?.(alerta)}
                    className={cn(
                      'p-4 rounded-lg border cursor-pointer transition-all',
                      'hover:shadow-md',
                      alerta.tipo_alerta === 'vencida'
                        ? 'border-destructive/50 bg-destructive/5'
                        : 'border-warning/50 bg-warning/5'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-sm">{alerta.titulo}</h4>
                        <p className="text-xs text-muted-foreground">
                          {alerta.cliente?.nome || alerta.corretor?.nome_completo || 'Sem contato'}
                        </p>
                      </div>
                      <Badge
                        variant={alerta.tipo_alerta === 'vencida' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {alerta.tipo_alerta === 'vencida' ? 'Vencida' : 'Follow-up'}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground mb-3">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {atraso}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {alerta.cliente?.nome && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              // WhatsApp action
                            }}
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            WhatsApp
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Phone action
                            }}
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Ligar
                          </Button>
                        </>
                      )}
                      
                      {/* Botões para Follow-up */}
                      {alerta.tipo_alerta === 'followup' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={(e) => handleNovoAcompanhamento(e, alerta.id, alerta)}
                            disabled={createAtividade.isPending}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Nova Atividade
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-muted-foreground"
                            onClick={(e) => handleDispensarFollowup(e, alerta.id)}
                            disabled={marcarRealizado.isPending}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Dispensar
                          </Button>
                        </>
                      )}

                      {/* Botão para Atividade Vencida */}
                      {alerta.tipo_alerta === 'vencida' && (
                        <Button
                          size="sm"
                          variant="default"
                          className="h-7 px-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAtividadeClick?.(alerta);
                          }}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Concluir
                        </Button>
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
