

# Plano: Corrigir Erro "Invalid time value" no Forecast

## Problema Identificado

O componente `AlertasFollowup.tsx` está causando o erro `RangeError: Invalid time value` porque tenta criar um objeto `Date` a partir de valores `null` ou `undefined`.

### Linha problemática (113):

```typescript
const dataRef = alerta.tipo_alerta === 'vencida' 
  ? alerta.data_fim 
  : alerta.data_followup;
const atraso = formatDistanceToNow(new Date(`${dataRef}T00:00:00`), { ... });
```

Quando `dataRef` é `null`, a expressão `${dataRef}T00:00:00` resulta em `"nullT00:00:00"`, que cria um `Date` inválido.

### Dados que causam o erro (da resposta da API):

```json
{"data_fim":"2026-01-26", "data_followup":null}
```

---

## Solução

Adicionar validações para garantir que datas inválidas não sejam processadas.

### Alterações no arquivo `src/components/forecast/AlertasFollowup.tsx`:

1. **Filtrar alertas sem data válida** antes de mapear
2. **Adicionar validação** antes de chamar `formatDistanceToNow`
3. **Usar helper seguro** para parse de datas

### Código corrigido:

```typescript
// Linha 59-66: Filtrar alertas com data válida
const alertas = [
  ...(vencidas || []).map((a) => ({ ...a, tipo_alerta: 'vencida' as const })),
  ...(followups || []).map((a) => ({ ...a, tipo_alerta: 'followup' as const })),
]
  .filter((a) => {
    // Garantir que tem data de referência válida
    const dataRef = a.tipo_alerta === 'vencida' ? a.data_fim : a.data_followup;
    return dataRef != null;
  })
  .sort((a, b) => {
    const dataA = a.tipo_alerta === 'vencida' ? a.data_fim : a.data_followup;
    const dataB = b.tipo_alerta === 'vencida' ? b.data_fim : b.data_followup;
    return new Date(dataA!).getTime() - new Date(dataB!).getTime();
  });

// Linha 110-116: Adicionar validação antes de formatar
const dataRef = alerta.tipo_alerta === 'vencida' 
  ? alerta.data_fim 
  : alerta.data_followup;

// Parse seguro da data
const parseLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const atraso = dataRef 
  ? formatDistanceToNow(parseLocalDate(dataRef), {
      addSuffix: true,
      locale: ptBR,
    })
  : 'Data não informada';
```

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/components/forecast/AlertasFollowup.tsx` | Adicionar filtro para excluir alertas sem data válida e usar parse seguro de datas |

---

## Benefícios

1. **Previne crash**: O componente não quebra mais com datas nulas
2. **Parse correto**: Usa componentes locais da data (evita problemas de timezone)
3. **Robustez**: Filtra dados inválidos antes do processamento

