import { useState } from 'react';
import { Plus, Search, UserCheck, Phone, Mail, Building, Trash2, KeyRound, UserPlus, Link2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useCorretores, useCorretor } from '@/hooks/useCorretores';
import { useImobiliarias } from '@/hooks/useImobiliarias';
import { usePermissions } from '@/hooks/usePermissions';
import { CorretorForm } from '@/components/mercado/CorretorForm';
import { VincularUsuarioDialog } from '@/components/corretores/VincularUsuarioDialog';
import { Corretor } from '@/types/mercado.types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export default function Corretores() {
  const [search, setSearch] = useState('');
  const [filterImobiliaria, setFilterImobiliaria] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCorretorId, setEditingCorretorId] = useState<string | null>(null);
  const [isCreatingAccess, setIsCreatingAccess] = useState(false);
  const [corretorToLink, setCorretorToLink] = useState<Corretor | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { corretores, isLoading, create, update, delete: deleteCorretor, isCreating, isUpdating } = useCorretores();
  const { data: corretorDetalhe, isLoading: isLoadingCorretor } = useCorretor(editingCorretorId || undefined);
  const { imobiliarias } = useImobiliarias();
  const { canAccessModule } = usePermissions();
  
  const canCreate = canAccessModule('corretores', 'create');
  const canEdit = canAccessModule('corretores', 'edit');
  const canDelete = canAccessModule('corretores', 'delete');

  const filteredCorretores = corretores.filter(corretor => {
    const matchesSearch = corretor.nome_completo.toLowerCase().includes(search.toLowerCase()) ||
      corretor.cpf?.includes(search) ||
      corretor.email?.toLowerCase().includes(search.toLowerCase());
    
    const matchesImobiliaria = filterImobiliaria === 'all' || corretor.imobiliaria_id === filterImobiliaria;
    
    return matchesSearch && matchesImobiliaria;
  });

  const handleSubmit = (data: any) => {
    if (editingCorretorId) {
      update({ ...data, id: editingCorretorId });
    } else {
      create(data);
    }
    handleDialogOpenChange(false);
  };

  const handleEdit = (corretor: Corretor) => {
    setEditingCorretorId(corretor.id);
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingCorretorId(null);
    }
  };

  const openWhatsApp = (whatsapp: string) => {
    const number = whatsapp.replace(/\D/g, '');
    window.open(`https://wa.me/55${number}`, '_blank');
  };

  const handleCreateSystemAccess = async (corretor: Corretor) => {
    if (!corretor.email) {
      toast({
        title: 'Erro',
        description: 'O corretor precisa ter um email cadastrado para criar acesso ao sistema.',
        variant: 'destructive'
      });
      return;
    }

    setIsCreatingAccess(true);
    try {
      // Call edge function to create user
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: corretor.email,
          password: 'Seven@1234',
          full_name: corretor.nome_completo,
          role: 'corretor'
        }
      });

      if (error) throw error;

      const userId = data?.user?.id;
      if (!userId) throw new Error('Não foi possível obter o ID do usuário criado');

      // Link user_id to corretor
      const { error: updateError } = await supabase
        .from('corretores')
        .update({ user_id: userId })
        .eq('id', corretor.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['corretores'] });

      toast({
        title: 'Acesso criado!',
        description: `Usuário criado para ${corretor.nome_completo}. Senha padrão: Seven@1234`
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao criar acesso',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive'
      });
    } finally {
      setIsCreatingAccess(false);
    }
  };

  return (
    <MainLayout title="Corretores" subtitle="Gestão de corretores">
      <div className="space-y-6">
        <div className="flex justify-end">
          {canCreate && (
            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Corretor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingCorretorId ? 'Editar Corretor' : 'Novo Corretor'}
                  </DialogTitle>
                </DialogHeader>
                {editingCorretorId && isLoadingCorretor ? (
                  <div className="space-y-4 py-4">
                    <Skeleton className="h-10 w-full" />
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <CorretorForm
                    initialData={corretorDetalhe || undefined}
                    onSubmit={handleSubmit}
                    isLoading={isCreating || isUpdating}
                  />
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CPF ou email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterImobiliaria} onValueChange={setFilterImobiliaria}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por imobiliária" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as imobiliárias</SelectItem>
                  {imobiliarias.map(imob => (
                    <SelectItem key={imob.id} value={imob.id}>{imob.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant="secondary">
                {filteredCorretores.length} corretor{filteredCorretores.length !== 1 ? 'es' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : filteredCorretores.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum corretor encontrado
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Corretor</TableHead>
                        <TableHead>Imobiliária</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>CRECI</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Acesso</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCorretores.map((corretor) => (
                        <TableRow 
                          key={corretor.id}
                          className={canEdit ? "cursor-pointer hover:bg-muted/50" : ""}
                          onClick={() => canEdit && handleEdit(corretor)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <UserCheck className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{corretor.nome_completo}</p>
                                {corretor.cpf && (
                                  <p className="text-sm text-muted-foreground">{corretor.cpf}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {corretor.imobiliaria && (
                              <div className="flex items-center gap-1">
                                <Building className="h-3 w-3 text-muted-foreground" />
                                <span>{corretor.imobiliaria.nome}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {corretor.telefone && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Phone className="h-3 w-3" />
                                  {corretor.telefone}
                                </div>
                              )}
                              {corretor.whatsapp && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="h-auto p-0 text-green-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openWhatsApp(corretor.whatsapp!);
                                  }}
                                >
                                  WhatsApp
                                </Button>
                              )}
                              {corretor.email && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  {corretor.email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{corretor.creci || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={corretor.is_active ? 'default' : 'secondary'}>
                              {corretor.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {corretor.user_id ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                                      <KeyRound className="h-3 w-3" />
                                      Com acesso
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{corretor.user?.email || 'Usuário vinculado'}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                  >
                                    <UserPlus className="h-3 w-3" />
                                    Acesso
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    disabled={isCreatingAccess || !corretor.email}
                                    onClick={() => handleCreateSystemAccess(corretor)}
                                  >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Criar Novo Usuário
                                    {!corretor.email && (
                                      <span className="text-xs text-muted-foreground ml-2">(email obrigatório)</span>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setCorretorToLink(corretor)}>
                                    <Link2 className="h-4 w-4 mr-2" />
                                    Vincular Usuário Existente
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {canDelete && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir corretor?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteCorretor(corretor.id)}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Dialog para vincular usuário existente */}
      <VincularUsuarioDialog
        open={!!corretorToLink}
        onOpenChange={(open) => !open && setCorretorToLink(null)}
        corretorId={corretorToLink?.id || ''}
        corretorNome={corretorToLink?.nome_completo || ''}
      />
    </MainLayout>
  );
}
