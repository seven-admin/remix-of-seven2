
# Plano: Corrigir Scroll na Lista de Atividades do Calendário

## Problema

O painel de detalhes do dia está crescendo indefinidamente ao invés de mostrar scroll quando há muitas tarefas. Isso acontece porque:
- `h-full` + `overflow-y-auto` só funciona se o container pai tiver altura fixa definida
- Com `items-stretch`, ambos os cards crescem juntos, mas não há limite

## Solução Simples

Definir uma altura máxima fixa para a área de scroll da lista de atividades, independente do tamanho do calendário. Isso garante que o scroll apareça quando necessário.

## Alteração

**Arquivo:** `src/components/planejamento/PlanejamentoCalendario.tsx`

**De (linha 291):**
```tsx
<div className="h-full overflow-y-auto pr-2">
```

**Para:**
```tsx
<div className="max-h-[400px] overflow-y-auto pr-2">
```

Isso define um limite de altura de 400px (aproximadamente a altura do grid do calendário) após o qual o scroll aparecerá.

## Alternativa (mais elegante)

Usar altura calculada para alinhar com o calendário:

```tsx
<div className="max-h-[calc(100vh-400px)] min-h-[300px] overflow-y-auto pr-2">
```

Isso:
- `max-h-[calc(100vh-400px)]`: altura máxima responsiva
- `min-h-[300px]`: altura mínima para não ficar muito pequeno
- `overflow-y-auto`: scroll quando exceder

## Resumo

| Arquivo | Alteração |
|---------|-----------|
| `src/components/planejamento/PlanejamentoCalendario.tsx` | Linha 291: trocar `h-full` por `max-h-[400px]` ou `max-h-[calc(100vh-400px)] min-h-[300px]` |
