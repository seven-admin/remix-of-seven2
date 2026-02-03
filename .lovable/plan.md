
# Plano: Visao Global do Planejamento e Correcao de Layout

## Parte 1: Visao Global do Planejamento (Super Admin)

### Objetivo
Criar uma nova aba "Visao Global" exclusiva para super admins que permite visualizar todos os planejamentos de todos os empreendimentos simultaneamente, identificando:
- Choques de datas entre tarefas de diferentes empreendimentos
- Sobrecarga de responsaveis (funcionarios com muitas tarefas no mesmo periodo)
- Gargalos de equipe e recursos
- Linha do tempo consolidada de todos os projetos

### Estrutura da Interface

```text
┌────────────────────────────────────────────────────────────────────────┐
│  Planejamento                                                          │
├────────────────────────────────────────────────────────────────────────┤
│  [Por Empreendimento ▼]     [Global]                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ NOVA ABA "Visao Global" (super_admin apenas)                    │   │
│  │                                                                 │   │
│  │  ┌──────────────────┬──────────────────┬──────────────────┐    │   │
│  │  │ Resumo           │ Timeline Global  │ Equipe           │    │   │
│  │  └──────────────────┴──────────────────┴──────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### Sub-abas da Visao Global

**1. Resumo Executivo**
- Cards com metricas consolidadas de todos os empreendimentos
- Total de tarefas ativas, concluidas, atrasadas
- Grafico de barras empilhadas: progresso por empreendimento
- Alertas de conflitos detectados

**2. Timeline Global**
- Visualizacao Gantt multi-projeto
- Cada linha representa um empreendimento com suas fases
- Barras de tarefas agrupadas por projeto
- Destaque visual para periodos de sobreposicao
- Filtros por: periodo, fase, status

**3. Carga da Equipe**
- Tabela de responsaveis com contagem de tarefas por periodo
- Mapa de calor: funcionario x semana
- Alertas de sobrecarga (muitas tarefas no mesmo periodo)
- Detalhamento por clique: quais tarefas de cada funcionario

### Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/pages/Planejamento.tsx` | Modificar | Adicionar toggle Global/Por Empreendimento para super admin |
| `src/components/planejamento/PlanejamentoGlobal.tsx` | Criar | Container principal da visao global |
| `src/components/planejamento/PlanejamentoGlobalResumo.tsx` | Criar | Cards de metricas consolidadas |
| `src/components/planejamento/PlanejamentoGlobalTimeline.tsx` | Criar | Timeline multi-projeto |
| `src/components/planejamento/PlanejamentoGlobalEquipe.tsx` | Criar | Analise de carga da equipe |
| `src/hooks/usePlanejamentoGlobal.ts` | Criar | Hook para buscar todos os itens sem filtro de empreendimento |

### Hook de Dados Globais

```typescript
// usePlanejamentoGlobal.ts
export function usePlanejamentoGlobal(filters?: { 
  data_de?: string; 
  data_ate?: string;
  responsavel_id?: string;
}) {
  // Busca TODOS os itens de planejamento ativos
  // Agrupa por empreendimento, responsavel, periodo
  // Calcula metricas de conflito e sobrecarga
}
```

### Logica de Deteccao de Conflitos

1. **Sobreposicao de Fases**: Quando a mesma fase esta ativa em multiplos empreendimentos no mesmo periodo
2. **Sobrecarga de Responsavel**: Quando um funcionario tem mais de X tarefas nao-finalizadas no mesmo intervalo de 7 dias
3. **Gargalo de Recursos**: Quando muitas tarefas estao programadas para o mesmo periodo

---

## Parte 2: Correcao do Layout da Planilha

### Problema Identificado

Na linha de "Adicionar tarefa" (linhas 280-319 do `PlanejamentoPlanilha.tsx`), o botao/input esta sendo renderizado na **primeira celula** (que deveria ser a coluna de checkbox), causando desalinhamento:

```typescript
// PROBLEMA ATUAL - Linha 280-319
<TableRow className="hover:bg-muted/20">
  <TableCell className="py-1">    // <-- Esta na coluna errada!
    {/* Botao/Input de adicionar tarefa */}
  </TableCell>
  <TableCell colSpan={readOnly ? 5 : 6}></TableCell>  // <-- colSpan incorreto
</TableRow>
```

A estrutura da tabela exige:
- Coluna 1: Checkbox (w-[40px]) - quando nao readOnly
- Coluna 2: Item/Tarefa (w-[280px])
- Colunas 3-8: Responsaveis, Status, Inicio, Fim, Obs, Acoes

### Solucao

Corrigir a linha para ter a mesma estrutura de celulas que as demais linhas:

```typescript
// CORRECAO
<TableRow className="hover:bg-muted/20">
  <TableCell className="py-1"></TableCell>  // Checkbox vazio
  <TableCell className="py-1">              // Item/Tarefa
    {/* Botao/Input de adicionar tarefa */}
  </TableCell>
  <TableCell className="py-1"></TableCell>  // Responsaveis
  <TableCell className="py-1"></TableCell>  // Status
  <TableCell className="py-1"></TableCell>  // Inicio
  <TableCell className="py-1"></TableCell>  // Fim
  <TableCell className="py-1"></TableCell>  // Obs
  <TableCell className="py-1"></TableCell>  // Acoes (quando !readOnly)
</TableRow>
```

### Arquivo a Modificar

| Arquivo | Linha | Alteracao |
|---------|-------|-----------|
| `src/components/planejamento/PlanejamentoPlanilha.tsx` | 280-319 | Reestruturar celulas da linha de novo item |

---

## Resumo da Implementacao

### Prioridade 1: Correcao do Layout (Bug Fix)
- Modificar `PlanejamentoPlanilha.tsx` para corrigir a estrutura de celulas

### Prioridade 2: Visao Global (Nova Feature)
1. Criar hook `usePlanejamentoGlobal.ts`
2. Criar componentes de visualizacao global
3. Modificar pagina principal para incluir toggle global
4. Testar deteccao de conflitos e sobrecarga

### Estimativa de Arquivos
- 1 arquivo modificado (bug fix)
- 5 novos arquivos (feature global)
- 1 arquivo modificado (pagina principal)

### Permissoes
- Visao Global: apenas `role === 'super_admin'` pode acessar
- Dados: consulta sem filtro de empreendimento (RLS ja permite para super_admin via `is_seven_team()`)
