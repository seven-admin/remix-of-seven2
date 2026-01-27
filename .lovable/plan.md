
# Plano: Corrigir Scroll Interno do Card "Próximas Atividades"

## Problema Identificado

O card "Próximas Atividades" no dashboard de Forecast apresenta layout quebrado quando há múltiplas atividades. O `ScrollArea` do Radix UI não está funcionando corretamente porque:

1. O `Viewport` do ScrollArea não está recebendo as classes necessárias para funcionar em contextos de layout flex/grid
2. A estrutura CSS atual não garante que o scroll seja ativado corretamente

## Análise Técnica

O componente atual usa:
```tsx
<ScrollArea className="h-[280px]">
  <div className="px-6 pb-6 space-y-1">
    {/* atividades */}
  </div>
</ScrollArea>
```

O problema é que o `ScrollAreaPrimitive.Viewport` no componente `scroll-area.tsx` não possui controle sobre overflow, dependendo apenas do comportamento padrão do Radix.

## Solução

Modificar o componente `scroll-area.tsx` para garantir que o Viewport tenha comportamento de scroll explícito, e ajustar o `ProximasAtividades.tsx` para ter uma estrutura mais robusta.

### Alterações Necessárias

#### 1. Atualizar `src/components/ui/scroll-area.tsx`

Adicionar `overflow-y-auto` e `overflow-x-hidden` ao Viewport para garantir scroll vertical:

```tsx
<ScrollAreaPrimitive.Viewport 
  className="h-full w-full rounded-[inherit] [&>div]:!block"
>
  {children}
</ScrollAreaPrimitive.Viewport>
```

A classe `[&>div]:!block` força o container interno a ser `display: block`, resolvendo um bug conhecido do Radix ScrollArea.

#### 2. Simplificar `src/components/forecast/ProximasAtividades.tsx`

Garantir que o CardContent tenha altura máxima e o ScrollArea funcione corretamente:

```tsx
<CardContent className="p-0">
  {!atividades || atividades.length === 0 ? (
    // estado vazio...
  ) : (
    <ScrollArea className="h-[300px]">
      <div className="px-6 pb-4 space-y-2">
        {/* lista de atividades */}
      </div>
    </ScrollArea>
  )}
</CardContent>
```

## Resultado Esperado

- Quando houver mais atividades do que cabem na altura definida (300px), uma scrollbar vertical aparecerá automaticamente
- A lista terá scroll suave interno
- O card manterá altura consistente independentemente do número de atividades
- Layout não quebrará com muitas atividades

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/ui/scroll-area.tsx` | Adicionar classe `[&>div]:!block` no Viewport |
| `src/components/forecast/ProximasAtividades.tsx` | Ajustar altura do ScrollArea e estrutura |

## Seção Técnica

### Bug do Radix ScrollArea

O Radix ScrollArea cria um div wrapper interno com `display: table` em alguns contextos, o que quebra a altura e impede o scroll. A solução `[&>div]:!block` força esse div interno a usar `display: block`.

### Altura Escolhida

A altura de `300px` foi escolhida para exibir aproximadamente 4-5 atividades antes de precisar de scroll, mantendo o card compacto e alinhado com outros cards do dashboard.
