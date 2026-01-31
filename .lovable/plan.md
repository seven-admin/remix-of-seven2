

# Plano: Corrigir Layout da Planilha de Planejamento

## Problema Identificado

Quando as fases estão colapsadas vs expandidas, o layout da tabela "pula" porque:

- **Colapsado**: A linha da fase usa `colSpan=7` e ocupa toda a largura
- **Expandido**: Cada coluna tem largura fixa definida (Item/Tarefa 280px, Status 160px, etc.)

Isso causa um desalinhamento visual quando o usuário expande/colapsa fases.

---

## Solução

Modificar a estrutura para que a linha da fase **não use colSpan** e mantenha as mesmas colunas que as linhas de itens, preservando a consistência visual.

### Alteração na linha da fase (linhas 216-244):

**De:**
```tsx
<TableRow className="bg-muted/30 hover:bg-muted/40 cursor-pointer">
  {!readOnly && (
    <TableCell className="py-2">
      <Checkbox ... />
    </TableCell>
  )}
  <TableCell colSpan={readOnly ? 7 : 7} className="py-2" onClick={() => toggleFase(fase.id)}>
    <div className="flex items-center gap-2 font-medium">
      {/* chevron + cor + nome + badge */}
    </div>
  </TableCell>
</TableRow>
```

**Para:**
```tsx
<TableRow className="bg-muted/30 hover:bg-muted/40 cursor-pointer" onClick={() => toggleFase(fase.id)}>
  {!readOnly && (
    <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
      <Checkbox ... />
    </TableCell>
  )}
  <TableCell className="py-2">
    <div className="flex items-center gap-2 font-medium">
      {/* chevron + cor + nome + badge */}
    </div>
  </TableCell>
  <TableCell className="py-2"></TableCell>  {/* Responsáveis - vazio */}
  <TableCell className="py-2"></TableCell>  {/* Status - vazio */}
  <TableCell className="py-2"></TableCell>  {/* Início - vazio */}
  <TableCell className="py-2"></TableCell>  {/* Fim - vazio */}
  <TableCell className="py-2"></TableCell>  {/* Obs - vazio */}
  {!readOnly && <TableCell className="py-2"></TableCell>}  {/* Ações - vazio */}
</TableRow>
```

---

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/planejamento/PlanejamentoPlanilha.tsx` | Remover `colSpan` da linha de fase e adicionar células vazias |

---

## Resultado Visual Esperado

```text
Antes (colapsado):
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ ○  > ● Fase 01 - Atendimento  7                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘

Depois (colapsado - mesma estrutura de colunas):
┌────┬─────────────────────────────┬──────────┬────────┬───────┬───────┬─────┬────────┐
│ ○  │ > ● Fase 01 - Atendimento 7 │          │        │       │       │     │        │
└────┴─────────────────────────────┴──────────┴────────┴───────┴───────┴─────┴────────┘
         (colunas vazias mantêm a largura consistente)
```

Assim, quando o usuário expandir a fase, as colunas já estarão alinhadas e não haverá "salto" no layout.

---

## Detalhes Técnicos

A mudança é simples: remover o `colSpan` e criar células vazias para cada coluna do cabeçalho. Isso garante que a tabela sempre renderize com as mesmas larguras de coluna, independente do estado de colapso.

