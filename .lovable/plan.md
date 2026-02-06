
# Plano: Remover Bordas dos Marcadores e Poligonos do Mapa

## Objetivo

Alterar o layout dos marcadores e poligonos no mapa interativo para que exibam apenas o preenchimento (fill), sem borda (stroke).

## Alteracoes

### 1. Visualizacao (MapaInterativo.tsx)

**Marcadores (circulos):**
- Remover `stroke` e `strokeWidth` na criacao do marcador
- Remover alteracoes de `strokeWidth` nos eventos de hover (mouseover/mouseout)
- Aumentar levemente a opacidade do fill para compensar a ausencia de borda (de 0.5 para 0.7; hover de 0.8 para 0.9)

**Poligonos:**
- Remover `stroke` e `strokeWidth` na criacao do poligono
- Remover alteracoes de `strokeWidth` nos eventos de hover (mouseover/mouseout)
- Aumentar levemente a opacidade do fill (de 0.5 para 0.7; hover de 0.8 para 0.9)

### 2. Editor (MapaEditor.tsx)

**Marcadores (circulos):**
- Remover `stroke` e `strokeWidth` no estado normal
- Manter borda branca apenas quando o item esta **selecionado** (para o usuario saber o que esta editando)

**Poligonos:**
- Remover `stroke` e `strokeWidth` no estado normal
- Manter borda branca apenas quando o item esta **selecionado**

## Resumo de Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/mapa/MapaInterativo.tsx` | Remover stroke/strokeWidth de marcadores e poligonos; ajustar opacidade do fill |
| `src/components/mapa/MapaEditor.tsx` | Remover stroke/strokeWidth no estado normal; manter apenas na selecao |

## Resultado Visual

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Marcador normal | Preenchimento + borda colorida | Apenas preenchimento (sem borda) |
| Marcador hover | Borda mais grossa | Preenchimento mais intenso |
| Marcador selecionado (editor) | Borda branca | Borda branca (mantida para feedback) |
| Poligono normal | Preenchimento + borda colorida | Apenas preenchimento (sem borda) |
