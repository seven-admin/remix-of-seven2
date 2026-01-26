
# Plano Definitivo: Eliminar Erros de "Acesso Negado" Pós-Login

## Análise do Problema

### Causa Raiz Identificada

O problema ocorre por uma **race condition** no fluxo de autenticação e redirecionamento. Existem múltiplos pontos de falha:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUXO ATUAL (PROBLEMÁTICO)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Login (Auth.tsx)                                                        │
│     ├── Aguarda authLoading                                                 │
│     ├── Aguarda permLoading                                                 │
│     └── navigate(getDefaultRoute())                                         │
│                    │                                                        │
│                    ▼                                                        │
│  2. Se getDefaultRoute() retorna "/" (problema!)                           │
│                    │                                                        │
│                    ▼                                                        │
│  3. ProtectedRoute para "/" (moduleName="dashboard")                       │
│     ├── isAdmin()? NÃO → verifica canAccessModule("dashboard")             │
│     └── Se não tem permissão → "Acesso Negado ao MÓDULO"                   │
│                    │                                                        │
│                    ▼                                                        │
│  4. Index.tsx                                                               │
│     ├── NÃO aguarda isLoading!                                             │
│     ├── getDefaultRoute() retorna "/" (permissões vazias)                  │
│     └── Redireciona para "/marketing"                                      │
│                    │                                                        │
│                    ▼                                                        │
│  5. Ou usuário já está em /dashboard-executivo (cache/histórico)           │
│     └── adminOnly=true → "Acesso Negado à PÁGINA"                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Pontos de Falha Específicos

1. **Index.tsx não aguarda permissões** - Toma decisões antes de `isLoading` terminar
2. **getDefaultRoute() falha silenciosamente** - Retorna "/" quando permissões estão carregando
3. **ProtectedRoute pode bloquear prematuramente** - Antes das permissões carregarem completamente
4. **Histórico do navegador** - Usuário pode ter `/dashboard-executivo` no histórico

---

## Solução Proposta

### Arquitetura do Fluxo Corrigido

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUXO CORRIGIDO                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Login (Auth.tsx) - já correto                                           │
│     └── Aguarda authLoading + permLoading antes de navegar                 │
│                    │                                                        │
│                    ▼                                                        │
│  2. ProtectedRoute - já correto                                             │
│     └── Aguarda isLoading antes de verificar permissões                    │
│                    │                                                        │
│                    ▼                                                        │
│  3. Index.tsx (CORRIGIR)                                                   │
│     ├── ADICIONAR verificação de isLoading                                 │
│     ├── Mostrar loader enquanto carrega                                    │
│     └── Só redirecionar DEPOIS das permissões carregarem                   │
│                    │                                                        │
│                    ▼                                                        │
│  4. Rota correta baseada em permissões                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Alterações Necessárias

### 1. Modificar Index.tsx - Adicionar verificação de loading

**Arquivo:** `src/pages/Index.tsx`

O Index.tsx atual não verifica se as permissões terminaram de carregar:

```typescript
// ANTES (problemático)
const Index = () => {
  const { role } = useAuth();
  const { getDefaultRoute } = useDefaultRoute();  // Não usa isLoading!

  if (role === 'incorporador') {
    return <DashboardIncorporador />;
  }

  const defaultRoute = getDefaultRoute();  // Pode retornar "/" incorretamente
  // ...
};
```

```typescript
// DEPOIS (corrigido)
import { Navigate } from 'react-router-dom';
import { DashboardIncorporador } from '@/components/dashboard/DashboardIncorporador';
import { useAuth } from '@/contexts/AuthContext';
import { useDefaultRoute } from '@/hooks/useDefaultRoute';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { role, isLoading: authLoading } = useAuth();
  const { getDefaultRoute, isLoading: permLoading } = useDefaultRoute();

  // Aguardar TODAS as informações carregarem antes de decidir
  if (authLoading || permLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Dashboard específico para incorporadores
  if (role === 'incorporador') {
    return <DashboardIncorporador />;
  }

  // Agora as permissões estão carregadas, getDefaultRoute() funciona corretamente
  const defaultRoute = getDefaultRoute();
  
  // Se a rota padrão é "/" (este componente), redireciona para marketing para evitar loop
  if (defaultRoute === '/') {
    return <Navigate to="/marketing" replace />;
  }

  return <Navigate to={defaultRoute} replace />;
};

export default Index;
```

### 2. Garantir que useDefaultRoute expõe isLoading corretamente

**Arquivo:** `src/hooks/useDefaultRoute.ts`

O hook já expõe `isLoading` - apenas precisa ser usado:

```typescript
// Código atual (já correto)
export function useDefaultRoute() {
  const { canAccessModule, isLoading } = usePermissions();

  // ...

  return {
    getDefaultRoute,
    canAccessDashboard,
    isLoading,  // Já exporta isLoading
  };
}
```

### 3. Validar ProtectedRoute para evitar flash

**Arquivo:** `src/components/auth/ProtectedRoute.tsx`

Verificar que o ProtectedRoute também considera `role === null` como estado de loading:

```typescript
// Linha 31 - já correto
const isLoading = authLoading || permLoading || (isAuthenticated && role === null);
```

---

## Resumo das Alterações

| Arquivo | Linha | Alteração |
|---------|-------|-----------|
| `src/pages/Index.tsx` | 1-25 | Adicionar verificação de `authLoading` e `permLoading` antes de redirecionar |

---

## Fluxo Após Correção

```text
Login (Jéssica - diretor_de_marketing)
         │
         ▼
Auth.tsx aguarda authLoading + permLoading
         │
         ▼
Permissões carregadas:
  - projetos_marketing: can_view=true ✓
  - dashboard: can_view=true ✓
         │
         ▼
getDefaultRoute() verifica prioridade:
  1. portal_corretor? NÃO
  2. marketing (projetos_marketing)? SIM ✓
         │
         ▼
navigate("/marketing") → Sucesso!
```

---

## Por que isso resolve DEFINITIVAMENTE

1. **Nenhuma decisão é tomada sem dados** - O loader é mostrado até que as permissões estejam carregadas
2. **getDefaultRoute() sempre retorna valor correto** - Porque só é chamado após `isLoading = false`
3. **Prioridade de rotas respeita permissões** - Marketing vem antes do dashboard na lista
4. **ProtectedRoute já funciona corretamente** - Apenas Index.tsx precisava do fix
5. **Funciona para TODOS os roles** - Não depende de nenhum role específico

---

## Testes Recomendados

Após a implementação, testar login com:
- `diretor_de_marketing` → deve ir para `/marketing`
- `corretor` → deve ir para `/portal-corretor`
- `admin` → deve ir para `/` (dashboard)
- `incorporador` → deve ver `DashboardIncorporador` em `/`
