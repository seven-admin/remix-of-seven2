
# Correção: Scroll não funciona na Seção de Mapeamento de Quadras

## Problema Identificado

Analisando a estrutura do componente e o contexto do problema de scroll que não aparece quando há mais de 9 quadras:

| Local | Código Atual | Problema |
|-------|--------------|----------|
| Linha 747 | `<ScrollArea className="flex-1 max-h-[50vh]">` | O `flex-1` faz o container expandir para caber todo conteúdo, ignorando `max-h-[50vh]` |
| Linha 746 | `<div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">` | Parent com `overflow-hidden` mas flex layout conflitante |

O problema é que quando você usa `flex-1` em um `ScrollArea`, o container cresce para acomodar todo o conteúdo, mesmo com `max-h-[50vh]`. O scroll só funciona quando o container tem uma **altura fixa ou limitada** que é menor que o conteúdo.

## Solução

Remover `flex-1` do `ScrollArea` e manter apenas `max-h-[50vh]` para garantir que a altura seja limitada e o scroll apareça:

### Modificação no Arquivo

| Arquivo | Linha | Alteração |
|---------|-------|-----------|
| `src/components/empreendimentos/ImportarUnidadesDialog.tsx` | 747 | Trocar `flex-1 max-h-[50vh]` por `max-h-[50vh] w-full` |
| Mesma linha | - | Adicionar `overflow-y-auto` como fallback se necessário |

### Código

**Antes (linha 747):**
```tsx
<ScrollArea className="flex-1 max-h-[50vh]">
```

**Depois:**
```tsx
<ScrollArea className="max-h-[50vh] w-full">
```

Também vou ajustar o container pai (linha 746) para garantir que o layout funcione corretamente sem o `flex-1` no `ScrollArea`:

**Antes (linha 746):**
```tsx
<div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
```

**Depois:**
```tsx
<div className="flex-1 overflow-hidden flex flex-col gap-4 py-4 min-h-0">
```

O `min-h-0` é crucial em layouts flexbox porque por padrão o `min-height` é `auto`, o que impede o shrink do container.

## Resumo de Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/components/empreendimentos/ImportarUnidadesDialog.tsx` | Corrigir classes CSS do ScrollArea e container pai na etapa "mapear-valores" |

## Teste Esperado

Após a correção:
1. Importar um arquivo Excel com mais de 9 quadras
2. Na etapa 3 (Mapear Valores), o usuário deve ver uma barra de scroll vertical
3. Todas as quadras devem ser acessíveis via scroll
