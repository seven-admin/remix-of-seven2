
# Plano: Correções no Portal do Corretor e Atividades

## Problema 1: Discrepância no Contador de Empreendimentos

### Análise
- **Dashboard** (`PortalDashboard.tsx`): Conta **todos** os empreendimentos retornados pelo hook (`empreendimentos.length`)
- **Lista** (`PortalEmpreendimentos.tsx`): Filtra apenas os com status `lancamento` ou `obra`

**Dados no banco:**
| Empreendimento | Status | Ativo |
|----------------|--------|-------|
| LIVTY | entregue | ✓ |
| VITHORIA DO SOL | obra | ✓ |
| RESERVA DO LAGO | obra | ✓ |
| BELVEDERE | obra | ✓ |

- Total ativos: **4** (o que o contador mostra)
- Filtrados por status: **3** (o que a lista mostra)

### Solução
Aplicar o mesmo filtro de status no dashboard para que o contador reflita apenas os empreendimentos que o corretor realmente pode acessar/solicitar reservas.

---

## Problema 2: Adicionar Hora às Atividades do Forecast

### Análise Atual
- A tabela `atividades` usa campos `data_inicio` e `data_fim` do tipo **DATE** (apenas data)
- O formulário de atividades não permite informar horário
- As memórias confirmam: "modelo de datas sem rastreamento de horário"

### Solução Proposta
Adicionar campos opcionais de hora ao modelo de atividades:
1. **Banco**: Adicionar colunas `hora_inicio` e `hora_fim` (tipo TIME)
2. **Frontend**: Adicionar inputs de hora no formulário de atividades
3. **Exibição**: Mostrar horário nas listas e detalhes quando informado

---

## Implementação Detalhada

### 1. Correção do Contador (Frontend)

**Arquivo:** `src/pages/PortalDashboard.tsx`

```typescript
// Aplicar o mesmo filtro usado em PortalEmpreendimentos
const empreendimentosDisponiveis = useMemo(() => 
  empreendimentos.filter(e => ['lancamento', 'obra'].includes(e.status))
, [empreendimentos]);

// No card de Empreendimentos
<div className="text-2xl font-bold">{empreendimentosDisponiveis.length}</div>
```

---

### 2. Adicionar Hora às Atividades

#### 2.1 Migração de Banco

```sql
-- Adicionar campos de hora opcionais
ALTER TABLE public.atividades 
ADD COLUMN hora_inicio TIME,
ADD COLUMN hora_fim TIME;

-- Comentários para documentação
COMMENT ON COLUMN public.atividades.hora_inicio IS 'Hora de início da atividade (opcional)';
COMMENT ON COLUMN public.atividades.hora_fim IS 'Hora de fim da atividade (opcional)';
```

#### 2.2 Atualizar Tipos TypeScript

**Arquivo:** `src/types/atividades.types.ts`

```typescript
export interface Atividade {
  // ... campos existentes ...
  hora_inicio?: string | null;  // formato: 'HH:mm:ss' ou 'HH:mm'
  hora_fim?: string | null;     // formato: 'HH:mm:ss' ou 'HH:mm'
}

export interface AtividadeFormData {
  // ... campos existentes ...
  hora_inicio?: string;
  hora_fim?: string;
}
```

#### 2.3 Atualizar Formulário

**Arquivo:** `src/components/atividades/AtividadeForm.tsx`

Adicionar campos de hora ao lado dos campos de data:

```typescript
// Schema
hora_inicio: z.string().optional(),
hora_fim: z.string().optional(),

// UI - após cada campo de data
<Input type="time" placeholder="Hora" {...field} />
```

Layout visual:
```
┌─────────────────────────────────────────┐
│ Data de Início        Data de Fim       │
│ [📅 02/02/2026] [⏰]  [📅 02/02/2026] [⏰]│
│                09:00               10:30│
└─────────────────────────────────────────┘
```

#### 2.4 Atualizar Exibição

**Arquivo:** `src/components/forecast/ProximasAtividades.tsx`

```typescript
// Exibir horário quando disponível
const formatarHora = (hora?: string | null) => 
  hora ? hora.substring(0, 5) : null;

// Na listagem
{atividade.hora_inicio && (
  <span className="text-xs text-muted-foreground">
    às {formatarHora(atividade.hora_inicio)}
    {atividade.hora_fim && ` - ${formatarHora(atividade.hora_fim)}`}
  </span>
)}
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/PortalDashboard.tsx` | Aplicar filtro de status no contador de empreendimentos |
| `supabase/migrations/...` | Adicionar colunas `hora_inicio` e `hora_fim` |
| `src/types/atividades.types.ts` | Adicionar campos de hora às interfaces |
| `src/components/atividades/AtividadeForm.tsx` | Adicionar inputs de hora |
| `src/hooks/useAtividades.ts` | Incluir campos de hora nas operações CRUD |
| `src/components/forecast/ProximasAtividades.tsx` | Exibir horário quando disponível |
| `src/components/forecast/AtividadesPorTipo.tsx` | Exibir horário (se aplicável) |
| `src/components/atividades/AtividadeCard.tsx` | Exibir horário no card |
| `src/components/atividades/AtividadeDetalheDialog.tsx` | Exibir horário nos detalhes |

---

## Comportamento Esperado

### Após Implementação

1. **Contador de Empreendimentos**: Dashboard e lista mostrarão o mesmo número (apenas empreendimentos em lançamento/obra)

2. **Atividades com Hora**:
   - Campos de hora são **opcionais**
   - Usuário pode informar apenas data (comportamento atual mantido)
   - Quando hora é informada, aparece nas listagens e detalhes
   - Formato de exibição: "02/02 às 09:00 - 10:30" ou "02/02 às 09:00"
