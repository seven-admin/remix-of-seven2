
# Configuracoes Visuais do Editor de Mapa

## Resumo
Adicionar ao editor de mapa (`MapaEditor`) controles para personalizar a aparencia dos marcadores e poligonos em tempo real: formato dos rotulos (label), opacidade do preenchimento e tamanho da fonte. Essas configuracoes serao locais ao editor (estado React), sem necessidade de alteracoes no banco de dados.

---

## O que sera adicionado

### 1. Seletor de Formato do Label
Um controle multi-select usando checkboxes permitira escolher quais elementos compoem o rotulo dos marcadores/poligonos. As opcoes ja existem em `LABEL_FORMAT_OPTIONS` (`mapaUtils.ts`):
- Bloco/Quadra
- Tipologia
- Numero
- Fachada
- Posicao
- Andar

O usuario podera reordenar e selecionar/desselecionar em tempo real, vendo o resultado imediatamente no mapa.

### 2. Slider de Opacidade
Um controle deslizante (Slider) de 0.1 a 1.0 para ajustar a opacidade de preenchimento de todos os marcadores e poligonos no canvas. Valor padrao: 0.7 (consistente com o estilo atual).

### 3. Controle de Tamanho da Fonte
Um slider ou input numerico para definir um fator de escala para o tamanho da fonte dos rotulos. Valor padrao: 1.0x (100%). Faixa: 0.5x a 2.0x.

---

## Detalhes Tecnicos

### Arquivos modificados

**`src/components/mapa/MapaEditor.tsx`**
- Adicionar 3 novos estados:
  - `editorLabelFormato: LabelFormatElement[]` (inicializado com o `labelFormato` da prop)
  - `markerOpacity: number` (padrao 0.7)
  - `fontSizeScale: number` (padrao 1.0)
- Na funcao `renderItems`:
  - Substituir as chamadas hardcoded a `getPolygonColorWithOpacity(status, 0.7)` por `getPolygonColorWithOpacity(status, markerOpacity)`
  - Substituir `buildUnitLabel(unidade, labelFormato)` por `buildUnitLabel(unidade, editorLabelFormato)`
  - Multiplicar o resultado de `calculateLabelFontSize()` pelo `fontSizeScale`
- Adicionar `editorLabelFormato`, `markerOpacity` e `fontSizeScale` ao array de dependencias do `useEffect` de render
- Adicionar um painel de configuracoes visuais na toolbar (separado por borda, ao lado do zoom):
  - Popover "Aparencia" com icone de Settings contendo:
    - **Formato do Label**: checkboxes com as opcoes de `LABEL_FORMAT_OPTIONS`, com drag-reorder ou simples toggle
    - **Opacidade**: Slider de 0.1 a 1.0 com exibicao do valor (ex: "70%")
    - **Tamanho da Fonte**: Slider de 0.5 a 2.0 com exibicao do valor (ex: "100%")

### Componentes UI utilizados (ja existentes no projeto)
- `Popover` / `PopoverTrigger` / `PopoverContent`
- `Slider` (de `@/components/ui/slider`)
- `Checkbox` (de `@/components/ui/checkbox`)
- `Label`
- `Badge`

### Fluxo do usuario
1. Abre o editor de mapa
2. Clica no botao "Aparencia" (icone de engrenagem) na toolbar
3. Um popover abre com 3 secoes:
   - Formato do Label: checkboxes para cada elemento (Bloco, Tipologia, Numero, etc.)
   - Opacidade: slider horizontal
   - Tamanho da Fonte: slider horizontal
4. Cada alteracao atualiza o canvas imediatamente (via re-render do `renderItems`)
5. As configuracoes sao locais a sessao do editor (nao persistidas)

### Impacto na visualizacao (MapaInterativo)
Nenhum. O `MapaInterativo` continuara usando o `labelFormato` do empreendimento e os valores padrao de opacidade/fonte. As configuracoes do editor sao exclusivas para a sessao de edicao.
