

# Plano: Remover Label "Contratante"

## Objetivo

Remover a informação "Contratante" que aparece abaixo do nome do usuário no header do Portal do Incorporador.

---

## Mudança Visual

### Antes (Atual)
```text
┌─────────────────────────────────────────────────────────────────────┐
│ [Logo]                                       Artur Gonzales [Sair]  │
│ Portal do Incorporador                       Contratante           │
└─────────────────────────────────────────────────────────────────────┘
```

### Depois (Proposto)
```text
┌─────────────────────────────────────────────────────────────────────┐
│ [Logo]                                       Artur Gonzales [Sair]  │
│ Portal do Incorporador                                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Alteração Técnica

### Arquivo: `src/components/portal-incorporador/PortalIncorporadorLayout.tsx`

**Antes:**
```tsx
<div className="text-right hidden sm:block">
  <p className="text-sm font-medium">{profile?.full_name}</p>
  <p className="text-xs text-muted-foreground">Contratante</p>
</div>
```

**Depois:**
```tsx
<div className="text-right hidden sm:block">
  <p className="text-sm font-medium">{profile?.full_name}</p>
</div>
```

---

## Resultado

- Header mais limpo
- Apenas o nome do usuário será exibido
- Mantém o layout responsivo (hidden sm:block)

