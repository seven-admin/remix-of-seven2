
# Plano de Correção: Dados de Forecast no Portal do Incorporador

## Problema Identificado

O usuário logado como **incorporador** (`mail@mail.com`) não consegue visualizar os dados de Forecast, apesar do Gestor de Produto **Michel** ter várias atividades vinculadas aos empreendimentos do incorporador (VITHORIA DO SOL e DON INÁCIO).

### Causa Raiz: Políticas RLS Bloqueando Acesso

As tabelas utilizadas pelo Forecast têm políticas RLS que **não permitem** ao role `incorporador` visualizar dados:

| Tabela | Políticas Existentes | Inclui Incorporador? |
|--------|---------------------|---------------------|
| `atividades` | Admins, Gestores (próprias), Corretores | **Não** |
| `clientes` | Admins, Gestores (próprios), Corretores, Imobiliárias | **Não** |

### Dados que Deveriam Aparecer

O Michel (gestor) tem **17+ atividades** vinculadas ao empreendimento VITHORIA DO SOL, incluindo:
- 2 pendentes (29/01)
- 15+ concluídas (janeiro/2026)

Todas essas atividades estão vinculadas a empreendimentos onde o incorporador tem acesso, mas a RLS bloqueia a visualização.

---

## Solução Proposta

### Etapa 1: Adicionar Políticas RLS para Incorporadores

Criar políticas que permitam ao `incorporador` visualizar dados dos seus empreendimentos.

**Tabela `atividades`:**
```sql
CREATE POLICY "Incorporadores can view atividades of their empreendimentos"
ON public.atividades
FOR SELECT
TO authenticated
USING (
  public.is_incorporador(auth.uid())
  AND empreendimento_id IN (
    SELECT empreendimento_id 
    FROM public.user_empreendimentos 
    WHERE user_id = auth.uid()
  )
);
```

**Tabela `clientes`:**
```sql
CREATE POLICY "Incorporadores can view clientes of their gestores"
ON public.clientes
FOR SELECT
TO authenticated
USING (
  public.is_incorporador(auth.uid())
  AND gestor_id IN (
    SELECT ue.user_id 
    FROM public.user_empreendimentos ue
    WHERE ue.empreendimento_id IN (
      SELECT empreendimento_id 
      FROM public.user_empreendimentos 
      WHERE user_id = auth.uid()
    )
  )
);
```

A função `is_incorporador()` já foi criada na correção anterior dos tickets de marketing.

### Etapa 2: Ajustar Componentes de Forecast para Filtrar por Empreendimento

Atualmente, os componentes de Forecast no Portal do Incorporador **não passam** os empreendimentoIds como filtro. Mesmo com RLS permitindo acesso, os dados precisam ser filtrados corretamente.

**Modificações nos componentes:**

1. **`PortalIncorporadorForecast.tsx`**: Passar `empreendimentoIds` para os hooks de Forecast
2. **Hooks em `useForecast.ts`**: Adicionar suporte a filtro por `empreendimentoIds[]` além do `gestorId`

### Etapa 3: Atualizar Hooks de Forecast

Modificar os hooks para aceitar uma lista opcional de `empreendimentoIds` e filtrar os dados adequadamente:

```typescript
// useForecast.ts
export function useResumoAtividades(
  gestorId?: string, 
  dataInicio?: Date, 
  dataFim?: Date,
  empreendimentoIds?: string[]  // NOVO parâmetro
) {
  // ... 
  if (empreendimentoIds?.length) {
    query = query.in('empreendimento_id', empreendimentoIds);
  }
  // ...
}
```

Aplicar a mesma lógica para:
- `useFunilTemperatura`
- `useVisitasPorEmpreendimento`  
- `useAtividadesPorTipoPorSemana`
- `useProximasAtividades`
- `useResumoAtendimentos`

---

## Resumo das Alterações

| Arquivo/Local | Modificação |
|---------------|-------------|
| **Banco de Dados** | Criar política RLS em `atividades` para incorporadores visualizarem atividades dos seus empreendimentos |
| **Banco de Dados** | Criar política RLS em `clientes` para incorporadores visualizarem clientes dos gestores vinculados aos seus empreendimentos |
| `src/hooks/useForecast.ts` | Adicionar parâmetro `empreendimentoIds?: string[]` a todos os hooks e aplicar filtro `.in('empreendimento_id', ...)` |
| `src/pages/portal-incorporador/PortalIncorporadorForecast.tsx` | Passar `empreendimentoIds` do hook `useIncorporadorEmpreendimentos` para cada componente de Forecast |
| `src/components/forecast/FunilTemperatura.tsx` | Adicionar prop `empreendimentoIds` e passar para o hook |
| `src/components/forecast/VisitasPorEmpreendimento.tsx` | Adicionar prop `empreendimentoIds` e passar para o hook |
| `src/components/forecast/AtividadesPorTipo.tsx` | Adicionar prop `empreendimentoIds` e passar para o hook |
| `src/components/forecast/ProximasAtividades.tsx` | Adicionar prop `empreendimentoIds` e passar para o hook |
| `src/components/forecast/AtendimentosResumo.tsx` | Adicionar prop `empreendimentoIds` e passar para o hook |

---

## Detalhes Técnicos

### Por que os Dados Não Aparecem?

O fluxo atual falha em dois pontos:

```text
1. PortalIncorporadorForecast chama useResumoAtividades() sem filtros
                    ↓
2. Hook busca atividades da tabela `atividades`
                    ↓
3. RLS verifica:
   - is_admin(auth.uid()) → false
   - gestor_id = auth.uid() → false (incorporador não é gestor)
   - corretor vinculado → false
                    ↓
4. RESULTADO: 0 registros retornados
```

Com a correção:

```text
1. PortalIncorporadorForecast passa empreendimentoIds para useResumoAtividades()
                    ↓
2. Hook busca atividades com filtro .in('empreendimento_id', [...ids])
                    ↓
3. RLS verifica:
   - is_incorporador(auth.uid()) → true ✓
   - empreendimento_id IN user_empreendimentos → true ✓
                    ↓
4. RESULTADO: 17+ atividades do Michel retornadas
```

### Relacionamento dos Dados

```text
┌─────────────────────────────────────────────────────────────────┐
│                    user_empreendimentos                          │
├─────────────────────────────────────────────────────────────────┤
│ user_id (Incorp)  ←→  empreendimento_id (VITHORIA DO SOL)       │
│ user_id (Michel)  ←→  empreendimento_id (VITHORIA DO SOL)       │
│ user_id (Incorp)  ←→  empreendimento_id (DON INÁCIO)            │
│ user_id (Michel)  ←→  empreendimento_id (DON INÁCIO)            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        atividades                                │
├─────────────────────────────────────────────────────────────────┤
│ gestor_id = Michel                                               │
│ empreendimento_id = VITHORIA DO SOL                             │
│ → 17+ atividades (2 pendentes, 15+ concluídas)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Critérios de Aceite

1. Ao acessar `/portal-incorporador/forecast`, os KPIs mostram as contagens corretas de atividades
2. O "Funil de Temperatura" exibe os clientes dos gestores vinculados aos empreendimentos do incorporador
3. "Visitas por Empreendimento" mostra as visitas de VITHORIA DO SOL e DON INÁCIO
4. "Atividades por Tipo" exibe o gráfico de barras empilhadas com dados reais
5. "Próximas Atividades" lista as 2 atividades pendentes do Michel (29/01)
6. "Atendimentos" mostra o resumo correto de novos vs retornos

---

## Considerações de Segurança

As novas políticas RLS garantem que:
- Incorporadores só veem atividades de **seus** empreendimentos
- Incorporadores só veem clientes de gestores vinculados aos **mesmos** empreendimentos
- A verificação `is_incorporador()` usa SECURITY DEFINER para evitar recursão
- Não há vazamento de dados entre incorporadores diferentes
