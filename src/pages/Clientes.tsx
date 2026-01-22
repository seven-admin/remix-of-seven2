import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Download, MoreVertical, Edit, Trash2, MessageSquare, UserX, RefreshCw, UserCheck, ClipboardList } from 'lucide-react';
import { useClientesPaginated, useDeleteCliente, useCreateCliente, useUpdateCliente, useClienteStats, useQualificarCliente, useMarcarPerdido, useReativarCliente, useCliente } from '@/hooks/useClientes';
import { Cliente, ClienteFormData, ClienteFase, CLIENTE_FASE_LABELS, CLIENTE_FASE_COLORS, CLIENTE_TEMPERATURA_LABELS, CLIENTE_TEMPERATURA_COLORS, ClienteTemperatura } from '@/types/clientes.types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { ClienteForm } from '@/components/clientes/ClienteForm';
import { ClienteInteracoesDialog } from '@/components/clientes/ClienteInteracoesDialog';
import { ClienteHistoricoAtividadesDialog } from '@/components/clientes/ClienteHistoricoAtividadesDialog';
import { ClienteQuickViewDialog } from '@/components/clientes/ClienteQuickViewDialog';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const Clientes = () => {
  const [search, setSearch] = useState('');
  const [selectedFase, setSelectedFase] = useState<ClienteFase | 'todos'>('todos');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClienteId, setEditingClienteId] = useState<string | null>(null);
  const [interacoesCliente, setInteracoesCliente] = useState<Cliente | null>(null);
  const [historicoCliente, setHistoricoCliente] = useState<Cliente | null>(null);
  const [quickViewCliente, setQuickViewCliente] = useState<Cliente | null>(null);
  const [page, setPage] = useState(1);
  
  const filters = {
    search: search || undefined,
    fase: selectedFase !== 'todos' ? selectedFase : undefined,
    page,
    pageSize: 20
  };
  
  const { data: paginatedData, isLoading } = useClientesPaginated(filters);
  const clientes = paginatedData?.clientes ?? [];
  const totalPages = paginatedData?.totalPages ?? 1;
  const total = paginatedData?.total ?? 0;
  
  const { data: clienteDetalhe, isLoading: isLoadingCliente } = useCliente(editingClienteId || undefined);
  const { data: stats } = useClienteStats();
  const deleteMutation = useDeleteCliente();
  const createMutation = useCreateCliente();
  const updateMutation = useUpdateCliente();
  const qualificarMutation = useQualificarCliente();
  const marcarPerdidoMutation = useMarcarPerdido();
  const reativarMutation = useReativarCliente();
  const isMobile = useIsMobile();

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, selectedFase]);

  const handleDelete = async () => {
    if (selectedCliente) {
      await deleteMutation.mutateAsync(selectedCliente.id);
      setDeleteDialogOpen(false);
      setSelectedCliente(null);
    }
  };

  const handleOpenNew = () => {
    setEditingClienteId(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingClienteId(cliente.id);
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingClienteId(null);
    }
  };

  const handleSubmit = (data: ClienteFormData) => {
    if (editingClienteId) {
      updateMutation.mutate(
        { id: editingClienteId, data },
        { onSuccess: () => handleDialogOpenChange(false) }
      );
    } else {
      createMutation.mutate(data, { onSuccess: () => handleDialogOpenChange(false) });
    }
  };

  const formatPhone = (phone?: string | null) => {
    if (!phone) return '-';
    return phone;
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
  };

  const getFaseBadge = (fase: ClienteFase) => {
    return (
      <Badge variant="outline" className={cn("text-xs", CLIENTE_FASE_COLORS[fase])}>
        {CLIENTE_FASE_LABELS[fase]}
      </Badge>
    );
  };

  const getTemperaturaBadge = (temperatura?: ClienteTemperatura | null) => {
    if (!temperatura) return null;
    return (
      <Badge variant="outline" className={cn("text-xs", CLIENTE_TEMPERATURA_COLORS[temperatura])}>
        {CLIENTE_TEMPERATURA_LABELS[temperatura]}
      </Badge>
    );
  };

  return (
    <MainLayout
      title="Clientes"
      subtitle="Gerencie sua base de clientes em todas as fases"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <Card 
          className={cn(
            "p-3 cursor-pointer transition-all hover:ring-2 hover:ring-primary/20",
            selectedFase === 'todos' && "ring-2 ring-primary"
          )}
          onClick={() => setSelectedFase('todos')}
        >
          <p className="text-xs text-muted-foreground">Todos</p>
          <p className="text-2xl font-bold">{stats?.total || 0}</p>
        </Card>
        {(['prospecto', 'qualificado', 'negociando', 'comprador', 'perdido'] as ClienteFase[]).map(fase => (
          <Card 
            key={fase}
            className={cn(
              "p-3 cursor-pointer transition-all hover:ring-2 hover:ring-primary/20",
              selectedFase === fase && "ring-2 ring-primary"
            )}
            onClick={() => setSelectedFase(fase)}
          >
            <p className="text-xs text-muted-foreground">{CLIENTE_FASE_LABELS[fase]}</p>
            <p className="text-2xl font-bold">{stats?.[fase] || 0}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar cliente..." 
              className="pl-9 bg-card" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={handleOpenNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Tabs Mobile */}
      {isMobile && (
        <Tabs value={selectedFase} onValueChange={(v) => setSelectedFase(v as ClienteFase | 'todos')} className="mb-4">
          <TabsList className="w-full overflow-x-auto">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="prospecto">Prospectos</TabsTrigger>
            <TabsTrigger value="qualificado">Qualificados</TabsTrigger>
            <TabsTrigger value="negociando">Negociando</TabsTrigger>
            <TabsTrigger value="comprador">Compradores</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : clientes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {search || selectedFase !== 'todos' ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
        </div>
      ) : isMobile ? (
        // Mobile Card View
        <div className="space-y-3">
          {clientes.map((cliente) => (
            <Card key={cliente.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => setQuickViewCliente(cliente)}
                    className="font-medium text-left hover:underline"
                  >
                    {cliente.nome}
                  </button>
                  <p className="text-sm text-muted-foreground">{cliente.email || '-'}</p>
                  <p className="text-sm text-muted-foreground">{formatPhone(cliente.telefone)}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setInteracoesCliente(cliente)}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Interações
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setHistoricoCliente(cliente)}>
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Histórico (Atividades)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEdit(cliente)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {cliente.fase === 'prospecto' && (
                      <DropdownMenuItem onClick={() => qualificarMutation.mutate(cliente.id)}>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Qualificar
                      </DropdownMenuItem>
                    )}
                    {cliente.fase !== 'perdido' && cliente.fase !== 'comprador' && (
                      <DropdownMenuItem onClick={() => marcarPerdidoMutation.mutate({ id: cliente.id })}>
                        <UserX className="h-4 w-4 mr-2" />
                        Marcar Perdido
                      </DropdownMenuItem>
                    )}
                    {cliente.fase === 'perdido' && (
                      <DropdownMenuItem onClick={() => reativarMutation.mutate(cliente.id)}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reativar
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => {
                        setSelectedCliente(cliente);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {getFaseBadge(cliente.fase)}
                {getTemperaturaBadge(cliente.temperatura)}
                {cliente.origem && (
                  <Badge variant="outline" className="text-xs">
                    {cliente.origem}
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        // Desktop Table View - Clickable rows
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Gestor de Produto</TableHead>
                <TableHead className="w-[50px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((cliente) => (
                <TableRow 
                  key={cliente.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setQuickViewCliente(cliente)}
                >
                  <TableCell>
                    <p className="font-medium">{cliente.nome}</p>
                  </TableCell>
                  <TableCell>
                    {formatPhone(cliente.telefone)}
                  </TableCell>
                  <TableCell>
                    {formatPhone(cliente.whatsapp)}
                  </TableCell>
                  <TableCell>
                    {cliente.endereco_cidade || '-'}
                  </TableCell>
                  <TableCell>
                    {cliente.endereco_uf || '-'}
                  </TableCell>
                  <TableCell>
                    {(cliente as any).gestor?.full_name || '-'}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setInteracoesCliente(cliente)}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Interações
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setHistoricoCliente(cliente)}>
                          <ClipboardList className="h-4 w-4 mr-2" />
                          Histórico (Atividades)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(cliente)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {cliente.fase === 'prospecto' && (
                          <DropdownMenuItem onClick={() => qualificarMutation.mutate(cliente.id)}>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Qualificar
                          </DropdownMenuItem>
                        )}
                        {cliente.fase !== 'perdido' && cliente.fase !== 'comprador' && (
                          <DropdownMenuItem onClick={() => marcarPerdidoMutation.mutate({ id: cliente.id })}>
                            <UserX className="h-4 w-4 mr-2" />
                            Marcar Perdido
                          </DropdownMenuItem>
                        )}
                        {cliente.fase === 'perdido' && (
                          <DropdownMenuItem onClick={() => reativarMutation.mutate(cliente.id)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reativar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSelectedCliente(cliente);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {!isLoading && clientes.length > 0 && (
        <PaginationControls
          page={page}
          totalPages={totalPages}
          totalItems={total}
          onPageChange={setPage}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente {selectedCliente?.nome}? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {editingClienteId ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            {editingClienteId && isLoadingCliente ? (
              <div className="space-y-4 py-4">
                <Skeleton className="h-10 w-full" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <ClienteForm
                initialData={clienteDetalhe || undefined}
                onSubmit={handleSubmit}
                isLoading={createMutation.isPending || updateMutation.isPending}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ClienteQuickViewDialog
        cliente={quickViewCliente}
        open={!!quickViewCliente}
        onOpenChange={(open) => !open && setQuickViewCliente(null)}
        onOpenFull={(cliente) => {
          setQuickViewCliente(null);
          handleEdit(cliente);
        }}
      />

      <ClienteInteracoesDialog
        cliente={interacoesCliente}
        open={!!interacoesCliente}
        onOpenChange={(open) => !open && setInteracoesCliente(null)}
      />

      <ClienteHistoricoAtividadesDialog
        cliente={historicoCliente}
        open={!!historicoCliente}
        onOpenChange={(open) => !open && setHistoricoCliente(null)}
      />
    </MainLayout>
  );
};

export default Clientes;
