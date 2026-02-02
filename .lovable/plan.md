
# Plano: Organizar Lista de Unidades por Andar, Bloco e Numero

## Situacao Atual

Na pagina `/negociacoes/nova`, o componente `UnidadeSelectorCard.tsx` exibe as unidades disponiveis em um grid simples, sem organizacao hierarquica:

```typescript
// Codigo atual - sem agrupamento
{unidadesFiltradas.map(unidade => (
  <button ...>
    {codigo}
    {unidade.bloco && <div>{unidade.bloco.nome}</div>}
    {formatCurrency(valor)}
  </button>
))}
```

O hook `useUnidades` ja traz as unidades ordenadas por `andar` e `numero` no banco, mas essa ordenacao nao considera agrupamento visual por bloco.

## Solucao Proposta

Utilizar a funcao `groupUnidadesByBloco` ja existente em `src/lib/mapaUtils.ts` para agrupar e ordenar as unidades de forma hierarquica:

```
┌─────────────────────────────────────────────────────────┐
│  Unidades Disponiveis                                   │
├─────────────────────────────────────────────────────────┤
│  ▼ Quadra A (6 unidades)                                │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│  │ 101 │ │ 102 │ │ 103 │ │ 201 │ │ 202 │ │ 203 │      │
│  │ 1º  │ │ 1º  │ │ 1º  │ │ 2º  │ │ 2º  │ │ 2º  │      │
│  │R$X  │ │R$X  │ │R$X  │ │R$X  │ │R$X  │ │R$X  │      │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘      │
│                                                         │
│  ▼ Quadra B (4 unidades)                                │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                       │
│  │ 01  │ │ 02  │ │ 03  │ │ 04  │                       │
│  │R$X  │ │R$X  │ │R$X  │ │R$X  │                       │
│  └─────┘ └─────┘ └─────┘ └─────┘                       │
└─────────────────────────────────────────────────────────┘
```

### Comportamento da Ordenacao

1. **Blocos/Quadras**: Ordenados naturalmente ("Quadra 2" antes de "Quadra 10")
2. **Dentro de cada Bloco**: Ordenados por Andar (crescente), depois por Numero
3. **Sem Bloco**: Agrupado no final da lista
4. **Exibicao de Andar**: Mostrar indicador de andar quando disponivel

---

## Implementacao Tecnica

### Arquivo: `src/components/propostas/UnidadeSelectorCard.tsx`

**1. Adicionar import:**
```typescript
import { groupUnidadesByBloco } from '@/lib/mapaUtils';
```

**2. Criar memo para unidades agrupadas:**
```typescript
const unidadesAgrupadas = useMemo(() => 
  groupUnidadesByBloco(unidadesFiltradas),
  [unidadesFiltradas]
);
```

**3. Atualizar o render do grid:**
Substituir o grid plano por uma estrutura agrupada usando `Collapsible`:

```typescript
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Para cada grupo (bloco)
{Array.from(unidadesAgrupadas.entries()).map(([blocoNome, unidadesDoBloco]) => (
  <Collapsible key={blocoNome} defaultOpen className="border rounded-lg">
    <CollapsibleTrigger className="w-full p-2 flex justify-between hover:bg-muted/50">
      <span className="font-medium">{blocoNome}</span>
      <Badge variant="outline">{unidadesDoBloco.length}</Badge>
    </CollapsibleTrigger>
    <CollapsibleContent className="p-2 pt-0">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {unidadesDoBloco.map(unidade => (
          // Card da unidade com indicador de andar
        ))}
      </div>
    </CollapsibleContent>
  </Collapsible>
))}
```

**4. Adicionar indicador de andar no card:**
```typescript
<button ...>
  <div className="font-medium text-sm">{codigo}</div>
  {unidade.andar && (
    <div className="text-xs text-muted-foreground">{unidade.andar}º andar</div>
  )}
  <div className="text-xs font-mono mt-1">
    {formatCurrency(valor)}
  </div>
</button>
```

---

## Resultado Esperado

| Antes | Depois |
|-------|--------|
| Grid plano sem agrupamento | Grupos colapsaveis por Bloco/Quadra |
| Ordem arbitraria | Blocos ordenados naturalmente |
| Sem indicador de andar | Andar visivel quando disponivel |
| Dificil encontrar unidades | Navegacao hierarquica intuitiva |

---

## Arquivos Modificados

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/propostas/UnidadeSelectorCard.tsx` | Agrupar unidades por bloco, adicionar indicador de andar |

Nenhuma alteracao de banco de dados necessaria - a funcao de agrupamento ja existe no projeto.
