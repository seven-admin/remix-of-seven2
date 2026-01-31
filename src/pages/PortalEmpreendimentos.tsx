import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, MapPin, Loader2, Eye, X, Send, TableIcon, Image } from 'lucide-react';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { useUnidades } from '@/hooks/useUnidades';
import { EMPREENDIMENTO_STATUS_LABELS, EMPREENDIMENTO_TIPO_LABELS } from '@/types/empreendimentos.types';
import { SolicitarReservaDialog } from '@/components/portal/SolicitarReservaDialog';
import { ValoresReadOnlyTable } from '@/components/portal/ValoresReadOnlyTable';
import { MidiasReadOnlyList } from '@/components/portal/MidiasReadOnlyList';
import { formatarMoeda } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { ordenarUnidadesPorBlocoENumero } from '@/lib/unidadeUtils';

interface UnidadeSimples {
  id: string;
  numero: string;
  valor: number;
  bloco?: { nome: string } | null;
}

export default function PortalEmpreendimentos() {
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [unidadesSelecionadas, setUnidadesSelecionadas] = useState<UnidadeSimples[]>([]);
  const [dialogEnviarOpen, setDialogEnviarOpen] = useState(false);
  const [filtroBloco, setFiltroBloco] = useState<string>('todos');
  const [activeTab, setActiveTab] = useState<string>('unidades');

  // Exibir empreendimentos em lançamento ou em obra (status relevantes para corretores)
  const { data: empreendimentos, isLoading: loadingEmps } = useEmpreendimentos();
  const { data: unidades, isLoading: loadingUnidades } = useUnidades(selectedEmpId || undefined);

  // Filtrar empreendimentos com status relevantes para corretores
  const empreendimentosFiltrados = useMemo(() => {
    return empreendimentos?.filter(e => ['lancamento', 'obra'].includes(e.status)) || [];
  }, [empreendimentos]);

  const empreendimentoSelecionado = useMemo(() => {
    return empreendimentosFiltrados?.find(e => e.id === selectedEmpId);
  }, [empreendimentosFiltrados, selectedEmpId]);

  const unidadesDisponiveis = useMemo(() => {
    const disponiveis = unidades?.filter(u => u.status === 'disponivel') || [];
    return ordenarUnidadesPorBlocoENumero(disponiveis);
  }, [unidades]);

  // Extrair lista de blocos únicos para o filtro
  const blocosDisponiveis = useMemo(() => {
    const blocos = unidadesDisponiveis
      .map(u => u.bloco?.nome)
      .filter((nome): nome is string => !!nome);
    
    return [...new Set(blocos)].sort((a, b) => 
      a.localeCompare(b, 'pt-BR', { numeric: true })
    );
  }, [unidadesDisponiveis]);

  // Filtrar unidades pelo bloco selecionado
  const unidadesFiltradas = useMemo(() => {
    if (filtroBloco === 'todos') return unidadesDisponiveis;
    return unidadesDisponiveis.filter(u => u.bloco?.nome === filtroBloco);
  }, [unidadesDisponiveis, filtroBloco]);

  // Agrupar unidades por bloco para exibição em lista
  const unidadesAgrupadasPorBloco = useMemo(() => {
    const grupos: Record<string, typeof unidadesFiltradas> = {};
    
    unidadesFiltradas.forEach(unidade => {
      const blocoNome = unidade.bloco?.nome || 'Sem Quadra';
      if (!grupos[blocoNome]) {
        grupos[blocoNome] = [];
      }
      grupos[blocoNome].push(unidade);
    });
    
    return Object.entries(grupos).sort(([a], [b]) => 
      a.localeCompare(b, 'pt-BR', { numeric: true })
    );
  }, [unidadesFiltradas]);

  const valorTotal = useMemo(() => {
    return unidadesSelecionadas.reduce((sum, u) => sum + (u.valor || 0), 0);
  }, [unidadesSelecionadas]);

  const handleCloseDialog = () => {
    setSelectedEmpId(null);
    setUnidadesSelecionadas([]);
    setFiltroBloco('todos');
    setActiveTab('unidades');
  };

  const handleToggleUnidade = (unidade: UnidadeSimples) => {
    setUnidadesSelecionadas(prev => {
      const exists = prev.some(u => u.id === unidade.id);
      if (exists) {
        return prev.filter(u => u.id !== unidade.id);
      }
      return [...prev, unidade];
    });
  };

  const isUnidadeSelecionada = (id: string) => {
    return unidadesSelecionadas.some(u => u.id === id);
  };

  const handleLimparSelecao = () => {
    setUnidadesSelecionadas([]);
  };

  const handleSolicitacaoSuccess = () => {
    setUnidadesSelecionadas([]);
    setSelectedEmpId(null);
  };

  if (loadingEmps) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {empreendimentosFiltrados && empreendimentosFiltrados.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {empreendimentosFiltrados.map((emp) => (
            <Card key={emp.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-1">{emp.nome}</CardTitle>
                  <Badge variant="secondary" className="shrink-0">
                    {EMPREENDIMENTO_TIPO_LABELS[emp.tipo]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="line-clamp-1">
                    {emp.endereco_cidade}, {emp.endereco_uf}
                  </span>
                </div>
                
                <Badge variant="outline">
                  {EMPREENDIMENTO_STATUS_LABELS[emp.status]}
                </Badge>

                {emp.descricao_curta && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {emp.descricao_curta}
                  </p>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setSelectedEmpId(emp.id)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalhes
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium mb-1">Nenhum empreendimento disponível</h3>
          <p className="text-muted-foreground">
            Não há empreendimentos em lançamento no momento.
          </p>
        </div>
      )}

      {/* Dialog de Detalhes do Empreendimento */}
      <Dialog open={!!selectedEmpId} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 flex-shrink-0 border-b">
            <DialogTitle>
              {empreendimentoSelecionado?.nome}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-2 border-b flex-shrink-0">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="unidades" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Unidades</span>
                </TabsTrigger>
                <TabsTrigger value="valores" className="flex items-center gap-2">
                  <TableIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Tabela de Valores</span>
                </TabsTrigger>
                <TabsTrigger value="midias" className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  <span className="hidden sm:inline">Mídias</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Aba Unidades */}
            <TabsContent value="unidades" className="flex-1 flex flex-col overflow-hidden m-0">
              {/* Header com filtro */}
              <div className="p-4 border-b flex-shrink-0">
                {blocosDisponiveis.length > 0 && (
                  <Select value={filtroBloco} onValueChange={setFiltroBloco}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Filtrar por quadra" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas as quadras</SelectItem>
                      {blocosDisponiveis.map(bloco => (
                        <SelectItem key={bloco} value={bloco}>
                          {bloco}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Conteúdo com scroll */}
              <div className="flex-1 overflow-y-auto p-6">
                {loadingUnidades ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : unidadesFiltradas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Building2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground mb-4">
                      {filtroBloco !== 'todos' 
                        ? `Nenhuma unidade disponível em ${filtroBloco}.`
                        : 'Nenhuma unidade disponível neste empreendimento.'}
                    </p>
                    {filtroBloco !== 'todos' && (
                      <Button variant="outline" onClick={() => setFiltroBloco('todos')}>
                        Ver todas as quadras
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {unidadesAgrupadasPorBloco.map(([blocoNome, unidadesBloco]) => (
                      <div key={blocoNome}>
                        {/* Header do bloco */}
                        <h4 className="font-medium text-sm text-muted-foreground mb-2 px-1">
                          {blocoNome} ({unidadesBloco.length})
                        </h4>
                        
                        {/* Lista de unidades */}
                        <div className="border rounded-lg divide-y">
                          {unidadesBloco.map((unidade) => {
                            const selecionada = isUnidadeSelecionada(unidade.id);
                            return (
                              <label
                                key={unidade.id}
                                className={cn(
                                  "flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                                  selecionada && "bg-primary/5"
                                )}
                              >
                                <Checkbox
                                  checked={selecionada}
                                  onCheckedChange={() => handleToggleUnidade({
                                    id: unidade.id,
                                    numero: unidade.numero,
                                    valor: unidade.valor || 0,
                                    bloco: unidade.bloco
                                  })}
                                />
                                
                                <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                                  <div className="flex items-center gap-3">
                                    <span className="font-medium">
                                      Unidade {unidade.numero}
                                    </span>
                                    {unidade.tipologia && (
                                      <span className="text-sm text-muted-foreground hidden sm:inline">
                                        {unidade.tipologia.nome}
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-semibold text-primary whitespace-nowrap">
                                    {formatarMoeda(unidade.valor || 0)}
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer fixo com seleção */}
              {unidadesSelecionadas.length > 0 && (
                <div className="flex-shrink-0 border-t bg-muted/30 p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        {unidadesSelecionadas.length} unidade{unidadesSelecionadas.length > 1 ? 's' : ''} selecionada{unidadesSelecionadas.length > 1 ? 's' : ''}
                      </p>
                      <p className="text-lg font-semibold">{formatarMoeda(valorTotal)}</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button 
                        variant="outline" 
                        onClick={handleLimparSelecao}
                        className="flex-1 sm:flex-none"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Limpar
                      </Button>
                      <Button 
                        onClick={() => setDialogEnviarOpen(true)}
                        className="flex-1 sm:flex-none"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Solicitar Reserva
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Aba Tabela de Valores */}
            <TabsContent value="valores" className="flex-1 overflow-y-auto p-6 m-0">
              {selectedEmpId && <ValoresReadOnlyTable empreendimentoId={selectedEmpId} />}
            </TabsContent>

            {/* Aba Mídias */}
            <TabsContent value="midias" className="flex-1 overflow-y-auto p-6 m-0">
              {selectedEmpId && <MidiasReadOnlyList empreendimentoId={selectedEmpId} />}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Dialog de Envio da Solicitação */}
      {selectedEmpId && (
        <SolicitarReservaDialog
          open={dialogEnviarOpen}
          onOpenChange={setDialogEnviarOpen}
          empreendimentoId={selectedEmpId}
          unidades={unidadesSelecionadas}
          onSuccess={handleSolicitacaoSuccess}
        />
      )}
    </>
  );
}
