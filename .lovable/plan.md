
# Plano: Adicionar Calendário de Atividades ao Portal do Incorporador

## Objetivo

Adicionar o **Calendário Compacto de Atividades** à página de Forecast do Portal do Incorporador, garantindo que exiba apenas atividades vinculadas aos empreendimentos do incorporador logado.

---

## Análise do Código Atual

| Componente/Hook | Status | Problema |
|-----------------|--------|----------|
| `CalendarioCompacto` | Existe | Não aceita filtro por `empreendimentoIds` |
| `useCalendarioAtividades` | Existe | Não filtra por `empreendimentoIds` |
| `PortalIncorporadorForecast` | Existe | Não inclui o calendário |

---

## Alterações Técnicas

### 1. Atualizar Hook `useCalendarioAtividades` (src/hooks/useForecast.ts)

Adicionar parâmetros opcionais para `gestorId` e `empreendimentoIds`:

```typescript
export function useCalendarioAtividades(
  ano: number, 
  mes: number,
  gestorId?: string,           // NOVO
  empreendimentoIds?: string[] // NOVO
) {
  return useQuery({
    queryKey: ['forecast', 'calendario-atividades', ano, mes, gestorId || 'all', empreendimentoIds?.join(',') || 'all'],
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const inicioMes = new Date(ano, mes - 1, 1);
      const fimMes = new Date(ano, mes, 0, 23, 59, 59);

      let query = supabase
        .from('atividades' as any)
        .select('data_hora')
        .gte('data_hora', inicioMes.toISOString())
        .lte('data_hora', fimMes.toISOString())
        .neq('status', 'cancelada');

      // NOVOS FILTROS
      if (gestorId) {
        query = query.eq('gestor_id', gestorId);
      }
      
      if (empreendimentoIds?.length) {
        query = query.in('empreendimento_id', empreendimentoIds);
      }

      const { data, error } = await query;
      if (error) throw error;

      const contagem = new Map<number, number>();
      (data || []).forEach((ativ: any) => {
        const dia = new Date(ativ.data_hora).getDate();
        contagem.set(dia, (contagem.get(dia) || 0) + 1);
      });

      return Array.from(contagem.entries())
        .map(([dia, quantidade]) => ({ dia, quantidade }))
        .sort((a, b) => a.dia - b.dia);
    },
  });
}
```

### 2. Atualizar Componente `CalendarioCompacto` (src/components/forecast/CalendarioCompacto.tsx)

Adicionar props opcionais:

```typescript
interface CalendarioCompactoProps {
  gestorId?: string;
  empreendimentoIds?: string[];
}

export function CalendarioCompacto({ gestorId, empreendimentoIds }: CalendarioCompactoProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { data: diasComAtividades, isLoading } = useCalendarioAtividades(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    gestorId,           // NOVO
    empreendimentoIds   // NOVO
  );
  // ... restante do código permanece igual
}
```

### 3. Adicionar Calendário ao Portal do Incorporador (src/pages/portal-incorporador/PortalIncorporadorForecast.tsx)

Importar e renderizar o calendário passando os IDs dos empreendimentos:

```typescript
import { CalendarioCompacto } from '@/components/forecast/CalendarioCompacto';

// ... dentro do return
<div className="grid gap-4 lg:grid-cols-2">
  <AtividadesPorTipo empreendimentoIds={empreendimentoIds} />
  <ProximasAtividades empreendimentoIds={empreendimentoIds} />
</div>

{/* NOVO: Calendário Compacto */}
<div className="grid gap-4 lg:grid-cols-2">
  <CalendarioCompacto empreendimentoIds={empreendimentoIds} />
  <AtendimentosResumo empreendimentoIds={empreendimentoIds} />
</div>
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useForecast.ts` | Adicionar parâmetros `gestorId` e `empreendimentoIds` ao hook `useCalendarioAtividades` |
| `src/components/forecast/CalendarioCompacto.tsx` | Adicionar props e passá-las ao hook |
| `src/pages/portal-incorporador/PortalIncorporadorForecast.tsx` | Importar e renderizar `CalendarioCompacto` com filtro |

---

## Fluxo de Dados

```text
┌─────────────────────────────────────────────────────────────────┐
│ useIncorporadorEmpreendimentos()                                │
│   → Retorna lista de empreendimentoIds vinculados ao usuário   │
└─────────────────────────────────────┬───────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ CalendarioCompacto({ empreendimentoIds })                       │
│   → Passa IDs para o hook                                       │
└─────────────────────────────────────┬───────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ useCalendarioAtividades(ano, mes, undefined, empreendimentoIds) │
│   → Query filtra: .in('empreendimento_id', empreendimentoIds)   │
└─────────────────────────────────────┬───────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ Resultado: Apenas atividades dos empreendimentos do incorporador│
└─────────────────────────────────────────────────────────────────┘
```

---

## Segurança

As políticas RLS existentes na tabela `atividades` já garantem que o incorporador só veja atividades de seus empreendimentos:

```sql
-- Política existente para incorporadores
CREATE POLICY "Incorporadores can view their project activities"
ON public.atividades FOR SELECT
USING (
  public.is_incorporador(auth.uid())
  AND empreendimento_id IN (
    SELECT empreendimento_id FROM public.user_empreendimentos
    WHERE user_id = auth.uid()
  )
);
```

O filtro adicional no frontend é uma camada extra de segurança e otimização de performance.

---

## Resultado Esperado

1. O calendário aparece na página de Forecast do Portal do Incorporador
2. Exibe apenas atividades dos empreendimentos vinculados ao usuário
3. Navegação por mês funciona corretamente
4. Intensidade visual (cores) reflete a quantidade de atividades por dia
5. Layout responsivo em grid com outros componentes

---

## Critérios de Aceite

1. Calendário visível na página `/portal-incorporador/forecast`
2. Apenas atividades dos empreendimentos do incorporador são contabilizadas
3. Navegação entre meses funciona
4. Dias com atividades exibem indicador visual
5. Tooltip mostra quantidade de atividades ao passar o mouse
