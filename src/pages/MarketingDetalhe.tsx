import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, User, Building2, MessageSquare, History, CheckSquare, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useProjetosMarketing } from '@/hooks/useProjetosMarketing';
import { CATEGORIA_LABELS, STATUS_LABELS, STATUS_COLORS, PRIORIDADE_LABELS, PRIORIDADE_COLORS } from '@/types/marketing.types';
import { ProjetoTarefas } from '@/components/marketing/ProjetoTarefas';
import { ProjetoComentarios } from '@/components/marketing/ProjetoComentarios';
import { ProjetoTimeline } from '@/components/marketing/ProjetoTimeline';
import { ProjetoEditForm } from '@/components/marketing/ProjetoEditForm';

export default function MarketingDetalhe() {
  const { id } = useParams<{ id: string }>();
  const { useProjeto } = useProjetosMarketing();
  const { data: projeto, isLoading } = useProjeto(id || '');
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <MainLayout title="Carregando...">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!projeto) {
    return (
      <MainLayout title="Projeto não encontrado">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">O projeto solicitado não foi encontrado.</p>
          <Link to="/marketing">
            <Button>Voltar para Marketing</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const headerBadges = (
    <>
      <Badge 
        className="text-white"
        style={{ backgroundColor: STATUS_COLORS[projeto.status] }}
      >
        {STATUS_LABELS[projeto.status]}
      </Badge>
      <Badge 
        variant="outline"
        style={{ borderColor: PRIORIDADE_COLORS[projeto.prioridade] }}
      >
        {PRIORIDADE_LABELS[projeto.prioridade]}
      </Badge>
    </>
  );

  return (
    <MainLayout 
      title={projeto.titulo}
      subtitle={`${projeto.codigo} · ${CATEGORIA_LABELS[projeto.categoria]}`}
      backTo="/marketing"
      backLabel="Marketing"
      badge={headerBadges}
      actions={
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="h-4 w-4 mr-2" />
          Editar
        </Button>
      }
    >
      {/* Edit Form Dialog */}
      <ProjetoEditForm 
        open={editOpen} 
        onOpenChange={setEditOpen} 
        projeto={projeto} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Descrição e Briefing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Briefing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {projeto.descricao && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                  <p>{projeto.descricao}</p>
                </div>
              )}
              {projeto.briefing_texto && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Detalhes do Briefing</p>
                  <p className="whitespace-pre-wrap">{projeto.briefing_texto}</p>
                </div>
              )}
              {!projeto.descricao && !projeto.briefing_texto && (
                <p className="text-muted-foreground">Nenhum briefing cadastrado.</p>
              )}
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="tarefas">
            <TabsList>
              <TabsTrigger value="tarefas" className="gap-2">
                <CheckSquare className="h-4 w-4" />
                Tarefas
              </TabsTrigger>
              <TabsTrigger value="comentarios" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Comentários
              </TabsTrigger>
              <TabsTrigger value="historico" className="gap-2">
                <History className="h-4 w-4" />
                Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tarefas" className="mt-4">
              <ProjetoTarefas projetoId={projeto.id} />
            </TabsContent>

            <TabsContent value="comentarios" className="mt-4">
              <ProjetoComentarios projetoId={projeto.id} />
            </TabsContent>

            <TabsContent value="historico" className="mt-4">
              <ProjetoTimeline projetoId={projeto.id} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {projeto.cliente && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{projeto.cliente.full_name}</p>
                  </div>
                </div>
              )}

              {projeto.supervisor && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Supervisor</p>
                    <p className="font-medium">{projeto.supervisor.full_name}</p>
                  </div>
                </div>
              )}

              {projeto.empreendimento && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Empreendimento</p>
                    <p className="font-medium">{projeto.empreendimento.nome}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Datas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Solicitação</p>
                  <p className="font-medium">
                    {format(new Date(projeto.data_solicitacao), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              </div>

              {projeto.data_inicio && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Início</p>
                    <p className="font-medium">
                      {format(new Date(projeto.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}

              {projeto.data_previsao && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Previsão</p>
                    <p className="font-medium">
                      {format(new Date(projeto.data_previsao), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}

              {projeto.data_entrega && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Entregue em</p>
                    <p className="font-medium text-green-600">
                      {format(new Date(projeto.data_entrega), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
