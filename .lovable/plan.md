

# Plano: Estender Cores de Categoria aos Subitens do Sidebar

## Contexto

Atualmente, os **ícones dos grupos** (ex: Financeiro, Comercial) recebem a cor da categoria, mas os **subitens internos** (ex: Fluxo de Caixa, DRE) permanecem brancos. Sua sugestão é replicar a cor para os subitens, criando uma hierarquia visual mais coesa.

## Comparação Visual

### Antes (atual)
```text
┌─────────────────────────────────┐
│ ▌ 💛 Financeiro           ▼    │  ← Ícone amarelo
│  │   ⚪ Fluxo de Caixa         │  ← Ícone branco
│  │   ⚪ DRE                    │  ← Ícone branco
│  │   ⚪ Comissões              │  ← Ícone branco
└─────────────────────────────────┘
```

### Depois (proposta)
```text
┌─────────────────────────────────┐
│ ▌ 💛 Financeiro           ▼    │  ← Ícone amarelo
│  │   💛 Fluxo de Caixa         │  ← Ícone amarelo
│  │   💛 DRE                    │  ← Ícone amarelo
│  │   💛 Comissões              │  ← Ícone amarelo
└─────────────────────────────────┘
```

## Implementação

A alteração é simples e requer apenas modificar a função `renderMenuItem` para receber a cor do grupo pai e aplicá-la ao ícone do subitem.

### Alterações no Arquivo

| Arquivo | Alteração |
|---------|-----------|
| `src/components/layout/Sidebar.tsx` | Passar a cor do grupo para `renderMenuItem` e aplicar ao ícone |

## Detalhes Técnicos

### Função renderMenuItem Atualizada

```typescript
// Adicionar parâmetro groupColor
const renderMenuItem = (item: MenuItem, showLabel: boolean, groupColor?: string) => {
  const [basePath, queryString] = item.path.split('?');
  const isActive = queryString 
    ? location.pathname === basePath && location.search === `?${queryString}`
    : location.pathname === item.path && !location.search;
  
  return (
    <Link
      key={item.path}
      to={item.path}
      onClick={() => setMobileOpen(false)}
      className={cn(
        'sidebar-nav-item',
        isActive ? 'sidebar-nav-item-active' : 'sidebar-nav-item-inactive'
      )}
      title={!showLabel ? item.label : undefined}
    >
      <item.icon 
        className="h-4 w-4 flex-shrink-0" 
        style={groupColor ? { color: groupColor } : undefined}  // Aplicar cor
      />
      {showLabel && <span>{item.label}</span>}
    </Link>
  );
};
```

### Chamada Atualizada no renderGroup

```typescript
<CollapsibleContent className="pl-4 space-y-0.5 mt-1 ...">
  {group.items.map((item) => renderMenuItem(item, true, groupColor))}
</CollapsibleContent>
```

## Benefícios

1. **Consistência visual**: Todos os ícones de uma categoria compartilham a mesma cor
2. **Identificação rápida**: Ao ver um subitem, o usuário sabe imediatamente a qual categoria pertence
3. **Hierarquia reforçada**: A cor cria uma conexão visual entre grupo e subitens
4. **Implementação mínima**: Apenas 3-4 linhas de código alteradas

## Resultado Final Esperado

```text
┌─────────────────────────────────┐
│ ▌ 🟢 Empreendimentos      ▼    │
│  │   🟢 Listagem               │
│  │   🟢 Mapa de Unidades       │
├─────────────────────────────────┤
│ ▌ 🟡 Financeiro           ▼    │
│  │   🟡 Fluxo de Caixa         │
│  │   🟡 DRE                    │
│  │   🟡 Comissões              │
│  │   🟡 Bonificações           │
├─────────────────────────────────┤
│ ▌ 🟠 Comercial            ▼    │
│  │   🟠 Fichas de Proposta     │
│  │   🟠 Solicitações           │
└─────────────────────────────────┘
```

