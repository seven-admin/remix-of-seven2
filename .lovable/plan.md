

# Plano: Mover Título para o Header

## Objetivo

Posicionar "Portal do Incorporador" ao lado da logo no header e remover o título duplicado da área de conteúdo na página principal.

---

## Mudança Visual

### Antes (Atual)
```text
┌─────────────────────────────────────────────────────────────────────┐
│ [Logo]                                       Nome Usuário   [Sair]  │
└─────────────────────────────────────────────────────────────────────┘

  Portal do Incorporador          <-- Título abaixo do header
  Visão geral dos seus empreendimentos
```

### Depois (Proposto)
```text
┌─────────────────────────────────────────────────────────────────────┐
│ [Logo]  Portal do Incorporador               Nome Usuário   [Sair]  │
└─────────────────────────────────────────────────────────────────────┘

  Visão geral dos seus empreendimentos    <-- Apenas subtitle
```

---

## Comportamento por Página

| Página | Header | Área de Conteúdo |
|--------|--------|------------------|
| `/portal-incorporador` | Logo + "Portal do Incorporador" | Apenas subtitle |
| `/portal-incorporador/executivo` | Logo + "Portal do Incorporador" | "Voltar" + "Dashboard Executivo" + subtitle |
| `/portal-incorporador/forecast` | Logo + "Portal do Incorporador" | "Voltar" + "Forecast" + subtitle |
| `/portal-incorporador/marketing` | Logo + "Portal do Incorporador" | "Voltar" + "Produção de Marketing" + subtitle |

---

## Alterações Técnicas

### Arquivo: `src/components/portal-incorporador/PortalIncorporadorLayout.tsx`

**1. Adicionar título ao lado da logo no header:**

```tsx
<Link to="/portal-incorporador" className="flex items-center gap-3">
  <img src={logo} alt="Logo" className="h-8" />
  <span className="font-semibold text-lg hidden sm:inline">
    Portal do Incorporador
  </span>
</Link>
```

**2. Ajustar área de conteúdo:**

- Na página principal (`/portal-incorporador`): exibir apenas o subtitle
- Nas páginas internas: manter título específico (Dashboard Executivo, Forecast, etc.)

```tsx
<div className="mb-6">
  {isInternalPage && (
    <>
      <Link to="/portal-incorporador" className="...">
        <ArrowLeft /> Voltar
      </Link>
      <h1 className="text-2xl font-bold">{title}</h1>
    </>
  )}
  {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
</div>
```

---

## Resultado Final

- Header mais informativo com identificação clara do portal
- Página principal sem título duplicado (apenas subtitle)
- Páginas internas mantêm seus títulos específicos
- Título "Portal do Incorporador" oculto em mobile (para não ocupar espaço)

