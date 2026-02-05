
# Plano: Exibir Dados do Briefing nos Tickets de Marketing

## Problema Identificado

Os dados do briefing cadastrado (cliente, tema, objetivo, formato da peca, tom de comunicacao, estilo visual, etc.) nao aparecem nos tickets de marketing porque as queries nunca fazem JOIN com a tabela `briefings`.

### Fluxo Atual (Quebrado)

```text
TicketForm cria briefing na tabela "briefings" (com dados ricos)
       |
Vincula ao ticket via briefing_id
       |
useProjetosMarketing busca ticket SEM join na tabela briefings
       |
MarketingDetalhe exibe projeto.briefing_texto (que esta NULL)
       |
Resultado: "Nenhum briefing cadastrado" -- dados perdidos
```

### Evidencia no Banco de Dados

| Ticket | briefing_id | briefing_texto |
|--------|-------------|----------------|
| MKT-00026 | 0a271602... | NULL |
| MKT-00021 | 86395fcb... | NULL |
| MKT-00006 | dbcac0ce... | NULL |

Os dados existem na tabela `briefings` (ex: cliente="KRAFT", tema="IMAGEM COMPUTADOR"), mas nunca sao consultados.

## Solucao Proposta

### 1. Adicionar JOIN com briefings nas queries

**Arquivo:** `src/hooks/useProjetosMarketing.ts`

Alterar o SELECT para incluir a tabela `briefings`:

```typescript
.select(`
  *,
  cliente:cliente_id(id, full_name, email),
  supervisor:supervisor_id(id, full_name),
  empreendimento:empreendimento_id(id, nome),
  briefing:briefing_id(id, codigo, cliente, tema, objetivo, formato_peca, composicao, head_titulo, sub_complemento, mensagem_chave, tom_comunicacao, estilo_visual, diretrizes_visuais, referencia, importante, observacoes, status)
`)
```

Fazer isso em duas queries:
- A query de listagem (linha 60-67)
- A query do `useProjeto` individual (linha 106-113)

**Arquivo:** `src/hooks/useTickets.ts`

Mesma alteracao nas duas queries (linha 58-67 e linha 100-108).

### 2. Atualizar o tipo Ticket para incluir briefing

**Arquivo:** `src/types/marketing.types.ts`

Atualizar a interface `Ticket` para incluir o relacionamento:

```typescript
briefing?: {
  id: string;
  codigo: string;
  cliente: string;
  tema: string;
  objetivo: string | null;
  formato_peca: string | null;
  composicao: string | null;
  head_titulo: string | null;
  sub_complemento: string | null;
  mensagem_chave: string | null;
  tom_comunicacao: string | null;
  estilo_visual: string | null;
  diretrizes_visuais: string | null;
  referencia: string | null;
  importante: string | null;
  observacoes: string | null;
  status: string;
} | null;
```

### 3. Exibir dados do briefing na pagina de detalhe

**Arquivo:** `src/pages/MarketingDetalhe.tsx`

Substituir a secao de "Briefing" (linhas 140-161) para exibir os dados ricos do briefing vinculado:

- **Cliente do Briefing** e **Tema**
- **Objetivo**
- **Formato da Peca** e **Composicao**
- **Head/Titulo** e **Sub/Complemento**
- **Mensagem Chave**
- **Tom de Comunicacao** e **Estilo Visual**
- **Diretrizes Visuais**
- **Referencias**
- **Importante** e **Observacoes**

Manter fallback para `projeto.descricao` e `projeto.briefing_texto` caso o ticket nao tenha briefing vinculado.

## Fluxo Corrigido

```text
TicketForm cria briefing na tabela "briefings"
       |
Vincula ao ticket via briefing_id
       |
useProjetosMarketing busca ticket COM join: briefing:briefing_id(...)
       |
MarketingDetalhe exibe projeto.briefing.tema, .objetivo, etc.
       |
Resultado: Dados completos do briefing visiveis no ticket
```

## Resumo de Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/types/marketing.types.ts` | Adicionar tipo `briefing` na interface Ticket |
| `src/hooks/useProjetosMarketing.ts` | Adicionar join com `briefings` nas 2 queries |
| `src/hooks/useTickets.ts` | Adicionar join com `briefings` nas 2 queries |
| `src/pages/MarketingDetalhe.tsx` | Exibir campos do briefing vinculado na secao Briefing |

## Impacto

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Dados do briefing visiveis no ticket | Nao | Sim |
| Campos ricos (tema, objetivo, formato) | Perdidos | Exibidos |
| Tickets sem briefing | Mostra "Nenhum briefing" | Continua mostrando (fallback mantido) |
| Performance | 3 joins | 4 joins (impacto minimo) |
