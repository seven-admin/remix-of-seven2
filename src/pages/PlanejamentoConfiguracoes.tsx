import { PageHeader } from '@/components/layout/PageHeader';
import { PlanejamentoFasesEditor } from '@/components/planejamento/PlanejamentoFasesEditor';
import { PlanejamentoStatusEditor } from '@/components/planejamento/PlanejamentoStatusEditor';

export default function PlanejamentoConfiguracoes() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações do Planejamento"
        subtitle="Gerencie as fases e status disponíveis para as tarefas de planejamento"
      />

      <div className="grid gap-6 lg:grid-cols-2 px-4 md:px-6">
        <PlanejamentoFasesEditor />
        <PlanejamentoStatusEditor />
      </div>
    </div>
  );
}
