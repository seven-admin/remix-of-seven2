
# Plano: Corrigir a Aba de Atividades no Portal do Incorporador

## Diagnóstico

Após análise detalhada, identifiquei que:

1. **A implementação atual está tecnicamente correta** - O filtro `empreendimento_ids` está sendo aplicado corretamente no hook `useAtividades`
2. **Os dados existem no banco** - Há 18 atividades de "visita" nos empreendimentos do incorporador (todas concluídas)
3. **O calendário funciona** - As requisições mostram dados sendo retornados para os componentes do dashboard
4. **O problema**: A lista na aba "Atividades" pode não estar buscando corretamente ou há um problema de renderização

## Problema Identificado

O componente `AtividadesListaPortal` está usando o hook `useAtividades` que funciona corretamente, **porém** o session replay mostra que quando você seleciona "Pendente" no filtro de status, a lista fica vazia porque **não existem atividades pendentes** - todas as 18 atividades estão com status "concluída".

**Solução Proposta**: Replicar o sistema completo do Forecast administrativo para o Portal do Incorporador, garantindo que:
1. A lista de atividades mostre todas as atividades (não apenas pendentes)
2. O calendário seja clicável e filtre a lista pelo dia selecionado
3. Adicione mais filtros úteis (período, ordenação)

---

## Alterações Técnicas

### 1. Melhorar AtividadesListaPortal com Sincronização de Calendário

Adicionar prop para data selecionada no calendário e filtrar atividades por essa data:

```typescript
interface AtividadesListaPortalProps {
  empreendimentoIds: string[];
  dataSelecionada?: Date | null;
  onDataChange?: (data: Date | null) => void;
}
```

### 2. Tornar CalendarioCompacto Interativo

Permitir clique nos dias para filtrar a lista:

```typescript
interface CalendarioCompactoProps {
  gestorId?: string;
  empreendimentoIds?: string[];
  onDayClick?: (date: Date) => void;
  selectedDate?: Date | null;
}
```

### 3. Atualizar PortalIncorporadorForecast

Sincronizar estado entre calendário e lista:

```typescript
const [dataSelecionada, setDataSelecionada] = useState<Date | null>(null);

<CalendarioCompacto 
  empreendimentoIds={empreendimentoIds} 
  onDayClick={(date) => setDataSelecionada(date)}
  selectedDate={dataSelecionada}
/>
<AtividadesListaPortal 
  empreendimentoIds={empreendimentoIds}
  dataSelecionada={dataSelecionada}
  onDataChange={setDataSelecionada}
/>
```

### 4. Adicionar Filtro de Período na Lista

Permitir filtrar por mês/período como no Forecast principal:

```typescript
// Adicionar seletor de mês
const [competencia, setCompetencia] = useState(new Date());

const filters: AtividadeFilters = {
  empreendimento_ids: empreendimentoIds,
  data_inicio: startOfMonth(competencia).toISOString(),
  data_fim: endOfMonth(competencia).toISOString(),
  // ... outros filtros
};
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/forecast/CalendarioCompacto.tsx` | Adicionar `onDayClick` e `selectedDate` props |
| `src/components/portal-incorporador/AtividadesListaPortal.tsx` | Adicionar filtro por data e melhorar UX |
| `src/pages/portal-incorporador/PortalIncorporadorForecast.tsx` | Sincronizar estado entre componentes |

---

## Melhorias na UX

1. **Clique no calendário** filtra a lista para mostrar apenas atividades daquele dia
2. **Indicador visual** no dia selecionado no calendário
3. **Botão "Limpar filtro"** para voltar a ver todas as atividades
4. **Contador de atividades** atualizado conforme filtros
5. **Navegação por mês** no calendário já sincronizada com a lista

---

## Fluxo de Interação

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        Aba "Atividades"                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────┐  ┌──────────────────────────────────────┐   │
│  │   Calendário Compacto  │  │    Lista de Atividades              │   │
│  │   [< Janeiro 2026 >]   │  │    [Todos tipos ▼] [Todos status ▼] │   │
│  │   ┌─┬─┬─┬─┬─┬─┬─┐     │  │    [Limpar filtro de data]          │   │
│  │   │D│S│T│Q│Q│S│S│     │  │                                      │   │
│  │   ├─┼─┼─┼─┼─┼─┼─┤     │  │    ┌────────────────────────────┐   │   │
│  │   │ │ │ │●│ │●│●│     │  │    │ 📍 Visita - Corretor X     │   │   │
│  │   │●│ │●│●│●│ │ │ ←───┼──┼────│ 15/01 17:30 - Concluída    │   │   │
│  │   │ │ │ │ │ │ │ │     │  │    └────────────────────────────┘   │   │
│  │   └─┴─┴─┴─┴─┴─┴─┘     │  │    ┌────────────────────────────┐   │   │
│  │   [Legenda...]         │  │    │ 📍 Visita - Corretor Y     │   │   │
│  └────────────────────────┘  │    │ 15/01 18:00 - Concluída    │   │   │
│                               │    └────────────────────────────┘   │   │
│                               │    ...                              │   │
│                               └──────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘

Clique no dia 15 → Lista filtra para mostrar só atividades do dia 15
```

---

## Resultado Esperado

1. Lista de atividades mostra **todas as atividades** (não apenas pendentes) quando filtro é "Todos"
2. Calendário é **clicável** - selecionar um dia filtra a lista
3. Visual **integrado** entre calendário e lista
4. **18 atividades** do incorporador aparecem na lista quando sem filtros
5. Filtros funcionam corretamente (tipo, status, dia)

---

## Critérios de Aceite

1. Lista exibe atividades quando filtro de status é "Todos"
2. Clique no dia do calendário filtra a lista
3. Botão para limpar filtro de data funciona
4. Badge de contagem reflete quantidade filtrada
5. Navegação por mês no calendário funciona
6. Dialog de detalhes abre ao clicar em atividade
