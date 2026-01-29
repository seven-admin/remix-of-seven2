

# Plano: Atividades com Data de Início e Fim (Sem Hora)

## Objetivo

Simplificar o modelo de atividades para trabalhar apenas com **datas** (dia/mês/ano), removendo o conceito de hora. Isso torna o sistema mais simples e alinhado com o uso real.

---

## Mudança de Paradigma

### Antes (Atual)
```text
data_hora: TIMESTAMP (ex: 2026-01-29T14:30:00)
└── Contém data E hora da atividade
```

### Depois (Proposto)
```text
data_inicio: DATE (ex: 2026-01-29)
data_fim: DATE (ex: 2026-01-30)
└── Apenas datas, sem hora
```

---

## Alterações no Banco de Dados

### Migration SQL

```sql
-- 1. Adicionar novas colunas de data (apenas DATE, sem hora)
ALTER TABLE atividades ADD COLUMN data_inicio DATE;
ALTER TABLE atividades ADD COLUMN data_fim DATE;

-- 2. Migrar dados existentes:
--    data_hora existente vira data_fim (conforme solicitado)
--    data_inicio = data_fim para registros existentes
UPDATE atividades 
SET 
  data_fim = (data_hora AT TIME ZONE 'America/Sao_Paulo')::date,
  data_inicio = (data_hora AT TIME ZONE 'America/Sao_Paulo')::date;

-- 3. Tornar campos NOT NULL após migração
ALTER TABLE atividades ALTER COLUMN data_inicio SET NOT NULL;
ALTER TABLE atividades ALTER COLUMN data_fim SET NOT NULL;

-- 4. Adicionar constraint para garantir início <= fim
ALTER TABLE atividades 
ADD CONSTRAINT chk_atividade_datas CHECK (data_inicio <= data_fim);

-- 5. Remover coluna antiga data_hora
ALTER TABLE atividades DROP COLUMN data_hora;

-- 6. Campo duracao_minutos perde sentido sem hora - tornar nullable ou remover
-- (opcional: manter para compatibilidade)
```

---

## Alterações no Frontend

### 1. Tipos TypeScript (`src/types/atividades.types.ts`)

```typescript
export interface Atividade {
  id: string;
  tipo: AtividadeTipo;
  // ...outros campos...
  
  // REMOVER:
  // data_hora: string;
  // duracao_minutos?: number | null;
  
  // ADICIONAR:
  data_inicio: string;  // formato: 'YYYY-MM-DD'
  data_fim: string;     // formato: 'YYYY-MM-DD'
  
  // Manter campos existentes
  deadline_date?: string | null;
}

export interface AtividadeFormData {
  // REMOVER: data_hora
  // ADICIONAR:
  data_inicio: string;
  data_fim: string;
}

export interface AtividadeFilters {
  // Atualizar campos de filtro de data
  data_inicio?: string;
  data_fim?: string;
}
```

### 2. Formulário (`src/components/atividades/AtividadeForm.tsx`)

Simplificar drasticamente o formulário:

```text
┌────────────────────────────────────────────────────────────────────┐
│ Formulário de Atividade (Novo Layout Simplificado)                 │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─ Data de Início ─────────┐  ┌─ Data de Fim ──────────────────┐ │
│  │ 📅 [29/01/2026]          │  │ 📅 [29/01/2026]                │ │
│  └──────────────────────────┘  └────────────────────────────────┘ │
│                                                                     │
│  ⏱️ Duração: 1 dia                                                 │
│  (calculado automaticamente quando datas são diferentes)          │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

**Mudanças no Form:**
- Remover campo de Hora
- Remover campo duracao_minutos (ou torná-lo calculado)
- Dois campos de data simples (início e fim)
- Atalho "mesmo dia" para preencher fim igual início

### 3. Componentes de Visualização

**AtividadeCard e AtividadeDetalheDialog:**

```typescript
// ANTES:
format(new Date(atividade.data_hora), "dd/MM/yyyy 'às' HH:mm")

// DEPOIS (mesmo dia):
format(parseISO(atividade.data_inicio), "dd/MM/yyyy")

// DEPOIS (dias diferentes):
`${format(parseISO(atividade.data_inicio), "dd/MM")} - ${format(parseISO(atividade.data_fim), "dd/MM/yyyy")}`
```

### 4. Componente AgendaDia

**Impacto maior**: Este componente agrupa atividades por hora.

**Solução**: Remover agrupamento por hora, listar atividades em ordem alfabética ou por ordem de criação.

```typescript
// ANTES: agrupa por hora
const atividadesPorHora = atividades.reduce((acc, ativ) => {
  const hora = format(new Date(ativ.data_hora), 'HH:00');
  // ...
});

// DEPOIS: lista simples ordenada
const atividadesOrdenadas = [...atividades].sort((a, b) => 
  a.titulo.localeCompare(b.titulo)
);
```

### 5. Hook useAtividades

Atualizar queries para usar novos campos:

```typescript
// ANTES:
.gte('data_hora', dataInicio.toISOString())
.lte('data_hora', dataFim.toISOString())

// DEPOIS: buscar atividades que se sobrepõem ao período
.lte('data_inicio', dataFim)  // início <= fim do período
.gte('data_fim', dataInicio)  // fim >= início do período
```

### 6. Calendário (AgendaCalendario e CalendarioCompacto)

Atualizar lógica para considerar intervalo de datas:

```typescript
// ANTES:
const key = format(new Date(ativ.data_hora), 'yyyy-MM-dd');

// DEPOIS: atividade aparece em todos os dias do intervalo
const diasAtividade = eachDayOfInterval({
  start: parseISO(ativ.data_inicio),
  end: parseISO(ativ.data_fim)
});
diasAtividade.forEach(dia => {
  const key = format(dia, 'yyyy-MM-dd');
  // adicionar atividade a cada dia
});
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| **Migration SQL** | Criar colunas date, migrar dados, remover data_hora |
| `src/types/atividades.types.ts` | Substituir data_hora por data_inicio e data_fim |
| `src/components/atividades/AtividadeForm.tsx` | Remover hora, dois campos de data simples |
| `src/hooks/useAtividades.ts` | Atualizar queries e filtros |
| `src/components/atividades/AtividadeCard.tsx` | Exibir intervalo de datas |
| `src/components/atividades/AtividadeDetalheDialog.tsx` | Exibir intervalo de datas |
| `src/components/agenda/AgendaDia.tsx` | Remover agrupamento por hora |
| `src/components/agenda/AgendaCalendario.tsx` | Considerar intervalo de datas |
| `src/components/forecast/CalendarioCompacto.tsx` | Considerar intervalo de datas |
| `src/components/forecast/ProximasAtividades.tsx` | Atualizar exibição |
| `src/components/clientes/ClienteHistoricoAtividadesDialog.tsx` | Atualizar exibição |
| `src/components/portal-incorporador/AtividadesListaPortal.tsx` | Atualizar exibição |
| `src/pages/Atividades.tsx` | Atualizar listagem |

---

## Exemplos de Uso

### Atividade de 1 Dia
```text
Título: "Ligação para João"
Início: 29/01/2026
Fim: 29/01/2026

Exibição: "29/01/2026"
```

### Atividade de Múltiplos Dias
```text
Título: "Evento de Lançamento"
Início: 01/02/2026
Fim: 03/02/2026

Exibição: "01/02 - 03/02/2026"

→ Aparece no calendário em 01/02, 02/02 e 03/02
```

---

## O que Acontece com Campos Relacionados?

| Campo | Decisão |
|-------|---------|
| `duracao_minutos` | **Remover** ou tornar obsoleto (sem hora, não faz sentido) |
| `deadline_date` | **Manter** - prazo continua sendo apenas data (compatível) |
| `data_followup` | **Manter como DATE** - já era data sem hora |

---

## Critérios de Aceite

1. Atividades existentes mantêm funcionamento (data_hora migrada para data_fim)
2. Formulário permite selecionar data início e fim (sem hora)
3. Validação impede fim anterior ao início
4. Calendário exibe atividades nos dias corretos (incluindo múltiplos dias)
5. Listagens exibem data ou intervalo corretamente
6. AgendaDia funciona sem agrupamento por hora
7. Filtros funcionam considerando intervalo de datas

---

## Vantagens da Simplificação

1. **UI mais simples** - Menos campos no formulário
2. **Menos validações** - Não precisa validar hora
3. **Mais flexível** - Atividades podem durar dias
4. **Consistente** - Todos os campos de data usam o mesmo tipo (DATE)
5. **Mais rápido** - Menos processamento de timezone

