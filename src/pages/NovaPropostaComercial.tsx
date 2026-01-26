import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Monitor, Save, FileText, Loader2 } from 'lucide-react';
import { ClienteSelectorCard } from '@/components/propostas/ClienteSelectorCard';
import { UnidadeSelectorCard } from '@/components/propostas/UnidadeSelectorCard';
import { ResponsaveisCard } from '@/components/propostas/ResponsaveisCard';
import { ResumoPropostaCards } from '@/components/propostas/ResumoPropostaCards';
import { ApresentacaoDialog } from '@/components/propostas/ApresentacaoDialog';
import { LocalCondicoesPagamentoEditor, LocalCondicao } from '@/components/negociacoes/LocalCondicoesPagamentoEditor';
import { useCreateNegociacao } from '@/hooks/useNegociacoes';
import { useEtapasPadraoAtivas } from '@/hooks/useFunis';
import { toast } from 'sonner';
import { toCents, fromCents } from '@/lib/formatters';

interface UnidadeSelecionada {
  id: string;
  codigo: string;
  bloco?: string;
  valor: number;
}

export default function NovaPropostaComercial() {
  const navigate = useNavigate();
  const createNegociacao = useCreateNegociacao();
  const { data: etapas = [] } = useEtapasPadraoAtivas();
  
  // Form state
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [clienteNome, setClienteNome] = useState<string>('');
  const [empreendimentoId, setEmpreendimentoId] = useState<string | null>(null);
  const [empreendimentoNome, setEmpreendimentoNome] = useState<string>('');
  const [unidades, setUnidades] = useState<UnidadeSelecionada[]>([]);
  const [corretorId, setCorretorId] = useState<string | null>(null);
  const [imobiliariaId, setImobiliariaId] = useState<string | null>(null);
  const [condicoes, setCondicoes] = useState<LocalCondicao[]>([]);
  const [apresentacaoOpen, setApresentacaoOpen] = useState(false);
  
  // Derived values
  const valorTotal = useMemo(() => 
    unidades.reduce((acc, u) => acc + (u.valor || 0), 0), 
    [unidades]
  );
  
  // Calculate summary from conditions
  const resumo = useMemo(() => {
    let totalCents = 0;
    let entradaCents = 0;
    let primeiraParcela = 0;
    let baloesCents = 0;
    
    condicoes.forEach(c => {
      const valorCents = toCents(c.valor || 0);
      const total = c.quantidade * valorCents;
      totalCents += total;
      
      if (c.tipo_parcela_codigo === 'entrada') {
        entradaCents += total;
      } else if (c.tipo_parcela_codigo === 'mensal_serie' || c.tipo_parcela_codigo === 'mensal_fixa') {
        if (primeiraParcela === 0) primeiraParcela = c.valor || 0;
      } else if (c.tipo_parcela_codigo === 'intermediaria') {
        baloesCents += total;
      }
    });
    
    return {
      valorEntrada: fromCents(entradaCents),
      valorPrimeiraParcela: primeiraParcela,
      valorBaloes: fromCents(baloesCents),
      custoTotal: fromCents(totalCents),
    };
  }, [condicoes]);
  
  // Validation
  const percentualConfigurado = useMemo(() => {
    if (valorTotal <= 0) return 0;
    const totalCents = condicoes.reduce((acc, c) => acc + toCents(c.valor || 0) * c.quantidade, 0);
    return Math.min((totalCents / toCents(valorTotal)) * 100, 100);
  }, [condicoes, valorTotal]);
  
  const canSave = clienteId && empreendimentoId && unidades.length > 0 && percentualConfigurado >= 99.9;
  
  const handleSave = async () => {
    if (!clienteId || !empreendimentoId || unidades.length === 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    
    if (percentualConfigurado < 99.9) {
      toast.error('Configure as condições de pagamento para totalizar 100% do valor');
      return;
    }
    
    // Find initial stage
    const etapaInicial = etapas.find(e => e.is_inicial) || etapas[0];
    
    if (!etapaInicial) {
      toast.error('Configure as etapas do funil antes de criar propostas');
      return;
    }
    
    try {
      await createNegociacao.mutateAsync({
        cliente_id: clienteId,
        empreendimento_id: empreendimentoId,
        corretor_id: corretorId || undefined,
        imobiliaria_id: imobiliariaId || undefined,
        funil_etapa_id: etapaInicial.id,
        valor_negociacao: valorTotal,
        unidade_ids: unidades.map(u => u.id),
        condicoes_pagamento: condicoes.map((c, index) => ({
          ...c,
          ordem: index,
        })),
      });
      
      navigate('/negociacoes');
    } catch (error) {
      console.error('Erro ao criar proposta:', error);
    }
  };
  
  return (
    <MainLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/negociacoes')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Nova Proposta Comercial</h1>
            <p className="text-sm text-muted-foreground">Configure a proposta visualmente</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setApresentacaoOpen(true)}
            disabled={!clienteId || unidades.length === 0}
          >
            <Monitor className="h-4 w-4 mr-2" />
            Apresentar
          </Button>
          <Button variant="outline" disabled={!canSave}>
            <FileText className="h-4 w-4 mr-2" />
            Gerar PDF
          </Button>
          <Button onClick={handleSave} disabled={!canSave || createNegociacao.isPending}>
            {createNegociacao.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Proposta
          </Button>
        </div>
      </div>
      
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column - 40% */}
        <div className="lg:col-span-2 space-y-4">
          <ClienteSelectorCard
            clienteId={clienteId}
            clienteNome={clienteNome}
            onClienteChange={(id, nome) => {
              setClienteId(id);
              setClienteNome(nome || '');
            }}
          />
          
          <UnidadeSelectorCard
            empreendimentoId={empreendimentoId}
            empreendimentoNome={empreendimentoNome}
            unidades={unidades}
            onEmpreendimentoChange={(id, nome) => {
              setEmpreendimentoId(id);
              setEmpreendimentoNome(nome || '');
              setUnidades([]); // Reset units when changing empreendimento
            }}
            onUnidadesChange={setUnidades}
          />
          
          <ResponsaveisCard
            corretorId={corretorId}
            imobiliariaId={imobiliariaId}
            onCorretorChange={setCorretorId}
            onImobiliariaChange={setImobiliariaId}
          />
        </div>
        
        {/* Right Column - 60% */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Condições de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <LocalCondicoesPagamentoEditor
                valorReferencia={valorTotal}
                condicoes={condicoes}
                onChange={setCondicoes}
              />
            </CardContent>
          </Card>
          
          <ResumoPropostaCards
            valorEntrada={resumo.valorEntrada}
            valorPrimeiraParcela={resumo.valorPrimeiraParcela}
            valorBaloes={resumo.valorBaloes}
            custoTotal={resumo.custoTotal}
          />
        </div>
      </div>
      
      {/* Apresentação Dialog */}
      <ApresentacaoDialog
        open={apresentacaoOpen}
        onOpenChange={setApresentacaoOpen}
        clienteNome={clienteNome}
        empreendimentoNome={empreendimentoNome}
        unidades={unidades}
        valorTotal={valorTotal}
        resumo={resumo}
        condicoes={condicoes}
      />
    </MainLayout>
  );
}
