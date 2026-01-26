
# Plano: Ocultar Menu "Dashboard Executivo" para Não-Admins

## Problema Identificado

O menu "Dashboard Executivo" aparece para Jéssica, mas ao clicar, ela recebe "Acesso Negado" porque:

1. **Rota `/dashboard-executivo`** tem `adminOnly={true}` no App.tsx (linha 82)
2. **Item de menu no Sidebar.tsx** (linha 68) **NÃO tem** `adminOnly: true`
3. Jéssica tem `can_view: true` para o módulo `dashboard` (configurado no banco)
4. Resultado: O menu aparece (baseado em `canAccessModule`), mas a rota bloqueia acesso

```text
┌────────────────────────────────────────────────────────────┐
│                    INCONSISTÊNCIA                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Sidebar.tsx (linha 68):                                   │
│  { label: 'Executivo', path: '/dashboard-executivo',       │
│    moduleName: 'dashboard' }     ← SEM adminOnly!          │
│                                                            │
│  App.tsx (linha 82):                                       │
│  <ProtectedRoute moduleName="dashboard" adminOnly>         │
│    <DashboardExecutivo />        ← COM adminOnly!          │
│  </ProtectedRoute>                                         │
│                                                            │
│  Resultado: Menu visível, mas rota bloqueada               │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Solução

Adicionar `adminOnly: true` ao item de menu do Dashboard Executivo no Sidebar.tsx, garantindo que só apareça para administradores.

## Alteração Necessária

**Arquivo:** `src/components/layout/Sidebar.tsx`

**Linha 68 - Antes:**
```typescript
{ icon: BarChart2, label: 'Executivo', path: '/dashboard-executivo', moduleName: 'dashboard' },
```

**Linha 68 - Depois:**
```typescript
{ icon: BarChart2, label: 'Executivo', path: '/dashboard-executivo', moduleName: 'dashboard', adminOnly: true },
```

## Por que isso funciona

O método `filterItems` no Sidebar.tsx (linha 242-248) já implementa a lógica correta:

```typescript
const filterItems = (items: MenuItem[]) =>
  items.filter((item) => {
    if (item.path === '/marketing/etapas') return isSuperAdmin();
    if (item.adminOnly) return isAdmin();  // ← Esta linha já existe!
    return canAccessModule(item.moduleName);
  });
```

Com `adminOnly: true`, o item só será exibido se `isAdmin()` retornar `true` (admin ou super_admin).

## Resultado Esperado

| Usuário | Role | Vê menu "Executivo"? | Pode acessar rota? |
|---------|------|---------------------|-------------------|
| Jéssica | diretor_de_marketing | Não | Não |
| Admin | admin | Sim | Sim |
| Super Admin | super_admin | Sim | Sim |
| Corretor | corretor | Não | Não |

## Decisão de Design

Se no futuro o "Dashboard Executivo" precisar ser acessível a outros roles além de admin/super_admin:
1. Remover `adminOnly` da rota no App.tsx
2. Remover `adminOnly` do menu no Sidebar.tsx
3. Configurar permissões específicas via banco de dados

Por enquanto, mantemos consistência: menu e rota ambos exigem admin.
