
# Plano de Correção: Redirecionamento do Portal do Incorporador

## Análise Completa

### Configuração do Banco de Dados (CORRETA ✅)
- Módulo `portal_incorporador` existe e está ativo
- Role `incorporador` existe com `is_active: true`
- Permissão `role_permissions` para incorporador + portal_incorporador tem `can_view: true`
- Usuário `mail@mail.com` tem o role `incorporador` corretamente atribuído
- Usuário tem 2 empreendimentos vinculados (VITHORIA DO SOL e DON INÁCIO)

### Fluxo Atual (DEVERIA FUNCIONAR)
1. Login → AuthContext busca role via join `user_roles ↔ roles`
2. Navega para `/` → ProtectedRoute aguarda loading
3. Index.tsx verifica `role === 'incorporador'` → Redireciona para `/portal-incorporador`
4. ProtectedRoute para `/portal-incorporador` verifica `canAccessModule('portal_incorporador', 'view')` → Deveria retornar `true`
5. Portal renderiza

### Problemas Identificados

#### 1. Race Condition no useDefaultRoute
O hook `useDefaultRoute` é chamado pelo `ProtectedRoute` **antes** de garantir que as permissões estejam carregadas:

```typescript
// ProtectedRoute.tsx linha 31
const { getDefaultRoute } = useDefaultRoute();
```

Se `getDefaultRoute()` for chamado enquanto `permissions` ainda é um array vazio, o loop de prioridade pode retornar rotas incorretas.

#### 2. Fallback Inconsistente no Index.tsx
Linha 32-34:
```typescript
if (defaultRoute === '/') {
  return <Navigate to="/marketing" replace />;
}
```

Se o incorporador não tiver acesso ao marketing, isso pode gerar um redirect em loop ou "Acesso Negado".

#### 3. useDefaultRoute Não Verifica Loading
O hook retorna `getDefaultRoute()` sem verificar se as permissões já carregaram:

```typescript
const getDefaultRoute = (): string => {
  // Verifica role diretamente ✅
  if (role === 'incorporador') {
    return '/portal-incorporador';
  }
  
  // Mas se role não estiver carregado...
  for (const route of routePriority) {
    if (canAccessModule(route.module, 'view')) { // ← permissions pode estar vazio!
      return route.path;
    }
  }
  return '/'; // Fallback genérico
};
```

---

## Solução Proposta

### Correção 1: Proteger Index.tsx contra race conditions

**Arquivo:** `src/pages/Index.tsx`

Adicionar verificação adicional para garantir que o role foi carregado antes de decidir o redirecionamento:

```typescript
const Index = () => {
  const { role, isLoading: authLoading } = useAuth();
  const { getDefaultRoute, isLoading: permLoading } = useDefaultRoute();

  // Aguardar TODAS as informações carregarem
  // ADICIONAR: verificar se role está definido também
  if (authLoading || permLoading || role === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Incorporadores vão para o portal dedicado
  if (role === 'incorporador') {
    return <Navigate to="/portal-incorporador" replace />;
  }

  // Para outros usuários, usa getDefaultRoute()
  const defaultRoute = getDefaultRoute();
  
  // Se a rota padrão é "/" evitar loop infinito
  if (defaultRoute === '/') {
    // Fallback mais seguro: verificar permissões antes de redirecionar
    return <Navigate to="/dashboard-executivo" replace />;
  }

  return <Navigate to={defaultRoute} replace />;
};
```

### Correção 2: Garantir que useDefaultRoute seja robusto

**Arquivo:** `src/hooks/useDefaultRoute.ts`

Adicionar verificação de loading e fallback mais inteligente:

```typescript
export function useDefaultRoute() {
  const { canAccessModule, isLoading, isAdmin, permissions } = usePermissions();
  const { role } = useAuth();

  const getDefaultRoute = (): string => {
    // Admin e Super Admin sempre vão para o dashboard
    if (isAdmin() || role === 'super_admin' || role === 'admin') {
      return '/';
    }
    
    // Incorporadores vão para o portal dedicado
    if (role === 'incorporador') {
      return '/portal-incorporador';
    }

    // Corretores vão para o portal do corretor
    if (role === 'corretor') {
      return '/portal-corretor';
    }
    
    // Se permissions ainda não carregaram, retornar loading indicator
    // (o componente que chama deve verificar isLoading antes de usar)
    if (permissions.length === 0) {
      return '/'; // Fallback seguro - será verificado pelo ProtectedRoute
    }
    
    for (const route of routePriority) {
      if (canAccessModule(route.module, 'view')) {
        return route.path;
      }
    }
    
    // Fallback final
    return '/sem-acesso';
  };

  const canAccessDashboard = (): boolean => {
    return canAccessModule('dashboard', 'view');
  };

  return {
    getDefaultRoute,
    canAccessDashboard,
    isLoading,
  };
}
```

### Correção 3: Adicionar verificação explícita no ProtectedRoute para portal_incorporador

**Arquivo:** `src/components/auth/ProtectedRoute.tsx`

Adicionar tratamento especial para roles que têm portais dedicados:

```typescript
// Após a verificação de loading e autenticação, antes das verificações de módulo:

// Verificar se usuário com role específico está tentando acessar área errada
if (role === 'incorporador' && !location.pathname.startsWith('/portal-incorporador')) {
  // Se incorporador tenta acessar área fora do portal, redirecionar
  return <Navigate to="/portal-incorporador" replace />;
}

if (role === 'corretor' && !location.pathname.startsWith('/portal-corretor')) {
  // Se corretor tenta acessar área fora do portal, redirecionar
  return <Navigate to="/portal-corretor" replace />;
}
```

### Correção 4: Adicionar logs de debug temporários

Para diagnosticar o problema exato em produção, adicionar logs:

```typescript
// Em usePermissions.ts, no início do useEffect
console.log('[usePermissions] Starting fetch:', { user: user?.id, role, isAuthenticated });

// Em ProtectedRoute.tsx, antes das verificações
console.log('[ProtectedRoute]', { 
  moduleName, 
  role, 
  isLoading, 
  permissionsCount: permissions.length,
  canAccess: moduleName ? canAccessModule(moduleName, requiredAction) : 'N/A'
});
```

---

## Resumo das Alterações

| Arquivo | Modificação |
|---------|-------------|
| `src/pages/Index.tsx` | Adicionar verificação `role === null` no loading state |
| `src/hooks/useDefaultRoute.ts` | Adicionar verificações de fallback mais robustas e tratamento para permissions vazias |
| `src/components/auth/ProtectedRoute.tsx` | Adicionar redirecionamento explícito para portais de roles específicos (incorporador/corretor) |

---

## Critérios de Aceite

1. Ao fazer login como incorporador, o sistema redireciona corretamente para `/portal-incorporador`
2. O Portal do Incorporador carrega e exibe os dados dos empreendimentos vinculados
3. Não há mensagem de "Acesso Negado" para incorporadores com permissões configuradas
4. O fluxo de redirecionamento é determinístico e não depende de timing de carregamento
5. Outros roles (admin, corretor, gestor_produto) continuam funcionando normalmente

---

## Detalhes Técnicos

### Por que isso pode estar falhando?

O React Query e os hooks de autenticação operam de forma assíncrona. Durante o carregamento:

```text
t=0ms:   authLoading=true, permLoading=true, role=null, permissions=[]
t=100ms: authLoading=false, permLoading=true, role='incorporador', permissions=[]
t=200ms: authLoading=false, permLoading=false, role='incorporador', permissions=[...]
```

Se o ProtectedRoute avalia `canAccessModule` no t=100ms (quando role carregou mas permissions não), pode retornar `false` e mostrar "Acesso Negado".

A correção garante que **ambos** (role E permissions) estejam carregados antes de tomar decisões de redirecionamento.
