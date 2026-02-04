import { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  endOfWeek
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { usePlanejamentoGlobal, type PlanejamentoGlobalFilters } from '@/hooks/usePlanejamentoGlobal';
import { usePlanejamentoFases } from '@/hooks/usePlanejamentoFases';
import { Skeleton } from '@/components/ui/skeleton';
import type { PlanejamentoItemWithRelations } from '@/types/planejamento.types';

// Constantes de altura
const ROW_HEIGHT = 32;
const HEADER_HEIGHT = 44;
const FASE_ROW_HEIGHT = 28;
const EMP_ROW_HEIGHT = 36;
const SIDEBAR_WIDTH = 280;

interface Props {
  filters: PlanejamentoGlobalFilters;
  onFiltersChange: (filters: PlanejamentoGlobalFilters) => void;
}

type ZoomLevel = 'dia' | 'semana' | 'mes';

interface ColumnInfo {
  date: Date;
  isToday: boolean;
  isWeekend: boolean;
  label: string;
}

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

  // Calcular informações das colunas (hoje, fim de semana, labels)
  const columns = useMemo<ColumnInfo[]>(() => {
    const today = new Date();
    return timeUnits.map((unit) => {
      const isToday = zoom === 'dia' 
        ? format(unit, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
        : zoom === 'semana'
          ? isWithinInterval(today, { start: unit, end: endOfWeek(unit, { weekStartsOn: 1 }) })
          : isSameMonth(unit, today);
      const isWeekend = zoom === 'dia' && (unit.getDay() === 0 || unit.getDay() === 6);
      const label = zoom === 'dia' 
        ? format(unit, 'dd', { locale: ptBR }) 
        : zoom === 'semana' 
          ? format(unit, 'dd/MM', { locale: ptBR }) 
          : format(unit, 'MMM yy', { locale: ptBR });
      
      return { date: unit, isToday, isWeekend, label };
    });
  }, [timeUnits, zoom]);

  const unitWidth = zoom === 'dia' ? 30 : zoom === 'semana' ? 80 : 120;
  const totalWidth = columns.length * unitWidth;

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

  // Renderiza células de grid para uma linha
  const renderGridCells = (height: number = ROW_HEIGHT) => (
    <>
      {columns.map((col, idx) => (
        <div
          key={idx}
          className={cn(
            "shrink-0 border-r border-b border-border/50",
            col.isWeekend && "bg-muted/20",
            col.isToday && "bg-primary/10"
          )}
          style={{ width: unitWidth, height }}
        />
      ))}
    </>
  );

  // Renderiza barra de tarefa com tooltip
  const renderTaskBar = (item: PlanejamentoItemWithRelations, fase?: { cor?: string }) => {
    const style = getBarStyle(item);
    if (!style) return null;

    const isAtrasada = !item.status?.is_final && 
      item.data_fim && 
      parseISO(item.data_fim) < new Date();

    return (
      <TooltipProvider key={item.id}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "absolute h-5 top-[6px] rounded cursor-pointer transition-opacity hover:opacity-80",
                isAtrasada && "ring-2 ring-destructive"
              )}
              style={{
                left: style.left,
                width: style.width,
                backgroundColor: fase?.cor || 'hsl(var(--primary))'
              }}
            />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="font-medium">{item.item}</p>
            <p className="text-muted-foreground text-xs mt-1">
              {item.data_inicio && format(parseISO(item.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}
              {' - '}
              {item.data_fim && format(parseISO(item.data_fim), 'dd/MM/yyyy', { locale: ptBR })}
            </p>
            {item.status && (
              <Badge variant="secondary" className="mt-1 text-xs">
                {item.status.nome}
              </Badge>
            )}
            {isAtrasada && (
              <p className="text-destructive text-xs mt-1 font-medium">Atrasada</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
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
      <CardContent className="p-0">
        <div className="flex border-t" style={{ maxHeight: 600 }}>
          {/* Coluna fixa de títulos */}
          <div 
            className="shrink-0 border-r bg-card z-10 overflow-hidden"
            style={{ width: SIDEBAR_WIDTH }}
          >
            {/* Header da coluna de títulos */}
            <div 
              className="border-b bg-muted/50 px-3 font-medium text-sm flex items-center"
              style={{ height: HEADER_HEIGHT }}
            >
              Empreendimento / Tarefa
            </div>
            
            {/* Área scrollável vertical sincronizada */}
            <div className="overflow-hidden" style={{ height: 'calc(100% - ' + HEADER_HEIGHT + 'px)' }}>
              <ScrollArea className="h-full">
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
                    <div key={empId}>
                      {/* Linha do empreendimento */}
                      <div 
                        className="flex items-center gap-2 px-2 border-b hover:bg-muted/20 cursor-pointer"
                        style={{ height: EMP_ROW_HEIGHT }}
                        onClick={() => toggleEmpreendimento(empId)}
                      >
                        {isCollapsed ? (
                          <ChevronRight className="h-4 w-4 shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 shrink-0" />
                        )}
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium text-sm truncate flex-1" title={nome}>
                          {nome}
                        </span>
                        <Badge variant="secondary" className="shrink-0">
                          {empItens.length}
                        </Badge>
                      </div>

                      {/* Fases e tarefas quando expandido */}
                      {!isCollapsed && Array.from(itensPorFase.entries()).map(([faseId, faseItens]) => {
                        const fase = fases?.find(f => f.id === faseId);
                        
                        return (
                          <div key={faseId}>
                            {/* Linha da fase */}
                            <div 
                              className="flex items-center gap-2 pl-6 pr-2 border-b bg-muted/5"
                              style={{ height: FASE_ROW_HEIGHT }}
                            >
                              <div 
                                className="w-3 h-3 rounded-full shrink-0" 
                                style={{ backgroundColor: fase?.cor }}
                              />
                              <span className="text-sm font-medium truncate flex-1">
                                {fase?.nome || 'Sem fase'}
                              </span>
                              <span className="text-xs text-muted-foreground shrink-0">
                                ({faseItens.length})
                              </span>
                            </div>

                            {/* Linhas das tarefas */}
                            {faseItens.map((item) => (
                              <div 
                                key={item.id} 
                                className="flex items-center pl-10 pr-2 border-b hover:bg-muted/10"
                                style={{ height: ROW_HEIGHT }}
                              >
                                <span className="text-xs truncate" title={item.item}>
                                  {item.item}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

                {itensPorEmpreendimento.size === 0 && (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                    Nenhum item encontrado
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          {/* Área scrollável do timeline */}
          <ScrollArea className="flex-1" ref={scrollRef}>
            <div style={{ width: totalWidth, minHeight: 400 }}>
              {/* Header de datas - sticky */}
              <div 
                className="flex sticky top-0 bg-muted/50 z-10 border-b"
                style={{ height: HEADER_HEIGHT }}
              >
                {columns.map((col, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "shrink-0 border-r text-center text-xs flex items-center justify-center",
                      col.isToday && "bg-primary/20 font-semibold",
                      col.isWeekend && !col.isToday && "bg-muted/30"
                    )}
                    style={{ width: unitWidth }}
                  >
                    {col.label}
                  </div>
                ))}
              </div>

              {/* Linhas do grid com barras */}
              {Array.from(itensPorEmpreendimento.entries()).map(([empId, { itens: empItens }]) => {
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
                  <div key={empId}>
                    {/* Linha do empreendimento - grid cells */}
                    <div 
                      className="flex relative"
                      style={{ height: EMP_ROW_HEIGHT }}
                    >
                      {renderGridCells(EMP_ROW_HEIGHT)}
                      {/* Barras resumidas quando colapsado */}
                      {isCollapsed && empItens.map(item => {
                        const fase = fases?.find(f => f.id === item.fase_id);
                        const style = getBarStyle(item);
                        if (!style) return null;
                        return (
                          <div
                            key={item.id}
                            className="absolute h-2 top-[14px] rounded-full opacity-60"
                            style={{
                              left: style.left,
                              width: style.width,
                              backgroundColor: fase?.cor || 'hsl(var(--primary))'
                            }}
                          />
                        );
                      })}
                    </div>

                    {/* Fases e tarefas quando expandido */}
                    {!isCollapsed && Array.from(itensPorFase.entries()).map(([faseId, faseItens]) => {
                      const fase = fases?.find(f => f.id === faseId);
                      
                      return (
                        <div key={faseId}>
                          {/* Linha da fase - grid cells */}
                          <div 
                            className="flex relative"
                            style={{ height: FASE_ROW_HEIGHT }}
                          >
                            {renderGridCells(FASE_ROW_HEIGHT)}
                          </div>

                          {/* Linhas das tarefas com barras */}
                          {faseItens.map((item) => (
                            <div 
                              key={item.id} 
                              className="flex relative"
                              style={{ height: ROW_HEIGHT }}
                            >
                              {renderGridCells(ROW_HEIGHT)}
                              {renderTaskBar(item, fase)}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
