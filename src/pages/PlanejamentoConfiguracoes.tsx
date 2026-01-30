import { MainLayout } from '@/components/layout/MainLayout';
import { PlanejamentoFasesEditor } from '@/components/planejamento/PlanejamentoFasesEditor';
import { PlanejamentoStatusEditor } from '@/components/planejamento/PlanejamentoStatusEditor';

export default function PlanejamentoConfiguracoes() {
  return (
    <MainLayout
      title="Configurações do Planejamento"
      subtitle="Gerencie as fases e status disponíveis para as tarefas de planejamento"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <PlanejamentoFasesEditor />
        <PlanejamentoStatusEditor />
      </div>
    </MainLayout>
  );
}
