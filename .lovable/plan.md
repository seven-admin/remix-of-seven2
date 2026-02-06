
# Plano Completo: 11 Melhorias no Sistema

Dado o volume de mudancas, o plano esta organizado em blocos independentes. Cada bloco pode ser implementado e testado separadamente.

---

## Bloco 1: Novas Metas Comerciais

**Contexto:** A tabela `metas_comerciais` atualmente armazena apenas `meta_valor` e `meta_unidades`. Precisamos adicionar campos para visitas, atendimentos, treinamentos e propostas.

**Banco de Dados:**
- Adicionar colunas na tabela `metas_comerciais`:
  - `meta_visitas` (integer, default 0)
  - `meta_atendimentos` (integer, default 0)
  - `meta_treinamentos` (integer, default 0)
  - `meta_propostas` (integer, default 0)

**Frontend:**
- `src/hooks/useMetasComerciais.ts`: Atualizar interfaces e mutations para incluir os novos campos
- `src/pages/MetasComerciais.tsx`: Adicionar inputs no dialog de criacao/edicao para cada nova meta; adicionar KPI cards no dashboard mostrando realizado vs meta para cada tipo
- Buscar dados reais de atividades (contagem por tipo e periodo) para comparar com as metas

---

## Bloco 2: Correcao dos Kanbans (Cards nao aparecem sem reload)

**Diagnostico:** Os Kanbans do sistema usam `queryClient.invalidateQueries` apos mutations, mas em alguns hooks a invalidacao nao esta refazendo fetch automaticamente. O Marketing Kanban usa `refetchType: 'none'` no onSuccess, e o Kanban de negociacoes nao invalida a query key `negociacoes-kanban` (que e a usada pela pagina).

**Correcoes:**
- `src/hooks/useProjetosMarketing.ts` (moveProjetoKanban): Remover `refetchType: 'none'` do invalidateQueries no onSuccess. Adicionar um pequeno delay (300ms) antes de invalidar para dar tempo do banco confirmar a escrita
- `src/hooks/useTickets.ts` (moveTicketKanban): Garantir que alem de `['tickets']` tambem invalide `['projetos-marketing']`
- `src/hooks/useNegociacoes.ts` (useCreateNegociacao, useMoverNegociacao, useUpdateNegociacao, useDeleteNegociacao): Adicionar invalidacao de `['negociacoes-kanban']` em todos os callbacks onSuccess, pois a pagina Negociacoes.tsx usa `useNegociacoesKanban` mas as mutations so invalidam `['negociacoes']`
- `src/hooks/useAtividades.ts`: Verificar se createAtividade e updateAtividade invalidam corretamente `['atividades']`

**Resumo:** O problema central e que as query keys usadas para buscar dados nao sao as mesmas que sao invalidadas apos mutations.

---

## Bloco 3: Edicao Completa de Propostas (Fichas de Proposta)

**Contexto:** Apos cadastrar uma ficha de proposta, o gestor precisa editar todos os campos (cliente, unidades, condicoes de pagamento, valores).

**Alteracoes:**
- `src/pages/NovaPropostaComercial.tsx`: Adaptar para aceitar um parametro de rota com ID da negociacao (modo edicao). Quando em modo edicao, carregar dados existentes e preencher o formulario. O botao "Salvar" usara `useUpdateNegociacao` em vez de `useCreateNegociacao`
- `src/App.tsx`: Adicionar rota `/negociacoes/editar/:id` apontando para o componente adaptado
- `src/components/negociacoes/NegociacaoCard.tsx`: Alterar botao "Editar" para navegar para a nova rota em vez de abrir o dialog simplificado

---

## Bloco 4: Rastreamento de Tempo de Negociacao

**Banco de Dados:**
- Adicionar colunas na tabela `negociacoes`:
  - `data_primeiro_atendimento` (timestamptz, nullable) - registrado quando a negociacao e criada
  - `data_proposta_gerada` (timestamptz, nullable) - registrado quando a proposta e gerada
  - `data_contrato_gerado` (timestamptz, nullable) - registrado quando o contrato e gerado
  - Obs: `data_fechamento` ja existe na tabela

**Frontend - Detalhe da Negociacao:**
- `src/components/negociacoes/NegociacaoHistoricoTimeline.tsx`: Adicionar uma secao visual com timeline de marcos (Atendimento, Proposta, Contrato, Fechamento) mostrando datas e duracao entre cada etapa

**Frontend - Dashboard Executivo:**
- `src/hooks/useDashboardExecutivo.ts`: Adicionar query para calcular tempo medio de fechamento (media de `data_fechamento - created_at` para negociacoes fechadas no periodo)
- `src/pages/DashboardExecutivo.tsx`: Adicionar KPI card "Tempo Medio de Fechamento"

**Frontend - Relatorios:**
- `src/pages/Relatorios.tsx`: Adicionar secao de metricas de tempo por empreendimento e por periodo

**Hooks de Mutation:**
- `src/hooks/useNegociacoes.ts`: Atualizar `useCreateNegociacao` para preencher `data_primeiro_atendimento`; atualizar `useGerarProposta` para preencher `data_proposta_gerada`; atualizar `useConverterPropostaEmContrato` para preencher `data_contrato_gerado`

---

## Bloco 5: Destaque Visual para Atividades de Superadministradores

**Contexto:** Atividades criadas por superadmins devem ter destaque visual (cor/icone diferente).

**Alteracoes:**
- `src/hooks/useAtividades.ts`: No select das atividades, adicionar join com `criador:profiles!created_by(id, full_name)` (ja existe parcialmente). Adicionar join com `user_roles` para verificar se o criador e super_admin
- Alternativa mais simples: criar uma RPC `is_super_admin_batch(user_ids uuid[])` que retorna quais users sao super_admin, ou verificar no frontend usando o campo `created_by` ja existente
- `src/components/atividades/AtividadeCard.tsx`: Adicionar verificacao se `created_by` corresponde a um super_admin. Se sim, aplicar borda dourada/destaque e icone de escudo (Shield)
- `src/pages/Atividades.tsx` e `src/components/atividades/PendenciasTab.tsx`: Passar informacao de super_admin ids para os cards

---

## Bloco 6: Acesso a Atividades Relacionadas em Cards de Pendencias/Atrasos

**Contexto:** Nos cards de pendencias, KPIs e dashboards, ao clicar no card, o usuario deve ser direcionado para ver as atividades relacionadas.

**Alteracoes:**
- `src/components/dashboard/DashboardIncorporador.tsx`: Cards de pendencias e atrasos - ao clicar, navegar para `/atividades` com filtros pre-aplicados (status=pendente, data_fim antes de hoje)
- `src/components/forecast/AlertasFollowup.tsx` e `src/components/forecast/ProximasAtividades.tsx`: Tornar cards clicaveis, navegando para o detalhe da atividade
- `src/components/dashboard-executivo/AlertsList.tsx`: Ao clicar em alertas de atividades, navegar para a listagem filtrada
- Padrao: usar `navigate('/atividades?status=pendente')` e ler query params na pagina de atividades para aplicar filtros

---

## Bloco 7: Renomear "Tickets de Producao" para "Atividades de Producao"

**Arquivos afetados (textos visiveis ao usuario):**
- `src/pages/Marketing.tsx`: Alterar title de "Tickets de Producao" para "Atividades de Producao" e subtitle
- `src/types/marketing.types.ts`: Alterar comentario no topo do arquivo
- `src/pages/Relatorios.tsx`: Alterar label do tab de "Marketing - Tickets de Producao"
- `src/hooks/useWebhooks.ts`: Alterar comentario "Tickets de Producao"
- `src/components/layout/Sidebar.tsx`: Verificar e alterar labels de menu se houver referencia a "Tickets"
- Toast messages nos hooks (`useProjetosMarketing.ts`, `useTickets.ts`): Trocar "Ticket" por "Atividade de Producao" nas mensagens

**Nota:** Nao alterar nomes de tabelas, colunas ou query keys (apenas textos visiveis).

---

## Bloco 8: Sistema de Alertas para Novas Atividades (Sino com Contador)

**Banco de Dados:**
- Criar tabela `notificacoes`:
  - `id` (uuid, PK)
  - `user_id` (uuid, FK profiles)
  - `tipo` (text) - ex: 'nova_atividade', 'atividade_atribuida'
  - `titulo` (text)
  - `mensagem` (text)
  - `referencia_id` (uuid, nullable) - ID da atividade/entidade
  - `referencia_tipo` (text, nullable) - 'atividade', 'negociacao', etc
  - `lida` (boolean, default false)
  - `created_at` (timestamptz)
- RLS: usuario so ve suas proprias notificacoes

**Frontend:**
- Criar `src/hooks/useNotificacoes.ts`: Hook para buscar notificacoes nao lidas (count + lista)
- Criar `src/components/layout/NotificacaoBell.tsx`: Componente de sino no header com badge de contagem. Ao clicar, dropdown com lista das ultimas notificacoes. Botao "Marcar todas como lidas"
- `src/components/layout/MainLayout.tsx`: Adicionar o componente NotificacaoBell no header
- `src/hooks/useAtividades.ts`: No `onSuccess` do createAtividade, inserir notificacao para o gestor/corretor atribuido

---

## Bloco 9: Referencia de Imagem/URL no Briefing

**Banco de Dados:**
- A coluna `referencia` (text) ja existe na tabela `briefings`. Podemos reutiliza-la para URLs
- Adicionar coluna `referencia_imagem_url` (text, nullable) para upload de imagem

**Frontend:**
- `src/types/briefings.types.ts`: Adicionar `referencia_imagem_url` na interface Briefing e BriefingFormData
- `src/components/briefings/BriefingForm.tsx`: Adicionar campo com duas opcoes:
  - Input de URL (texto livre)
  - Botao de upload de imagem (usando storage bucket existente `projetos-arquivos`)
- `src/components/briefings/BriefingDetalhe.tsx`: Exibir a imagem de referencia e/ou link clicavel
- `src/hooks/useBriefings.ts`: Atualizar mutations para incluir o novo campo

---

## Bloco 10: Multiplos Responsaveis por Atividade de Marketing

**Banco de Dados:**
- Criar tabela `projeto_responsaveis`:
  - `id` (uuid, PK)
  - `projeto_id` (uuid, FK projetos_marketing)
  - `user_id` (uuid, FK profiles)
  - `created_at` (timestamptz)
  - Constraint unique(projeto_id, user_id)
- Manter `supervisor_id` na tabela `projetos_marketing` como "responsavel principal" para compatibilidade

**Frontend:**
- Criar `src/hooks/useProjetoResponsaveis.ts`: CRUD para a tabela de relacionamento
- `src/components/marketing/TicketForm.tsx` e `src/components/marketing/ProjetoEditForm.tsx`: Adicionar seletor de multiplos responsaveis (multi-select de usuarios)
- `src/components/marketing/ProjetoCard.tsx`: Exibir avatares dos responsaveis (ate 3 + "+N")
- `src/pages/MarketingDetalhe.tsx`: Exibir lista completa de responsaveis com opcao de adicionar/remover

---

## Bloco 11: Novo Tipo "Criacao de Campanha" em Atividades de Marketing

**Banco de Dados:**
- Adicionar valor `criacao_campanha` ao enum `categoria_projeto` (ou ao tipo usado pela coluna `categoria` na tabela `projetos_marketing`)
- Verificar tipo atual do enum e adicionar o novo valor via ALTER TYPE

**Frontend:**
- `src/types/marketing.types.ts`: Adicionar `'criacao_campanha'` ao type `CategoriaTicket` e ao `CATEGORIA_LABELS`
- `src/components/marketing/TicketForm.tsx`: O novo tipo aparecera automaticamente no select de categorias
- `src/components/marketing/ProjetoCard.tsx`: Badge de categoria ja funciona de forma generica

---

## Ordem de Implementacao Sugerida

Sugiro implementar na seguinte ordem, agrupando por dependencias:

1. **Bloco 2** - Correcao dos Kanbans (bug critico, impacta uso diario)
2. **Bloco 7** - Renomear Tickets para Atividades de Producao (rapido, sem risco)
3. **Bloco 11** - Novo tipo Criacao de Campanha (rapido, so enum + label)
4. **Bloco 1** - Novas Metas Comerciais (banco + UI)
5. **Bloco 3** - Edicao Completa de Propostas (reutiliza pagina existente)
6. **Bloco 9** - Referencia de Imagem no Briefing (banco + upload)
7. **Bloco 5** - Destaque para atividades de superadmins (UI + logica)
8. **Bloco 6** - Acesso a atividades relacionadas em cards (navegacao)
9. **Bloco 4** - Rastreamento de Tempo de Negociacao (banco + dashboard + relatorios)
10. **Bloco 10** - Multiplos Responsaveis no Marketing (nova tabela + UI complexa)
11. **Bloco 8** - Sistema de Alertas/Notificacoes (nova tabela + componente global)

---

## Resumo de Alteracoes no Banco de Dados

| Tabela | Alteracao |
|--------|-----------|
| `metas_comerciais` | +4 colunas (meta_visitas, meta_atendimentos, meta_treinamentos, meta_propostas) |
| `negociacoes` | +3 colunas (data_primeiro_atendimento, data_proposta_gerada, data_contrato_gerado) |
| `briefings` | +1 coluna (referencia_imagem_url) |
| `notificacoes` | Nova tabela |
| `projeto_responsaveis` | Nova tabela |
| enum `categoria_projeto` | +1 valor (criacao_campanha) |

## Resumo de Arquivos Modificados

Aproximadamente 25-30 arquivos serao alterados, distribuidos entre hooks, paginas e componentes.
