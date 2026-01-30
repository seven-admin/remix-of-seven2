
# Plano: Edição em Lote e Múltiplos Responsáveis no Planejamento

## Resumo
Implementar duas funcionalidades solicitadas:
1. **Edição em lote** de itens do planejamento
2. **Múltiplos responsáveis** por tarefa (atualmente limitado a 1)

---

## 1. Múltiplos Responsáveis por Item

### Situação Atual
A tabela `planejamento_itens` possui apenas o campo `responsavel_tecnico_id` (UUID único), limitando a 1 responsável por tarefa.

### Solução: Nova Tabela de Relacionamento

Criar tabela `planejamento_item_responsaveis` seguindo o padrão já existente em `evento_membros`:

```text
planejamento_item_responsaveis
├── id (uuid, PK)
├── item_id (uuid, FK → planejamento_itens)
├── user_id (uuid, FK → profiles)
├── papel (text) - opcional: "principal", "apoio", etc.
├── created_at (timestamp)
└── UNIQUE(item_id, user_id)
```

### Alterações no Banco de Dados (Migração SQL)
- Criar tabela `planejamento_item_responsaveis`
- Migrar dados existentes de `responsavel_tecnico_id` para a nova tabela
- Manter coluna antiga por compatibilidade (deprecar gradualmente)
- Adicionar políticas RLS (leitura para todos, escrita apenas admins)

### Alterações no Frontend

**Tipos (`src/types/planejamento.types.ts`):**
- Adicionar interface `PlanejamentoItemResponsavel`
- Atualizar `PlanejamentoItemWithRelations` para incluir array de responsáveis

**Hook (`src/hooks/usePlanejamentoItens.ts`):**
- Atualizar query para incluir `responsaveis:planejamento_item_responsaveis(user:profiles(...))`
- Adicionar mutations para adicionar/remover responsáveis

**Componente (`src/components/planejamento/PlanejamentoPlanilha.tsx`):**
- Substituir Select simples por um componente multi-select
- Exibir múltiplos responsáveis como badges/avatares
- Popover para gerenciar responsáveis (adicionar/remover)

---

## 2. Edição em Lote de Itens

### Funcionalidades
- Selecionar múltiplos itens via checkbox
- Aplicar alterações em lote: status, fase, responsáveis, datas

### Componentes a Criar/Modificar

**Novo Componente: `src/components/planejamento/EditarEmLoteDialog.tsx`**

Campos editáveis em lote:
- Status (manter / definir para... / não alterar)
- Fase (manter / definir para... / não alterar)
- Responsáveis (manter / adicionar / substituir / remover todos)
- Data Início (manter / definir / limpar)
- Data Fim (manter / definir / limpar)

Interface similar ao `AcaoEmLoteDialog` já existente em Clientes.

**Modificações em `PlanejamentoPlanilha.tsx`:**
- Adicionar coluna de checkbox para seleção
- Estado `selectedIds: Set<string>`
- Barra de ações flutuante quando há seleção
- Botão "Selecionar todos" no header

**Hook (`src/hooks/usePlanejamentoItens.ts`):**
- Nova mutation `updateItemsBulk` para atualização em lote

---

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| Migração SQL | Criar tabela `planejamento_item_responsaveis` |
| `src/types/planejamento.types.ts` | Adicionar tipos para responsáveis |
| `src/hooks/usePlanejamentoItens.ts` | Adicionar queries e mutations |
| `src/hooks/usePlanejamentoItemResponsaveis.ts` | **Criar** - Hook dedicado |
| `src/components/planejamento/PlanejamentoPlanilha.tsx` | Checkbox + multi-select |
| `src/components/planejamento/EditarEmLoteDialog.tsx` | **Criar** - Dialog de edição em lote |
| `src/components/planejamento/ResponsaveisEditor.tsx` | **Criar** - Editor de múltiplos responsáveis |

---

## Detalhes de Implementação

### Migração SQL

```sql
-- Tabela de relacionamento N:N
CREATE TABLE planejamento_item_responsaveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES planejamento_itens(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  papel text DEFAULT 'responsavel',
  created_at timestamptz DEFAULT now(),
  UNIQUE(item_id, user_id)
);

-- Migrar dados existentes
INSERT INTO planejamento_item_responsaveis (item_id, user_id, papel)
SELECT id, responsavel_tecnico_id, 'principal'
FROM planejamento_itens
WHERE responsavel_tecnico_id IS NOT NULL;

-- RLS
ALTER TABLE planejamento_item_responsaveis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura liberada" ON planejamento_item_responsaveis
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins podem gerenciar" ON planejamento_item_responsaveis
FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));
```

### Componente de Múltiplos Responsáveis

```tsx
// ResponsaveisEditor.tsx - Resumo
<Popover>
  <PopoverTrigger>
    <div className="flex -space-x-2">
      {responsaveis.map(r => (
        <Avatar key={r.id} className="h-6 w-6 border-2">
          <AvatarFallback>{r.full_name[0]}</AvatarFallback>
        </Avatar>
      ))}
      <Button variant="outline" size="icon" className="h-6 w-6">+</Button>
    </div>
  </PopoverTrigger>
  <PopoverContent>
    {/* Lista de responsáveis atuais com botão remover */}
    {/* Select para adicionar novo */}
  </PopoverContent>
</Popover>
```

### Dialog de Edição em Lote

```tsx
// Campos disponíveis
- Status: [Não alterar] [Definir para...] 
- Fase: [Não alterar] [Definir para...]
- Responsáveis: [Não alterar] [Adicionar] [Substituir por] [Remover todos]
- Data Início: [Não alterar] [Definir] [Limpar]
- Data Fim: [Não alterar] [Definir] [Limpar]
```

### Barra de Seleção na Planilha

```tsx
{selectedIds.size > 0 && (
  <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-background border rounded-lg shadow-lg p-4 flex items-center gap-4">
    <span className="text-sm font-medium">
      {selectedIds.size} item(ns) selecionado(s)
    </span>
    <Button size="sm" onClick={() => setEditEmLoteOpen(true)}>
      Editar em Lote
    </Button>
    <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>
      Cancelar
    </Button>
  </div>
)}
```

---

## Fluxo de Usuário

### Múltiplos Responsáveis
1. Admin clica na célula de responsáveis
2. Popover abre mostrando responsáveis atuais
3. Pode remover clicando no X de cada um
4. Pode adicionar selecionando do dropdown
5. Alterações são salvas automaticamente

### Edição em Lote
1. Admin marca checkbox de múltiplos itens
2. Barra flutuante aparece com contagem
3. Clica em "Editar em Lote"
4. Dialog abre com opções de alteração
5. Define quais campos alterar e valores
6. Confirma e todos os itens são atualizados

---

## Considerações Técnicas

- A coluna `responsavel_tecnico_id` será mantida para compatibilidade
- Dashboard e Timeline continuam funcionando com a nova estrutura
- O histórico (`planejamento_historico`) registrará alterações de responsáveis
- Importação via Excel será atualizada para suportar múltiplos responsáveis (separados por vírgula/ponto-e-vírgula)
