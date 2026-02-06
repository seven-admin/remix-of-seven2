

# Plano: Exclusao em Lote de Marcadores + Otimizacao do Salvamento do Mapa

## Problema 1: Sem opcao de excluir marcadores em lote

Atualmente so e possivel excluir marcadores um por um (selecionar + Delete). Para empreendimentos com dezenas ou centenas de marcadores, isso e inviavel.

## Problema 2: Salvamento lento do mapa

Ao salvar, o sistema faz chamadas individuais ao banco para **cada marcador**:

```text
Marcador 1 -> UPDATE unidades SET polygon_coords = ... (+ toast + 3 invalidacoes)
Marcador 2 -> UPDATE unidades SET polygon_coords = ... (+ toast + 3 invalidacoes)
Marcador 3 -> UPDATE unidades SET polygon_coords = ... (+ toast + 3 invalidacoes)
...
Marcador 200 -> UPDATE unidades SET polygon_coords = ... (+ toast + 3 invalidacoes)
```

200 marcadores = 200 chamadas sequenciais + 200 toasts + 600 invalidacoes de cache.

Alem disso, ao editar **um unico marcador** e salvar, o sistema salva **todos** os marcadores novamente, nao apenas o que mudou.

---

## Solucao

### 1. Botao "Excluir Todos" no editor de mapa

**Arquivo:** `src/components/mapa/MapaEditor.tsx`

Adicionar um botao "Limpar Todos" na toolbar do editor com dialog de confirmacao:
- Opcoes: "Todos os Itens", "Apenas Marcadores", "Apenas Poligonos"
- Dialog AlertDialog para confirmacao antes de limpar
- Limpa os itens do estado local (drawnItems) - so e persistido ao salvar

### 2. Otimizar salvamento - usar chamadas diretas em lote

**Arquivo:** `src/components/mapa/MapaEditor.tsx`

Reescrever a funcao `handleSave` para:

**a) Detectar apenas o que mudou (diff):**
- Comparar `drawnItems` atual com os dados originais carregados das `unidades`
- Salvar apenas itens que realmente foram alterados (movidos, vinculados, criados, removidos)

**b) Usar chamadas diretas ao Supabase (sem o hook mutateAsync):**
- Evita toasts individuais e invalidacoes por item
- Uma unica chamada para limpar marcadores removidos via `.in('id', idsParaLimpar)`
- Chamadas paralelas via `Promise.all` para os itens alterados
- Um unico toast e invalidacao ao final

**Antes (lento):**
```text
for (item of drawnItems) {
  await updateUnidade.mutateAsync(item)  // sequencial, 1 por 1
}
```

**Depois (rapido):**
```text
// 1. Limpar removidos em uma unica chamada
await supabase.from('unidades')
  .update({ polygon_coords: null })
  .in('id', idsRemovidos)

// 2. Salvar alterados em paralelo
await Promise.all(
  itensAlterados.map(item => 
    supabase.from('unidades')
      .update({ polygon_coords: coords })
      .eq('id', item.unidadeId)
  )
)

// 3. Invalidar cache uma unica vez
queryClient.invalidateQueries(...)
```

### 3. Armazenar estado inicial para comparacao (diff)

**Arquivo:** `src/components/mapa/MapaEditor.tsx`

Adicionar um `useRef` com o snapshot inicial dos itens carregados. Ao salvar, comparar o estado atual com o inicial para identificar apenas as mudancas.

---

## Resumo de Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/mapa/MapaEditor.tsx` | Adicionar botao "Limpar Todos" com opcoes e confirmacao |
| `src/components/mapa/MapaEditor.tsx` | Reescrever `handleSave` com diff + batch + paralelo |

Nenhum arquivo novo precisa ser criado. Nenhuma alteracao no banco de dados.

## Impacto Estimado

| Cenario (200 marcadores) | Antes | Depois |
|---------------------------|-------|--------|
| Salvar apos editar 1 marcador | ~200 chamadas (~30s) | ~1 chamada (~0.3s) |
| Salvar sem nenhuma alteracao | ~200 chamadas (~30s) | 0 chamadas (instantaneo) |
| Salvar apos criar 5 novos | ~200 chamadas (~30s) | ~5 chamadas (~1.5s) |
| Limpar todos marcadores | Manual, 1 por 1 | 1 clique + confirmar |

