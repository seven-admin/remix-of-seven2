

# Plano: Corrigir Alinhamento do Header

## Problema Identificado

O texto "Portal do Incorporador" não está centralizado verticalmente com o logo. O logo contém duas linhas de texto (nome + tagline) o que o torna mais alto, e o texto do título está ficando desalinhado.

---

## Solução

Ajustar o CSS para garantir alinhamento vertical central entre logo e texto:

### Mudanças no Header

**Arquivo:** `src/components/portal-incorporador/PortalIncorporadorLayout.tsx`

**Antes:**
```tsx
<Link to="/portal-incorporador" className="flex items-center gap-3">
  <img src={logo} alt="Logo" className="h-8" />
  <span className="font-semibold text-lg hidden sm:inline">
    Portal do Incorporador
  </span>
</Link>
```

**Depois:**
```tsx
<Link to="/portal-incorporador" className="flex items-center gap-3">
  <img src={logo} alt="Logo" className="h-10" />
  <span className="font-semibold text-xl hidden sm:inline leading-none">
    Portal do Incorporador
  </span>
</Link>
```

### Alterações:

| Elemento | Antes | Depois | Motivo |
|----------|-------|--------|--------|
| Logo altura | `h-8` (32px) | `h-10` (40px) | Aumentar para melhor legibilidade e proporção |
| Texto tamanho | `text-lg` | `text-xl` | Proporção visual com logo maior |
| Line-height | padrão | `leading-none` | Remove espaçamento extra que causa desalinhamento |

---

## Resultado Esperado

```text
┌─────────────────────────────────────────────────────────────────────┐
│ [sevengroup     ]                                                   │
│ [ACELERADORA...]   Portal do Incorporador       Nome Usuário [Sair] │
└─────────────────────────────────────────────────────────────────────┘
         ↑                    ↑
    Logo centrado        Texto centrado verticalmente
```

O `items-center` do flex garantirá que ambos fiquem alinhados pelo centro vertical.

