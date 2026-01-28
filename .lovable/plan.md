
# Correção: Falha na Importação de Terrenos via Excel (Criação de Quadras)

## Problema Identificado

Ao analisar o código do componente `ImportarUnidadesDialog.tsx` e o erro de runtime capturado no console:

```
ReferenceError: Cannot access 'ue' before initialization
```

Identifiquei um **bug crítico de referência circular** na função `processarDadosFinais` (linhas 449-455):

```typescript
// Linhas 369-491
const linhasProcessadas: LinhaImportacao[] = dadosBrutos.map((row, index) => {
  // ... código ...
  
  // ❌ BUG: Referenciando linhasProcessadas DENTRO do próprio .map() que a cria!
  const jaExisteNoLote = linhasProcessadas  // <-- Variável ainda não existe!
    .slice(0, index)
    .some(l => 
      l.dados.numero === numero && 
      ((l.dados.bloco_id === blocoId) || (!l.dados.bloco_id && !blocoId))
    );
  
  // ... resto do código ...
});
```

### Por que isso causa o travamento na etapa 3?

1. O usuário avança para a etapa "Mapear Valores" (etapa 3)
2. Clica em "Avançar" para ir ao preview (etapa 4)
3. A função `handleAvancarValores` chama `processarDadosFinais()`
4. Durante a criação das quadras (blocos), o código tenta acessar `linhasProcessadas` antes dela ser inicializada
5. JavaScript lança `ReferenceError: Cannot access 'linhasProcessadas' before initialization`
6. O try/catch em `handleAvancarValores` captura o erro silenciosamente e o estado `criandoEntidades` fica em `false`
7. O sistema fica travado sem avançar para a etapa 4

## Solução

Modificar a lógica de detecção de duplicatas internas para usar um Set acumulador ao invés de referenciar o array que está sendo construído:

### Antes (Código Problemático)
```typescript
const linhasProcessadas: LinhaImportacao[] = dadosBrutos.map((row, index) => {
  // ...
  const jaExisteNoLote = linhasProcessadas
    .slice(0, index)
    .some(l => l.dados.numero === numero && ...);
  // ...
});
```

### Depois (Código Corrigido)
```typescript
// Usar Set para rastrear combinações já vistas
const combinacoesVistas = new Set<string>();
const linhasProcessadas: LinhaImportacao[] = dadosBrutos.map((row, index) => {
  // ...
  
  // Criar chave única para verificar duplicata
  const chaveUnidade = `${numero}__${blocoId || 'NULL'}`;
  const jaExisteNoLote = combinacoesVistas.has(chaveUnidade);
  
  // Adicionar ao Set para próximas iterações
  combinacoesVistas.add(chaveUnidade);
  
  // ...
});
```

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/empreendimentos/ImportarUnidadesDialog.tsx` | Corrigir referência circular na função `processarDadosFinais` |

## Código Específico da Correção

A função `processarDadosFinais` será modificada para:

1. Criar um `Set<string>` antes do `.map()` para rastrear combinações número+bloco já processadas
2. Substituir a verificação `linhasProcessadas.slice(0, index).some(...)` por uma verificação no Set
3. Adicionar cada combinação ao Set após processá-la

```typescript
// Dentro de processarDadosFinais, antes do map:
const combinacoesVistas = new Set<string>();

// Dentro do map, substituir:
// DE:
const jaExisteNoLote = linhasProcessadas
  .slice(0, index)
  .some(l => 
    l.dados.numero === numero && 
    ((l.dados.bloco_id === blocoId) || (!l.dados.bloco_id && !blocoId))
  );

// PARA:
const chaveUnidade = `${numero}__${blocoId || 'NULL'}`;
const jaExisteNoLote = combinacoesVistas.has(chaveUnidade);
combinacoesVistas.add(chaveUnidade);
```

## Fluxo Corrigido

```text
Etapa 1: Upload do Excel
    │
    ▼
Etapa 2: Mapear Colunas
    │
    ▼
Etapa 3: Mapear Valores (Quadras/Tipologias)
    │
    ├─ Usuário clica "Avançar"
    │
    ├─ handleAvancarValores() chamada
    │
    ├─ setCriandoEntidades(true)
    │
    ├─ processarDadosFinais() executada
    │   ├─ Cria blocos novos (se marcados)        ✅
    │   ├─ Cria tipologias novas (se marcadas)    ✅
    │   ├─ Processa linhas do Excel               ✅ (CORRIGIDO)
    │   └─ setEtapa('preview')                    ✅
    │
    ├─ setCriandoEntidades(false)
    │
    ▼
Etapa 4: Preview dos Dados ✅
    │
    ▼
Etapa 5: Resultado da Importação
```

## Benefícios da Correção

1. **Elimina o erro de referência circular** que travava a importação
2. **Melhora a performance** - usar Set tem complexidade O(1) vs O(n) do slice+some
3. **Código mais limpo** e fácil de manter
4. **Mantém a mesma lógica de negócio** - detectar duplicatas internas no Excel

