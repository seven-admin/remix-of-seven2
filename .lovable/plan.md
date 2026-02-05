

# Plano: Alinhar Layout do Calendário de Planejamento com Marketing

## Problema Identificado

No calendário de Planejamento (`/planejamento` aba Calendário), os dois cards (calendário à esquerda e detalhes à direita) não estão alinhados na base. Isso ocorre porque:

1. O card do calendário cresce de acordo com seu conteúdo (grid de dias + legenda)
2. O card de detalhes usa `h-full` mas o `ScrollArea` interno tem altura calculada que pode não corresponder

## Referência

O calendário de Marketing (`/marketing/calendario`) resolve isso com:
- Cards irmãos ambos com `h-full` dentro de um grid com altura implícita
- O card de detalhes não usa `ScrollArea` com altura fixa
- Layout mais simples e direto

## Solução

Ajustar o `PlanejamentoCalendario.tsx` para:
1. Garantir que ambos os cards tenham altura igual usando `flex` ou alinhamento de grid
2. Substituir `ScrollArea` com altura calculada por `overflow-auto` com altura máxima
3. Simplificar o layout para seguir o padrão do Marketing

## Alterações Técnicas

### Arquivo: `src/components/planejamento/PlanejamentoCalendario.tsx`

**Mudanças principais:**

1. **Grid wrapper com altura mínima**:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
```
O `items-stretch` garante que ambas as colunas tenham a mesma altura.

2. **Card do Calendário sem mudanças estruturais** (mantém como está)

3. **Card de Detalhes - altura alinhada**:
```tsx
<div className="lg:col-span-1">
  <Card className="h-full flex flex-col">
    <CardHeader className="pb-3">
      {/* ... header ... */}
    </CardHeader>
    <CardContent className="pt-0 flex-1 overflow-hidden">
      {itensDoDia.length === 0 ? (
        {/* ... empty state ... */}
      ) : (
        <div className="h-full overflow-y-auto pr-2 space-y-3">
          {/* ... lista de tarefas ... */}
        </div>
      )}
    </CardContent>
  </Card>
</div>
```

**Detalhes das mudanças:**

| Local | De | Para |
|-------|-----|------|
| Div container | `grid-cols-1 lg:grid-cols-3 gap-6` | `grid-cols-1 lg:grid-cols-3 gap-6 items-stretch` |
| Card detalhes | `h-full` | `h-full flex flex-col` |
| CardContent detalhes | `pt-0` | `pt-0 flex-1 overflow-hidden` |
| ScrollArea | `<ScrollArea className="h-[calc(100vh-480px)]">` | Remover, usar `<div className="h-full overflow-y-auto pr-2">` |

## Visualização do Resultado

```text
┌─────────────────────────────────────────────────┬──────────────────────────┐
│              CALENDÁRIO                          │    5 de Fevereiro        │
│  ┌────┬────┬────┬────┬────┬────┬────┐           │    3 tarefas ativas      │
│  │ D  │ S  │ T  │ Q  │ Q  │ S  │ S  │           │                          │
│  ├────┼────┼────┼────┼────┼────┼────┤           │   ┌────────────────────┐ │
│  │    │    │    │    │ 5  │    │    │           │   │ Projeto Alpha      │ │
│  │    │    │    │    │ ▬  │    │    │           │   │ Tarefa 1           │ │
│  │    │    │    │    │    │    │    │           │   │ 01/02 - 10/02      │ │
│  │    │    │    │    │    │    │    │           │   └────────────────────┘ │
│  │    │    │    │    │    │    │    │           │   ┌────────────────────┐ │
│  └────┴────┴────┴────┴────┴────┴────┘           │   │ Projeto Beta       │ │
│                                                  │   │ Tarefa 2           │ │
│  [Legenda: cores por empreendimento]            │   └────────────────────┘ │
├─────────────────────────────────────────────────┴──────────────────────────┤
│                    ↑ Bases alinhadas ↑                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Benefícios

1. **Alinhamento visual**: Ambos os cards terminam na mesma altura
2. **Consistência**: Segue o mesmo padrão do calendário de Marketing
3. **Responsivo**: Continua funcionando bem em mobile (empilhado)
4. **Scroll suave**: Lista de tarefas com scroll interno quando necessário

## Resumo de Arquivos

| Arquivo | Alteração |
|---------|-----------|
| `src/components/planejamento/PlanejamentoCalendario.tsx` | Ajustar grid com `items-stretch`, Card com `flex flex-col`, remover ScrollArea por div com overflow |

