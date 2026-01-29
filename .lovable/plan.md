

# Plano: Simplificar Layout do Portal do Incorporador

## Objetivo

Remover as abas de navegação do header e utilizar os cards clicáveis como única forma de navegação entre as seções do portal. Isso elimina a redundância visual e deixa o layout mais limpo.

## Alterações Propostas

### 1. Simplificar o Header (PortalIncorporadorLayout.tsx)

**Antes:** Header com logo + 4 abas (Dashboard, Executivo, Forecast, Marketing) + info usuário

**Depois:** Header com logo + info usuário + botão Sair (apenas)

O header fica minimalista e elegante:
```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]                                      Incorp    [Sair]  │
│                                            Contratante          │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Adicionar Navegação de Volta nas Páginas Internas

Nas páginas Executivo, Forecast e Marketing, adicionar um botão/link de retorno ao Dashboard no título da página:

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Voltar    Dashboard Executivo                                │
│              KPIs e métricas consolidadas                       │
└─────────────────────────────────────────────────────────────────┘
```

Isso será feito via props no Layout, similar ao padrão `backTo` já usado no `PageHeader` do sistema principal.

### 3. Manter Cards de Navegação no Dashboard

Os cards de navegação rápida já existem e funcionam bem - serão mantidos exatamente como estão:

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ 📊 Dashboard     │  │ 📈 Forecast      │  │ 🎨 Marketing     │
│    Executivo     │  │    Previsões     │  │    Tickets       │
│              →   │  │              →   │  │              →   │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## Detalhes Técnicos

### Arquivo: `src/components/portal-incorporador/PortalIncorporadorLayout.tsx`

**Modificações:**
1. Remover a `nav` do header desktop (linhas 60-79)
2. Remover a navegação mobile (linhas 99-120)
3. Adicionar lógica para exibir link "Voltar" quando não estiver no Dashboard
4. Simplificar o `menuItems` para apenas referência de títulos

```typescript
// Antes: Header com navegação
<nav className="hidden md:flex items-center gap-1">
  {menuItems.map((item) => ...)}
</nav>

// Depois: Header limpo (sem navegação)
// Apenas logo + info usuário + sair
```

**Novo Header:**
```tsx
<header className="sticky top-0 z-50 w-full border-b bg-background/95 ...">
  <div className="container flex h-16 items-center justify-between">
    {/* Logo */}
    <Link to="/portal-incorporador" className="flex items-center gap-2">
      <img src={logo} alt="Logo" className="h-8" />
    </Link>
    
    {/* Usuário + Sair */}
    <div className="flex items-center gap-4">
      <div className="text-right hidden sm:block">
        <p className="text-sm font-medium">{profile?.full_name}</p>
        <p className="text-xs text-muted-foreground">Contratante</p>
      </div>
      <button onClick={handleLogout} ...>
        <LogOut className="h-4 w-4" />
        <span>Sair</span>
      </button>
    </div>
  </div>
</header>
```

**Novo Título com Voltar:**
```tsx
<main className="container py-6">
  <div className="mb-6">
    {/* Mostrar "Voltar" apenas em páginas internas */}
    {location.pathname !== '/portal-incorporador' && (
      <Link 
        to="/portal-incorporador" 
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>
    )}
    <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
    {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
  </div>
  <Outlet />
</main>
```

---

## Resumo das Alterações

| Arquivo | Modificação |
|---------|-------------|
| `src/components/portal-incorporador/PortalIncorporadorLayout.tsx` | Remover navegação por abas do header e da navegação mobile; adicionar link "Voltar" no título para páginas internas |

---

## Resultado Visual Esperado

**Dashboard (/portal-incorporador):**
```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]                                      Incorp    [Sair]  │
└─────────────────────────────────────────────────────────────────┘

  Dashboard
  Visão geral dos seus empreendimentos

  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
  │Empreendim.  │ │ Unidades    │ │ VGV Vendido │ │ Vendas Mês  │
  │     2       │ │     0       │ │   R$ 0      │ │   R$ 0      │
  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘

  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
  │ Dashboard        │ │ Forecast         │ │ Marketing        │
  │ Executivo      → │ │                → │ │                → │
  └──────────────────┘ └──────────────────┘ └──────────────────┘

  ┌─────────────────────────────────────────────────────────────┐
  │ Seus Empreendimentos                                        │
  │ ┌─────────────────────┐ ┌─────────────────────┐             │
  │ │ VITHORIA DO SOL     │ │ DON INÁCIO          │             │
  │ │ Gestor: Michel      │ │ Gestor: Michel      │             │
  │ └─────────────────────┘ └─────────────────────┘             │
  └─────────────────────────────────────────────────────────────┘
```

**Página Interna (/portal-incorporador/executivo):**
```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]                                      Incorp    [Sair]  │
└─────────────────────────────────────────────────────────────────┘

  ← Voltar

  Dashboard Executivo
  KPIs e métricas consolidadas

  [... conteúdo da página ...]
```

---

## Critérios de Aceite

1. O header mostra apenas logo + info do usuário + botão Sair
2. Não há mais abas de navegação no header (desktop e mobile)
3. Os cards de navegação no Dashboard funcionam como links para as seções
4. Nas páginas internas (Executivo, Forecast, Marketing) aparece link "← Voltar"
5. O clique no logo também retorna ao Dashboard

