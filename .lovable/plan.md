

# Plano: Melhorias no Timeline de Planejamento

## Resumo das Alterações Solicitadas

1. **Remover aba "Planilha"** do Portal do Incorporador (somente Timeline e Dashboard)
2. **Coluna "Tarefas" adaptável** ao tamanho do texto
3. **Modal de detalhamento** ao clicar em uma tarefa na Timeline (para ambos os portais)

---

## 1. Remover Aba "Planilha" do Portal Incorporador

### Arquivo: `src/pages/portal-incorporador/PortalIncorporadorPlanejamento.tsx`

**Alterações:**
- Mudar `activeTab` inicial de `'planilha'` para `'timeline'`
- Remover o `TabsTrigger` da aba "Planilha"
- Remover o `TabsContent` da aba "Planilha"
- Remover import do componente `PlanejamentoPlanilha`
- Remover import do ícone `ClipboardList` (se não for mais usado)

**Resultado:**
O incorporador verá apenas duas abas: Timeline e Dashboard.

---

## 2. Coluna "Tarefas" Adaptável

### Arquivo: `src/components/planejamento/PlanejamentoTimeline.tsx`

**Situação Atual:**
A coluna de tarefas tem largura fixa de 200px (linha 297: `w-[200px]`).

**Solução:**
- Mudar de `w-[200px]` para `min-w-[200px] w-auto max-w-[350px]`
- Remover `truncate` dos nomes das tarefas para permitir quebra de linha
- Adicionar `whitespace-nowrap` nos itens curtos ou `break-words` para longos

**Implementação:**
```tsx
// Antes (linha 297)
<div className="w-[200px] flex-shrink-0 border-r bg-card z-10">

// Depois
<div className="min-w-[200px] w-fit max-w-[350px] flex-shrink-0 border-r bg-card z-10">
```

Para os nomes das tarefas, usar `text-ellipsis overflow-hidden` apenas quando muito longos, ou permitir quebra de linha:
```tsx
// Antes (linha 326-327)
className="border-b flex items-center px-3 text-sm truncate hover:bg-muted/20"
title={item.item}

// Depois
className="border-b flex items-center px-3 text-sm hover:bg-muted/20"
title={item.item}
// Texto se ajusta naturalmente
```

---

## 3. Modal de Detalhamento ao Clicar na Tarefa

### Novo Componente: `src/components/planejamento/TarefaDetalheDialog.tsx`

Modal que exibe informações completas da tarefa quando clicada na Timeline.

**Campos exibidos:**
- Nome da tarefa (item)
- Fase
- Status (com badge colorido)
- Data início e Data fim
- Responsáveis (lista com avatares)
- Observações
- Histórico de alterações (usando `usePlanejamentoHistorico`)

**Estrutura do componente:**
```tsx
interface TarefaDetalheDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PlanejamentoItemWithRelations | null;
}

export function TarefaDetalheDialog({ open, onOpenChange, item }: TarefaDetalheDialogProps) {
  const { historico, isLoading: loadingHistorico } = usePlanejamentoHistorico(item?.id);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalhes da Tarefa</DialogTitle>
        </DialogHeader>
        
        {/* Conteúdo com informações da tarefa */}
        {/* Tabs: Detalhes | Histórico */}
      </DialogContent>
    </Dialog>
  );
}
```

### Modificação: `src/components/planejamento/PlanejamentoTimeline.tsx`

**Adicionar estado e handler:**
```tsx
const [selectedItem, setSelectedItem] = useState<PlanejamentoItemWithRelations | null>(null);
const [detalheOpen, setDetalheOpen] = useState(false);

const handleItemClick = (item: PlanejamentoItemWithRelations) => {
  setSelectedItem(item);
  setDetalheOpen(true);
};
```

**Modificar as barras clicáveis (linha 411-430):**
```tsx
<div
  className={cn(
    "absolute top-1 h-[calc(100%-8px)] rounded-md cursor-pointer transition-all hover:brightness-110",
    pos.isOverdue ? "bg-destructive/80" : ""
  )}
  style={{...}}
  onClick={() => handleItemClick(item)}  // NOVO
>
```

**Modificar os nomes na coluna (linha 323-331):**
```tsx
<div 
  key={item.id}
  className="border-b flex items-center px-3 text-sm hover:bg-muted/20 cursor-pointer"
  style={{ height: ROW_HEIGHT }}
  title={item.item}
  onClick={() => handleItemClick(item)}  // NOVO
>
```

**Renderizar o dialog no final:**
```tsx
<TarefaDetalheDialog
  open={detalheOpen}
  onOpenChange={setDetalheOpen}
  item={selectedItem}
/>
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/portal-incorporador/PortalIncorporadorPlanejamento.tsx` | Remover aba Planilha |
| `src/components/planejamento/PlanejamentoTimeline.tsx` | Coluna adaptável + onClick para modal |
| `src/components/planejamento/TarefaDetalheDialog.tsx` | **Criar** - Modal de detalhamento |

---

## Layout do Modal de Detalhamento

```text
┌─────────────────────────────────────────────────────┐
│  Detalhes da Tarefa                              ✕  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Nome da Tarefa]                                   │
│                                                     │
│  [Badge: Fase]  [Badge: Status]  [Badge: Atrasado?] │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  📅 Data Início: 15/01/2026                         │
│  📅 Data Fim: 30/01/2026                            │
│                                                     │
│  👤 Responsáveis:                                   │
│     • João Silva (Principal)                        │
│     • Maria Santos (Apoio)                          │
│                                                     │
│  📝 Observações:                                    │
│     Lorem ipsum dolor sit amet...                   │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  📜 Histórico de Alterações:                        │
│     • 28/01 - Status alterado: Pendente → Em And... │
│     • 25/01 - Data fim alterada: 28/01 → 30/01      │
│     • 15/01 - Tarefa criada por Admin               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Fluxo de Usuário Final

### Portal do Incorporador (`/portal-incorporador/planejamento`)
1. Usuário seleciona empreendimento
2. Vê apenas abas **Timeline** e **Dashboard**
3. Na Timeline, clica em uma barra de tarefa
4. Modal abre com detalhes completos (somente leitura)

### Sistema Principal (`/planejamento`)
1. Usuário continua tendo todas as 3 abas
2. Na Timeline, clica em uma tarefa
3. Modal abre com detalhes + histórico

---

## Observações Técnicas

- O componente `TarefaDetalheDialog` será reutilizável em ambos os contextos
- A largura adaptável da coluna usa `w-fit` com min/max constraints para evitar extremos
- O histórico já existe no hook `usePlanejamentoHistorico` e será integrado ao modal
- O modal é somente visualização (não permite edição direta)

