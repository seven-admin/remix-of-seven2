import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Phone, Users, MapPin, Headphones, CheckCircle, XCircle, Trash2, Edit, List, Calendar, AlertCircle, CheckSquare, Square } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AtividadeForm } from '@/components/atividades/AtividadeForm';
import { ConcluirAtividadeDialog } from '@/components/atividades/ConcluirAtividadeDialog';
import { AtividadeDetalheDialog } from '@/components/atividades/AtividadeDetalheDialog';
import { AgendaCalendario } from '@/components/agenda/AgendaCalendario';
import { AgendaDia } from '@/components/agenda/AgendaDia';
import { useAtividades, useDeleteAtividade, useCancelarAtividade, useCreateAtividade, useUpdateAtividade, useAgendaMensal, useAgendaDia, useAtividadesHoje, useAtividadesVencidas, useConcluirAtividadesEmLote, useCreateAtividadesParaGestores } from '@/hooks/useAtividades';
import { useGestoresProduto } from '@/hooks/useGestores';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { useClientes } from '@/hooks/useClientes';
import { useIsMobile } from '@/hooks/use-mobile';
import type { AtividadeFormSubmitData } from '@/components/atividades/AtividadeForm';
import type { Atividade, AtividadeFilters, AtividadeTipo, AtividadeStatus, AtividadeFormData } from '@/types/atividades.types';
import { ATIVIDADE_TIPO_LABELS, ATIVIDADE_STATUS_LABELS } from '@/types/atividades.types';
import { cn } from '@/lib/utils';

const TIPO_ICONS: Record<AtividadeTipo, typeof Phone> = {
  ligacao: Phone,
  reuniao: Users,
  visita: MapPin,
  atendimento: Headphones,
};

const STATUS_COLORS: Record<AtividadeStatus, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  concluida: 'bg-green-100 text-green-800 border-green-200',
  cancelada: 'bg-gray-100 text-gray-600 border-gray-200',
};

const TIPO_COLORS: Record<AtividadeTipo, string> = {
  ligacao: 'bg-blue-100 text-blue-800 border-blue-200',
  reuniao: 'bg-purple-100 text-purple-800 border-purple-200',
  visita: 'bg-orange-100 text-orange-800 border-orange-200',
  atendimento: 'bg-cyan-100 text-cyan-800 border-cyan-200',
};

export default function Atividades() {
  const isMobile = useIsMobile();
  const [view, setView] = useState<'lista' | 'calendario'>('lista');
  const [filters, setFilters] = useState<AtividadeFilters>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAtividade, setEditingAtividade] = useState<Atividade | null>(null);
  const [concluirDialogOpen, setConcluirDialogOpen] = useState(false);
  const [selectedAtividade, setSelectedAtividade] = useState<Atividade | null>(null);
  const [detalheDialogOpen, setDetalheDialogOpen] = useState(false);
  const [detalheAtividade, setDetalheAtividade] = useState<Atividade | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const ano = currentDate.getFullYear();
  const mes = currentDate.getMonth() + 1;

  const { data: atividadesData, isLoading } = useAtividades({ filters });
  const atividades = atividadesData?.items || [];
  const { data: atividadesMes, isLoading: isLoadingMes } = useAgendaMensal(ano, mes);
  const { data: atividadesDia } = useAgendaDia(selectedDate);
  const { data: atividadesHoje } = useAtividadesHoje();
  const { data: atividadesVencidas } = useAtividadesVencidas();
  const { data: gestores } = useGestoresProduto();
  const { data: empreendimentos } = useEmpreendimentos();
  const { data: clientes } = useClientes();
  const createAtividade = useCreateAtividade();
  const createAtividadesParaGestores = useCreateAtividadesParaGestores();
  const updateAtividade = useUpdateAtividade();
  const deleteAtividade = useDeleteAtividade();
  const cancelarAtividade = useCancelarAtividade();
  const concluirEmLote = useConcluirAtividadesEmLote();

  // Atividades pendentes para seleção
  const atividadesPendentes = atividades?.filter(a => a.status === 'pendente') || [];

  const handleNova = () => {
    setEditingAtividade(null);
    setDialogOpen(true);
  };

  const handleEdit = (atividade: Atividade) => {
    if (atividade.status === 'pendente') {
      setEditingAtividade(atividade);
      setDialogOpen(true);
    } else {
      setDetalheAtividade(atividade);
      setDetalheDialogOpen(true);
    }
  };

  const handleConcluir = (atividade: Atividade) => {
    setSelectedAtividade(atividade);
    setConcluirDialogOpen(true);
  };

  const handleDelete = (id: string) => deleteAtividade.mutate(id);
  const handleCancelar = (id: string) => cancelarAtividade.mutate(id);

  const handleSubmit = (data: AtividadeFormSubmitData) => {
    if (editingAtividade) {
      // Na edição, sempre usa o formData normal
      updateAtividade.mutate({ id: editingAtividade.id, data: data.formData }, {
        onSuccess: () => {
          setDialogOpen(false);
          setEditingAtividade(null);
        }
      });
    } else {
      // Na criação, verifica se tem gestorIds (múltiplos gestores)
      if (data.gestorIds && data.gestorIds.length > 0) {
        createAtividadesParaGestores.mutate(
          { formData: data.formData, gestorIds: data.gestorIds },
          {
            onSuccess: () => {
              setDialogOpen(false);
            }
          }
        );
      } else {
        createAtividade.mutate(data.formData, {
          onSuccess: () => {
            setDialogOpen(false);
          }
        });
      }
    }
  };

  const handleConcluirSuccess = () => {
    setConcluirDialogOpen(false);
    setSelectedAtividade(null);
  };

  const handleMonthChange = (year: number, month: number) => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // Seleção em lote
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === atividadesPendentes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(atividadesPendentes.map(a => a.id)));
    }
  };

  const handleConcluirEmLote = () => {
    if (selectedIds.size === 0) return;
    concluirEmLote.mutate(Array.from(selectedIds), {
      onSuccess: () => {
        setSelectedIds(new Set());
      }
    });
  };

  return (
    <MainLayout title="Atividades" subtitle="Gerencie as atividades comerciais">
      <div className="space-y-6">
        {/* Header com toggle de visualização */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={view} onValueChange={(v) => setView(v as 'lista' | 'calendario')}>
            <TabsList>
              <TabsTrigger value="lista" className="gap-2">
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Lista</span>
              </TabsTrigger>
              <TabsTrigger value="calendario" className="gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Calendário</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex gap-2">
            {selectedIds.size > 0 && (
              <Button 
                variant="outline" 
                onClick={handleConcluirEmLote}
                disabled={concluirEmLote.isPending}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Concluir {selectedIds.size} selecionada(s)
              </Button>
            )}
            <Button onClick={handleNova} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              <span className="sm:hidden">Nova</span>
              <span className="hidden sm:inline">Nova Atividade</span>
            </Button>
          </div>
        </div>

        {/* Resumo (visível em ambas as views) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Atividades Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{atividadesHoje?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Este Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{atividadesMes?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className={atividadesVencidas?.length ? 'border-destructive/50 bg-destructive/5' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="h-4 w-4 text-destructive" />
                Vencidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{atividadesVencidas?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* View: Lista */}
        {view === 'lista' && (
          <>
            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
                  <Select value={filters.tipo || ''} onValueChange={(v) => setFilters({ ...filters, tipo: v === 'all' ? undefined : v as AtividadeTipo })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {Object.entries(ATIVIDADE_TIPO_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.status || ''} onValueChange={(v) => setFilters({ ...filters, status: v === 'all' ? undefined : v as AtividadeStatus })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {Object.entries(ATIVIDADE_STATUS_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.responsavel_id || ''} onValueChange={(v) => setFilters({ ...filters, responsavel_id: v === 'all' ? undefined : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {gestores?.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.empreendimento_id || ''} onValueChange={(v) => setFilters({ ...filters, empreendimento_id: v === 'all' ? undefined : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Empreendimento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {empreendimentos?.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.cliente_id || ''} onValueChange={(v) => setFilters({ ...filters, cliente_id: v === 'all' ? undefined : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {clientes?.slice(0, 50).map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="date"
                    value={filters.data_inicio || ''}
                    onChange={(e) => setFilters({ ...filters, data_inicio: e.target.value || undefined })}
                    placeholder="Data início"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Lista - Mobile Card View */}
            <div className="md:hidden space-y-3">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
                </div>
              ) : atividades?.length === 0 ? (
                <Card className="p-6 text-center text-muted-foreground">
                  Nenhuma atividade encontrada
                </Card>
              ) : (
                atividades?.map((atividade) => {
                  const TipoIcon = TIPO_ICONS[atividade.tipo];
                  const isVencida = atividade.status === 'pendente' && new Date(atividade.data_hora) < new Date();
                  const isSelected = selectedIds.has(atividade.id);
                  return (
                    <Card key={atividade.id} className={cn("p-4", isVencida && "border-destructive", isSelected && "ring-2 ring-primary")}>
                      <div className="flex items-start gap-3">
                        {atividade.status === 'pendente' && (
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(atividade.id)}
                            className="mt-1"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant="outline" className={TIPO_COLORS[atividade.tipo]}>
                              <TipoIcon className="h-3 w-3 mr-1" />
                              {ATIVIDADE_TIPO_LABELS[atividade.tipo]}
                            </Badge>
                            <Badge variant="outline" className={STATUS_COLORS[atividade.status]}>
                              {ATIVIDADE_STATUS_LABELS[atividade.status]}
                            </Badge>
                          </div>
                          <h4 className="font-medium truncate">{atividade.titulo}</h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {atividade.cliente?.nome || 'Sem cliente'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(atividade.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1">
                          {atividade.status === 'pendente' && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => handleConcluir(atividade)} title="Concluir">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(atividade)} title="Editar">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" title="Excluir">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir esta atividade? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(atividade.id)}>
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Lista - Desktop Table View */}
            <Card className="hidden md:block">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-6 space-y-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={atividadesPendentes.length > 0 && selectedIds.size === atividadesPendentes.length}
                            onCheckedChange={toggleSelectAll}
                            aria-label="Selecionar todas"
                          />
                        </TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="hidden lg:table-cell">Corretor</TableHead>
                        <TableHead className="hidden lg:table-cell">Gestor</TableHead>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {atividades?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            Nenhuma atividade encontrada
                          </TableCell>
                        </TableRow>
                      ) : (
                        atividades?.map((atividade) => {
                          const TipoIcon = TIPO_ICONS[atividade.tipo];
                          const isVencida = atividade.status === 'pendente' && new Date(atividade.data_hora) < new Date();
                          const isSelected = selectedIds.has(atividade.id);
                          return (
                            <TableRow key={atividade.id} className={cn(isVencida && 'bg-red-50', isSelected && 'bg-primary/5')}>
                              <TableCell>
                                {atividade.status === 'pendente' && (
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleSelect(atividade.id)}
                                  />
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={TIPO_COLORS[atividade.tipo]}>
                                  <TipoIcon className="h-3 w-3 mr-1" />
                                  {ATIVIDADE_TIPO_LABELS[atividade.tipo]}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">{atividade.titulo}</TableCell>
                              <TableCell>{atividade.cliente?.nome || '-'}</TableCell>
                              <TableCell className="hidden lg:table-cell">{atividade.corretor?.nome_completo || '-'}</TableCell>
                              <TableCell className="hidden lg:table-cell">{atividade.gestor?.full_name || '-'}</TableCell>
                              <TableCell>
                                {format(new Date(atividade.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={STATUS_COLORS[atividade.status]}>
                                  {ATIVIDADE_STATUS_LABELS[atividade.status]}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {atividade.status === 'pendente' && (
                                    <>
                                      <Button variant="ghost" size="icon" onClick={() => handleConcluir(atividade)} title="Concluir">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      </Button>
                                      <Button variant="ghost" size="icon" onClick={() => handleCancelar(atividade.id)} title="Cancelar">
                                        <XCircle className="h-4 w-4 text-orange-600" />
                                      </Button>
                                      <Button variant="ghost" size="icon" onClick={() => handleEdit(atividade)} title="Editar">
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" title="Excluir">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Tem certeza que deseja excluir esta atividade? Esta ação não pode ser desfeita.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(atividade.id)}>
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* View: Calendário */}
        {view === 'calendario' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendário */}
            <div className="lg:col-span-2">
              {isLoadingMes ? (
                <Card>
                  <CardContent className="pt-6">
                    <Skeleton className="h-[400px] w-full" />
                  </CardContent>
                </Card>
              ) : (
                <AgendaCalendario
                  atividades={atividadesMes || []}
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  onMonthChange={handleMonthChange}
                />
              )}
            </div>

            {/* Lista do Dia Selecionado */}
            <div>
              <AgendaDia 
                data={selectedDate}
                atividades={atividadesDia || []}
                onAtividadeClick={handleEdit}
                onNovaAtividade={handleNova}
              />
            </div>
          </div>
        )}

        {/* Atividades Vencidas */}
        {atividadesVencidas && atividadesVencidas.length > 0 && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Atividades Vencidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {atividadesVencidas.map((atividade) => (
                  <div key={atividade.id} className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{atividade.titulo}</p>
                      <p className="text-sm text-muted-foreground">
                        {atividade.cliente?.nome} • {atividade.corretor?.nome_completo}
                      </p>
                    </div>
                    <Badge variant="destructive">
                      {format(new Date(atividade.data_hora), 'dd/MM/yyyy', { locale: ptBR })}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog Nova/Editar Atividade */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{editingAtividade ? 'Editar Atividade' : 'Nova Atividade'}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            <AtividadeForm 
              initialData={editingAtividade || undefined} 
              onSubmit={handleSubmit}
              isLoading={createAtividade.isPending || updateAtividade.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Concluir Atividade */}
      <ConcluirAtividadeDialog
        atividade={selectedAtividade}
        open={concluirDialogOpen}
        onOpenChange={setConcluirDialogOpen}
        onSuccess={handleConcluirSuccess}
      />

      {/* Dialog Detalhe Atividade */}
      <AtividadeDetalheDialog
        atividade={detalheAtividade}
        open={detalheDialogOpen}
        onOpenChange={setDetalheDialogOpen}
      />
    </MainLayout>
  );
}
