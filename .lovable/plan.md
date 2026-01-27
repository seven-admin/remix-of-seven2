

# Proposta: Modernização do Sidebar com Categorias Coloridas

## Visão Geral

Transformar o sidebar atual em uma experiência visual mais intuitiva, usando cores para identificar rapidamente cada categoria de módulos. A ideia é manter a elegância do design escuro atual, adicionando sutis indicadores de cor que não sobrecarreguem visualmente.

## Análise do Estado Atual

O sidebar possui **12 grupos de navegação**:
- Dashboard, Empreendimentos, Clientes, Forecast, Comercial, Contratos
- Financeiro, Parceiros, Marketing, Eventos, Utilidades, Sistema

Atualmente todos usam o mesmo visual neutro (branco/cinza), dificultando a identificação rápida de onde cada módulo está.

## Proposta de Cores por Categoria

Usando a paleta já definida em `chartColors.ts` para manter consistência:

| Categoria | Cor | Código | Justificativa |
|-----------|-----|--------|---------------|
| Dashboard | Azul | `#3B82F6` | Visão analítica, dados |
| Empreendimentos | Verde | `#10B981` | Crescimento, imóveis |
| Clientes | Roxo | `#8B5CF6` | Relacionamento, pessoas |
| Forecast | Ciano | `#06B6D4` | Previsão, futuro |
| Comercial | Laranja | `#F97316` | Vendas, energia |
| Contratos | Azul Escuro | `#3B82F6` | Documentos, formalidade |
| Financeiro | Amarelo | `#F59E0B` | Dinheiro, ouro |
| Parceiros | Rosa | `#EC4899` | Relacionamentos |
| Marketing | Rosa | `#EC4899` | Criatividade |
| Eventos | Ciano | `#06B6D4` | Calendário, agenda |
| Utilidades | Cinza | `#6B7280` | Ferramentas gerais |
| Sistema | Vermelho | `#EF4444` | Configurações críticas |

## 3 Opções de Implementação Visual

### Opção A: Borda Lateral Colorida (Recomendada)
Uma barra fina colorida na lateral esquerda do grupo quando expandido:

```text
┌──────────────────────────────┐
│ ▌🟠 Comercial           ▼   │  ← Barra laranja na lateral
│     Fichas de Proposta      │
│     Solicitações            │
├──────────────────────────────┤
│ ▌🟡 Financeiro          ▼   │  ← Barra amarela
│     Fluxo de Caixa          │
│     DRE                     │
└──────────────────────────────┘
```

**Vantagens**: Sutil, elegante, não interfere no conteúdo

### Opção B: Ícone Colorido
Os ícones dos grupos recebem a cor da categoria:

```text
┌──────────────────────────────┐
│ 🎯 Comercial            ▼   │  ← Ícone Target em laranja
│     Fichas de Proposta      │
│     Solicitações            │
├──────────────────────────────┤
│ 💰 Financeiro           ▼   │  ← Ícone DollarSign em amarelo
│     Fluxo de Caixa          │
│     DRE                     │
└──────────────────────────────┘
```

**Vantagens**: Fácil identificação visual, sem elementos extras

### Opção C: Badge/Ponto Colorido
Um pequeno círculo colorido antes do nome do grupo:

```text
┌──────────────────────────────┐
│ 🟠 • Comercial          ▼   │  ← Círculo laranja
│     Fichas de Proposta      │
│     Solicitações            │
├──────────────────────────────┤
│ 🟡 • Financeiro         ▼   │  ← Círculo amarelo
│     Fluxo de Caixa          │
│     DRE                     │
└──────────────────────────────┘
```

**Vantagens**: Muito sutil, ocupa pouco espaço

## Sugestão de Implementação Combinada

Combinar **Opção A + Opção B** para máximo impacto visual:
- Ícone do grupo com a cor da categoria
- Borda lateral colorida quando o grupo está expandido
- Ao passar o mouse, um leve fundo com a cor em opacidade baixa

```text
┌──────────────────────────────┐
│ ▌ 💰 Financeiro         ▼   │  ← Ícone amarelo + borda
│  │   Fluxo de Caixa         │
│  │   DRE                    │
│  │   Comissões              │
│  │   Bonificações           │
└──────────────────────────────┘
```

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/layout/Sidebar.tsx` | Adicionar propriedade `color` aos grupos e aplicar estilos |
| `src/index.css` | Adicionar classes CSS para cada cor de categoria |
| `src/lib/chartColors.ts` | Adicionar `CORES_SIDEBAR` com mapeamento de categorias |

## Seção Técnica

### Nova Interface MenuGroup

```typescript
interface MenuGroup {
  label: string | null;
  icon?: LucideIcon;
  items: MenuItem[];
  color?: string; // Nova propriedade para a cor da categoria
}
```

### Mapeamento de Cores

```typescript
// src/lib/chartColors.ts
export const CORES_SIDEBAR = {
  dashboard: '#3B82F6',      // Azul
  empreendimentos: '#10B981', // Verde
  clientes: '#8B5CF6',       // Roxo
  forecast: '#06B6D4',       // Ciano
  comercial: '#F97316',      // Laranja
  contratos: '#3B82F6',      // Azul
  financeiro: '#F59E0B',     // Amarelo
  parceiros: '#EC4899',      // Rosa
  marketing: '#EC4899',      // Rosa
  eventos: '#06B6D4',        // Ciano
  utilidades: '#6B7280',     // Cinza
  sistema: '#EF4444',        // Vermelho
} as const;
```

### Exemplo de Grupo com Cor

```typescript
const menuGroups: MenuGroup[] = [
  {
    label: 'Financeiro',
    icon: DollarSign,
    color: CORES_SIDEBAR.financeiro, // '#F59E0B'
    items: [
      { icon: Wallet, label: 'Fluxo de Caixa', path: '/financeiro', moduleName: 'financeiro_fluxo' },
      // ...
    ],
  },
];
```

### Estilos CSS

```css
/* Borda lateral colorida para grupo expandido */
.sidebar-group-colored {
  position: relative;
}

.sidebar-group-colored::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: var(--group-color);
  border-radius: 0 2px 2px 0;
  opacity: 0;
  transition: opacity 0.2s;
}

.sidebar-group-colored[data-state="open"]::before {
  opacity: 1;
}

/* Hover com cor de fundo sutil */
.sidebar-group-trigger:hover {
  background-color: color-mix(in srgb, var(--group-color) 10%, transparent);
}
```

### Componente Atualizado

```tsx
const renderGroup = (group: MenuGroup) => {
  // ...
  return (
    <Collapsible 
      key={group.label} 
      open={isOpen} 
      onOpenChange={() => toggleGroup(group.label)}
      className="sidebar-group-colored"
      style={{ '--group-color': group.color } as React.CSSProperties}
    >
      <CollapsibleTrigger asChild>
        <button className="sidebar-nav-item sidebar-group-trigger ...">
          <div className="flex items-center gap-3">
            {GroupIcon && (
              <GroupIcon 
                className="h-4 w-4 flex-shrink-0" 
                style={{ color: group.color }} // Ícone colorido
              />
            )}
            <span>{group.label}</span>
          </div>
          <ChevronDown className="..." />
        </button>
      </CollapsibleTrigger>
      {/* ... */}
    </Collapsible>
  );
};
```

## Benefícios

1. **Navegação mais rápida**: Cores ajudam a encontrar módulos visualmente
2. **Consistência visual**: Usa a mesma paleta dos dashboards
3. **Hierarquia clara**: Diferencia grupos principais de itens internos
4. **Modernização sutil**: Não altera drasticamente o design atual
5. **Acessibilidade**: Cores são complementares ao texto, não substituem

## Próximos Passos

Após aprovação, posso implementar qualquer uma das 3 opções ou a combinação sugerida. Qual abordagem você prefere?

