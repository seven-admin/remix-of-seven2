

# Plano: Corrigir Atualização de Usuários com Roles Dinâmicos

## Problema Identificado

Na página `src/pages/Usuarios.tsx`, a função `handleSaveUser` apresenta dois cenários:

1. **Usuário já possui role** (linhas 179-186): Atualiza corretamente usando apenas `role_id`
2. **Usuário não possui role** (linhas 187-198): Tenta inserir **ambas** as colunas `role_id` e `role` (enum legado)

O segundo cenário falha porque roles dinâmicos como `supervisão_de_criação` não existem no enum fixo `app_role`.

### Código Problemático (linha 191-195):
```typescript
.insert({ 
  user_id: editingUser.id, 
  role_id: roleData.id,
  role: editRole as any  // ← PROBLEMA: tenta inserir valor fora do enum
});
```

## Solução

Remover a inserção da coluna `role` (enum) e usar apenas `role_id`, seguindo o mesmo padrão já aplicado no Edge Function `create-user`.

## Alteração Necessária

**Arquivo:** `src/pages/Usuarios.tsx`

**Antes (linhas 188-195):**
```typescript
// Insert new role with role_id (keeping role column for backward compatibility until removed)
const { error: roleError } = await supabase
  .from('user_roles')
  .insert({ 
    user_id: editingUser.id, 
    role_id: roleData.id,
    role: editRole as any  // Temporary: keep enum column populated
  });
```

**Depois:**
```typescript
// Insert new role with role_id only (enum column now optional)
const { error: roleError } = await supabase
  .from('user_roles')
  .insert({ 
    user_id: editingUser.id, 
    role_id: roleData.id
  });
```

## Resumo da Alteração

| Arquivo | Linha | Ação |
|---------|-------|------|
| `src/pages/Usuarios.tsx` | 191-195 | Remover inserção da coluna `role` |

## Resultado Esperado

- Atualização de usuários funcionará com qualquer role da tabela `roles`
- Roles com caracteres especiais (acentos) serão aceitos
- Compatibilidade com o sistema dinâmico de permissões

