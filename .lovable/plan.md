
# Solução Definitiva: Permissões para Usuários com Roles Dinâmicos

## Diagnóstico Final

Após análise profunda de todo o fluxo de autenticação e permissões, identifiquei **3 problemas raiz** que causam o "Acesso Negado":

| Problema | Localização | Impacto |
|----------|-------------|---------|
| Roles sem permissões | Banco de dados | "Diretor de Marketing" e "Supervisão de Criação" têm **0 permissões** cadastradas |
| Hook legado | `useUserPermissions.ts` linha 92-95 | Ainda usa `.eq('role', userRole)` ao invés de `role_id` |
| Falta de validação na criação | `create-user` Edge Function | Não verifica se o perfil tem permissões antes de criar o usuário |

## Fluxo Atual (Quebrado)

```text
1. Admin cria usuário com role "supervisão_de_criação"
   └─ Edge Function cria user_roles com role_id ✅

2. Usuário faz login
   └─ AuthContext busca role name via join ✅

3. usePermissions busca role_id e depois role_permissions
   └─ Retorna 0 permissões (nenhuma cadastrada para esse role) ❌

4. ProtectedRoute verifica canAccessModule("projetos_marketing")
   └─ Retorna false (sem permissões) ❌

5. Usuário vê "Acesso Negado" ❌
```

## Solução Proposta

### 1. Corrigir Hook useUserPermissions (Bug Crítico)

O hook que busca permissões para a aba de "Permissões Individuais" do usuário ainda usa a coluna enum legada. Precisa ser atualizado para usar `role_id`:

**Arquivo**: `src/hooks/useUserPermissions.ts`

**Antes** (linha 91-95):
```typescript
if (userRole) {
  const { data: rolePerms, error: roleError } = await supabase
    .from('role_permissions')
    .select('*')
    .eq('role', userRole as any);
```

**Depois**:
```typescript
if (userRole) {
  // Buscar role_id pelo nome
  const { data: roleData } = await supabase
    .from('roles')
    .select('id')
    .eq('name', userRole)
    .maybeSingle();

  const { data: rolePerms, error: roleError } = await supabase
    .from('role_permissions')
    .select('*')
    .eq('role_id', roleData?.id || '');
```

### 2. Adicionar Validação na Edge Function (create-user)

Quando o admin criar um usuário, verificar se o perfil escolhido tem permissões. Se não tiver:
- Para **super_admin/admin** criando: Copiar permissões de um perfil base escolhido (ex: `equipe_marketing`)
- Para cadastro externo (corretor): Manter pendente

**Arquivo**: `supabase/functions/create-user/index.ts`

Adicionar após encontrar o role_id:
```typescript
// Verificar se o role tem permissões cadastradas
const { count } = await supabaseAdmin
  .from('role_permissions')
  .select('*', { count: 'exact', head: true })
  .eq('role_id', roleData.id);

if (count === 0 && callerRoleName !== 'cliente_externo') {
  // Se criado por admin e sem permissões, copiar do perfil base
  // (baseRoleId vem do body da requisição ou usa default)
  const baseRoleId = body.base_role_id || 'equipe_marketing_role_id';
  await copyPermissionsFromBase(supabaseAdmin, baseRoleId, roleData.id);
}
```

### 3. Atualizar Página de Cadastro de Usuários

Adicionar seletor de "Perfil Base" que aparece quando o perfil escolhido não tem permissões.

**Arquivo**: `src/pages/Usuarios.tsx`

- Adicionar estado `createBaseRole`
- Mostrar seletor de perfil base quando perfil selecionado não tem permissões
- Enviar `base_role_id` para a Edge Function

### 4. Criar Página "Sem Acesso Configurado"

Quando o usuário não tem nenhuma permissão disponível, mostrar uma página explicativa ao invés do genérico "Acesso Negado".

**Novo arquivo**: `src/pages/SemAcesso.tsx`

```typescript
export default function SemAcesso() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldOff className="h-6 w-6 text-amber-500" />
            Acesso Pendente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Seu perfil ainda não possui permissões configuradas.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Entre em contato com o administrador do sistema para liberar seu acesso.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 5. Atualizar Lógica de Redirecionamento

**Arquivo**: `src/components/auth/ProtectedRoute.tsx`

Verificar se o usuário tem **alguma** permissão. Se não tiver nenhuma, redirecionar para `/sem-acesso`:

```typescript
// Se usuário não tem NENHUMA permissão, ir para página dedicada
const hasAnyPermission = permissions.some(p => p.can_view);
if (!hasAnyPermission && !isAdmin()) {
  return <Navigate to="/sem-acesso" replace />;
}
```

## Resumo de Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useUserPermissions.ts` | Corrigir busca de permissões para usar `role_id` |
| `supabase/functions/create-user/index.ts` | Adicionar verificação e cópia de permissões |
| `src/pages/Usuarios.tsx` | Adicionar seletor de perfil base |
| `src/pages/SemAcesso.tsx` | Criar nova página |
| `src/components/auth/ProtectedRoute.tsx` | Adicionar verificação de zero permissões |
| `src/App.tsx` | Adicionar rota `/sem-acesso` |
| `src/hooks/usePermissions.ts` | Expor `permissions` para verificação externa |

## Fluxo Corrigido

```text
1. Admin cria usuário com role "supervisão_de_criação"
   └─ Seleciona perfil base "equipe_marketing" (se não tiver permissões)
   └─ Edge Function copia permissões do base para o novo role ✅

2. Usuário faz login
   └─ AuthContext busca role name ✅

3. usePermissions busca role_id e role_permissions
   └─ Encontra as permissões copiadas ✅

4. ProtectedRoute verifica canAccessModule("projetos_marketing")
   └─ Retorna true ✅

5. Usuário acessa o módulo normalmente ✅
```

## Benefícios

1. **Novos usuários funcionam imediatamente** quando criados por admin
2. **Usuários externos ficam pendentes** até admin configurar
3. **Página "Sem Acesso" clara** orienta usuários e admins
4. **Sistema retrocompatível** com roles legados
