import { useState } from 'react';
import { Plus, Search, Building, Phone, Mail, MapPin, Users, Trash2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useImobiliarias, useImobiliaria, useImobiliariasPaginated } from '@/hooks/useImobiliarias';
import { usePermissions } from '@/hooks/usePermissions';
import { ImobiliariaForm } from '@/components/mercado/ImobiliariaForm';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Imobiliaria } from '@/types/mercado.types';

export default function Imobiliarias() {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingImobiliariaId, setEditingImobiliariaId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  
  const { create, update, delete: deleteImobiliaria, isCreating, isUpdating } = useImobiliarias();
  const { data, isLoading } = useImobiliariasPaginated(page, 20, search || undefined);
  const { data: imobiliariaDetalhe, isLoading: isLoadingImobiliaria } = useImobiliaria(editingImobiliariaId || undefined);
  const { canAccessModule } = usePermissions();
  
  const imobiliarias = data?.imobiliarias || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;
  
  const canCreate = canAccessModule('imobiliarias', 'create');
  const canEdit = canAccessModule('imobiliarias', 'edit');
  const canDelete = canAccessModule('imobiliarias', 'delete');

  const handleSubmit = (data: any) => {
    if (editingImobiliariaId) {
      update({ ...data, id: editingImobiliariaId });
    } else {
      create(data);
    }
    handleDialogOpenChange(false);
  };

  const handleEdit = (imobiliaria: Imobiliaria) => {
    setEditingImobiliariaId(imobiliaria.id);
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingImobiliariaId(null);
    }
  };

  return (
    <MainLayout title="Imobiliárias" subtitle="Gestão de imobiliárias parceiras">
      <div className="space-y-6">
        <div className="flex justify-end">
          {canCreate && (
            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Imobiliária
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingImobiliariaId ? 'Editar Imobiliária' : 'Nova Imobiliária'}
                  </DialogTitle>
                </DialogHeader>
                {editingImobiliariaId && isLoadingImobiliaria ? (
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
                  <ImobiliariaForm
                    initialData={imobiliariaDetalhe || undefined}
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
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CNPJ ou cidade..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Badge variant="secondary">
                {total} imobiliária{total !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : imobiliarias.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma imobiliária encontrada
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Imobiliária</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Cidade</TableHead>
                        <TableHead>Corretores</TableHead>
                        <TableHead>Status</TableHead>
                        {canDelete && <TableHead className="w-[60px]"></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {imobiliarias.map((imob) => (
                        <TableRow 
                          key={imob.id}
                          className={canEdit ? "cursor-pointer hover:bg-muted/50" : ""}
                          onClick={() => canEdit && handleEdit(imob)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Building className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{imob.nome}</p>
                                {imob.cnpj && (
                                  <p className="text-sm text-muted-foreground">{imob.cnpj}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {imob.telefone && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Phone className="h-3 w-3" />
                                  {imob.telefone}
                                </div>
                              )}
                              {imob.email && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  {imob.email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {imob.endereco_cidade && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                {imob.endereco_cidade}/{imob.endereco_uf}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{imob.corretores_count || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={imob.is_active ? 'default' : 'secondary'}>
                              {imob.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          {canDelete && (
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir imobiliária?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta ação não pode ser desfeita. Todos os corretores vinculados perderão o vínculo.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteImobiliaria(imob.id)}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <PaginationControls
                  page={page}
                  totalPages={totalPages}
                  totalItems={total}
                  onPageChange={setPage}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
