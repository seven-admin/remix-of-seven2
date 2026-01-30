

# Plano: Módulo de Planejamento com Interface Estilo Planilha

## Visão Geral

Criar o módulo de Planejamento usando uma **tabela editável inline estilo Excel/GanttPRO** para entrada de dados rápida e intuitiva. O usuário preenche diretamente na tabela, com navegação via Tab/Enter, sem necessidade de abrir modais para cada tarefa.

---

## Conceito da Interface

### Referências
- Microsoft Project (lista de tarefas)
- GanttPRO (tabela inline)
- Excel/Google Sheets (edição rápida)

### Layout Principal

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Planejamento                                              [Filtros ▾] [+ Importar] [Exportar]      │
├────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Dashboard Cards: Total | Em Desenvolvimento | Aguardando | Finalizados | Atrasadas]               │
├────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Empreendimento: [Residencial Monte Verde ▾]                                                        │
├────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Tabs: [📋 Lista/Planilha] [📅 Timeline] [📊 Dashboard]                                             │
├────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                    │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ PLANILHA EDITÁVEL (TAB PRINCIPAL)                                                            │  │
│  ├────────┬─────────────────────────┬──────────────┬──────────────┬──────────┬──────────┬───────┤  │
│  │ Fase   │ Item/Tarefa             │ Responsável  │ Status       │ Início   │ Fim      │ ⋮     │  │
│  ├────────┼─────────────────────────┼──────────────┼──────────────┼──────────┼──────────┼───────┤  │
│  │▼ Fase 01 - Atendimento                                                                       │  │
│  ├────────┼─────────────────────────┼──────────────┼──────────────┼──────────┼──────────┼───────┤  │
│  │        │ [Reunião de kickoff   ] │ [João ▾]     │ [●Finaliz.▾] │ 10/01/26 │ 10/01/26 │ 🗑️    │  │
│  │        │ [Levantamento de req. ] │ [Maria ▾]    │ [●Em Des.▾]  │ 11/01/26 │ 20/01/26 │ 🗑️    │  │
│  │        │ [+]                     │              │              │          │          │       │  │
│  ├────────┼─────────────────────────┼──────────────┼──────────────┼──────────┼──────────┼───────┤  │
│  │▼ Fase 02 - Planejamento                                                                      │  │
│  ├────────┼─────────────────────────┼──────────────┼──────────────┼──────────┼──────────┼───────┤  │
│  │        │ [Cronograma detalhado ] │ [Carlos ▾]   │ [●Aguard.▾]  │ 21/01/26 │ 30/01/26 │ 🗑️    │  │
│  │        │ [Orçamento preliminar ] │ [Ana ▾]      │ [●Em Des.▾]  │ 25/01/26 │ 05/02/26 │ 🗑️    │  │
│  │        │ [+]                     │              │              │          │          │       │  │
│  └────────┴─────────────────────────┴──────────────┴──────────────┴──────────┴──────────┴───────┘  │
│                                                                                                    │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📌 SEM DATA (3 itens) - Clique para expandir                                                 │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Comportamentos da Planilha

### Navegação (Estilo Excel)
| Tecla | Ação |
|-------|------|
| Tab | Próxima célula |
| Shift+Tab | Célula anterior |
| Enter | Salva e vai para próxima linha |
| Escape | Cancela edição |
| Click | Entra em modo edição |

### Edição Inline
- **Item/Tarefa**: Input de texto direto
- **Responsável**: Select/Combobox com busca
- **Status**: Select com cores (badge colorido)
- **Datas**: DatePicker inline ou digitação (DD/MM/AAAA)
- **Observações**: Expande ao clicar em ícone (popover/modal)

### Recursos Especiais
- **Nova linha**: Linha vazia no final de cada fase com [+]
- **Duplicar**: Botão no menu de ações (⋮)
- **Drag & Drop**: Reordenar tarefas dentro da fase
- **Collapse/Expand**: Colapsar fases

---

## Fase 1: Modelo de Dados (Banco de Dados)

### 1.1 Tabela `planejamento_fases`

```sql
CREATE TABLE planejamento_fases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cor TEXT DEFAULT '#3B82F6',
  ordem INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Dados iniciais
INSERT INTO planejamento_fases (nome, cor, ordem) VALUES
  ('Fase 01 - Atendimento', '#22C55E', 1),
  ('Fase 02 - Planejamento', '#3B82F6', 2),
  ('Fase 03 - Produção', '#F59E0B', 3),
  ('Fase 04 - Lançamento', '#8B5CF6', 4),
  ('Fase 05 - Suporte', '#6B7280', 5);
```

### 1.2 Tabela `planejamento_status`

```sql
CREATE TABLE planejamento_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cor TEXT DEFAULT '#6B7280',
  ordem INTEGER DEFAULT 0,
  is_final BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Dados iniciais
INSERT INTO planejamento_status (nome, cor, ordem, is_final) VALUES
  ('Em Desenvolvimento', '#3B82F6', 1, false),
  ('Aguarda Apresentação', '#F59E0B', 2, false),
  ('Finalizado', '#22C55E', 3, true);
```

### 1.3 Tabela `planejamento_itens`

```sql
CREATE TABLE planejamento_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendimento_id UUID NOT NULL REFERENCES empreendimentos(id) ON DELETE CASCADE,
  fase_id UUID NOT NULL REFERENCES planejamento_fases(id),
  status_id UUID NOT NULL REFERENCES planejamento_status(id),
  item TEXT NOT NULL,
  responsavel_tecnico_id UUID REFERENCES profiles(id),
  data_inicio DATE,
  data_fim DATE,
  obs TEXT,
  ordem INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT check_datas CHECK (data_fim IS NULL OR data_inicio IS NULL OR data_fim >= data_inicio)
);

-- Índices
CREATE INDEX idx_planejamento_itens_empreendimento ON planejamento_itens(empreendimento_id);
CREATE INDEX idx_planejamento_itens_fase ON planejamento_itens(fase_id);
CREATE INDEX idx_planejamento_itens_responsavel ON planejamento_itens(responsavel_tecnico_id);
```

### 1.4 Tabela `planejamento_historico` (Auditoria)

```sql
CREATE TABLE planejamento_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES planejamento_itens(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  campo_alterado TEXT NOT NULL,
  valor_anterior TEXT,
  valor_novo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger automático
CREATE OR REPLACE FUNCTION log_planejamento_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status_id IS DISTINCT FROM NEW.status_id THEN
    INSERT INTO planejamento_historico (item_id, user_id, campo_alterado, valor_anterior, valor_novo)
    VALUES (NEW.id, auth.uid(), 'status', OLD.status_id::text, NEW.status_id::text);
  END IF;
  IF OLD.data_inicio IS DISTINCT FROM NEW.data_inicio THEN
    INSERT INTO planejamento_historico (item_id, user_id, campo_alterado, valor_anterior, valor_novo)
    VALUES (NEW.id, auth.uid(), 'data_inicio', OLD.data_inicio::text, NEW.data_inicio::text);
  END IF;
  IF OLD.data_fim IS DISTINCT FROM NEW.data_fim THEN
    INSERT INTO planejamento_historico (item_id, user_id, campo_alterado, valor_anterior, valor_novo)
    VALUES (NEW.id, auth.uid(), 'data_fim', OLD.data_fim::text, NEW.data_fim::text);
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER planejamento_audit_trigger
  BEFORE UPDATE ON planejamento_itens
  FOR EACH ROW EXECUTE FUNCTION log_planejamento_changes();
```

### 1.5 RLS (Políticas de Segurança)

```sql
ALTER TABLE planejamento_fases ENABLE ROW LEVEL SECURITY;
ALTER TABLE planejamento_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE planejamento_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE planejamento_historico ENABLE ROW LEVEL SECURITY;

-- Fases e Status: leitura pública
CREATE POLICY "fases_select" ON planejamento_fases FOR SELECT USING (true);
CREATE POLICY "status_select" ON planejamento_status FOR SELECT USING (true);

-- Itens: Seven vê tudo, Incorporador vê seus empreendimentos
CREATE POLICY "itens_all_seven" ON planejamento_itens FOR ALL 
  USING (is_seven_team(auth.uid()));

CREATE POLICY "itens_select_incorporador" ON planejamento_itens FOR SELECT 
  USING (
    empreendimento_id IN (
      SELECT empreendimento_id FROM user_empreendimentos WHERE user_id = auth.uid()
    )
  );
```

---

## Fase 2: Estrutura de Arquivos

```text
src/
├── pages/
│   ├── Planejamento.tsx                       # Página principal
│   ├── PlanejamentoConfiguracoes.tsx          # Config Fases/Status
│   └── portal-incorporador/
│       └── PortalIncorporadorPlanejamento.tsx # Versão read-only
│
├── components/
│   └── planejamento/
│       ├── PlanejamentoPlanilha.tsx           # ⭐ Tabela editável principal
│       ├── PlanejamentoTimeline.tsx           # View Gantt (secundária)
│       ├── PlanejamentoDashboard.tsx          # Cards de métricas
│       ├── PlanejamentoFilters.tsx            # Filtros
│       ├── PlanejamentoFaseRow.tsx            # Linha de fase (colapsável)
│       ├── PlanejamentoItemRow.tsx            # Linha de item (editável)
│       ├── PlanejamentoObsPopover.tsx         # Popover para observações
│       ├── PlanejamentoFasesEditor.tsx        # CRUD de fases
│       ├── PlanejamentoStatusEditor.tsx       # CRUD de status
│       ├── ImportarPlanejamentoDialog.tsx     # Import XLSX
│       └── NaoAgendadosList.tsx               # Itens sem data
│
├── hooks/
│   ├── usePlanejamentoItens.ts                # CRUD itens com otimistic update
│   ├── usePlanejamentoFases.ts                # CRUD fases
│   ├── usePlanejamentoStatus.ts               # CRUD status
│   └── usePlanejamentoHistorico.ts            # Consulta histórico
│
└── types/
    └── planejamento.types.ts                  # Tipos TypeScript
```

---

## Fase 3: Componente Principal - Planilha Editável

### 3.1 Estrutura do PlanejamentoPlanilha.tsx

```tsx
// Baseado no padrão CondicoesPagamentoInlineEditor.tsx
export function PlanejamentoPlanilha({ empreendimentoId }: Props) {
  const { itens, isLoading, createItem, updateItem, deleteItem } = usePlanejamentoItens(empreendimentoId);
  const { fases } = usePlanejamentoFases();
  const { status } = usePlanejamentoStatus();
  const { funcionarios } = useFuncionariosSeven();

  // Estado de edição inline
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<any>(null);
  const [collapsedFases, setCollapsedFases] = useState<Set<string>>(new Set());

  // Agrupar itens por fase
  const itensByFase = useMemo(() => groupBy(itens, 'fase_id'), [itens]);

  // Handlers de edição
  const handleCellClick = (id: string, field: string, value: any) => {
    setEditingCell({ id, field });
    setEditValue(value);
  };

  const handleCellSave = () => {
    if (editingCell) {
      updateItem.mutate({ id: editingCell.id, [editingCell.field]: editValue });
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') handleCellSave();
    if (e.key === 'Escape') setEditingCell(null);
    if (e.key === 'Tab') { /* navegar para próxima célula */ }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]">Item/Tarefa</TableHead>
          <TableHead className="w-[150px]">Responsável</TableHead>
          <TableHead className="w-[140px]">Status</TableHead>
          <TableHead className="w-[110px]">Início</TableHead>
          <TableHead className="w-[110px]">Fim</TableHead>
          <TableHead className="w-[40px]">Obs</TableHead>
          <TableHead className="w-[40px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fases?.map(fase => (
          <>
            {/* Linha da Fase (colapsável) */}
            <FaseHeaderRow fase={fase} onToggle={toggleFase} isCollapsed={...} />
            
            {/* Itens da fase */}
            {!collapsedFases.has(fase.id) && itensByFase[fase.id]?.map(item => (
              <ItemEditableRow 
                key={item.id}
                item={item}
                editingCell={editingCell}
                onCellClick={handleCellClick}
                onSave={handleCellSave}
                funcionarios={funcionarios}
                statusOptions={status}
              />
            ))}
            
            {/* Linha para adicionar novo item */}
            {!collapsedFases.has(fase.id) && (
              <NewItemRow faseId={fase.id} onCreate={createItem} />
            )}
          </>
        ))}
      </TableBody>
    </Table>
  );
}
```

### 3.2 Célula Editável

```tsx
// Componente reutilizável para célula editável
function EditableCell({ 
  value, 
  isEditing, 
  onEdit, 
  onSave,
  type = 'text' 
}: EditableCellProps) {
  if (isEditing) {
    switch (type) {
      case 'text':
        return <Input value={value} onChange={...} onBlur={onSave} autoFocus />;
      case 'select':
        return <Select value={value} onValueChange={v => { onSave(v); }} />;
      case 'date':
        return <DatePicker value={value} onChange={v => { onSave(v); }} />;
    }
  }
  
  return (
    <div onClick={onEdit} className="cursor-pointer hover:bg-muted/50 p-2 rounded">
      {formatValue(value, type)}
    </div>
  );
}
```

---

## Fase 4: View Timeline (Secundária)

A timeline será uma visualização complementar, acessada via tab:

```text
┌────────────────────────────────────────────────────────────────────────────┐
│              │ Jan 06 │ Jan 13 │ Jan 20 │ Jan 27 │ Fev 03 │ Fev 10 │       │
├──────────────┼────────────────────────────────────────────────────────────┤
│ Fase 01      │                                                            │
│ ├─ Kickoff   │ [████] Finalizado                                          │
│ └─ Levant.   │     [██████████] Em Desenvolvimento                        │
├──────────────┼────────────────────────────────────────────────────────────┤
│ Fase 02      │                                                            │
│ ├─ Cronogram │         [████████] Aguarda Apresentação                    │
│ └─ Orçamento │              [██████████] Em Desenvolvimento               │
└──────────────┴────────────────────────────────────────────────────────────┘
```

Click na barra abre popover com detalhes. Drag das extremidades ajusta datas.

---

## Fase 5: Dashboard de Métricas

### Cards Principais

| Card | Métrica |
|------|---------|
| Total de Tarefas | Contagem total |
| Em Desenvolvimento | Status = Em Desenvolvimento |
| Aguardando | Status = Aguarda Apresentação |
| Finalizadas | Status = Finalizado |
| Atrasadas | data_fim < hoje AND status != Finalizado |
| Sem Responsável | responsavel_tecnico_id IS NULL |

### Gráfico de Progresso por Fase

Barra horizontal mostrando % concluído de cada fase.

---

## Fase 6: Import/Export XLSX

### Template de Importação

| Fase | Item | Responsável (email) | Status | Data Início | Data Fim | Observações |
|------|------|---------------------|--------|-------------|----------|-------------|
| Fase 01 - Atendimento | Reunião kickoff | joao@seven.com | Finalizado | 10/01/2026 | 10/01/2026 | ... |

### Fluxo
1. Download template
2. Upload arquivo preenchido
3. Validação e mapeamento automático
4. Preview com erros
5. Confirmação e inserção

---

## Fase 7: Portal do Incorporador

### Acesso Read-Only
- Mesma visualização de planilha, porém sem edição
- Cores de status visíveis
- Filtro por empreendimento (apenas os seus)
- Timeline view disponível

### Card no Dashboard

```tsx
<Card onClick={() => navigate('/portal-incorporador/planejamento')}>
  <CalendarClock className="h-8 w-8 text-primary" />
  <h3>Planejamento</h3>
  <p>Acompanhe o cronograma</p>
  <Badge>5 em andamento</Badge>
</Card>
```

---

## Ordem de Implementação

| Etapa | Descrição | Sessões |
|-------|-----------|---------|
| 1 | Migrations (tabelas + RLS + trigger) | 1 |
| 2 | Types + Hooks básicos | 1 |
| 3 | Planilha editável (componente principal) | 2-3 |
| 4 | CRUD completo inline | 1 |
| 5 | Filtros e busca | 1 |
| 6 | Config Fases/Status | 1 |
| 7 | Timeline view | 2 |
| 8 | Dashboard métricas | 1 |
| 9 | Portal Incorporador (read-only) | 1 |
| 10 | Import XLSX | 1-2 |

**Total: 12-14 sessões**

---

## Vantagens da Interface Planilha

1. **Produtividade**: Entrada rápida de múltiplas tarefas
2. **Familiaridade**: Usuários já conhecem Excel/Sheets
3. **Visão geral**: Todas as tarefas visíveis de uma vez
4. **Edição fluida**: Tab/Enter para navegar
5. **Menos cliques**: Sem necessidade de abrir modais

---

## Próximos Passos

Ao aprovar, começaremos pela **Fase 1** criando as migrations do banco de dados.

