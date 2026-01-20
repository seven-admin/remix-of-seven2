import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search } from 'lucide-react';
import { useProjetosMarketing } from '@/hooks/useProjetosMarketing';
import { MarketingKanban } from '@/components/marketing/MarketingKanban';
import { TicketForm } from '@/components/marketing/TicketForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CATEGORIA_LABELS, type CategoriaProjeto } from '@/types/marketing.types';

export default function Marketing() {
  const [showForm, setShowForm] = useState(false);
  const [categoriaFilter, setCategoriaFilter] = useState<CategoriaProjeto | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { projetos, isLoading } = useProjetosMarketing(
    categoriaFilter !== 'all' ? { categoria: categoriaFilter } : undefined
  );

  // Filtrar por busca
  const projetosFiltrados = projetos?.filter(p => 
    p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout 
      title="Tickets de Produção"
      subtitle="Gerencie tickets de criação e marketing"
    >
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={categoriaFilter} onValueChange={(v) => setCategoriaFilter(v as CategoriaProjeto | 'all')}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            {Object.entries(CATEGORIA_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Ticket
        </Button>
      </div>

      {/* Kanban */}
      <MarketingKanban projetos={projetosFiltrados || []} isLoading={isLoading} />

      {/* Dialog Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Ticket</DialogTitle>
          </DialogHeader>
          <TicketForm onSuccess={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
