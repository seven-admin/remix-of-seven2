
# Plano: Configuracao do Limite de Sobrecarga

## Objetivo

Permitir que o administrador configure o limite de tarefas por semana que define "sobrecarga" de um colaborador. Atualmente o valor esta fixo em **5 tarefas/semana** no codigo, e sera transformado em uma configuracao do sistema.

---

## Solucao

### 1. Adicionar Configuracao no Banco de Dados

Inserir uma nova entrada na tabela `configuracoes_sistema`:

```sql
INSERT INTO configuracoes_sistema (id, chave, valor, categoria)
VALUES (
  gen_random_uuid(),
  'planejamento_limite_sobrecarga',
  '5',
  'planejamento'
);
```

### 2. Atualizar Hook de Planejamento Global

O hook `usePlanejamentoGlobal.ts` sera modificado para:
- Receber o limite de sobrecarga como parametro (valor dinamico do banco)
- Usar esse valor ao inves do `5` hardcoded

Locais de alteracao:
- Linha 207: `sobrecarga: maxPorSemana > 5` passa a usar o parametro
- Linhas 223-224: deteccao de conflitos usa o mesmo valor

### 3. Criar Editor de Configuracao

Adicionar uma nova secao na pagina de **Configuracoes do Planejamento** (`PlanejamentoConfiguracoes.tsx`) com:
- Um card "Configuracoes Gerais"
- Campo numerico para o limite de sobrecarga
- Descricao explicativa do que esse valor significa
- Botao de salvar

### 4. Atualizar Componentes que Usam o Limite

Os componentes que exibem informacoes de sobrecarga precisarao buscar a configuracao:
- `PlanejamentoGlobalEquipe.tsx` (mapa de calor - legenda e cores)
- `PlanejamentoGlobalResumo.tsx` (alertas de conflitos)

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| **Migracao SQL** | Inserir configuracao `planejamento_limite_sobrecarga` |
| `src/hooks/usePlanejamentoGlobal.ts` | Aceitar parametro `limiteSobrecarga` |
| `src/pages/PlanejamentoConfiguracoes.tsx` | Adicionar card de configuracoes gerais |
| `src/components/planejamento/PlanejamentoGlobal.tsx` | Buscar configuracao e passar para sub-componentes |
| `src/components/planejamento/PlanejamentoGlobalEquipe.tsx` | Ajustar legenda do mapa de calor |

---

## Nova Interface de Configuracao

A pagina de Configuracoes do Planejamento tera um novo card:

```text
┌─────────────────────────────────────────────────────────────┐
│ Configuracoes Gerais                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Limite de Sobrecarga                                       │
│  ┌─────┐ tarefas por semana                                 │
│  │  5  │                                                    │
│  └─────┘                                                    │
│                                                             │
│  Funcionarios com mais tarefas que este limite em uma       │
│  mesma semana serao sinalizados como "sobrecarregados"      │
│  na visao global.                                           │
│                                                             │
│                                    [Salvar Configuracoes]   │
└─────────────────────────────────────────────────────────────┘
```

---

## Resumo Tecnico

1. **Banco**: Nova entrada em `configuracoes_sistema` com `chave = 'planejamento_limite_sobrecarga'`
2. **Hook existente**: `useConfiguracao('planejamento_limite_sobrecarga')` para buscar o valor
3. **Hook de update**: `useUpdateConfiguracao()` para salvar alteracoes
4. **Propagacao**: O valor e passado como prop para o hook e componentes que calculam sobrecarga
5. **Fallback**: Se a configuracao nao existir, usa o valor padrao de 5

---

## Fluxo de Dados

```text
configuracoes_sistema (DB)
         ↓
useConfiguracao('planejamento_limite_sobrecarga')
         ↓
PlanejamentoGlobal.tsx (busca e armazena)
         ↓
usePlanejamentoGlobal({ limiteSobrecarga: valor })
         ↓
cargaPorResponsavel (calcula com limite dinamico)
         ↓
PlanejamentoGlobalEquipe.tsx (exibe mapa de calor)
```
