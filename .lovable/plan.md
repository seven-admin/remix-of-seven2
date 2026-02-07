
# Plano: Ajustar Marcadores do Mapa, Remover Aparencia e Investigar Proposta LIVTY

## 1. Opacidade dos Marcadores -- Fixar em 90%

Alterar a opacidade padrao de TODOS os marcadores e poligonos em todos os mapas do sistema:

**`src/components/mapa/MapaInterativo.tsx`** (mapa de visualizacao):
- Normal: `0.7` --> `0.9`
- Hover: `0.9` --> `1.0`
- Aplicar tanto para marcadores (Circle) quanto poligonos (Polygon)
- Sao 6 pontos de alteracao neste arquivo (linhas 301, 345, 352, 375, 426, 433)

**`src/components/mapa/MapaEditor.tsx`** (editor):
- Remover a variavel `markerOpacity` do estado (linha 120)
- Substituir todas as referencias a `markerOpacity` por valor fixo `0.9`
- Para itens selecionados: `Math.min(0.9 + 0.1, 1)` = `1.0`
- Sao 4 pontos de alteracao (linhas 468, 469, 526, 527)

---

## 2. Cores Mais Vibrantes / Fluorescentes

Atualizar as cores em `src/types/mapa.types.ts` para tons mais saturados e luminosos:

| Status | Cor Atual | Nova Cor | Descricao |
|--------|-----------|----------|-----------|
| Disponivel | `rgb(34, 197, 94)` | `rgb(0, 255, 100)` | Verde neon |
| Reservada | `rgb(234, 179, 8)` | `rgb(255, 200, 0)` | Amarelo vibrante |
| Negociacao | `rgb(59, 130, 246)` | `rgb(0, 150, 255)` | Azul eletrico |
| Contrato | `rgb(168, 85, 247)` | `rgb(180, 60, 255)` | Roxo neon |
| Vendida | `rgb(239, 68, 68)` | `rgb(255, 50, 50)` | Vermelho vivo |
| Bloqueada | `rgb(107, 114, 128)` | `rgb(120, 130, 150)` | Cinza mais claro |

As cores serao atualizadas tanto em `getPolygonColor`, `getPolygonColorWithOpacity` quanto no array `STATUS_LEGEND`.

---

## 3. Remover Painel de Aparencia do Editor

O painel "Aparencia" com controles de Slider foi adicionado recentemente e esta causando lentidao porque cada alteracao de opacidade ou escala de fonte dispara um re-render completo do canvas com todos os itens.

**Remover de `src/components/mapa/MapaEditor.tsx`:**
- Estado `markerOpacity` (linha 120) -- substituir por constante fixa `0.9`
- Estado `fontSizeScale` (linha 121) -- substituir por constante fixa `1.0`
- Estado `editorLabelFormato` (linha 119) -- voltar a usar `labelFormato` (prop)
- Importacao do `Slider` (linha 54)
- Importacao do `Checkbox` (linha 55)
- Importacao do `Settings2` (linha 72)
- Importacao do `LABEL_FORMAT_OPTIONS` (linha 52, se nao usado em outro lugar)
- Todo o bloco JSX do Popover "Aparencia" (linhas 1127-1195)
- Remover essas variaveis da lista de dependencias do `renderItems` (linha 630) e do `useEffect` (linha 295)

Isso elimina 3 re-renders reactivos que estavam disparando a cada micro-ajuste do slider.

---

## 4. Proposta LIVTY (NEG-00017) -- Diagnostico

**A proposta NAO foi excluida.** Ela existe no banco de dados:
- Codigo: `NEG-00017`
- Cliente: `MARTA CAROLINA VALIENTE ZAZYCKI`
- Empreendimento: `LIVTY` (nao "LIVYT")
- Etapa: `Ganho` (etapa final de sucesso)
- Status da proposta: `rascunho`
- `is_active = true`

A proposta esta visivel no Kanban na coluna "Ganho". Possiveis razoes para nao ter sido encontrada:
1. Filtros ativos na tela (empreendimento, corretor, etapa) podem estar escondendo
2. Na view de "Lista", o nome do empreendimento e "LIVTY", nao "LIVYT"
3. Na coluna "Ganho" do Kanban, se houver muitas fichas, ela pode estar abaixo da dobra (scroll)

**Nenhuma correcao necessaria** -- a proposta esta integra e acessivel.

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/types/mapa.types.ts` | Novas cores fluorescentes em `getPolygonColor`, `getPolygonColorWithOpacity` e `STATUS_LEGEND` |
| `src/components/mapa/MapaInterativo.tsx` | Opacidade de 0.7/0.9 para 0.9/1.0 |
| `src/components/mapa/MapaEditor.tsx` | Remover painel Aparencia, fixar opacidade em 0.9, remover estados desnecessarios |

## Sequencia

1. Atualizar cores em `mapa.types.ts`
2. Atualizar opacidade em `MapaInterativo.tsx`
3. Limpar `MapaEditor.tsx` (remover painel Aparencia + estados)
