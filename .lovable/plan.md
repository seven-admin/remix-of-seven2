
# Plano: Correções da Página Financeiro

## Problemas Identificados

1. **Filtro por Tipo inexistente** - Não há seletor para filtrar Entradas/Saídas na aba Movimentações
2. **Filtro automático não funciona** - O hook `useLancamentos` aceita filtro `tipo`, mas a página não utiliza
3. **Paginação incorreta/inexistente** - Todos os lançamentos do mês são carregados de uma vez
4. **Warning de forwardRef** - O componente `SortableHeader` precisa ser convertido para `forwardRef`

## Solução Proposta

### 1. Adicionar Filtro por Tipo (Entrada/Saída/Todos)

Criar um estado e seletor na toolbar da aba Movimentações:

```text
┌─────────────────────────────────────────────────────────────────┐
│  [Todos ▼]  [Centro Custo ▼]  [Status ▼]     [Nova Entrada] [+] │
│                                                                  │
│  Tabela de lançamentos...                                       │
└─────────────────────────────────────────────────────────────────┘
```

Opções do filtro:
- **Todos** - Mostra entradas e saídas
- **Entradas** - Filtra por `tipo = 'receber'`
- **Saídas** - Filtra por `tipo = 'pagar'`

### 2. Integrar Filtro com Hook useLancamentos

Passar o parâmetro `tipo` para o hook quando filtro estiver ativo:

```typescript
const [tipoFilter, setTipoFilter] = useState<'todos' | 'receber' | 'pagar'>('todos');

const { data: lancamentos = [] } = useLancamentos({
  data_inicio: startDate,
  data_fim: endDate,
  tipo: tipoFilter !== 'todos' ? tipoFilter : undefined,
});
```

### 3. Implementar Paginação Client-Side

Adicionar paginação com controles usando o componente existente `PaginationControls`:

```typescript
const [page, setPage] = useState(1);
const pageSize = 20;

const paginatedLancamentos = useMemo(() => {
  const start = (page - 1) * pageSize;
  return sortedLancamentos.slice(start, start + pageSize);
}, [sortedLancamentos, page]);

const totalPages = Math.ceil(sortedLancamentos.length / pageSize);
```

### 4. Corrigir Warning do SortableHeader

Converter para `forwardRef` para evitar o warning do React:

```typescript
const SortableHeader = React.forwardRef<
  HTMLTableCellElement,
  { column: string; label: string; className?: string }
>(({ column, label, className }, ref) => (
  <TableHead 
    ref={ref}
    className={`cursor-pointer select-none hover:bg-muted/50 ${className || ''}`}
    onClick={() => handleSort(column)}
  >
    <div className="flex items-center gap-1">
      {label}
      {sortConfig?.key === column ? (
        sortConfig.direction === 'asc' 
          ? <ChevronUp className="h-4 w-4" />
          : <ChevronDown className="h-4 w-4" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-30" />
      )}
    </div>
  </TableHead>
));
SortableHeader.displayName = 'SortableHeader';
```

## Alterações de Arquivos

### `src/pages/Financeiro.tsx`

**Novos estados:**
- `tipoFilter` - Filtro de tipo (todos/receber/pagar)
- `page` - Página atual da paginação

**Modificações:**
1. Adicionar import do `React` para `forwardRef`
2. Converter `SortableHeader` para usar `forwardRef`
3. Adicionar Select de filtro por tipo na toolbar
4. Passar filtro `tipo` para o hook `useLancamentos`
5. Implementar lógica de paginação com `useMemo`
6. Adicionar componente `PaginationControls` abaixo da tabela
7. Resetar página ao mudar filtros

## Resultado Esperado

- Filtro por tipo funcionando corretamente
- Paginação com 20 itens por página
- Warning de console eliminado
- Interface mais organizada para gerenciar grandes volumes de dados

## Seção Técnica

### Dependências
- Usar `PaginationControls` de `@/components/ui/pagination-controls`
- Manter compatibilidade com ordenação existente (`sortedLancamentos`)

### Reset de Página
A página deve resetar para 1 quando:
- O mês selecionado mudar
- O filtro de tipo mudar
- O filtro de status mudar (se adicionado)

### Filtros no Hook
O hook `useLancamentos` já suporta o parâmetro `tipo` (linhas 55-57 do useFinanceiro.ts), então basta passar o valor quando não for "todos".
