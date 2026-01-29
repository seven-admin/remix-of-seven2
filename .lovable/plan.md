
# Plano: Corrigir Referências Restantes de `data_hora`

## Diagnóstico

A migração do banco de dados foi executada com sucesso, mas ainda existem **2 arquivos** que referenciam o campo antigo `data_hora`:

| Arquivo | Ocorrências | Status |
|---------|-------------|--------|
| `src/hooks/useForecast.ts` | 20 referências | Pendente |
| `src/components/forecast/ProximasAtividades.tsx` | 2 referências | Pendente |

---

## Alterações Necessárias

### 1. Hook useForecast.ts

Atualizar **todas** as queries para usar `data_inicio` e `data_fim`:

| Função | Mudança |
|--------|---------|
| `useFunilTemperatura` | Trocar `.gte('data_hora', ...)` por `.lte('data_inicio', ...).gte('data_fim', ...)` |
| `useVisitasPorEmpreendimento` | Trocar select e filtros para novos campos |
| `useResumoAtividades` | Trocar select e filtros, atualizar lógica de vencidas/hoje |
| `useAtividadesPorTipoPorSemana` | Trocar campos e lógica de agrupamento por semana |
| `useAtividadesPorCorretor` | Trocar filtros de data |
| `useCalendarioAtividades` | Trocar select e filtros, ajustar contagem por dia |
| `useProximasAtividades` | Trocar select, filtros e ordenação |
| `useResumoAtendimentos` | Trocar filtros de data |

**Padrão de migração:**

```typescript
// ANTES (data_hora)
.gte('data_hora', inicioMes.toISOString())
.lte('data_hora', fimMes.toISOString())

// DEPOIS (data_inicio e data_fim)
// Buscar atividades que se sobrepõem ao período
.lte('data_inicio', fimMes.toISOString().split('T')[0])
.gte('data_fim', inicioMes.toISOString().split('T')[0])
```

**Lógica de calendário (atividades multi-dia):**

```typescript
// Para contagem no calendário, considerar todos os dias do intervalo
eachDayOfInterval({ 
  start: parseISO(ativ.data_inicio), 
  end: parseISO(ativ.data_fim) 
}).forEach(dia => {
  const diaNum = dia.getDate();
  contagem.set(diaNum, (contagem.get(diaNum) || 0) + 1);
});
```

### 2. Componente ProximasAtividades.tsx

Atualizar exibição para usar `data_inicio`:

```typescript
// ANTES
const isToday = format(new Date(atividade.data_hora), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
format(new Date(atividade.data_hora), "dd/MM 'às' HH:mm")

// DEPOIS (sem hora)
const isToday = atividade.data_inicio === format(new Date(), 'yyyy-MM-dd');
// Exibir apenas data ou intervalo
atividade.data_inicio === atividade.data_fim
  ? format(parseISO(atividade.data_inicio), "dd/MM")
  : `${format(parseISO(atividade.data_inicio), "dd/MM")} - ${format(parseISO(atividade.data_fim), "dd/MM")}`
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useForecast.ts` | Atualizar todas as queries e lógicas |
| `src/components/forecast/ProximasAtividades.tsx` | Atualizar exibição de datas |

---

## Considerações Especiais

### Atividades Multi-Dia no Calendário

Uma atividade com `data_inicio: 01/02` e `data_fim: 03/02` deve aparecer na contagem dos dias 1, 2 e 3 do calendário.

### Ordenação de Próximas Atividades

Ordenar por `data_inicio` em vez de `data_hora`:

```typescript
.order('data_inicio', { ascending: true })
```

### Verificação de "Hoje"

Comparar apenas a parte DATE:

```typescript
// Verificar se atividade inclui hoje
const hoje = format(new Date(), 'yyyy-MM-dd');
const isToday = atividade.data_inicio <= hoje && atividade.data_fim >= hoje;
```

---

## Critérios de Aceite

1. Nenhuma referência a `data_hora` no código
2. Queries do Forecast funcionam com novos campos
3. Calendário mostra atividades multi-dia corretamente
4. Próximas atividades exibe datas sem hora
5. Sem erros no console
