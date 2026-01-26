
# Plano: Adicionar Permissões para Diretor de Marketing

## Diagnóstico
A usuária Jéssica (`marketing@sevengroup360.com.br`) está recebendo "Acesso Negado" porque:
- Possui o role `diretor_de_marketing` (ID: `683bdb97-a42e-4d77-a07d-9f81988d731f`)
- Este role não possui nenhuma permissão configurada na tabela `role_permissions`
- Sem permissões, o sistema bloqueia o acesso a todos os módulos

## Solução

Inserir registros na tabela `role_permissions` vinculando o role `diretor_de_marketing` aos módulos apropriados.

## Permissões Propostas

O Diretor de Marketing deverá ter acesso a:

| Módulo | Visualizar | Criar | Editar | Excluir |
|--------|:----------:|:-----:|:------:|:-------:|
| Dashboard Executivo | Sim | - | - | - |
| Projetos de Marketing | Sim | Sim | Sim | Sim |
| Config. Workflow Marketing | Sim | Sim | Sim | Sim |
| Briefings | Sim | Sim | Sim | Sim |
| Calendário de Eventos | Sim | Sim | Sim | Sim |
| Templates de Evento | Sim | Sim | Sim | Sim |
| Empreendimentos | Sim | - | - | - |
| Relatórios | Sim | - | - | - |

## Implementação Técnica

Executar o seguinte SQL via migration:

```sql
INSERT INTO role_permissions (role, module_id, can_view, can_create, can_edit, can_delete, scope)
VALUES
  -- Dashboard Executivo (visualização)
  ('diretor_de_marketing', '319c48ad-6bf8-4f57-b68f-4bcf84040dd9', true, false, false, false, 'global'),
  
  -- Projetos de Marketing (acesso total)
  ('diretor_de_marketing', 'e8d4fe27-a4fe-4033-8b9e-c3795fdb9159', true, true, true, true, 'global'),
  
  -- Config. Workflow Marketing (acesso total)
  ('diretor_de_marketing', '0802a585-fbc7-40a7-94d5-4dbc8eedd386', true, true, true, true, 'global'),
  
  -- Briefings (acesso total)
  ('diretor_de_marketing', '43be8d14-9db0-46a5-9756-f5926757ffd1', true, true, true, true, 'global'),
  
  -- Calendário de Eventos (acesso total)
  ('diretor_de_marketing', 'b042dfe2-b925-442c-b72b-c26276b89fcc', true, true, true, true, 'global'),
  
  -- Templates de Evento (acesso total)
  ('diretor_de_marketing', 'f0d1ec3b-ea5a-45bf-8e5c-08e4462a54a9', true, true, true, true, 'global'),
  
  -- Empreendimentos (somente visualização)
  ('diretor_de_marketing', '0d1019b5-ef9c-4744-ab0b-22877512ae5d', true, false, false, false, 'global'),
  
  -- Relatórios (somente visualização)
  ('diretor_de_marketing', '713a265f-7007-48bc-b324-2d9eae3faeef', true, false, false, false, 'global');
```

## Resultado Esperado

Após a execução:
1. Jéssica poderá fazer login normalmente
2. Será redirecionada para o Dashboard Executivo (primeiro módulo com acesso)
3. Terá acesso completo à área de Marketing (projetos, briefings, eventos)
4. Poderá visualizar empreendimentos e relatórios para contexto

## Arquivo a Modificar

| Arquivo | Ação |
|---------|------|
| Nova migration SQL | Inserir permissões do role |
