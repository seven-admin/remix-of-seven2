import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ClipboardList, CalendarDays, BarChart3, Download, Upload } from 'lucide-react';
import { useEmpreendimentosSelect } from '@/hooks/useEmpreendimentosSelect';
import { usePermissions } from '@/hooks/usePermissions';
import { PlanejamentoPlanilha } from '@/components/planejamento/PlanejamentoPlanilha';
import { PlanejamentoDashboard } from '@/components/planejamento/PlanejamentoDashboard';
import { PlanejamentoTimeline } from '@/components/planejamento/PlanejamentoTimeline';
import { ImportarPlanejamentoDialog } from '@/components/planejamento/ImportarPlanejamentoDialog';

export default function Planejamento() {
  const [empreendimentoId, setEmpreendimentoId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('planilha');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const { data: empreendimentos } = useEmpreendimentosSelect();
  const { isAdmin } = usePermissions();
  const canEdit = isAdmin();

  return (
    <MainLayout
      title="Planejamento"
      subtitle="Gerencie o cronograma de tarefas por empreendimento"
    >
      <div className="space-y-4">
        {/* Seletor de Empreendimento */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[250px]">
                <Select value={empreendimentoId} onValueChange={setEmpreendimentoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um empreendimento" />
                  </SelectTrigger>
                  <SelectContent>
                    {empreendimentos?.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {canEdit && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={!empreendimentoId}
                    onClick={() => setImportDialogOpen(true)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Importar
                  </Button>
                  <Button variant="outline" size="sm" disabled={!empreendimentoId}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo principal */}
        {empreendimentoId ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="planilha" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                Planilha
              </TabsTrigger>
              <TabsTrigger value="timeline" className="gap-2">
                <CalendarDays className="h-4 w-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
            </TabsList>

            <TabsContent value="planilha" className="mt-4">
              <PlanejamentoPlanilha empreendimentoId={empreendimentoId} readOnly={!canEdit} />
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <PlanejamentoTimeline empreendimentoId={empreendimentoId} readOnly={!canEdit} />
            </TabsContent>

            <TabsContent value="dashboard" className="mt-4">
              <PlanejamentoDashboard empreendimentoId={empreendimentoId} />
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Selecione um empreendimento para visualizar o planejamento</p>
            </CardContent>
          </Card>
        )}

        {empreendimentoId && (
          <ImportarPlanejamentoDialog
            open={importDialogOpen}
            onOpenChange={setImportDialogOpen}
            empreendimentoId={empreendimentoId}
          />
        )}
      </div>
    </MainLayout>
  );
}
