
# Plano: Corrigir Campo de Observações no Planejamento

## Problema Identificado

O campo de observações (`obs`) na planilha de planejamento **não está salvando os dados** devido a uma condição de corrida:

### Fluxo Problemático Atual (linha 542)

```tsx
<Textarea
  value={item.obs || ''}
  onChange={(e) => onSelectChange(item.id, 'obs', e.target.value)}
  ...
/>
```

**O que acontece:**
1. Usuário digita "A" → dispara `updateItem.mutate({ id, obs: 'A' })`
2. Mutation executa e chama `invalidateQueries`
3. React Query refaz a consulta ao banco
4. Usuário digita "B" → dispara `updateItem.mutate({ id, obs: 'AB' })`
5. **Resposta do passo 3 chega** com `obs: 'A'` → sobrescreve o campo
6. Usuário vê "A" em vez de "AB"

Esse ciclo se repete, resultando em perda de dados ou comportamento imprevisível.

---

## Solução

Usar um **estado local** para o campo de observações e salvar apenas quando o popover for fechado (padrão debounced/onBlur).

---

## Alterações em `src/components/planejamento/PlanejamentoPlanilha.tsx`

### 1. Adicionar Estado Local no ItemRow

```tsx
function ItemRow({ ... }: ItemRowProps) {
  const isEditingItem = editingCell?.id === item.id && editingCell?.field === 'item';
  const [obsOpen, setObsOpen] = useState(false);
  const [localObs, setLocalObs] = useState(item.obs || ''); // NOVO

  // Sincronizar quando o item mudar (ex: após refetch)
  useEffect(() => {
    if (!obsOpen) {
      setLocalObs(item.obs || '');
    }
  }, [item.obs, obsOpen]);
```

### 2. Modificar o Textarea

```tsx
<Textarea
  value={localObs}  // Usar estado local
  onChange={(e) => setLocalObs(e.target.value)}  // Atualizar apenas estado local
  placeholder="Digite observações..."
  rows={4}
/>
```

### 3. Salvar ao Fechar o Popover

```tsx
<Popover 
  open={obsOpen} 
  onOpenChange={(open) => {
    if (!open && localObs !== (item.obs || '')) {
      // Salvar apenas se houve alteração
      onSelectChange(item.id, 'obs', localObs);
    }
    setObsOpen(open);
  }}
>
```

---

## Arquivo a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/planejamento/PlanejamentoPlanilha.tsx` | Corrigir gerenciamento de estado do campo obs |

---

## Resultado Esperado

1. Usuário clica no ícone de observações
2. Popover abre com o valor atual
3. Usuário digita livremente sem disparar requisições
4. Ao fechar o popover (clicar fora ou ESC), o valor é salvo
5. Dados persistem corretamente no banco

---

## Benefícios Adicionais

- **Performance**: Apenas 1 requisição ao fechar, em vez de 1 por keystroke
- **UX**: Usuário não perde o foco durante digitação
- **Estabilidade**: Elimina condição de corrida
