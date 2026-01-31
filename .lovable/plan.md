

# Plano: Adicionar Label de Status na Lista de Unidades

## Resumo

Adicionar uma coluna/label de status na tabela de unidades do Portal do Corretor para exibir visualmente o status de cada unidade.

---

## Esclarecimento sobre o Formulário de Links

O formulário para cadastrar links **já existe** na aba Mídias do empreendimento (`MidiasTab.tsx`). Ele inclui:
- Campo "Título do link"
- Campo "URL" 
- Botão "Adicionar"

Se não está aparecendo, pode ser um problema de cache ou navegação. Por favor, acesse a aba "Mídias" de um empreendimento no painel administrativo (não no portal do corretor) para verificar.

---

## Alteração no Portal do Corretor

### Arquivo: `src/pages/PortalEmpreendimentoDetalhe.tsx`

Adicionar coluna "Status" na tabela com Badge visual:

### Mudanças na Tabela

**Header:**
```tsx
<TableRow>
  <TableHead className="w-12"></TableHead>
  <TableHead>Quadra</TableHead>
  <TableHead>Lote</TableHead>
  <TableHead>Status</TableHead>  // ← Nova coluna
  <TableHead className="text-right">Valor</TableHead>
</TableRow>
```

**Body:**
```tsx
<TableCell>
  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
    Disponível
  </Badge>
</TableCell>
```

### Observação

Como a lista atualmente só mostra unidades disponíveis (filtro `status === 'disponivel'`), todas exibirão "Disponível". Se quiser mostrar outros status também (reservada, vendida), será necessário remover ou ajustar o filtro em `unidadesDisponiveis`.

---

## Resumo de Arquivos

| Arquivo | Ação |
|---------|------|
| `src/pages/PortalEmpreendimentoDetalhe.tsx` | Adicionar coluna Status com Badge |

