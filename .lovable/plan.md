
# Plano: Corrigir Criação de Usuários com Roles Dinâmicos

## Problema Identificado

A tabela `user_roles` possui duas colunas para armazenar o role:
1. **`role_id`** (UUID, nullable) → Referência à tabela dinâmica `roles`
2. **`role`** (ENUM `app_role`, NOT NULL) → Sistema legado com valores fixos

Quando o usuário tenta criar um novo usuário com role `supervisão_de_criação`:
- Este role existe na tabela `roles` (dinâmica)
- **NÃO existe** no enum `app_role` (legado)
- O Edge Function tenta preencher ambas as colunas, mas falha no enum

## Solução

Remover a obrigatoriedade da coluna `role` (enum) e permitir que apenas `role_id` seja usado para novos registros.

### Alteração 1: Tornar coluna `role` nullable

```sql
ALTER TABLE user_roles ALTER COLUMN role DROP NOT NULL;
```

### Alteração 2: Atualizar Edge Function

Modificar `supabase/functions/create-user/index.ts` para:
- Inserir apenas `role_id` (não mais a coluna `role`)
- Remover a dependência do enum legado

**Antes:**
```typescript
const { error: insertRoleError } = await supabaseAdmin
  .from('user_roles')
  .insert({
    user_id: newUserId,
    role_id: roleData.id,
    role: role  // ← PROBLEMA: tenta inserir valor fora do enum
  })
```

**Depois:**
```typescript
const { error: insertRoleError } = await supabaseAdmin
  .from('user_roles')
  .insert({
    user_id: newUserId,
    role_id: roleData.id
    // role removido - usando apenas role_id
  })
```

## Benefícios

1. **Compatibilidade**: Roles existentes no enum continuam funcionando
2. **Flexibilidade**: Novos roles dinâmicos podem ser criados sem alterar o banco
3. **Migração gradual**: Código existente que usa `role` continua funcionando

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| Nova migration SQL | Tornar coluna `role` nullable |
| `supabase/functions/create-user/index.ts` | Remover inserção da coluna `role` |

## Resultado Esperado

- Criação de usuários com qualquer role da tabela `roles` funcionará
- Roles com caracteres especiais (acentos) serão aceitos
- Sistema 100% baseado em `role_id` para novos registros
