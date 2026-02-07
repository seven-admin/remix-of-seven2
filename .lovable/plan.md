
# Plano: Novos Webhooks, Melhorias Equipe Marketing e Renomeacao de Tickets

## Resumo

Este plano abrange 4 frentes de trabalho:
1. **Novos eventos de webhook** (3 novos disparos)
2. **Renomeacao de "tickets" para "atividades de producao"** nos eventos de webhook
3. **Detalhamento de atividades nos cards da equipe** (`/marketing/equipe`)
4. **Auditoria dos contadores "Tempo Medio" e "No Prazo"**

---

## 1. Novos Eventos de Webhook

### 1.1 `atividade_criada_por_superadmin`
Disparado quando um super_admin cria atividades para um ou mais usuarios.

**Onde integrar:** `useCreateAtividade` e `useCreateAtividadesParaGestores` em `src/hooks/useAtividades.ts`

**Logica:**
- Apos o insert com sucesso, verificar se o usuario logado e super_admin (consultar `user_roles` com `role = 'super_admin'`)
- Se sim, chamar o edge function `webhook-dispatcher` com:
  - `evento: 'atividade_criada_por_superadmin'`
  - `dados`: titulo da atividade, lista de gestores (IDs + nomes), data de inicio/fim, nome do super admin que criou

### 1.2 `meta_comercial_criada`
Disparado quando uma nova meta comercial e criada ou atualizada.

**Onde integrar:** `useCreateMeta` em `src/hooks/useMetasComerciais.ts`

**Logica:**
- Apos o upsert com sucesso, chamar o edge function `webhook-dispatcher` com:
  - `evento: 'meta_comercial_criada'`
  - `dados`: competencia, empreendimento_id, valores da meta (meta_valor, meta_unidades, etc.)

### 1.3 `atividade_comentada`
Disparado quando ha um novo comentario em:
- Atividades de producao (marketing/antigos tickets) - via `useComentariosTicket` em `src/hooks/useTickets.ts`
- Atividades do forecast/geral - via `useAtividadeComentarios` em `src/hooks/useAtividadeComentarios.ts`

**Logica para atividades de producao (marketing):**
- Apos o insert do comentario com sucesso, buscar os responsaveis da atividade via `projeto_responsaveis`
- Chamar `webhook-dispatcher` com:
  - `evento: 'atividade_comentada'`
  - `dados`: ID e titulo da atividade, texto do comentario, nome do autor, lista de responsaveis (ID + nome de cada um), tipo = 'marketing'

**Logica para atividades do forecast:**
- Apos o insert do comentario com sucesso, buscar o `gestor_id` da atividade
- Chamar `webhook-dispatcher` com:
  - `evento: 'atividade_comentada'`
  - `dados`: ID e titulo da atividade, texto do comentario, nome do autor, gestor responsavel (ID + nome), tipo = 'forecast'

---

## 2. Renomeacao de Eventos de Webhook (Tickets -> Atividades de Producao)

No array `WEBHOOK_EVENTS` em `src/hooks/useWebhooks.ts`, renomear os labels:
- `'Ticket - Aguardando Analise'` -> `'Atividade de Producao - Aguardando Analise'`
- `'Ticket - Em Producao'` -> `'Atividade de Producao - Em Producao'`
- `'Ticket - Revisao'` -> `'Atividade de Producao - Revisao'`
- `'Ticket - Aprovacao Cliente'` -> `'Atividade de Producao - Aprovacao Cliente'`
- `'Ticket - Ajuste'` -> `'Atividade de Producao - Ajuste'`
- `'Ticket - Concluido'` -> `'Atividade de Producao - Concluido'`

Os `value` dos eventos permanecem inalterados para manter compatibilidade com webhooks ja configurados.

Tambem renomear o texto `"{membro.totalTickets} tickets atribuidos"` em `MembroEquipeCard.tsx` para `"atividades atribuidas"`.

---

## 3. Detalhamento de Atividades nos Cards da Equipe (`/marketing/equipe`)

### Problema atual
Os cards de `MembroEquipeCard` mostram contadores (Em Producao, Pendentes, Concluidos), mas nao e possivel ver quais sao as atividades de cada contador.

### Solucao
Adicionar um **dialog/popover expandido** que aparece ao clicar no card do membro, mostrando as atividades agrupadas por status.

**Mudancas necessarias:**

**`useEquipeMarketing.ts`:**
- Incluir os dados dos tickets de cada membro na interface `MembroEquipe` (atualmente ja calcula os contadores mas descarta os tickets individuais)
- Adicionar um campo `tickets: TicketResumo[]` com `{ id, codigo, titulo, status, data_previsao, categoria }`

**`MembroEquipeCard.tsx`:**
- Tornar o card clicavel (ou os contadores individuais)
- Ao clicar, abrir um Dialog com 3 abas ou secoes:
  - **Em Producao**: lista das atividades com status `em_producao`
  - **Pendentes**: lista das atividades com status `briefing`, `triagem`, `revisao`, `aprovacao_cliente`
  - **Concluidos**: lista das atividades concluidas no periodo
- Cada item mostra: codigo, titulo, categoria, data de previsao
- Link para abrir a atividade em `/marketing/:id`

---

## 4. Auditoria dos Contadores "Tempo Medio" e "No Prazo"

### Analise do codigo atual

**Tempo Medio** (`tempoMedio`):
- Calcula a diferenca em dias entre `data_solicitacao` e `data_entrega` para os tickets concluidos no periodo selecionado
- **Resultado**: numero medio de dias que a equipe levou para entregar uma atividade de producao desde a solicitacao
- **Avaliacao**: A logica esta **correta** e bem implementada. Pega apenas tickets com ambas as datas preenchidas e calcula a media.

**No Prazo** (`taxaNoPrazo`):
- Dos tickets concluidos no periodo, filtra os que possuem `data_previsao` definida
- Compara se `data_entrega <= data_previsao` (entregue ate ou antes do prazo)
- Calcula a porcentagem de entregas no prazo
- **Avaliacao**: A logica esta **correta**. Usa apenas tickets que tenham data de previsao para evitar distorcao, e a comparacao de datas e adequada.

**Observacao importante sobre a fonte de dados:**
O hook agrupa tickets pelo `supervisor_id` do `projetos_marketing`. Isso significa que os contadores refletem atividades onde o membro e o **supervisor** designado, nao necessariamente onde ele e um dos multiplos responsaveis (via `projeto_responsaveis`). Futuramente, pode ser util considerar tambem a tabela `projeto_responsaveis` para uma visao mais completa da carga de trabalho.

---

## Detalhes Tecnicos

### Arquivos a serem modificados

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useWebhooks.ts` | Adicionar 3 novos eventos, renomear labels dos tickets |
| `src/hooks/useAtividades.ts` | Adicionar disparo de webhook em `useCreateAtividade` e `useCreateAtividadesParaGestores` |
| `src/hooks/useMetasComerciais.ts` | Adicionar disparo de webhook em `useCreateMeta` |
| `src/hooks/useTickets.ts` | Adicionar disparo de webhook em `useComentariosTicket` com busca de responsaveis |
| `src/hooks/useAtividadeComentarios.ts` | Adicionar disparo de webhook em `createComentario` com dados do gestor |
| `src/hooks/useEquipeMarketing.ts` | Expor lista de tickets por membro na interface `MembroEquipe` |
| `src/components/marketing/MembroEquipeCard.tsx` | Adicionar Dialog com detalhes das atividades, renomear "tickets" |
| `supabase/config.toml` | Adicionar `[functions.webhook-dispatcher]` com `verify_jwt = false` |

### Helper para disparo de webhook (reutilizavel)
Criar uma funcao utilitaria em `src/lib/webhookUtils.ts`:

```text
dispararWebhook(evento: string, dados: Record<string, unknown>): Promise<void>
```

Essa funcao encapsula a chamada ao edge function `webhook-dispatcher` usando `supabase.functions.invoke()`, com tratamento de erro silencioso (log no console, sem impactar UX).

### Estrutura do payload dos novos eventos

**atividade_criada_por_superadmin:**
```text
{
  evento: "atividade_criada_por_superadmin",
  dados: {
    titulo: "Visita ao empreendimento X",
    criado_por: { id: "uuid", nome: "Admin Fulano" },
    gestores: [{ id: "uuid", nome: "Gestor 1" }, ...],
    data_inicio: "2026-02-07",
    data_fim: "2026-02-10",
    tipo: "visita",
    empreendimento: "Nome do Empreendimento"
  }
}
```

**meta_comercial_criada:**
```text
{
  evento: "meta_comercial_criada",
  dados: {
    competencia: "2026-02-01",
    empreendimento_id: "uuid" | null,
    meta_valor: 500000,
    meta_unidades: 10,
    meta_visitas: 50,
    meta_atendimentos: 100
  }
}
```

**atividade_comentada:**
```text
{
  evento: "atividade_comentada",
  dados: {
    tipo: "marketing" | "forecast",
    atividade_id: "uuid",
    atividade_titulo: "Criacao banner campanha",
    comentario: "Texto do comentario",
    autor: { id: "uuid", nome: "Fulano" },
    responsaveis: [{ id: "uuid", nome: "Designer 1" }, ...]
  }
}
```

### Sequencia de implementacao
1. Criar `src/lib/webhookUtils.ts` (helper)
2. Atualizar `supabase/config.toml` (adicionar webhook-dispatcher)
3. Atualizar `src/hooks/useWebhooks.ts` (novos eventos + renomeacao)
4. Integrar disparos em `useAtividades.ts`, `useMetasComerciais.ts`, `useTickets.ts`, `useAtividadeComentarios.ts`
5. Atualizar `useEquipeMarketing.ts` (expor tickets por membro)
6. Atualizar `MembroEquipeCard.tsx` (Dialog com atividades + renomeacao)
