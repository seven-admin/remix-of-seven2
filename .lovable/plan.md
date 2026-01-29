

# Plano: Adicionar Campo de Link na Aba Criativo

## Objetivo

Adicionar um formulário simples com input de texto para cadastrar links externos na aba "Criativo" dos tickets de marketing, complementando a funcionalidade de upload de arquivos já existente.

---

## Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────┐
│                    ProjetoCriativos.tsx                        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ [Enviar Arquivo] [+ Adicionar Link]                       │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              ↓                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Dialog: Adicionar Link                                    │ │
│  │  ┌─────────────────────────────────────────────────────┐  │ │
│  │  │ Nome (opcional): [_________________________]        │  │ │
│  │  │ URL:             [_________________________]        │  │ │
│  │  │            [Cancelar]  [Salvar Link]                │  │ │
│  │  └─────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              ↓                                  │
│  Grid de criativos (imagens, vídeos e links)                   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                         │
│  │  IMG    │  │  LINK   │  │  VIDEO  │                         │
│  │ [FINAL] │  │ 🔗      │  │         │                         │
│  └─────────┘  └─────────┘  └─────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Alterações Necessárias

### 1. Atualizar Tipo `TicketCriativo`

**Arquivo**: `src/types/marketing.types.ts`

Adicionar `'link'` como opção de tipo:

```typescript
export interface TicketCriativo {
  id: string;
  projeto_id: string;
  tipo: 'imagem' | 'video' | 'link';  // Adicionar 'link'
  nome: string | null;
  url: string;
  is_final: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
```

---

### 2. Adicionar Mutation de Criação de Link

**Arquivo**: `src/hooks/useTicketCriativos.ts`

Adicionar nova mutation `addLink`:

```typescript
// Adicionar link externo
const addLink = useMutation({
  mutationFn: async ({ nome, url }: { nome?: string; url: string }) => {
    const { data, error } = await supabase
      .from('ticket_criativos')
      .insert({
        projeto_id: projetoId,
        tipo: 'link',
        nome: nome || url,
        url: url,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['ticket-criativos', projetoId] });
    toast.success('Link adicionado com sucesso');
  },
  onError: (error: Error) => {
    console.error('Erro ao adicionar link:', error);
    toast.error('Erro ao adicionar link');
  },
});
```

---

### 3. Atualizar Componente `ProjetoCriativos`

**Arquivo**: `src/components/marketing/ProjetoCriativos.tsx`

Alterações:
1. Adicionar botão "Adicionar Link" ao lado do "Enviar Arquivo"
2. Criar Dialog com formulário simples (nome + url)
3. Atualizar o `CriativoCard` para exibir links com ícone diferente
4. Ao clicar em link, abrir em nova aba (não preview)

#### Novo Dialog para Link

```typescript
const [showLinkForm, setShowLinkForm] = useState(false);
const [linkNome, setLinkNome] = useState('');
const [linkUrl, setLinkUrl] = useState('');

const handleAddLink = async () => {
  if (!linkUrl.trim()) return;
  await addLink.mutateAsync({ nome: linkNome || undefined, url: linkUrl });
  setLinkNome('');
  setLinkUrl('');
  setShowLinkForm(false);
};
```

#### Card de Link

Para criativos do tipo `link`, exibir:
- Ícone de link (🔗) ao invés de thumbnail
- Ao clicar, abrir URL em nova aba
- Manter ações de marcar como final e excluir

---

## Resumo de Arquivos

| Arquivo | Ação |
|---------|------|
| `src/types/marketing.types.ts` | Adicionar `'link'` ao tipo |
| `src/hooks/useTicketCriativos.ts` | Adicionar mutation `addLink` |
| `src/components/marketing/ProjetoCriativos.tsx` | Adicionar botão, dialog e card de link |

---

## Interface Visual

### Header com botões

```text
Criativos                    [+ Adicionar Link] [Enviar Arquivo]
3 arquivos
```

### Dialog de Adicionar Link

```text
┌────────────────────────────────────────┐
│ Adicionar Link                         │
├────────────────────────────────────────┤
│                                        │
│ Nome (opcional)                        │
│ [________________________________]     │
│                                        │
│ URL *                                  │
│ [________________________________]     │
│                                        │
│                [Cancelar] [Salvar]     │
└────────────────────────────────────────┘
```

### Card de Link no Grid

```text
┌─────────────┐
│             │
│    🔗       │  ← Ícone de link centralizado
│             │
│ [FINAL]     │  ← Badge se marcado como final
├─────────────┤
│ Nome do link│  ← Nome ou URL truncado
└─────────────┘
```

---

## Critérios de Aceite

1. Novo botão "Adicionar Link" visível ao lado de "Enviar Arquivo"
2. Dialog abre com formulário de nome (opcional) e URL (obrigatório)
3. Validação básica: URL não pode estar vazio
4. Link salvo aparece no grid com ícone diferenciado
5. Clicar no card de link abre URL em nova aba
6. Ações de marcar como final e excluir funcionam para links
7. Mensagens de sucesso/erro exibidas via toast

