
# Plano: Aba "Corretores" na Página de Usuários

## Resumo

Criar uma aba dedicada na página de Usuários para gerenciar exclusivamente corretores que fizeram auto-cadastro, com CRUD completo, visualização de dados profissionais (CPF, CRECI, cidade/UF) e gestão de vínculos com empreendimentos.

---

## Arquitetura

A aba "Corretores" vai juntar dados de duas tabelas:
- **profiles**: dados de usuário (nome, email, status, avatar)
- **corretores**: dados profissionais (CPF, CRECI, cidade, UF, WhatsApp)

O vínculo é feito por `corretores.user_id = profiles.id`

---

## Alterações Necessárias

### 1. Criar Hook `useCorretoresUsuarios.ts`

Novo hook específico para buscar corretores com dados unificados:

```typescript
// src/hooks/useCorretoresUsuarios.ts
interface CorretorUsuario {
  // Dados do profile
  id: string; // profile.id = user_id
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  
  // Dados do corretor
  corretor_id: string;
  cpf: string | null;
  creci: string | null;
  cidade: string | null;
  uf: string | null;
  whatsapp: string | null;
  imobiliaria?: { id: string; nome: string } | null;
}

export function useCorretoresUsuarios() {
  return useQuery({
    queryKey: ['corretores-usuarios'],
    queryFn: async () => {
      // Buscar profiles com role corretor
      // Fazer join com tabela corretores
      // Retornar dados unificados
    }
  });
}
```

---

### 2. Criar Componente `CorretoresUsuariosTab.tsx`

Novo componente para a aba de corretores:

```typescript
// src/components/usuarios/CorretoresUsuariosTab.tsx

Features:
- Tabela com: Nome, Email, CPF, CRECI, Cidade/UF, WhatsApp, Status, Ações
- Filtros: Busca, Pendentes de ativação, Por cidade
- Ativação individual e em lote
- Botão editar abre Dialog com:
  - Aba Dados (editar nome, telefone, status)
  - Aba Empreendimentos (usando UserEmpreendimentosTab existente)
- Contador de pendentes com badge
```

---

### 3. Atualizar `Usuarios.tsx`

Adicionar a nova aba no sistema de tabs:

```tsx
// Antes (2 abas):
- Usuários
- Perfis de Acesso

// Depois (3 abas):
- Usuários (todos menos corretores)
- Corretores (nova aba dedicada)
- Perfis de Acesso
```

A aba "Usuários" passará a filtrar corretores da listagem (para evitar duplicação).

---

## Interface Visual

### Aba Corretores

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Usuários]  [Corretores] (3 pendentes)  [Perfis de Acesso]         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │   Total     │ │  Ativos     │ │  Pendentes  │ │Com Imobiliária│  │
│  │     25      │ │     22      │ │      3      │ │     15       │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
│                                                                     │
│  [🔍 Buscar...          ]  [Pendentes ✓] [Selecionar Todos]        │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ ☐ │ Nome           │ CPF          │ CRECI  │ Cidade/UF│ Status ││
│  ├───┼────────────────┼──────────────┼────────┼──────────┼────────┤│
│  │ ☐ │ João Silva     │ 123.456.789-00│ 12345 │ São Paulo/SP│Ativo ││
│  │ ☑ │ Maria Santos   │ 987.654.321-00│ 54321 │ Curitiba/PR│Pendente│
│  │ ☐ │ Pedro Oliveira │ 456.789.123-00│ 67890 │ BH/MG     │Ativo   │
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│                                    [Ativar Selecionados (1)]        │
└─────────────────────────────────────────────────────────────────────┘
```

### Dialog de Edição

```
┌─────────────────────────────────────────────────────────────────────┐
│  Editar Corretor                                            [X]    │
│  joao@email.com                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  [Dados]  [Empreendimentos]                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Nome Completo                                                      │
│  [João da Silva                                              ]      │
│                                                                     │
│  WhatsApp                                                           │
│  [(67) 99999-9999                                            ]      │
│                                                                     │
│  CPF                 CRECI                                          │
│  [123.456.789-00  ] [12345-MS                               ]      │
│                                                                     │
│  Cidade              UF                                             │
│  [Campo Grande    ] [MS ▼                                   ]      │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Status do Usuário                                    [● ativo] ││
│  │ Usuários inativos não podem acessar o sistema                  ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  [Resetar Senha (Seven@1234)]                                       │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                           [Cancelar]  [Salvar]  [Excluir ⚠️]        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Resumo de Arquivos

| Arquivo | Ação |
|---------|------|
| `src/hooks/useCorretoresUsuarios.ts` | **Novo** - Hook para buscar corretores com dados unificados |
| `src/components/usuarios/CorretoresUsuariosTab.tsx` | **Novo** - Componente da aba Corretores |
| `src/pages/Usuarios.tsx` | Adicionar aba Corretores, filtrar corretores da listagem principal |

---

## Detalhes de Implementação

### Hook `useCorretoresUsuarios.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CorretorUsuario {
  // profile data
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  
  // corretor data
  corretor_id: string | null;
  cpf: string | null;
  creci: string | null;
  cidade: string | null;
  uf: string | null;
  whatsapp: string | null;
  imobiliaria_id: string | null;
  imobiliaria_nome: string | null;
}

export function useCorretoresUsuarios() {
  return useQuery({
    queryKey: ['corretores-usuarios'],
    queryFn: async (): Promise<CorretorUsuario[]> => {
      // 1. Buscar user_roles com role corretor
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role_id, roles!inner(name)')
        .eq('roles.name', 'corretor');

      if (rolesError) throw rolesError;

      const userIds = (userRoles || []).map(ur => ur.user_id);
      if (userIds.length === 0) return [];

      // 2. Buscar profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // 3. Buscar corretores com user_id
      const { data: corretores, error: corretoresError } = await supabase
        .from('corretores')
        .select('*, imobiliaria:imobiliarias(id, nome)')
        .in('user_id', userIds);

      if (corretoresError) throw corretoresError;

      // 4. Merge data
      const corretoresMap = new Map(
        (corretores || []).map(c => [c.user_id, c])
      );

      return (profiles || []).map(profile => {
        const corretor = corretoresMap.get(profile.id);
        return {
          id: profile.id,
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone || null,
          avatar_url: profile.avatar_url || null,
          is_active: profile.is_active,
          created_at: profile.created_at,
          corretor_id: corretor?.id || null,
          cpf: corretor?.cpf || null,
          creci: corretor?.creci || null,
          cidade: corretor?.cidade || null,
          uf: corretor?.uf || null,
          whatsapp: corretor?.telefone || null,
          imobiliaria_id: corretor?.imobiliaria_id || null,
          imobiliaria_nome: (corretor?.imobiliaria as any)?.nome || null
        };
      });
    }
  });
}

// Mutation para atualizar dados do corretor
export function useUpdateCorretorUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      userId: string;
      corretorId: string | null;
      fullName: string;
      phone: string | null;
      isActive: boolean;
      cpf?: string;
      creci?: string;
      cidade?: string;
      uf?: string;
    }) => {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          phone: data.phone,
          is_active: data.isActive
        })
        .eq('id', data.userId);

      if (profileError) throw profileError;

      // Update corretor if exists
      if (data.corretorId) {
        const { error: corretorError } = await supabase
          .from('corretores')
          .update({
            nome_completo: data.fullName,
            cpf: data.cpf?.replace(/\D/g, '') || null,
            creci: data.creci || null,
            cidade: data.cidade || null,
            uf: data.uf || null
          })
          .eq('id', data.corretorId);

        if (corretorError) throw corretorError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corretores-usuarios'] });
      toast.success('Corretor atualizado com sucesso');
    },
    onError: (error) => {
      console.error('Error updating corretor:', error);
      toast.error('Erro ao atualizar corretor');
    }
  });
}
```

### Aba Corretores na `Usuarios.tsx`

Adicionar nova aba:

```tsx
<TabsTrigger 
  value="corretores"
  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary ..."
>
  <UserCheck className="h-4 w-4 mr-2" />
  Corretores
  {corretoresPendentes > 0 && (
    <Badge variant="secondary" className="ml-2">
      {corretoresPendentes}
    </Badge>
  )}
</TabsTrigger>

<TabsContent value="corretores">
  <CorretoresUsuariosTab />
</TabsContent>
```

---

## Funcionalidades da Aba

1. **Listagem**
   - Tabela com todos os dados relevantes
   - Busca por nome, CPF, CRECI, email
   - Filtro por status (ativo/pendente)
   
2. **Ativação**
   - Botão individual por linha
   - Seleção múltipla + ativação em lote
   - Vinculação automática a todos empreendimentos (usando hook existente)

3. **Edição**
   - Dialog com abas: Dados e Empreendimentos
   - Campos editáveis: Nome, WhatsApp, CPF, CRECI, Cidade, UF
   - Switch de status ativo/inativo
   - Botão resetar senha

4. **Exclusão**
   - Botão com confirmação
   - Exclui profile e corretor (cascade)
