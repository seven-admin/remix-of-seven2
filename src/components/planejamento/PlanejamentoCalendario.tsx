import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
  isWithinInterval,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { usePlanejamentoGlobal, type PlanejamentoGlobalFilters } from '@/hooks/usePlanejamentoGlobal';
import { Skeleton } from '@/components/ui/skeleton';
import type { PlanejamentoItemWithRelations } from '@/types/planejamento.types';

interface Props {
  filters: PlanejamentoGlobalFilters;
  onFiltersChange: (filters: PlanejamentoGlobalFilters) => void;
}

// Paleta de cores distintas para empreendimentos
const EMPREENDIMENTO_COLORS = [
  '#3b82f6', // blue-500
  '#22c55e', // green-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#84cc16', // lime-500
  '#14b8a6', // teal-500
  '#6366f1', // indigo-500
];

// Helper para converter hex em rgba
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function PlanejamentoCalendario({ filters, onFiltersChange }: Props) {
  const { itens, isLoading } = usePlanejamentoGlobal(filters);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Mapear empreendimentos para cores
  const empColors = useMemo(() => {
    const map = new Map<string, { color: string; nome: string }>();
    if (!itens) return map;
    
    const uniqueEmps = [...new Set(itens.map(i => i.empreendimento?.id).filter(Boolean))];
    uniqueEmps.forEach((id, idx) => {
      if (id) {
        const emp = itens.find(i => i.empreendimento?.id === id)?.empreendimento;
        map.set(id, {
          color: EMPREENDIMENTO_COLORS[idx % EMPREENDIMENTO_COLORS.length],
          nome: emp?.nome || 'Sem nome'
        });
      }
    });
    return map;
  }, [itens]);

  // Agrupar tarefas por dia (tarefas ativas naquele dia)
  const itensPorDia = useMemo(() => {
    const map = new Map<string, PlanejamentoItemWithRelations[]>();
    if (!itens) return map;

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    days.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      const dayItems = itens.filter(item => {
        if (!item.data_inicio || !item.data_fim) return false;
        try {
          const inicio = parseISO(item.data_inicio);
          const fim = parseISO(item.data_fim);
          return isWithinInterval(day, { start: inicio, end: fim });
        } catch {
          return false;
        }
      });
      if (dayItems.length > 0) {
        map.set(key, dayItems);
      }
    });

    return map;
  }, [itens, currentMonth]);

  // Gerar dias do mês
  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Calcular o dia da semana do primeiro dia (0 = Domingo)
  const firstDayOfMonth = startOfMonth(currentMonth);
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  if (isLoading) {
    return <Skeleton className="h-[600px]" />;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToday}>
              Hoje
            </Button>
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Week days header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Espaços vazios antes do primeiro dia */}
          {Array.from({ length: startingDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="h-28" />
          ))}

          {/* Dias do mês */}
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayItems = itensPorDia.get(key) || [];
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            const hasItems = dayItems.length > 0;

            const cellContent = (
              <button
                onClick={() => setSelectedDate(day)}
                className={cn(
                  'h-28 w-full p-1 text-left rounded-lg border transition-colors relative',
                  'hover:bg-accent hover:border-primary/50',
                  isSelected && 'border-primary bg-accent'
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full',
                      isTodayDate && 'bg-primary text-primary-foreground'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {hasItems && (
                    <Badge variant="secondary" className="text-xs h-5 px-1.5">
                      {dayItems.length}
                    </Badge>
                  )}
                </div>

                {/* Preview das tarefas */}
                <div className="mt-1 space-y-0.5 overflow-hidden">
                  {dayItems.slice(0, 3).map((item) => {
                    const empColor = empColors.get(item.empreendimento?.id || '');
                    const color = empColor?.color || '#6b7280';
                    return (
                      <div
                        key={item.id}
                        className="text-xs truncate px-1 py-0.5 rounded"
                        style={{
                          backgroundColor: hexToRgba(color, 0.2),
                          color: color,
                        }}
                      >
                        {item.item}
                      </div>
                    );
                  })}
                  {dayItems.length > 3 && (
                    <div className="text-xs text-muted-foreground px-1">
                      +{dayItems.length - 3} mais
                    </div>
                  )}
                </div>
              </button>
            );

            // Se tem itens, envolve com HoverCard
            if (hasItems) {
              return (
                <HoverCard key={key} openDelay={200} closeDelay={100}>
                  <HoverCardTrigger asChild>
                    {cellContent}
                  </HoverCardTrigger>
                  <HoverCardContent 
                    className="w-80 p-0" 
                    side="right" 
                    align="start"
                    sideOffset={5}
                  >
                    <div className="p-3 border-b bg-muted/50">
                      <p className="font-semibold text-sm">
                        {format(day, "d 'de' MMMM", { locale: ptBR })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dayItems.length} tarefa{dayItems.length > 1 ? 's' : ''} ativa{dayItems.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="p-2 max-h-[250px] overflow-y-auto">
                      {dayItems.map((item) => {
                        const empColor = empColors.get(item.empreendimento?.id || '');
                        const color = empColor?.color || '#6b7280';
                        const isAtrasada = !item.status?.is_final && 
                          item.data_fim && 
                          parseISO(item.data_fim) < new Date();
                        
                        return (
                          <div 
                            key={item.id}
                            className="p-2 rounded-md mb-1.5 last:mb-0"
                            style={{
                              backgroundColor: hexToRgba(color, 0.1),
                              borderLeft: `3px solid ${color}`
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {item.empreendimento?.nome}
                                </p>
                                <p className="text-sm font-medium truncate">
                                  {item.item}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {item.data_inicio && format(parseISO(item.data_inicio), 'dd/MM', { locale: ptBR })}
                                  {' - '}
                                  {item.data_fim && format(parseISO(item.data_fim), 'dd/MM', { locale: ptBR })}
                                </p>
                              </div>
                              <div className="flex flex-col gap-1 items-end shrink-0">
                                {item.status && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    {item.status.nome}
                                  </Badge>
                                )}
                                {isAtrasada && (
                                  <Badge variant="destructive" className="text-[10px]">
                                    Atrasada
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              );
            }

            return <div key={key}>{cellContent}</div>;
          })}
        </div>

        {/* Legenda de empreendimentos */}
        {empColors.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 pt-4 mt-4 border-t text-xs">
            <span className="text-muted-foreground font-medium">Empreendimentos:</span>
            {Array.from(empColors.entries()).map(([id, { color, nome }]) => (
              <div key={id} className="flex items-center gap-1.5">
                <div 
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-muted-foreground">{nome}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
