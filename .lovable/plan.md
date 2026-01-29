

# Plano: Título Abaixo da Logo (Layout Empilhado)

## Objetivo

Reorganizar o header para que "Portal do Incorporador" fique **abaixo** da logo, criando um layout empilhado e alinhado à esquerda.

---

## Mudança Visual

### Antes (Atual - Lado a Lado)
```text
┌─────────────────────────────────────────────────────────────────────┐
│ [Logo]  Portal do Incorporador               Nome Usuário   [Sair]  │
└─────────────────────────────────────────────────────────────────────┘
```

### Depois (Proposto - Empilhado)
```text
┌─────────────────────────────────────────────────────────────────────┐
│ [sevengroup LOGO]                            Nome Usuário   [Sair]  │
│ Portal do Incorporador                                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Alterações Técnicas

### Arquivo: `src/components/portal-incorporador/PortalIncorporadorLayout.tsx`

**Mudança no Link/Logo:**

```tsx
// ANTES (flex horizontal)
<Link to="/portal-incorporador" className="flex items-center gap-3">
  <img src={logo} alt="Logo" className="h-10" />
  <span className="font-semibold text-xl hidden sm:inline leading-none">
    Portal do Incorporador
  </span>
</Link>

// DEPOIS (flex vertical/empilhado)
<Link to="/portal-incorporador" className="flex flex-col">
  <img src={logo} alt="Logo" className="h-8" />
  <span className="text-sm font-medium text-muted-foreground hidden sm:inline">
    Portal do Incorporador
  </span>
</Link>
```

**Ajuste no Header (altura):**

Como teremos duas linhas, precisamos aumentar a altura do header:

```tsx
// ANTES
<div className="container flex h-16 items-center justify-between">

// DEPOIS  
<div className="container flex h-20 items-center justify-between">
```

---

## Detalhes de Estilo

| Elemento | Valor | Motivo |
|----------|-------|--------|
| Container | `flex flex-col` | Empilhar logo + texto |
| Logo | `h-8` | Volta ao tamanho menor pois terá texto abaixo |
| Texto | `text-sm font-medium text-muted-foreground` | Secundário, mais discreto |
| Header altura | `h-20` (80px) | Acomodar duas linhas |

---

## Resultado Esperado

Layout mais clean com identificação clara do portal, mantendo o texto visualmente subordinado à logo principal da Seven Group.

