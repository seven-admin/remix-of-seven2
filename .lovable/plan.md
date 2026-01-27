
# Plano: Corrigir Sistema de Permissões para Roles Dinâmicos

## Problemas Identificados

Após análise detalhada, identifiquei **3 problemas** que causam o "Acesso Negado" ao cadastrar novos usuários:

### 1. Hook `usePermissions` usa coluna legada
O hook busca permissões usando `.eq('role', role as any)` (coluna enum), mas o sistema foi migrado para usar `role_id`. Roles dinâmicos como "Diretor de Marketing" não existem no enum e retornam **0 permissões**.

### 2. Roles dinâmicos sem permissões configuradas
| Role | Permissões Cadastradas |
|------|------------------------|
| admin | 26 |
| super_admin | 37 |
| gestor_produto | 27 |
| corretor | 20 |
| **diretor_de_marketing** | **0** |
| **supervisão_de_criação** | **0** |

### 3. Tabela `role_permissions` com coluna `role` NOT NULL
Ao salvar permissões para roles dinâmicos, a inserção falha silenciosamente porque a coluna `role` (enum legado) é obrigatória mas não tem valor válido para roles novos.

## Solução Proposta

### Parte 1: Alterar Hook usePermissions

Modificar para buscar permissões usando `role_id` ao invés da coluna enum:

```typescript
// Antes (problemático)
const { data: rolePerms } = await supabase
  .from('role_permissions')
  .select('*')
  .eq('role', role as any);

// Depois (correto)
// 1. Primeiro buscar o role_id baseado no nome do role
const { data: roleData } = await supabase
  .from('roles')
  .select('id')
  .eq('name', role)
  .single();

// 2. Depois buscar permissões pelo role_id
const { data: rolePerms } = await supabase
  .from('role_permissions')
  .select('*')
  .eq('role_id', roleData?.id);
```

### Parte 2: Alterar Coluna `role` para Nullable

Executar migração SQL para permitir que roles dinâmicos sejam salvos:

```sql
ALTER TABLE role_permissions 
ALTER COLUMN role DROP NOT NULL;
```

### Parte 3: Corrigir useBulkUpdateRolePermissions

Garantir que ao inserir permissões, o `role` legado seja obtido da tabela `roles` (para roles que existem no enum) ou seja NULL (para roles dinâmicos):

```typescript
// Buscar info do role para obter name (usado no enum legado se existir)
const { data: roleInfo } = await supabase
  .from('roles')
  .select('name')
  .eq('id', roleId)
  .single();

// Verificar se o role name existe no enum (legado)
const legacyEnumRoles = ['admin', 'super_admin', 'gestor_produto', 'corretor', 'incorporador', ...];
const legacyRole = legacyEnumRoles.includes(roleInfo?.name) ? roleInfo?.name : null;

// Inserir com role legado quando aplicável
await supabase.from('role_permissions').insert({
  role_id: roleId,
  role: legacyRole, // NULL para roles dinâmicos
  module_id: perm.moduleId,
  // ...
});
```

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/usePermissions.ts` | Buscar role_id antes de buscar permissões |
| `src/hooks/useRoles.ts` | Ajustar insert para lidar com roles dinâmicos |

## Migração SQL Necessária

```sql
-- Permitir role NULL para roles dinâmicos
ALTER TABLE public.role_permissions 
ALTER COLUMN role DROP NOT NULL;

-- Criar valor default (opcional, para retrocompatibilidade)
-- Se preferir, podemos atribuir um valor placeholder
```

## Fluxo Corrigido

```text
┌─────────────────────────────────────────────────────────────────┐
│ 1. Admin cria novo usuário com role "Supervisão de Criação"    │
├─────────────────────────────────────────────────────────────────┤
│ 2. Edge Function:                                               │
│    - Cria auth user                                             │
│    - Insere profile                                             │
│    - Busca role_id da tabela roles                              │
│    - Insere em user_roles (user_id + role_id)                   │
├─────────────────────────────────────────────────────────────────┤
│ 3. Usuário faz login                                            │
├─────────────────────────────────────────────────────────────────┤
│ 4. AuthContext:                                                 │
│    - Busca role name via user_roles + roles join                │
│    - Retorna "supervisão_de_criação"                            │
├─────────────────────────────────────────────────────────────────┤
│ 5. usePermissions (CORRIGIDO):                                  │
│    - Busca role_id baseado no nome do role                      │
│    - Busca permissões via role_id (não mais pelo enum)          │
│    - Retorna as permissões configuradas para esse role          │
├─────────────────────────────────────────────────────────────────┤
│ 6. ProtectedRoute:                                              │
│    - Verifica canAccessModule() com as permissões carregadas    │
│    - ✅ Permite acesso aos módulos configurados                 │
└─────────────────────────────────────────────────────────────────┘
```

## Ação Necessária: Configurar Permissões

Após a implementação, será necessário acessar **Usuários > Perfis de Acesso** e configurar as permissões para cada role dinâmico que ainda não tem configuração:

1. Selecionar o perfil "Diretor de Marketing"
2. Marcar as permissões desejadas (View/Create/Edit/Delete)
3. Definir o escopo (Global/Empreendimento/Próprio)
4. Clicar em "Salvar"

Repetir para "Supervisão de Criação" e outros roles criados dinamicamente.

## Benefícios

1. **Compatibilidade total**: Roles legados (via enum) e dinâmicos funcionam
2. **Sem perda de dados**: Permissões existentes continuam funcionando
3. **Administração centralizada**: Gestão via interface de Perfis de Acesso
4. **Escalabilidade**: Novos roles podem ser criados sem alteração de código
