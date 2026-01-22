import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Filter } from 'lucide-react';
import { FunilKanbanBoard } from '@/components/negociacoes/FunilKanbanBoard';
import { NegociacaoForm } from '@/components/negociacoes/NegociacaoForm';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { useCorretores } from '@/hooks/useCorretores';
import { useNegociacoes } from '@/hooks/useNegociacoes';
import { useEtapasPadraoAtivas } from '@/hooks/useFunis';
import { Card } from '@/components/ui/card';
import { formatarMoedaCompacta } from '@/lib/formatters';

const Funil = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [filters, setFilters] = useState<{
    empreendimento_id?: string;
    corretor_id?: string;
  }>({});

  const { data: empreendimentos = [] } = useEmpreendimentos();
  const { corretores = [] } = useCorretores();
  const { data: negociacoes = [], isLoading: isLoadingNegociacoes } = useNegociacoes(filters);
  const { data: etapas = [] } = useEtapasPadraoAtivas();

  // Calculate metrics
  const totalNegociacoes = negociacoes.length;
  const valorTotal = negociacoes.reduce((acc, n) => acc + (n.valor_negociacao || 0), 0);
  
  // Get success stage for conversion calculation
  const etapaFechado = etapas.find(e => e.is_final_sucesso);
  const taxaConversao = totalNegociacoes > 0 && etapaFechado
    ? ((negociacoes.filter(n => n.funil_etapa_id === etapaFechado.id).length / totalNegociacoes) * 100).toFixed(1)
    : 0;


  // Count per stage for mini metrics
  const countPerStage = etapas.reduce((acc, etapa) => {
    acc[etapa.id] = negociacoes.filter(n => n.funil_etapa_id === etapa.id).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <MainLayout
      title="Fichas de Proposta"
      subtitle="Gerencie suas fichas de proposta em modelo Kanban"
    >
      {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total de Fichas</p>
          <p className="text-2xl font-bold">{totalNegociacoes}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Valor Total</p>
          <p className="text-2xl font-bold">{formatarMoedaCompacta(valorTotal)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
          <p className="text-2xl font-bold">{taxaConversao}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Por Etapa</p>
          <div className="flex gap-1 mt-1 flex-wrap">
            {etapas.map((etapa) => (
              <div 
                key={etapa.id} 
                className="px-1.5 py-0.5 rounded text-xs text-white"
                style={{ backgroundColor: etapa.cor }}
                title={etapa.nome}
              >
                {countPerStage[etapa.id] || 0}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <div className="hidden sm:flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filtros:</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select
              value={filters.empreendimento_id || 'all'}
              onValueChange={(v) => setFilters(prev => ({ 
                ...prev, 
                empreendimento_id: v === 'all' ? undefined : v 
              }))}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Empreendimento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Empreendimentos</SelectItem>
                {empreendimentos.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.corretor_id || 'all'}
              onValueChange={(v) => setFilters(prev => ({ 
                ...prev, 
                corretor_id: v === 'all' ? undefined : v 
              }))}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Corretor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Corretores</SelectItem>
                {corretores.map((cor) => (
                  <SelectItem key={cor.id} value={cor.id}>
                    {cor.nome_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={() => setFormOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nova Ficha de Proposta
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="min-h-[500px]">
        <FunilKanbanBoard
          filters={filters}
          negociacoes={negociacoes}
          isLoadingNegociacoes={isLoadingNegociacoes}
        />
      </div>

      {/* Form Dialog */}
      <NegociacaoForm
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </MainLayout>
  );
};

export default Funil;
