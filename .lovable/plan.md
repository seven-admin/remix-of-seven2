
# Plano: Portal do Incorporador

## Objetivo
Criar um portal dedicado para usuários com role "incorporador" (display_name: "Contratante"), similar ao Portal do Corretor existente, com layout próprio e acesso restrito aos dashboards: **Executivo**, **Forecast** e **Produção de Marketing**.

---

## Arquitetura Proposta

### Layout Comparativo

| Componente | Portal do Corretor | Portal do Incorporador |
|------------|-------------------|------------------------|
| Rota base | `/portal-corretor` | `/portal-incorporador` |
| Layout | `PortalLayout.tsx` | `PortalIncorporadorLayout.tsx` |
| Menu | Dashboard, Empreendimentos, Solicitações, Clientes | Dashboard, Executivo, Forecast, Marketing |
| Filtro de dados | Próprio corretor | Empreendimentos vinculados |

### Fluxo de Dados

```
USUÁRIO INCORPORADOR
       ↓
Login → AuthContext detecta role = "incorporador"
       ↓
useDefaultRoute() retorna "/portal-incorporador"
       ↓
Hook useIncorporadorEmpreendimentos() busca user_empreendimentos
       ↓
Todos os dashboards filtram dados automaticamente
```

---

## Estrutura de Arquivos

### Novos Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/portal-incorporador/PortalIncorporadorLayout.tsx` | Layout com header/nav específico |
| `src/pages/portal-incorporador/PortalIncorporadorDashboard.tsx` | Dashboard principal com KPIs consolidados |
| `src/pages/portal-incorporador/PortalIncorporadorExecutivo.tsx` | Dashboard Executivo filtrado |
| `src/pages/portal-incorporador/PortalIncorporadorForecast.tsx` | Forecast filtrado por empreendimentos |
| `src/pages/portal-incorporador/PortalIncorporadorMarketing.tsx` | Tickets de marketing filtrados |
| `src/hooks/useIncorporadorEmpreendimentos.ts` | Hook para buscar empreendimentos do incorporador |

### Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/App.tsx` | Adicionar rotas do portal incorporador |
| `src/hooks/useDefaultRoute.ts` | Redirecionar incorporadores para `/portal-incorporador` |
| `src/hooks/useDashboardExecutivo.ts` | Aceitar array de `empreendimentoIds` |
| `src/hooks/useForecast.ts` | Adicionar filtro por `empreendimentoIds` |
| `src/hooks/useDashboardMarketing.ts` | Adicionar filtro por `empreendimentoIds` |

---

## Detalhamento Técnico

### 1. Hook `useIncorporadorEmpreendimentos`

```typescript
// src/hooks/useIncorporadorEmpreendimentos.ts
export function useIncorporadorEmpreendimentos() {
  const { user, role } = useAuth();
  
  const query = useQuery({
    queryKey: ['incorporador-empreendimentos', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_empreendimentos')
        .select(`
          empreendimento_id,
          empreendimento:empreendimentos(id, nome, status)
        `)
        .eq('user_id', user!.id);
      
      return {
        ids: data?.map(d => d.empreendimento_id) || [],
        empreendimentos: data?.map(d => d.empreendimento) || []
      };
    },
    enabled: !!user && role === 'incorporador',
  });
  
  return {
    empreendimentoIds: query.data?.ids || [],
    empreendimentos: query.data?.empreendimentos || [],
    isLoading: query.isLoading,
    isIncorporador: role === 'incorporador',
  };
}
```

### 2. Layout do Portal

```typescript
// src/components/portal-incorporador/PortalIncorporadorLayout.tsx
const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/portal-incorporador' },
  { icon: BarChart3, label: 'Executivo', path: '/portal-incorporador/executivo' },
  { icon: TrendingUp, label: 'Forecast', path: '/portal-incorporador/forecast' },
  { icon: Palette, label: 'Marketing', path: '/portal-incorporador/marketing' },
];
```

### 3. Modificação nos Hooks de Dashboard

#### useDashboardExecutivo
Aceitar `empreendimentoIds?: string[]` e filtrar todas as queries:
```typescript
// Antes
.eq('empreendimento_id', empreendimentoId)

// Depois
.in('empreendimento_id', empreendimentoIds)
```

#### useForecast hooks
Adicionar parâmetro `empreendimentoIds` para filtrar atividades:
```typescript
// Buscar clientes vinculados aos empreendimentos via negociações
// ou atividades com empreendimento_id no array
```

#### useDashboardMarketing
Adicionar filtro `empreendimentoIds` para `projetos_marketing`:
```typescript
if (empreendimentoIds?.length) {
  query = query.in('empreendimento_id', empreendimentoIds);
}
```

### 4. Rotas no App.tsx

```typescript
{/* Portal do Incorporador */}
<Route 
  path="/portal-incorporador" 
  element={
    <ProtectedRoute moduleName="portal_incorporador">
      <PortalIncorporadorLayout />
    </ProtectedRoute>
  }
>
  <Route index element={<PortalIncorporadorDashboard />} />
  <Route path="executivo" element={<PortalIncorporadorExecutivo />} />
  <Route path="forecast" element={<PortalIncorporadorForecast />} />
  <Route path="marketing" element={<PortalIncorporadorMarketing />} />
</Route>
```

### 5. Redirecionamento Automático

```typescript
// useDefaultRoute.ts - adicionar
const routePriority = [
  { path: '/', module: 'dashboard' },
  { path: '/portal-incorporador', module: 'portal_incorporador' }, // Nova entrada
  { path: '/marketing', module: 'projetos_marketing' },
  // ...
];

// E na função getDefaultRoute:
if (role === 'incorporador') {
  return '/portal-incorporador';
}
```

---

## Configuração de Banco de Dados

### 1. Criar módulo `portal_incorporador`

```sql
INSERT INTO modules (name, display_name, route, is_active)
VALUES ('portal_incorporador', 'Portal do Contratante', '/portal-incorporador', true);
```

### 2. Configurar permissões para o role incorporador

```sql
-- Buscar IDs
-- role_id do incorporador: 7ffff9af-4793-4f70-9ae1-c7211eccb579

INSERT INTO role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT 
  '7ffff9af-4793-4f70-9ae1-c7211eccb579',
  m.id,
  true,  -- can_view
  false, -- can_create
  false, -- can_edit
  false, -- can_delete
  'empreendimento'
FROM modules m
WHERE m.name = 'portal_incorporador';
```

---

## Páginas do Portal

### Dashboard Principal (`/portal-incorporador`)
- **KPIs Consolidados**: Total de empreendimentos, unidades disponíveis, vendidas, valor vendido
- **Ações Rápidas**: Links para Executivo, Forecast, Marketing
- **Lista de Empreendimentos**: Cards com status de cada empreendimento vinculado

### Dashboard Executivo (`/portal-incorporador/executivo`)
- Reutiliza componentes do `DashboardExecutivo.tsx`
- Remove seletor de empreendimento (usa automático)
- Oculta informações sensíveis se necessário (ex: comissões detalhadas)

### Forecast (`/portal-incorporador/forecast`)
- Reutiliza componentes do `Forecast.tsx`
- Filtrado automaticamente pelos empreendimentos
- Remove seletor de gestor (visualização consolidada)

### Marketing (`/portal-incorporador/marketing`)
- Lista de tickets vinculados aos empreendimentos
- Somente visualização (sem criar/editar)
- Status de produção e prazos

---

## Considerações de Segurança

### RLS para projetos_marketing
Adicionar policy para incorporadores visualizarem tickets:

```sql
CREATE POLICY "incorporadores_view_tickets"
ON projetos_marketing
FOR SELECT
TO authenticated
USING (
  public.is_admin(auth.uid()) 
  OR (
    public.has_role(auth.uid(), 'incorporador')
    AND empreendimento_id IN (
      SELECT empreendimento_id 
      FROM user_empreendimentos 
      WHERE user_id = auth.uid()
    )
  )
  OR -- políticas existentes...
);
```

### Dados Sensíveis
Os incorporadores NÃO devem ver:
- Detalhes de comissões de corretores
- Dados de outros clientes/negociações fora dos seus empreendimentos
- Configurações internas do sistema

---

## Fluxo de Cadastro

1. Admin cria usuário com role "incorporador" (Contratante)
2. Admin vincula empreendimentos via aba "Empreendimentos" na edição do usuário
3. Incorporador faz login
4. Sistema detecta role e redireciona para `/portal-incorporador`
5. Portal exibe dados filtrados automaticamente

---

## Fases de Implementação

| Fase | Entregáveis | Estimativa |
|------|-------------|------------|
| 1 | Hook `useIncorporadorEmpreendimentos` + módulo no banco | 15 min |
| 2 | Layout `PortalIncorporadorLayout` + Dashboard principal | 30 min |
| 3 | Modificar hooks para aceitar array de empreendimentos | 30 min |
| 4 | Páginas Executivo, Forecast, Marketing | 45 min |
| 5 | Rotas, redirecionamento e RLS | 20 min |
| 6 | Testes e ajustes | 20 min |

**Total estimado: ~2h30**

---

## Critérios de Aceite

1. Usuário com role "incorporador" é redirecionado automaticamente para `/portal-incorporador`
2. Portal exibe apenas dados dos empreendimentos vinculados ao usuário
3. Menu mostra apenas: Dashboard, Executivo, Forecast, Marketing
4. Não é possível acessar rotas administrativas do sistema principal
5. Dashboards funcionam corretamente com filtro automático
6. Layout responsivo (desktop e mobile)
