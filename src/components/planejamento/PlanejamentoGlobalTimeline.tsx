import { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ZoomIn, ZoomOut, ChevronDown, ChevronRight, Building2 } from 'lucide-react';
import { 
  format, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  eachWeekOfInterval,
  eachMonthOfInterval,
  differenceInDays,
  addMonths,
  subMonths,
  isWithinInterval,
  isSameMonth,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { usePlanejamentoGlobal, type PlanejamentoGlobalFilters } from '@/hooks/usePlanejamentoGlobal';
import { usePlanejamentoFases } from '@/hooks/usePlanejamentoFases';
import { Skeleton } from '@/components/ui/skeleton';
import type { PlanejamentoItemWithRelations } from '@/types/planejamento.types';

interface Props {
  filters: PlanejamentoGlobalFilters;
  onFiltersChange: (filters: PlanejamentoGlobalFilters) => void;
}

type ZoomLevel = 'dia' | 'semana' | 'mes';

export function PlanejamentoGlobalTimeline({ filters, onFiltersChange }: Props) {
  const { itens, isLoading } = usePlanejamentoGlobal(filters);
  const { fases } = usePlanejamentoFases();
  
  const [zoom, setZoom] = useState<ZoomLevel>('semana');
  const [collapsedEmpreendimentos, setCollapsedEmpreendimentos] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Agrupar itens por empreendimento
  const itensPorEmpreendimento = useMemo(() => {
    if (!itens) return new Map<string, { nome: string; itens: PlanejamentoItemWithRelations[] }>();
    
    const map = new Map<string, { nome: string; itens: PlanejamentoItemWithRelations[] }>();
    
    itens.forEach(item => {
      if (!item.empreendimento) return;
      const key = item.empreendimento.id;
      
      if (!map.has(key)) {
        map.set(key, { nome: item.empreendimento.nome, itens: [] });
      }
      map.get(key)!.itens.push(item);
    });
    
    return map;
  }, [itens]);

  // Calcular range de datas
  const dateRange = useMemo(() => {
    if (!itens || itens.length === 0) {
      const hoje = new Date();
      return {
        start: subMonths(startOfMonth(hoje), 1),
        end: addMonths(endOfMonth(hoje), 3)
      };
    }

    let minDate = new Date();
    let maxDate = new Date();
    let hasValidDates = false;

    itens.forEach(item => {
      if (item.data_inicio) {
        const inicio = parseISO(item.data_inicio);
        if (!hasValidDates || inicio < minDate) minDate = inicio;
        hasValidDates = true;
      }
      if (item.data_fim) {
        const fim = parseISO(item.data_fim);
        if (!hasValidDates || fim > maxDate) maxDate = fim;
        hasValidDates = true;
      }
    });

    if (!hasValidDates) {
      const hoje = new Date();
      return {
        start: subMonths(startOfMonth(hoje), 1),
        end: addMonths(endOfMonth(hoje), 3)
      };
    }

    return {
      start: subMonths(startOfMonth(minDate), 1),
      end: addMonths(endOfMonth(maxDate), 1)
    };
  }, [itens]);

  // Gerar unidades de tempo baseado no zoom
  const timeUnits = useMemo(() => {
    if (zoom === 'dia') {
      return eachDayOfInterval(dateRange);
    } else if (zoom === 'semana') {
      return eachWeekOfInterval(dateRange, { weekStartsOn: 1 });
    } else {
      return eachMonthOfInterval(dateRange);
    }
  }, [dateRange, zoom]);

  const unitWidth = zoom === 'dia' ? 30 : zoom === 'semana' ? 80 : 120;
  const totalWidth = timeUnits.length * unitWidth;

  const toggleEmpreendimento = (id: string) => {
    setCollapsedEmpreendimentos(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Calcular posição e largura da barra de tarefa
  const getBarStyle = (item: PlanejamentoItemWithRelations) => {
    if (!item.data_inicio || !item.data_fim) return null;

    try {
      const inicio = parseISO(item.data_inicio);
      const fim = parseISO(item.data_fim);
      
      const startOffset = differenceInDays(inicio, dateRange.start);
      const duration = differenceInDays(fim, inicio) + 1;

      let left: number, width: number;

      if (zoom === 'dia') {
        left = startOffset * unitWidth;
        width = duration * unitWidth;
      } else if (zoom === 'semana') {
        left = (startOffset / 7) * unitWidth;
        width = (duration / 7) * unitWidth;
      } else {
        // Aproximação mensal
        left = (startOffset / 30) * unitWidth;
        width = (duration / 30) * unitWidth;
      }

      return {
        left: Math.max(0, left),
        width: Math.max(unitWidth / 2, width)
      };
    } catch {
      return null;
    }
  };

  if (isLoading) {
    return <Skeleton className="h-[500px]" />;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Timeline Global de Projetos</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(zoom === 'dia' ? 'semana' : zoom === 'semana' ? 'mes' : 'mes')}
              disabled={zoom === 'mes'}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Select value={zoom} onValueChange={(v) => setZoom(v as ZoomLevel)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dia">Dia</SelectItem>
                <SelectItem value="semana">Semana</SelectItem>
                <SelectItem value="mes">Mês</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(zoom === 'mes' ? 'semana' : zoom === 'semana' ? 'dia' : 'dia')}
              disabled={zoom === 'dia'}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full" ref={scrollRef}>
          <div style={{ width: totalWidth + 300, minHeight: 400 }}>
            {/* Header com datas */}
            <div className="flex border-b sticky top-0 bg-background z-10">
              <div className="w-[280px] shrink-0 p-2 border-r font-medium text-sm bg-muted/30">
                Empreendimento / Fase
              </div>
              <div className="flex">
                {timeUnits.map((unit, idx) => (
                  <div
                    key={idx}
                    className="text-center text-xs border-r p-1 bg-muted/20"
                    style={{ width: unitWidth }}
                  >
                    {zoom === 'dia' && format(unit, 'dd', { locale: ptBR })}
                    {zoom === 'semana' && format(unit, 'dd/MM', { locale: ptBR })}
                    {zoom === 'mes' && format(unit, 'MMM yy', { locale: ptBR })}
                  </div>
                ))}
              </div>
            </div>

            {/* Linhas por empreendimento */}
            {Array.from(itensPorEmpreendimento.entries()).map(([empId, { nome, itens: empItens }]) => {
              const isCollapsed = collapsedEmpreendimentos.has(empId);
              
              // Agrupar por fase
              const itensPorFase = new Map<string, PlanejamentoItemWithRelations[]>();
              empItens.forEach(item => {
                const faseId = item.fase_id;
                if (!itensPorFase.has(faseId)) {
                  itensPorFase.set(faseId, []);
                }
                itensPorFase.get(faseId)!.push(item);
              });

              return (
                <div key={empId} className="border-b">
                  {/* Linha do empreendimento */}
                  <div 
                    className="flex hover:bg-muted/20 cursor-pointer"
                    onClick={() => toggleEmpreendimento(empId)}
                  >
                    <div className="w-[280px] shrink-0 p-2 border-r flex items-center gap-2">
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm truncate" title={nome}>
                        {nome}
                      </span>
                      <Badge variant="secondary" className="ml-auto">
                        {empItens.length}
                      </Badge>
                    </div>
                    <div className="flex-1 relative h-8 bg-muted/10">
                      {/* Barras resumidas do empreendimento quando colapsado */}
                      {isCollapsed && empItens.map(item => {
                        const style = getBarStyle(item);
                        if (!style) return null;
                        return (
                          <div
                            key={item.id}
                            className="absolute h-2 top-3 rounded-full opacity-60"
                            style={{
                              left: style.left,
                              width: style.width,
                              backgroundColor: item.fase?.cor || 'hsl(var(--primary))'
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Fases e tarefas quando expandido */}
                  {!isCollapsed && Array.from(itensPorFase.entries()).map(([faseId, faseItens]) => {
                    const fase = fases?.find(f => f.id === faseId);
                    
                    return (
                      <div key={faseId}>
                        {/* Linha da fase (cabeçalho) */}
                        <div className="flex bg-muted/5">
                          <div className="w-[280px] shrink-0 p-2 pl-8 border-r flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: fase?.cor }}
                            />
                            <span className="text-sm font-medium">{fase?.nome || 'Sem fase'}</span>
                            <span className="text-xs text-muted-foreground ml-auto">
                              ({faseItens.length})
                            </span>
                          </div>
                          <div className="flex-1 h-6" />
                        </div>

                        {/* Linhas das tarefas */}
                        {faseItens.map((item) => {
                          const style = getBarStyle(item);
                          const isAtrasada = !item.status?.is_final && 
                            item.data_fim && 
                            parseISO(item.data_fim) < new Date();
                          
                          return (
                            <div key={item.id} className="flex hover:bg-muted/10">
                              {/* Título da tarefa na coluna esquerda */}
                              <div className="w-[280px] shrink-0 p-1 pl-12 border-r flex items-center">
                                <span className="text-xs truncate" title={item.item}>
                                  {item.item}
                                </span>
                              </div>
                              {/* Barra no timeline */}
                              <div className="flex-1 relative h-6">
                                {style && (
                                  <div
                                    className={cn(
                                      "absolute h-4 top-1 rounded cursor-pointer hover:opacity-80",
                                      isAtrasada && "ring-2 ring-red-500"
                                    )}
                                    style={{
                                      left: style.left,
                                      width: style.width,
                                      backgroundColor: fase?.cor || 'hsl(var(--primary))'
                                    }}
                                    title={`${item.data_inicio} - ${item.data_fim}`}
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {itensPorEmpreendimento.size === 0 && (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nenhum item de planejamento encontrado
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
