
# Plano: Melhorias no Portal do Incorporador

## Diagnóstico do Problema Reportado

Ao investigar o problema do usuário `bk@sevengroup360.com.br`, descobri que:

### O que ESTÁ funcionando corretamente:
1. O usuário tem role `incorporador` configurada corretamente
2. Existe vínculo em `user_empreendimentos` com o empreendimento AXIS
3. O RLS está funcionando - o usuário só vê o empreendimento AXIS
4. Os 5 projetos de marketing do AXIS aparecem corretamente no dashboard

### A causa raiz do "problema":
O empreendimento **AXIS não possui dados cadastrados**:
- 0 unidades no sistema
- 0 negociações
- 0 atividades
- 0 contratos

Por isso todos os KPIs mostram zero - não é problema de permissão, é ausência de dados no empreendimento!

---

## Melhorias Propostas

Para evitar confusões futuras e melhorar a experiência, proponho as seguintes melhorias:

### 1. Mensagem Informativa no Dashboard

Quando um empreendimento não tem dados cadastrados, exibir uma mensagem clara informando que os dados estão vazios, em vez de apenas mostrar zeros.

```text
┌────────────────────────────────────────────────────────────────────────┐
│ ⚠️ Empreendimento AXIS ainda não possui dados cadastrados            │
│                                                                        │
│ Os dados de unidades, negociações e atividades serão exibidos aqui    │
│ assim que forem cadastrados no sistema.                               │
└────────────────────────────────────────────────────────────────────────┘
```

**Arquivo:** `src/pages/portal-incorporador/PortalIncorporadorDashboard.tsx`

### 2. Indicador Visual de Dados Vazios por Empreendimento

Na listagem de empreendimentos, adicionar um indicador quando o empreendimento não tem unidades cadastradas:

```text
┌─────────────────────────────────────────────────┐
│ AXIS                                            │
│ Goiânia - GO                                    │
│                                                 │
│ ⚠️ Nenhuma unidade cadastrada                  │
│                                                 │
│ Gestor: Maria Silva                             │
└─────────────────────────────────────────────────┘
```

**Arquivo:** `src/pages/portal-incorporador/PortalIncorporadorDashboard.tsx`

### 3. Validação ao Vincular Empreendimento

Na tela de administração de usuários, ao vincular um empreendimento a um incorporador, exibir quantas unidades o empreendimento possui para evitar vincular empreendimentos vazios:

```text
┌─────────────────────────────────────────────────┐
│ Vincular Empreendimentos                        │
├─────────────────────────────────────────────────┤
│ ☑ AXIS              (0 unidades) ⚠️            │
│ ☐ BELVEDERE         (111 unidades) ✓           │
│ ☐ RESERVA DO LAGO   (406 unidades) ✓           │
└─────────────────────────────────────────────────┘
```

**Arquivo:** `src/components/usuarios/UserEmpreendimentosTab.tsx`

### 4. Estado Vazio Melhorado no Forecast

Se não houver atividades ou negociações, exibir mensagem orientativa em vez de widgets vazios:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 📊 Forecast                                                           │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│ Nenhuma atividade ou negociação encontrada para seus empreendimentos. │
│                                                                        │
│ As informações de forecast serão exibidas aqui quando:                │
│ • Atividades forem agendadas                                          │
│ • Negociações forem cadastradas                                       │
│ • Leads forem registrados                                             │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Arquivo:** `src/pages/portal-incorporador/PortalIncorporadorForecast.tsx`

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/portal-incorporador/PortalIncorporadorDashboard.tsx` | Adicionar mensagem para dados vazios |
| `src/pages/portal-incorporador/PortalIncorporadorForecast.tsx` | Estado vazio melhorado |
| `src/components/usuarios/UserEmpreendimentosTab.tsx` | Mostrar contagem de unidades |
| `src/hooks/useIncorporadorEmpreendimentos.ts` | Incluir contagem de unidades |

---

## Detalhes Técnicos

### Hook useIncorporadorEmpreendimentos

Adicionar contagem de unidades na query:

```typescript
const { data, error } = await supabase
  .from('user_empreendimentos')
  .select(`
    empreendimento_id,
    empreendimento:empreendimentos(
      id, nome, status, endereco_cidade, endereco_uf,
      unidades:unidades(count)
    )
  `)
  .eq('user_id', user.id);
```

### Dashboard - Lógica de Dados Vazios

```typescript
const hasAnyData = (dashData?.unidades.total || 0) > 0 
  || (dashData?.negociacoes.total || 0) > 0
  || (dashData?.marketing.ticketsAbertos || 0) > 0;

if (!hasAnyData) {
  return (
    <Alert>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Dados em configuração</AlertTitle>
      <AlertDescription>
        Os empreendimentos vinculados ainda não possuem dados cadastrados.
      </AlertDescription>
    </Alert>
  );
}
```

### UserEmpreendimentosTab - Contagem de Unidades

```typescript
const { data: empreendimentos } = await supabase
  .from('empreendimentos')
  .select(`
    id, nome, status,
    unidades:unidades(count)
  `)
  .eq('is_active', true);
```

---

## Benefícios

1. **Clareza para o usuário** - Sabe exatamente por que não está vendo dados
2. **Prevenção de erros** - Admin vê se empreendimento tem dados antes de vincular
3. **Melhor UX** - Estados vazios orientam o usuário sobre próximos passos
4. **Menos suporte** - Reduz confusões sobre "dados não aparecem"

---

## Critérios de Aceite

1. Dashboard mostra mensagem clara quando empreendimentos não têm dados
2. Lista de empreendimentos indica quais não têm unidades
3. Tela de vínculo de empreendimentos mostra contagem de unidades
4. Forecast mostra estado vazio orientativo quando sem dados
