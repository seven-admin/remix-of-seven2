

# Plano: Corrigir Erro de Constraint ao Atualizar Datas

## Problema Identificado

A tabela `planejamento_itens` possui uma constraint no banco de dados:

```sql
CONSTRAINT check_datas CHECK (
  data_fim IS NULL OR 
  data_inicio IS NULL OR 
  data_fim >= data_inicio
)
```

Quando o usuario atualiza uma data (inicio ou fim), o codigo atual nao valida se a nova data respeita a regra de que **data_fim deve ser maior ou igual a data_inicio**.

### Cenario de Erro

1. Item tem `data_fim = 2026-02-10`
2. Usuario define `data_inicio = 2026-02-15`
3. Resultado: Erro de constraint (`data_inicio > data_fim`)

O mesmo acontece no cenario inverso (definir data_fim anterior a data_inicio existente).

---

## Solucao

### 1. Adicionar Validacao no Frontend

Modificar a funcao `handleDateChange` em `PlanejamentoPlanilha.tsx` para:

1. Buscar os dados atuais do item (data_inicio e data_fim existentes)
2. Validar se a nova data respeita a constraint
3. Se violar, exibir toast de erro e nao enviar ao banco

### 2. Logica de Validacao

```typescript
const handleDateChange = async (id: string, field: string, date: Date | undefined) => {
  // Buscar item atual
  const item = itens?.find(i => i.id === id);
  if (!item) return;

  const newDateStr = date ? format(date, 'yyyy-MM-dd') : null;
  
  // Montar datas para validacao
  const dataInicio = field === 'data_inicio' ? newDateStr : item.data_inicio;
  const dataFim = field === 'data_fim' ? newDateStr : item.data_fim;
  
  // Validar constraint
  if (dataInicio && dataFim && dataFim < dataInicio) {
    toast.error('A data de fim deve ser igual ou posterior a data de inicio');
    return;
  }

  // Se valido, enviar ao banco
  updateItem.mutate({ id, [field]: newDateStr });
};
```

### 3. Pontos de Alteracao

O mesmo tratamento deve ser aplicado em:
- `PlanejamentoPlanilha.tsx` - DatePickerCell
- `PlanejamentoTimeline.tsx` - Se houver edicao de datas
- `EditarEmLoteDialog.tsx` - Edicao em lote de datas

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/planejamento/PlanejamentoPlanilha.tsx` | Adicionar validacao em `handleDateChange` |
| `src/components/planejamento/EditarEmLoteDialog.tsx` | Verificar se precisa de validacao similar |

---

## Melhoria Adicional: UX do DatePicker

Para melhorar a experiencia, o DatePickerCell pode receber as datas atuais do item e desabilitar datas invalidas no calendario:

- Se editando `data_inicio`: desabilitar datas posteriores a `data_fim` existente
- Se editando `data_fim`: desabilitar datas anteriores a `data_inicio` existente

Isso previne o usuario de selecionar uma data invalida em primeiro lugar.

---

## Resumo da Implementacao

1. Modificar `handleDateChange` para validar antes de enviar
2. Passar informacoes de limite para o `DatePickerCell`
3. Usar `disabled` no Calendar para bloquear datas invalidas
4. Exibir toast de erro caso a validacao falhe

