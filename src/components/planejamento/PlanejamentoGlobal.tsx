import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, CalendarDays, Users } from 'lucide-react';
import { PlanejamentoGlobalResumo } from './PlanejamentoGlobalResumo';
import { PlanejamentoGlobalTimeline } from './PlanejamentoGlobalTimeline';
import { PlanejamentoGlobalEquipe } from './PlanejamentoGlobalEquipe';
import type { PlanejamentoGlobalFilters } from '@/hooks/usePlanejamentoGlobal';

export function PlanejamentoGlobal() {
  const [activeTab, setActiveTab] = useState('resumo');
  const [filters, setFilters] = useState<PlanejamentoGlobalFilters>({});

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="resumo" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Resumo
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Timeline Global
          </TabsTrigger>
          <TabsTrigger value="equipe" className="gap-2">
            <Users className="h-4 w-4" />
            Carga da Equipe
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="mt-4">
          <PlanejamentoGlobalResumo filters={filters} onFiltersChange={setFilters} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <PlanejamentoGlobalTimeline filters={filters} onFiltersChange={setFilters} />
        </TabsContent>

        <TabsContent value="equipe" className="mt-4">
          <PlanejamentoGlobalEquipe filters={filters} onFiltersChange={setFilters} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
