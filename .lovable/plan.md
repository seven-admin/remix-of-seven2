
# Plano: Sistema de Interações em Atividades + Gestão de Status por Super Admin

## Contexto

Você deseja duas funcionalidades:
1. **Interações/Chat**: Permitir que Admins e Super Admins interajam com gestores sobre atividades (similar ao chat dos tickets de marketing)
2. **Gestão de Status**: Permitir que Super Admins reabram atividades canceladas ou alterem seu status

## Parte 1: Sistema de Comentários/Interações nas Atividades

### Modelo de Dados

Criar uma nova tabela `atividade_comentarios` seguindo o padrão já existente em `projeto_comentarios`:

```text
┌─────────────────────────────────────────┐
│        atividade_comentarios            │
├─────────────────────────────────────────┤
│ id             UUID (PK)                │
│ atividade_id   UUID (FK → atividades)   │
│ user_id        UUID (FK → profiles)     │
│ comentario     TEXT                     │
│ created_at     TIMESTAMP                │
└─────────────────────────────────────────┘
```

### Componente de Comentários

Criar `AtividadeComentarios.tsx` similar ao `ProjetoComentarios.tsx`:

```text
┌─────────────────────────────────────────────────────────────┐
│  💬 Interações                                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Escreva uma mensagem...                             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                          [Enviar]           │
├─────────────────────────────────────────────────────────────┤
│  👤 João Silva                           27/01 às 14:30    │
│  Verificar com o cliente se prefere outro horário          │
│                                                              │
│  👤 Maria Admin                          27/01 às 13:15    │
│  Por favor, confirmar disponibilidade do empreendimento    │
└─────────────────────────────────────────────────────────────┘
```

### Integração no Diálogo de Detalhes

O componente será adicionado ao `AtividadeDetalheDialog`, exibindo:
- Histórico de interações
- Caixa de texto para nova mensagem
- Visível para todos, mas com destaque visual para mensagens de admins

## Parte 2: Super Admin - Alterar Status de Atividades

### Nova Funcionalidade

Adicionar no `AtividadeDetalheDialog` uma seção exclusiva para Super Admin:

```text
┌─────────────────────────────────────────────────────────────┐
│  ⚙ Ações de Administrador                                   │
├─────────────────────────────────────────────────────────────┤
│  Status atual: Cancelada                                     │
│                                                              │
│  Alterar para:                                               │
│  [Pendente ▼]                                               │
│                                                              │
│  Justificativa (obrigatória):                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Motivo da reabertura...                             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│                              [Aplicar Alteração]            │
└─────────────────────────────────────────────────────────────┘
```

### Regras de Negócio

| Ação | Quem pode | Condição |
|------|-----------|----------|
| Reabrir atividade cancelada | Super Admin | Sempre |
| Alterar de concluída para pendente | Super Admin | Sempre |
| Alterar de pendente para concluída | Qualquer usuário | Via diálogo de conclusão |
| Alterar para cancelada | Qualquer usuário | Via diálogo de cancelamento |

### Rastreabilidade

Cada alteração de status feita por um Super Admin será automaticamente registrada como um comentário na atividade:

```
"[SISTEMA] Status alterado de CANCELADA para PENDENTE por Maria Admin. 
Justificativa: Cliente retornou contato e deseja reagendar visita."
```

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/atividades/AtividadeComentarios.tsx` | Componente de chat/interações |
| `src/components/atividades/AlterarStatusAtividadeDialog.tsx` | Diálogo para Super Admin alterar status |
| `src/hooks/useAtividadeComentarios.ts` | Hook para buscar/criar comentários |

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/atividades/AtividadeDetalheDialog.tsx` | Adicionar seção de comentários e botão de ações admin |
| `src/hooks/useAtividades.ts` | Adicionar mutation para alterar status (Super Admin) |
| `src/types/atividades.types.ts` | Adicionar interface para comentário |

## Migração SQL

```sql
-- Tabela de comentários/interações em atividades
CREATE TABLE public.atividade_comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade_id UUID NOT NULL REFERENCES public.atividades(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  comentario TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índice para performance
CREATE INDEX idx_atividade_comentarios_atividade ON public.atividade_comentarios(atividade_id);

-- RLS
ALTER TABLE public.atividade_comentarios ENABLE ROW LEVEL SECURITY;

-- Política: usuários autenticados podem ver comentários
CREATE POLICY "Authenticated users can view comments"
  ON public.atividade_comentarios FOR SELECT
  TO authenticated
  USING (true);

-- Política: usuários autenticados podem criar comentários
CREATE POLICY "Authenticated users can create comments"
  ON public.atividade_comentarios FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

## Fluxo de Uso

### Cenário 1: Interação Admin → Gestor
1. Admin abre detalhes de uma atividade
2. Escreve mensagem: "Por favor, confirmar disponibilidade do cliente"
3. Gestor visualiza a atividade e vê o comentário
4. Gestor responde: "Confirmado, cliente disponível amanhã às 10h"

### Cenário 2: Reabrir Atividade Cancelada
1. Super Admin abre detalhes de uma atividade cancelada
2. Clica em "Ações de Administrador"
3. Seleciona novo status "Pendente"
4. Informa justificativa: "Cliente retornou contato"
5. Sistema atualiza status e registra comentário automático

## Seção Técnica

### Hook useAtividadeComentarios

```typescript
export function useAtividadeComentarios(atividadeId: string) {
  const queryClient = useQueryClient();

  const { data: comentarios, isLoading } = useQuery({
    queryKey: ['atividade-comentarios', atividadeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atividade_comentarios')
        .select(`*, user:profiles(id, full_name, avatar_url)`)
        .eq('atividade_id', atividadeId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!atividadeId
  });

  const createComentario = useMutation({
    mutationFn: async (comentario: string) => {
      const { error } = await supabase
        .from('atividade_comentarios')
        .insert({
          atividade_id: atividadeId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          comentario
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividade-comentarios', atividadeId] });
    }
  });

  return { comentarios, isLoading, createComentario };
}
```

### Mutation para Alterar Status (Super Admin)

```typescript
export function useAlterarStatusAtividade() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      novoStatus, 
      justificativa 
    }: { 
      id: string; 
      novoStatus: AtividadeStatus; 
      justificativa: string 
    }) => {
      // 1. Atualizar status
      const { error: updateError } = await supabase
        .from('atividades')
        .update({ status: novoStatus })
        .eq('id', id);
      if (updateError) throw updateError;

      // 2. Registrar comentário de auditoria
      const user = (await supabase.auth.getUser()).data.user;
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id)
        .single();

      await supabase.from('atividade_comentarios').insert({
        atividade_id: id,
        user_id: user?.id,
        comentario: `[ALTERAÇÃO DE STATUS] Status alterado para ${novoStatus.toUpperCase()} por ${profile?.full_name}.\nJustificativa: ${justificativa}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
      queryClient.invalidateQueries({ queryKey: ['atividade'] });
      toast.success('Status alterado com sucesso!');
    }
  });
}
```

### Interface AtividadeComentario

```typescript
export interface AtividadeComentario {
  id: string;
  atividade_id: string;
  user_id: string | null;
  comentario: string;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  } | null;
}
```
