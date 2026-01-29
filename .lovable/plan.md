

# Plano: Ordenar Dropdown de Vínculo por Quadra/Andar e Número

## Problema Identificado

A lista de unidades no dropdown de vínculo de polígonos/marcadores no Editor de Mapa (`MapaEditor.tsx`) não está ordenada de forma organizada. Atualmente:

1. **Os grupos de blocos/quadras** não estão sendo ordenados (aparecem na ordem que a `Map` inseriu)
2. **As unidades dentro de cada grupo** são ordenadas apenas por número, mas sem considerar o andar

## Solução

Refatorar a função `groupUnidadesByBloco` no arquivo `src/lib/mapaUtils.ts` para:

1. **Ordenar os grupos (blocos/quadras)** usando ordenação natural (Quadra 2 antes de Quadra 10)
2. **Ordenar as unidades dentro de cada grupo** por **andar** primeiro, depois por **número**

## Alterações Necessárias

### Arquivo: `src/lib/mapaUtils.ts`

Modificar a função `groupUnidadesByBloco`:

```text
ANTES (linhas 143-167):
- Grupos não ordenados (ordem de inserção do Map)
- Unidades ordenadas apenas por número

DEPOIS:
- Grupos ordenados por nome (ordenação natural: "Quadra 2" < "Quadra 10")
- Unidades ordenadas por: 1º andar (se existir), 2º número (ordenação natural)
- Retorna Map com chaves ordenadas
```

### Nova Implementação

```typescript
export function groupUnidadesByBloco(unidades: Unidade[]): Map<string, Unidade[]> {
  const groups = new Map<string, Unidade[]>();
  
  unidades.forEach((unidade) => {
    const key = unidade.bloco?.nome || 'Sem Bloco';
    const existing = groups.get(key) || [];
    existing.push(unidade);
    groups.set(key, existing);
  });

  // 1. Ordenar unidades dentro de cada grupo: por andar, depois por número
  groups.forEach((units) => {
    units.sort((a, b) => {
      // Primeiro ordenar por andar (se existir)
      const andarA = a.andar ?? -Infinity;
      const andarB = b.andar ?? -Infinity;
      if (andarA !== andarB) {
        return andarA - andarB;
      }
      // Depois ordenar por número (ordenação natural)
      return a.numero.localeCompare(b.numero, 'pt-BR', { numeric: true });
    });
  });

  // 2. Criar novo Map com chaves ordenadas (blocos/quadras em ordem natural)
  const sortedKeys = Array.from(groups.keys()).sort((a, b) => 
    a.localeCompare(b, 'pt-BR', { numeric: true })
  );
  
  const sortedGroups = new Map<string, Unidade[]>();
  
  // "Sem Bloco" sempre por último
  const semBlocoKey = 'Sem Bloco';
  const keysWithoutSemBloco = sortedKeys.filter(k => k !== semBlocoKey);
  
  keysWithoutSemBloco.forEach(key => {
    sortedGroups.set(key, groups.get(key)!);
  });
  
  // Adicionar "Sem Bloco" no final se existir
  if (groups.has(semBlocoKey)) {
    sortedGroups.set(semBlocoKey, groups.get(semBlocoKey)!);
  }

  return sortedGroups;
}
```

## Resultado Esperado

### Antes (ordem atual, ruim):
```
Quadra A
  ├─ 10
  ├─ 1
  └─ 2
Quadra B
  ├─ 5
  └─ 3
Quadra 10
  └─ 1
Quadra 2
  └─ 1
```

### Depois (ordenado):
```
Quadra 2
  └─ 1
Quadra 10
  └─ 1
Quadra A
  ├─ 1
  ├─ 2
  └─ 10
Quadra B
  ├─ 3
  └─ 5
```

Para prédios com andares:
```
Torre 1
  ├─ 1º andar
  │   ├─ 101
  │   └─ 102
  ├─ 2º andar
  │   ├─ 201
  │   └─ 202
```

## Resumo de Arquivos

| Arquivo | Ação |
|---------|------|
| `src/lib/mapaUtils.ts` | Modificar função `groupUnidadesByBloco` |

## Detalhes Técnicos

### Ordenação Natural
Usando `localeCompare` com `{ numeric: true }` para que:
- "Quadra 2" venha antes de "Quadra 10"
- "Lote 1" venha antes de "Lote 12"

### Tratamento de Nulos
- Unidades sem andar (`andar = null`) ficam antes das que têm andar
- Unidades sem bloco vão para o grupo "Sem Bloco" no final

## Critérios de Aceite

1. Grupos de blocos/quadras aparecem em ordem alfabética/numérica natural
2. Unidades dentro de cada grupo são ordenadas por andar primeiro
3. Unidades com mesmo andar são ordenadas por número
4. "Sem Bloco" aparece por último
5. A busca no dropdown continua funcionando normalmente

