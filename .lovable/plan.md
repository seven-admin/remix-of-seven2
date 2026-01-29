

# Plano: Reorganizar Layout do Portal do Incorporador

## Problema Atual

Os cards de navegação (Executivo, Forecast, Marketing) estão posicionados **entre os KPIs e a lista de empreendimentos**, o que não é intuitivo. O usuário quer que eles fiquem logo abaixo do título "Portal do Incorporador".

## Alterações Propostas

### 1. Alterar o Título da Página Principal

**Arquivo:** `src/components/portal-incorporador/PortalIncorporadorLayout.tsx`

- Mudar o título de "Dashboard" para "Portal do Incorporador"
- Ajustar o subtítulo conforme apropriado

### 2. Mover Cards de Navegação para o Layout

**Arquivo:** `src/components/portal-incorporador/PortalIncorporadorLayout.tsx`

Os cards de navegação serão renderizados **diretamente no Layout**, logo abaixo do título, apenas quando estiver na rota principal (`/portal-incorporador`).

### 3. Remover Cards de Navegação do Dashboard

**Arquivo:** `src/pages/portal-incorporador/PortalIncorporadorDashboard.tsx`

Remover a seção "Links Rápidos" (linhas 109-155), pois ela será movida para o Layout.

---

## Resultado Visual Esperado

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]                                      Incorp    [Sair]  │
└─────────────────────────────────────────────────────────────────┘

  Portal do Incorporador
  Visão geral dos seus empreendimentos

  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
  │ Dashboard        │ │ Forecast         │ │ Marketing        │
  │ Executivo      → │ │                → │ │                → │
  └──────────────────┘ └──────────────────┘ └──────────────────┘

  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
  │Empreendim.  │ │ Unidades    │ │ VGV Vendido │ │ Vendas Mês  │
  │     2       │ │     0       │ │   R$ 0      │ │   R$ 0      │
  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘

  ┌─────────────────────────────────────────────────────────────┐
  │ Seus Empreendimentos                                        │
  │ ...                                                         │
  └─────────────────────────────────────────────────────────────┘
```

---

## Detalhes Técnicos

### Arquivo: `src/components/portal-incorporador/PortalIncorporadorLayout.tsx`

```tsx
// Atualizar routeTitles
'/portal-incorporador': { 
  title: 'Portal do Incorporador', 
  subtitle: 'Visão geral dos seus empreendimentos' 
},

// Adicionar imports
import { BarChart3, TrendingUp, Palette, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// Adicionar cards de navegação após título (apenas na página principal)
{!isInternalPage && (
  <div className="grid gap-4 md:grid-cols-3 mb-6">
    <Link to="/portal-incorporador/executivo">
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Dashboard Executivo</h3>
            <p className="text-sm text-muted-foreground">KPIs e métricas detalhadas</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
    {/* ... Forecast e Marketing ... */}
  </div>
)}
<Outlet />
```

### Arquivo: `src/pages/portal-incorporador/PortalIncorporadorDashboard.tsx`

Remover toda a seção de "Links Rápidos" (linhas 109-155), mantendo apenas:
- KPIs Principais
- Lista de Empreendimentos

---

## Resumo das Alterações

| Arquivo | Modificação |
|---------|-------------|
| `PortalIncorporadorLayout.tsx` | Alterar título para "Portal do Incorporador"; adicionar cards de navegação logo após o título/subtítulo (apenas na rota principal) |
| `PortalIncorporadorDashboard.tsx` | Remover seção "Links Rápidos" (será renderizada pelo Layout) |

