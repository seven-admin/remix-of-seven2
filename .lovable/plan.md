

# Plano: Corrigir Listagem de Membros da Equipe de Criação

## Problema Identificado

O hook `useEquipeMarketing.ts` busca membros da equipe apenas na tabela `user_module_permissions`, que armazena **permissões customizadas por usuário**. 

A maioria dos usuários herda suas permissões através do **role** (via `role_permissions`), e não tem registros em `user_module_permissions`.

### Dados do Banco

| Fonte | Usuários encontrados |
|-------|---------------------|
| `user_module_permissions` | 1 (Jéssica) |
| `role_permissions` via role | 5 (Priscila, Jéssica, Rafael, Jonas, Kalebe) |

### Resultado Atual
Apenas Jéssica aparece em `/marketing/equipe`

---

## Solução

Atualizar a lógica do hook para buscar membros de **ambas as fontes**:
1. Usuários com permissões customizadas (`user_module_permissions`)
2. Usuários com roles que possuem acesso ao módulo (`role_permissions` + `user_roles`)

---

## Alterações Necessárias

### Arquivo: `src/hooks/useEquipeMarketing.ts`

Modificar a query de busca de membros da equipe:

```text
ANTES (linha 65-77):
- Busca apenas em user_module_permissions
- Resultado: 1 usuário

DEPOIS:
- Busca em user_module_permissions (permissões customizadas)
- Busca em user_roles + role_permissions (permissões via role)
- Combina resultados removendo duplicatas
- Exclui admin/super_admin
- Resultado: 5 usuários
```

### Nova Lógica

```typescript
// 1. Buscar usuários COM permissões customizadas no módulo
const { data: permissoesCustomizadas } = await supabase
  .from('user_module_permissions')
  .select('user_id')
  .eq('module_id', moduloMarketing.id)
  .eq('can_view', true);

// 2. Buscar usuários COM permissões via ROLE
const { data: permissoesViaRole } = await supabase
  .from('user_roles')
  .select('user_id, role_id')
  .in('role_id', roleIdsComAcessoMarketing);

// 3. Combinar IDs únicos
const todosUserIds = new Set([
  ...(permissoesCustomizadas || []).map(p => p.user_id),
  ...(permissoesViaRole || []).map(p => p.user_id)
]);

// 4. Buscar profiles e filtrar admins
```

---

## Diagrama do Fluxo Corrigido

```text
┌─────────────────────────────────────────────────────────────────┐
│                    useEquipeMarketing.ts                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Buscar módulo projetos_marketing                           │
│                     ↓                                           │
│  2. Buscar roles com acesso ao módulo                          │
│     └─→ role_permissions WHERE module_id = X AND can_view      │
│                     ↓                                           │
│  3. Buscar usuários com esses roles                            │
│     └─→ user_roles WHERE role_id IN (roles_com_acesso)         │
│                     ↓                                           │
│  4. Buscar usuários com permissões customizadas                │
│     └─→ user_module_permissions WHERE module_id = X            │
│                     ↓                                           │
│  5. Combinar (UNION de user_ids)                               │
│                     ↓                                           │
│  6. Excluir admin/super_admin                                  │
│                     ↓                                           │
│  7. Buscar profiles e métricas                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Resultado Esperado

| Antes | Depois |
|-------|--------|
| 1 membro (Jéssica) | 5 membros (Priscila, Jéssica, Rafael, Jonas, Kalebe) |

---

## Detalhes Técnicos

### Roles que devem aparecer

Os roles de marketing ativos são:
- `supervisão_de_criação` 
- `diretor_de_marketing`

### Exclusões

Serão excluídos usuários com roles:
- `admin`
- `super_admin`

Isso garante que apenas membros executores apareçam na listagem, não gestores/administradores.

---

## Critérios de Aceite

1. Todos os usuários com role de marketing aparecem na página
2. Usuários com permissões customizadas também aparecem
3. Não há duplicatas na listagem
4. Admins/super_admins não aparecem
5. Métricas de tickets são calculadas corretamente para cada membro

