
# Plano de Correção: Portal do Incorporador - Dados Não Exibidos

## Análise Completa

### Dados no Banco de Dados (Corretos)

- **Usuário logado:** `mail@mail.com` (Incorp) com role `incorporador`
- **Empreendimentos vinculados:** 
  - VITHORIA DO SOL (`f2208f56-edd6-4c98-b82a-9657606376cf`)
  - DON INÁCIO (`2271f374-62b7-4772-90f6-fe67de5c1113`)
- **Gestor de Produto:** Michel (user_id: `0bb345de-208f-47c5-a9f7-4935c033fd9b`) vinculado a ambos empreendimentos
- **Tickets de Marketing:** 3 tickets existentes para VITHORIA DO SOL:
  - MKT-00020: "Cobertura de Garagem" (em_producao)
  - MKT-00017: "Identidade visual e logo Vithoria" (aprovacao_cliente)
  - MKT-00009: "CALENDÁRIO - KRAFT" (aprovacao_cliente)

### Problemas Identificados

#### 1. RLS Bloqueando Acesso aos Tickets de Marketing

A tabela `projetos_marketing` tem as seguintes políticas RLS:

| Policy | Condição |
|--------|----------|
| Admins can manage | `is_admin(auth.uid())` |
| Supervisores can manage | `is_marketing_supervisor(auth.uid())` |
| Clientes can view own | `cliente_id = auth.uid()` |

**Problema:** Não existe política para o role `incorporador` visualizar tickets dos seus empreendimentos. A request de rede retorna `[]` (array vazio) mesmo com tickets existentes.

#### 2. Dashboard Não Exibe Gestor de Produto

O `PortalIncorporadorDashboard.tsx` lista os empreendimentos, mas NÃO exibe quem é o gestor de produto de cada um. Isso é uma informação valiosa para o incorporador saber com quem entrar em contato.

O hook `useGestorEmpreendimento` já existe e funciona corretamente (usa a RPC `get_gestor_empreendimento`), mas não está sendo utilizado no portal.

---

## Solução

### Correção 1: Criar Política RLS para Incorporadores

**Localização:** Banco de Dados (via SQL Migration)

Criar uma função helper `is_incorporador()` e adicionar política na tabela `projetos_marketing`:

```sql
-- Função para verificar se usuário é incorporador
CREATE OR REPLACE FUNCTION public.is_incorporador(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id
    AND r.name = 'incorporador'
    AND r.is_active = true
  )
$$;

-- Política para incorporadores visualizarem tickets de seus empreendimentos
CREATE POLICY "Incorporadores can view tickets of their empreendimentos"
ON public.projetos_marketing
FOR SELECT
TO authenticated
USING (
  is_incorporador(auth.uid())
  AND empreendimento_id IN (
    SELECT empreendimento_id 
    FROM user_empreendimentos 
    WHERE user_id = auth.uid()
  )
);
```

### Correção 2: Exibir Gestor de Produto no Dashboard

**Arquivo:** `src/pages/portal-incorporador/PortalIncorporadorDashboard.tsx`

Adicionar o nome do gestor de produto em cada card de empreendimento. Para isso:

1. Criar um novo hook `useGestoresEmpreendimentos` que busca os gestores de todos os empreendimentos de uma vez (evitando N+1 queries)
2. Exibir o nome do gestor no card de cada empreendimento

```typescript
// Novo hook para buscar gestores de múltiplos empreendimentos
export function useGestoresMultiplosEmpreendimentos(empreendimentoIds: string[]) {
  return useQuery({
    queryKey: ['gestores-empreendimentos', empreendimentoIds],
    queryFn: async () => {
      if (empreendimentoIds.length === 0) return {};
      
      // Buscar role_id do gestor_produto
      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'gestor_produto')
        .single();
      
      if (!roleData) return {};
      
      // Buscar todos os vínculos de gestores
      const { data: links } = await supabase
        .from('user_empreendimentos')
        .select(`
          empreendimento_id,
          user:profiles(id, full_name)
        `)
        .in('empreendimento_id', empreendimentoIds)
        .in('user_id', 
          supabase.from('user_roles')
            .select('user_id')
            .eq('role_id', roleData.id)
        );
      
      // Mapear empreendimento -> nome do gestor
      const gestorMap: Record<string, string> = {};
      links?.forEach(link => {
        if (link.user) {
          gestorMap[link.empreendimento_id] = link.user.full_name;
        }
      });
      
      return gestorMap;
    },
    enabled: empreendimentoIds.length > 0,
  });
}
```

E no componente do Dashboard, adicionar:

```tsx
{/* Card de Empreendimento */}
<div className="p-4 border rounded-lg bg-card">
  <div className="flex items-start justify-between gap-2">
    <div className="flex-1">
      <h4 className="font-medium">{emp.nome}</h4>
      {gestorMap[emp.id] && (
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <User className="h-3 w-3" />
          Gestor: {gestorMap[emp.id]}
        </p>
      )}
    </div>
    <Badge>{emp.status}</Badge>
  </div>
</div>
```

### Correção 3: Melhorar Hook useGestores para Compatibilidade

**Arquivo:** `src/hooks/useGestores.ts`

O hook atual usa `.eq('role', 'gestor_produto')` que depende da coluna enum legada. Atualizar para usar join com a tabela `roles`:

```typescript
export function useGestoresProduto(options: QueryOptions = {}) {
  return useQuery({
    queryKey: ['gestores-produto'],
    queryFn: async () => {
      // Buscar role_id do gestor_produto
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'gestor_produto')
        .single();

      if (roleError || !roleData) return [];

      // Buscar usuários com esse role_id
      const { data: userRoles, error: urError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role_id', roleData.id);

      if (urError || !userRoles?.length) return [];

      const userIds = userRoles.map(r => r.user_id);

      // Buscar perfis
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, is_active, percentual_comissao')
        .in('id', userIds)
        .eq('is_active', true);

      return profiles || [];
    },
    // ... options
  });
}
```

---

## Resumo das Alterações

| Arquivo/Local | Modificação |
|---------------|-------------|
| **Banco de Dados** | Criar função `is_incorporador()` e política RLS em `projetos_marketing` para permitir SELECT aos incorporadores |
| `src/pages/portal-incorporador/PortalIncorporadorDashboard.tsx` | Adicionar exibição do gestor de produto em cada card de empreendimento |
| `src/hooks/useGestores.ts` | Atualizar para usar `role_id` via join com tabela `roles` em vez do enum legado |
| `src/hooks/useGestorEmpreendimento.ts` | (Opcional) Criar variante que busca gestores de múltiplos empreendimentos |

---

## Detalhes Técnicos

### Por que os Tickets Retornam Vazio?

O Supabase aplica Row Level Security antes de retornar os dados. A query em `PortalIncorporadorMarketing.tsx`:

```typescript
const { data: tickets } = await supabase
  .from('projetos_marketing')
  .select('...')
  .in('empreendimento_id', empreendimentoIds);
```

Funciona corretamente no nível de filtro, mas a RLS bloqueia o acesso porque nenhuma das políticas existentes cobre o caso do incorporador:

```text
┌─────────────────────────────────────────────────────────┐
│ is_admin(auth.uid())                 → false           │
│ is_marketing_supervisor(auth.uid())  → false           │
│ cliente_id = auth.uid()              → false           │
│                                                         │
│ RESULTADO: 0 rows retornadas (RLS bloqueou)            │
└─────────────────────────────────────────────────────────┘
```

Com a nova política:
```text
┌─────────────────────────────────────────────────────────┐
│ is_incorporador(auth.uid())          → true ✓          │
│ empreendimento_id IN user_empreendimentos → true ✓     │
│                                                         │
│ RESULTADO: 3 tickets retornados                         │
└─────────────────────────────────────────────────────────┘
```

---

## Critérios de Aceite

1. Ao acessar `/portal-incorporador/marketing`, os 3 tickets de marketing são exibidos corretamente
2. Os KPIs (Tickets Ativos, Em Produção, etc.) mostram valores corretos
3. No Dashboard, cada empreendimento exibe o nome do gestor de produto associado (ex: "Gestor: Michel")
4. O hook `useGestoresProduto` continua funcionando para outros componentes do sistema
