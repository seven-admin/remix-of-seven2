
# Plano: Vinculação Automática de Polígonos/Marcadores no Mapa

## Problema Atual

Ao editar o mapa e criar múltiplos polígonos ou marcadores, o processo de vinculação é manual e repetitivo:
1. Criar item → 2. Clicar "Vincular" → 3. Buscar unidade → 4. Selecionar

Para um loteamento com 50+ lotes, isso é extremamente trabalhoso.

## Solução Proposta

Adicionar um **modo de Auto-Vincular** que permite:
1. Selecionar um filtro (Bloco/Quadra ou Andar)
2. Escolher o grupo específico (ex: "Quadra A")
3. Os próximos itens criados serão vinculados automaticamente às unidades desse grupo, **na ordem de criação**

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Selecionar] [Polígono] [Marcador]  │  Auto-Vincular: [Quadra A ▾] [✓ On]  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Fluxo do Usuário

1. **Ativar Auto-Vincular**: Seleciona uma Quadra/Bloco no dropdown
2. **Sistema mostra**: "Próxima unidade: Lote 01 (Quadra A)"
3. **Usuário desenha**: Polígono ou marcador no mapa
4. **Auto-vínculo**: Sistema vincula automaticamente ao Lote 01
5. **Avança fila**: Sistema mostra "Próxima: Lote 02 (Quadra A)"
6. **Repete** até terminar as unidades do grupo

## Detalhes Técnicos

### Novo Estado no MapaEditor

```typescript
// Modo de auto-vinculação
const [autoLinkMode, setAutoLinkMode] = useState<boolean>(false);
const [autoLinkBlocoId, setAutoLinkBlocoId] = useState<string | null>(null);

// Fila de unidades para vincular (ordenada por andar + número)
const autoLinkQueue = useMemo(() => {
  if (!autoLinkMode || !autoLinkBlocoId) return [];
  
  const blocoNome = autoLinkBlocoId; // Pode ser ID ou nome
  return unlinkedUnidades
    .filter(u => u.bloco?.nome === blocoNome)
    .sort((a, b) => {
      const andarA = a.andar ?? -Infinity;
      const andarB = b.andar ?? -Infinity;
      if (andarA !== andarB) return andarA - andarB;
      return a.numero.localeCompare(b.numero, 'pt-BR', { numeric: true });
    });
}, [autoLinkMode, autoLinkBlocoId, unlinkedUnidades]);

// Próxima unidade a vincular
const nextAutoLinkUnit = autoLinkQueue[0] || null;
```

### Modificar Criação de Itens

Quando um polígono/marcador é criado e `autoLinkMode` está ativo:

```typescript
// Em handleFinishPolygon e no handler de draw_marker
if (autoLinkMode && nextAutoLinkUnit) {
  const newItem: DrawnItem = {
    id: `polygon-${Date.now()}`,
    tipo: 'polygon',
    points: [...currentPoints],
    unidadeId: nextAutoLinkUnit.id, // JÁ VINCULA AUTOMATICAMENTE
  };
  setDrawnItems((prev) => [...prev, newItem]);
  toast.success(`Vinculado automaticamente: ${nextAutoLinkUnit.numero}`);
} else {
  // Comportamento atual
}
```

### UI do Auto-Vincular

```tsx
{/* Seção de Auto-Vincular na toolbar */}
<div className="flex items-center gap-2 ml-4 pl-4 border-l border-border">
  <Switch
    checked={autoLinkMode}
    onCheckedChange={(checked) => {
      setAutoLinkMode(checked);
      if (!checked) setAutoLinkBlocoId(null);
    }}
  />
  <Label className="text-sm">Auto-Vincular</Label>
  
  {autoLinkMode && (
    <>
      <Select value={autoLinkBlocoId || ''} onValueChange={setAutoLinkBlocoId}>
        <SelectTrigger className="w-40 h-8">
          <SelectValue placeholder="Selecione quadra" />
        </SelectTrigger>
        <SelectContent>
          {blocos.map((bloco) => (
            <SelectItem key={bloco} value={bloco}>
              {bloco} ({unlinkedByBloco.get(bloco)?.length || 0})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {nextAutoLinkUnit && (
        <Badge variant="outline" className="bg-primary/10">
          Próxima: {nextAutoLinkUnit.numero}
        </Badge>
      )}
    </>
  )}
</div>
```

### Indicador Visual no Canvas

Quando auto-link está ativo, mostrar destaque visual da próxima unidade a ser vinculada:

```tsx
{autoLinkMode && nextAutoLinkUnit && (
  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400">
    <strong>Auto-Vincular Ativo:</strong> O próximo item será vinculado a{' '}
    <span className="font-bold">{buildUnitLabel(nextAutoLinkUnit, labelFormato)}</span>
    {' '}({nextAutoLinkUnit.bloco?.nome || 'Sem bloco'})
    <span className="ml-2 text-xs opacity-75">
      Restam {autoLinkQueue.length} unidades
    </span>
  </div>
)}
```

## Resumo de Arquivos

| Arquivo | Alteração |
|---------|-----------|
| `src/components/mapa/MapaEditor.tsx` | Adicionar modo auto-vincular com seleção de quadra/bloco, fila automática e vinculação na criação |

## Fluxo Visual

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  TOOLBAR                                                                    │
│  [Selecionar] [Polígono] [Marcador]                                        │
│                                                                             │
│  ┌─ Auto-Vincular ─────────────────────────────────────────────────────────┐│
│  │  [✓ On]  Quadra: [Quadra A ▾]  │  Próxima: Lote 01  │  Restam: 12       ││
│  └──────────────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ INFO BAR ───────────────────────────────────────────────────────────────┐
│  │  Auto-Vincular Ativo: O próximo item será vinculado a Q.A|2Q|01          │
│  │  (Quadra A) - Restam 12 unidades                                         │
│  └──────────────────────────────────────────────────────────────────────────┘
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────────┐
│  │                                                                          │
│  │                         [ MAPA / CANVAS ]                                │
│  │                                                                          │
│  │      Usuário desenha marcadores/polígonos em sequência                   │
│  │      Sistema vincula automaticamente: 01, 02, 03, 04...                  │
│  │                                                                          │
│  └──────────────────────────────────────────────────────────────────────────┘
│                                                                             │
│  Polígonos: 5  Marcadores: 8  Vinculados: 13  Unidades sem vínculo: 37     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Benefícios

1. **Produtividade**: Vincular 50 lotes de uma quadra leva segundos, não minutos
2. **Ordem garantida**: Unidades são vinculadas na ordem natural (andar + número)
3. **Feedback visual**: Usuário sempre sabe qual será a próxima unidade
4. **Flexível**: Pode alternar entre quadras/blocos a qualquer momento
5. **Não-destrutivo**: Modo manual continua funcionando normalmente
