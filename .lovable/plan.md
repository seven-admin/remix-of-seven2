

# Plano: Listagem de Fichas de Proposta, Gestor Visivel, Log e Teste de Webhooks

## Resumo

Este plano abrange 4 frentes de trabalho:
1. Nova tela de listagem em tabela para Fichas de Proposta (com filtros, busca e CRUD completo)
2. Exibir o Gestor de Produto em todas as visoes (Kanban, lista, ficha)
3. Log de disparos de webhook com historico completo (tabela no banco)
4. Botao de teste de webhook na tela de configuracoes

---

## 1. Tela de Listagem de Fichas de Proposta

### O que sera criado

Uma nova visualizacao em tabela dentro da pagina `/negociacoes`, alternando entre Kanban e Lista via Tabs (semelhante ao padrao usado em Clientes).

### Estrutura da interface

- **Tabs**: "Kanban" | "Lista" (no topo da pagina, substituindo o header fixo)
- **Barra de filtros** (compartilhada entre as duas views):
  - Busca por nome do cliente
  - Filtro por empreendimento
  - Filtro por corretor
  - Filtro por gestor de produto (novo)
  - Filtro por status da proposta
  - Filtro por etapa do funil
- **Tabela com colunas**:
  - Codigo (NEG-XXXXX)
  - Cliente (nome)
  - Empreendimento
  - Gestor de Produto
  - Corretor
  - Unidades (qtd)
  - Valor Proposta
  - Status Proposta (badge colorido)
  - Etapa (badge com cor da etapa)
  - Data Criacao
  - Acoes (menu dropdown: Editar, Historico, Mover, Excluir)
- **Paginacao**: Navegacao entre paginas (20 itens por pagina)
- **Metricas**: Os mesmos cards de metricas ja existentes no topo

### Arquivos envolvidos

| Arquivo | Acao |
|---------|------|
| `src/pages/Negociacoes.tsx` | Adicionar Tabs (Kanban/Lista), estado de view, filtros expandidos |
| `src/pages/negociacoes/NegociacoesTable.tsx` | **Novo** - Componente de tabela |
| `src/pages/negociacoes/NegociacoesToolbar.tsx` | **Novo** - Barra de filtros compartilhada |
| `src/hooks/useNegociacoes.ts` | Adicionar hook `useNegociacoesPaginated` com busca e paginacao, e incluir join do gestor |

### Hook `useNegociacoesPaginated`

Novo hook para listagem paginada:
- Recebe filtros: `search`, `empreendimento_id`, `corretor_id`, `gestor_id`, `status_proposta`, `funil_etapa_id`, `page`, `pageSize`
- Faz select com joins: `cliente`, `empreendimento`, `corretor`, `funil_etapa`, `gestor:profiles!gestor_id(id, full_name)`, `unidades:negociacao_unidades(id)`
- Conta total para paginacao via `.count()` (head: true)
- Retorna `{ negociacoes, total, totalPages }`

---

## 2. Gestor de Produto Visivel em Todas as Visoes

### Situacao atual

- A tabela `negociacoes` ja possui a coluna `gestor_id` (uuid, nullable)
- O type `Negociacao` ja possui `gestor_id` e `gestor?: { id: string; full_name: string }`
- O `NegociacaoCard` (Kanban compacto) ja exibe o gestor quando presente
- Porem os hooks de query (`useNegociacoes`, `useNegociacoesKanban`) **nao fazem join** com profiles para trazer o gestor

### Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useNegociacoes.ts` | Adicionar join `gestor:profiles!gestor_id(id, full_name)` nos selects de `useNegociacoes` e `useNegociacoesKanban` |
| `src/pages/negociacoes/NegociacoesTable.tsx` | Coluna "Gestor de Produto" na tabela |
| `src/components/negociacoes/NegociacaoCard.tsx` | Ja exibe (sem alteracao necessaria) |

Isso garantira que o gestor apareca tanto no Kanban quanto na listagem.

---

## 3. Log de Disparos de Webhook

### Nova tabela no banco

Criar tabela `webhook_logs` para registrar cada disparo:

```text
webhook_logs:
  id          uuid PK default gen_random_uuid()
  webhook_id  uuid FK -> webhooks(id) ON DELETE CASCADE
  evento      text NOT NULL
  url         text NOT NULL
  payload     jsonb
  status_code integer
  response_body text
  tempo_ms    integer       -- tempo de resposta em ms
  sucesso     boolean NOT NULL default false
  erro        text
  created_at  timestamptz default now()
```

RLS: Apenas super_admin pode visualizar (via `is_admin()`).

### Edge Function atualizada

Modificar `supabase/functions/webhook-dispatcher/index.ts` para:
- Medir o tempo de cada disparo (`Date.now()` antes/depois do fetch)
- Inserir um registro em `webhook_logs` com: webhook_id, evento, url, payload, status_code, response_body (truncado em 1000 chars), tempo_ms, sucesso, erro
- Continuar atualizando `ultimo_disparo` e `ultimo_status` na tabela `webhooks` (comportamento existente)

### Interface no frontend

Adicionar uma sub-tab ou secao expansivel na tab "Webhooks" da pagina de Configuracoes:

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useWebhooks.ts` | Adicionar `useWebhookLogs(webhookId?)` - query paginada da tabela `webhook_logs` |
| `src/pages/Configuracoes.tsx` | Adicionar secao "Historico de Disparos" abaixo da tabela de webhooks |

A secao mostrara:
- Tabela com colunas: Data/Hora, Evento, URL (truncada), Status HTTP (badge verde/vermelho), Tempo (ex: 245ms), Payload (botao para expandir)
- Filtro por webhook especifico
- Ordenacao por data (mais recente primeiro)
- Limite de 50 registros mais recentes

---

## 4. Botao de Teste de Webhook

### Comportamento

Na tabela de webhooks (Configuracoes), adicionar um botao "Testar" no menu de acoes de cada webhook. Ao clicar:
1. Dispara um POST para a URL configurada com payload de teste:
```text
{
  evento: "[evento_do_webhook]",
  timestamp: "2026-02-07T...",
  dados: {
    _teste: true,
    mensagem: "Este e um disparo de teste do webhook",
    evento: "[evento_do_webhook]"
  }
}
```
2. Exibe um toast com o resultado (sucesso/falha + status code + tempo de resposta)
3. O resultado tambem sera registrado na tabela `webhook_logs` (pois passa pelo dispatcher)

### Implementacao

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useWebhooks.ts` | Adicionar `useTestarWebhook()` - mutation que chama o `webhook-dispatcher` com flag `_teste: true` |
| `src/pages/Configuracoes.tsx` | Adicionar item "Testar" no DropdownMenu de cada webhook, com loading state |

O teste sera feito chamando `supabase.functions.invoke('webhook-dispatcher')` com o evento do webhook e dados de teste. A edge function ja cuida de buscar webhooks ativos para aquele evento, disparar e registrar.

---

## Detalhes Tecnicos

### Migracao SQL necessaria

Uma unica migracao para criar a tabela `webhook_logs`:

```text
CREATE TABLE public.webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid REFERENCES public.webhooks(id) ON DELETE CASCADE,
  evento text NOT NULL,
  url text NOT NULL,
  payload jsonb,
  status_code integer,
  response_body text,
  tempo_ms integer,
  sucesso boolean NOT NULL DEFAULT false,
  erro text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhook logs"
  ON public.webhook_logs FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE INDEX idx_webhook_logs_webhook_id ON public.webhook_logs(webhook_id);
CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);
```

### Sequencia de implementacao

1. Criar migracao para `webhook_logs`
2. Atualizar edge function `webhook-dispatcher` (registrar logs)
3. Atualizar queries em `useNegociacoes.ts` (join gestor)
4. Criar `NegociacoesTable.tsx` e `NegociacoesToolbar.tsx`
5. Atualizar `Negociacoes.tsx` (tabs Kanban/Lista)
6. Atualizar `useWebhooks.ts` (logs + teste)
7. Atualizar `Configuracoes.tsx` (historico + botao teste)

### Componentes UI reutilizados
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`
- `Badge`, `Button`, `Select`, `Input`, `Tabs`, `Dialog`
- `PaginationControls` (ja existente)
- `DropdownMenu` para acoes

