

# Plano: Corrigir Redirecionamento Pós-Login para Diretor de Marketing

## Problema Identificado

A usuária Jéssica (role `diretor_de_marketing`) está recebendo "Acesso Negado" ao logar porque:

1. O sistema de login (`Auth.tsx`) usa `getDefaultRoute()` para redirecionar
2. `getDefaultRoute()` retorna `/` porque Jéssica tem permissão no módulo `dashboard`
3. O componente `Index.tsx` (rota `/`) ignora permissões e redireciona todos (exceto incorporadores) para `/dashboard-executivo`
4. A rota `/dashboard-executivo` exige `adminOnly={true}`
5. Jéssica não é admin → Acesso Negado

```text
Login → Auth.tsx → getDefaultRoute() → "/"
                                         ↓
                                    Index.tsx
                                         ↓
                        (não é incorporador)
                                         ↓
                        Navigate → /dashboard-executivo
                                         ↓
                        ProtectedRoute adminOnly
                                         ↓
                        isAdmin() = false → "Acesso Negado"
```

## Solução

Modificar dois arquivos para que o sistema respeite as permissões corretamente:

### 1. Atualizar lista de prioridade de rotas

**Arquivo:** `src/hooks/useDefaultRoute.ts`

Adicionar a rota de Marketing antes do dashboard, para que usuários com acesso ao marketing sejam direcionados para lá:

**Antes:**
```typescript
const routePriority = [
  { path: '/portal-corretor', module: 'portal_corretor' },
  { path: '/', module: 'dashboard' },
  { path: '/empreendimentos', module: 'empreendimentos' },
  // ...
];
```

**Depois:**
```typescript
const routePriority = [
  { path: '/portal-corretor', module: 'portal_corretor' },
  { path: '/marketing', module: 'projetos_marketing' },  // Marketing antes do dashboard
  { path: '/', module: 'dashboard' },
  { path: '/empreendimentos', module: 'empreendimentos' },
  // ...
];
```

### 2. Corrigir redirecionamento no Index.tsx

**Arquivo:** `src/pages/Index.tsx`

O componente atual ignora permissões. Deve usar o `getDefaultRoute()` para decidir o destino correto:

**Antes:**
```typescript
const Index = () => {
  const { role } = useAuth();

  if (role === 'incorporador') {
    return <DashboardIncorporador />;
  }

  // Redireciona SEMPRE para dashboard-executivo (ignora permissões)
  return <Navigate to="/dashboard-executivo" replace />;
};
```

**Depois:**
```typescript
const Index = () => {
  const { role } = useAuth();
  const { canAccessModule } = usePermissions();

  // Dashboard específico para incorporadores
  if (role === 'incorporador') {
    return <DashboardIncorporador />;
  }

  // Se tem acesso ao dashboard executivo, mostra ele
  if (canAccessModule('dashboard', 'view')) {
    return <DashboardExecutivo />;
  }

  // Caso contrário, redireciona para marketing (ou outra área que tenha acesso)
  return <Navigate to="/marketing" replace />;
};
```

Alternativamente, usar o hook `useDefaultRoute` para decidir:

```typescript
const Index = () => {
  const { role } = useAuth();
  const { getDefaultRoute } = useDefaultRoute();

  if (role === 'incorporador') {
    return <DashboardIncorporador />;
  }

  const defaultRoute = getDefaultRoute();
  
  // Se a rota padrão é "/" (este componente), evita loop infinito
  if (defaultRoute === '/') {
    return <Navigate to="/marketing" replace />;
  }

  return <Navigate to={defaultRoute} replace />;
};
```

## Fluxo Corrigido

```text
Login → Auth.tsx → getDefaultRoute()
                         ↓
              (Jéssica tem permissão em projetos_marketing)
                         ↓
                    retorna "/marketing"
                         ↓
               Navigate → /marketing ✓
```

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useDefaultRoute.ts` | Adicionar `/marketing` com `projetos_marketing` na lista de prioridade |
| `src/pages/Index.tsx` | Usar sistema de permissões em vez de redirecionamento fixo |

## Resultado Esperado

- Jéssica será redirecionada para `/marketing` ao fazer login
- Usuários admin/super_admin continuarão acessando o dashboard executivo normalmente
- Incorporadores continuarão vendo seu dashboard específico
- O sistema respeitará as permissões configuradas para cada role

