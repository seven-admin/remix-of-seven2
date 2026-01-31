
# Plano: Sistema de Auto-Cadastro de Corretores

## Resumo

Implementar um fluxo completo de auto-cadastro para corretores na página de login, com:
1. Formulário de cadastro com dados obrigatórios (CPF, CRECI, cidade, estado)
2. Mensagem de "cadastro pendente de ativação"
3. Ativação individual ou em lote pelos super admins
4. Vínculo automático a todos os empreendimentos ativos ao ativar

---

## 1. Fluxo do Corretor

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  PÁGINA DE LOGIN                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  [Entrar]  |  [Cadastrar como Corretor]                              │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  Formulário de Cadastro:                                                     │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │  Nome Completo *                                                    │     │
│  │  Email *                                                            │     │
│  │  Senha *                                                            │     │
│  │  CPF *                                                              │     │
│  │  CRECI *                                                            │     │
│  │  Cidade *                                                           │     │
│  │  Estado * (Select com UFs)                                          │     │
│  │  Telefone/WhatsApp (opcional)                                       │     │
│  │                                                                     │     │
│  │  [ ] Li e aceito os Termos de Uso                                   │     │
│  │                                                                     │     │
│  │                                         [Criar Cadastro]            │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Após Cadastro
```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│       ✅ Cadastro Realizado com Sucesso!                                    │
│                                                                              │
│       Seu cadastro foi recebido e está aguardando ativação                  │
│       por um administrador do sistema.                                       │
│                                                                              │
│       Você receberá uma notificação quando seu acesso                       │
│       for liberado.                                                          │
│                                                                              │
│                            [Voltar ao Login]                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Alterações no Banco de Dados

### 2.1 Adicionar campos à tabela `corretores` (opcional/alternativa)

O sistema já possui a tabela `corretores` com os campos necessários. A estratégia será:
- Criar registro em `auth.users` (via Supabase Auth)
- Criar registro em `profiles` (via trigger existente)
- Criar registro em `user_roles` com role `corretor` 
- Criar registro em `corretores` vinculando o `user_id`

### 2.2 Nova Edge Function: `register-corretor`

Edge function pública (sem auth) que:
1. Cria usuário no Supabase Auth
2. Atualiza profile com dados extras
3. Insere em `user_roles` com role `corretor`
4. Insere em `corretores` com os dados profissionais
5. Mantém `is_active = false` no profile (pendente ativação)

```typescript
// supabase/functions/register-corretor/index.ts
Deno.serve(async (req) => {
  const { 
    email, password, nome_completo, 
    cpf, creci, cidade, uf, telefone 
  } = await req.json();
  
  // 1. Criar usuário via Admin API
  const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: nome_completo }
  });
  
  // 2. Atualizar profile (is_active = false por padrão via trigger)
  // 3. Inserir user_role com role_id do corretor
  // 4. Inserir em corretores com user_id
});
```

---

## 3. Componentes Frontend

### 3.1 Atualizar `LoginForm.tsx`

Adicionar toggle entre "Entrar" e "Cadastrar como Corretor":

```tsx
const [mode, setMode] = useState<'login' | 'register'>('login');

// Adicionar link para alternar modos
<div className="text-center mt-4">
  {mode === 'login' ? (
    <Button variant="link" onClick={() => setMode('register')}>
      É corretor? Cadastre-se aqui
    </Button>
  ) : (
    <Button variant="link" onClick={() => setMode('login')}>
      Já tem cadastro? Faça login
    </Button>
  )}
</div>
```

### 3.2 Novo Componente `CorretorRegisterForm.tsx`

Formulário completo de cadastro:

```tsx
const registerSchema = z.object({
  nome_completo: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  cpf: z.string().refine(validarCPF, 'CPF inválido'),
  creci: z.string().min(1, 'CRECI é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  uf: z.string().min(2, 'Estado é obrigatório'),
  telefone: z.string().optional(),
  aceite_termos: z.literal(true, { errorMap: () => ({ message: 'Você deve aceitar os termos' }) })
});
```

### 3.3 Tela de Sucesso

Após cadastro bem-sucedido, exibir mensagem informativa.

---

## 4. Ativação pelo Admin

### 4.1 Modificar página `Usuarios.tsx`

Adicionar:
- Filtro para exibir apenas usuários pendentes (is_active = false)
- Botão de ativação individual
- Seleção múltipla + botão "Ativar em Lote"

```tsx
// Filtro
const [showPendentes, setShowPendentes] = useState(false);

// Botão de ativação
const handleActivateUser = async (userId: string) => {
  // 1. Atualizar is_active = true em profiles
  // 2. Vincular automaticamente a todos empreendimentos ativos
};

// Ativação em lote
const handleBulkActivate = async (userIds: string[]) => {
  for (const userId of userIds) {
    await handleActivateUser(userId);
  }
};
```

### 4.2 Vínculo Automático aos Empreendimentos

Ao ativar um corretor:

```typescript
// Buscar todos empreendimentos ativos
const { data: emps } = await supabase
  .from('empreendimentos')
  .select('id')
  .eq('is_active', true);

// Inserir vínculos
const links = emps.map(e => ({
  user_id: userId,
  empreendimento_id: e.id
}));

await supabase
  .from('user_empreendimentos')
  .insert(links);
```

---

## 5. Resumo de Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/functions/register-corretor/index.ts` | **Novo** - Edge function para auto-cadastro |
| `src/components/auth/LoginForm.tsx` | Adicionar toggle login/cadastro |
| `src/components/auth/CorretorRegisterForm.tsx` | **Novo** - Formulário de cadastro |
| `src/pages/Usuarios.tsx` | Adicionar filtro pendentes + ativação em lote |
| `src/hooks/useActivateCorretor.ts` | **Novo** - Hook para ativar + vincular empreendimentos |

---

## 6. Detalhes Técnicos

### Edge Function `register-corretor`

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { email, password, nome_completo, cpf, creci, cidade, uf, telefone } = await req.json();

    // Validações básicas
    if (!email || !password || !nome_completo || !cpf || !creci || !cidade || !uf) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios não preenchidos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se CPF já existe
    const { data: existingCpf } = await supabaseAdmin
      .from('corretores')
      .select('id')
      .eq('cpf', cpf.replace(/\D/g, ''))
      .maybeSingle();

    if (existingCpf) {
      return new Response(
        JSON.stringify({ error: 'CPF já cadastrado no sistema' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Criar usuário
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: nome_completo }
    });

    if (authError) throw authError;

    const userId = authData.user.id;

    // 2. Profile já criado por trigger (is_active = false por padrão)

    // 3. Buscar role_id do corretor
    const { data: roleData } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', 'corretor')
      .single();

    if (roleData) {
      await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: userId, role_id: roleData.id });
    }

    // 4. Criar registro em corretores
    await supabaseAdmin
      .from('corretores')
      .insert({
        nome_completo,
        cpf: cpf.replace(/\D/g, ''),
        creci,
        telefone: telefone || null,
        email,
        user_id: userId,
        is_active: true // corretor ativo, mas profile inativo até ativação
      });

    return new Response(
      JSON.stringify({ success: true, message: 'Cadastro realizado! Aguardando ativação.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### Hook de Ativação com Vínculo Automático

```typescript
// src/hooks/useActivateCorretor.ts
export function useActivateCorretor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // 1. Ativar profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_active: true })
        .eq('id', userId);

      if (profileError) throw profileError;

      // 2. Buscar todos empreendimentos ativos
      const { data: emps, error: empError } = await supabase
        .from('empreendimentos')
        .select('id')
        .eq('is_active', true);

      if (empError) throw empError;

      // 3. Inserir vínculos
      if (emps && emps.length > 0) {
        const links = emps.map(e => ({
          user_id: userId,
          empreendimento_id: e.id
        }));

        const { error: linkError } = await supabase
          .from('user_empreendimentos')
          .insert(links);

        if (linkError) throw linkError;
      }

      return { empreendimentosVinculados: emps?.length || 0 };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`Corretor ativado e vinculado a ${data.empreendimentosVinculados} empreendimentos`);
    }
  });
}
```

---

## 7. Fluxo Visual Completo

```text
                    CORRETOR                           ADMIN
                       │                                 │
                       ▼                                 │
               ┌──────────────┐                         │
               │ Página Login │                         │
               │ [Cadastrar]  │                         │
               └──────┬───────┘                         │
                       │                                 │
                       ▼                                 │
               ┌──────────────┐                         │
               │ Formulário   │                         │
               │ - Nome       │                         │
               │ - Email      │                         │
               │ - Senha      │                         │
               │ - CPF        │                         │
               │ - CRECI      │                         │
               │ - Cidade/UF  │                         │
               └──────┬───────┘                         │
                       │                                 │
                       ▼                                 │
               ┌──────────────┐                         │
               │ Edge Function│                         │
               │ register-    │                         │
               │ corretor     │                         │
               └──────┬───────┘                         │
                       │                                 │
      ┌────────────────┼────────────────┐               │
      │                │                │               │
      ▼                ▼                ▼               │
┌──────────┐    ┌──────────┐    ┌──────────┐           │
│ auth.    │    │ profiles │    │corretores│           │
│ users    │    │(inactive)│    │          │           │
└──────────┘    └──────────┘    └──────────┘           │
                       │                                │
                       ▼                                │
               ┌──────────────┐                         │
               │  "Cadastro   │                         │
               │  Pendente"   │                         │
               └──────────────┘                         │
                       │                                │
                       │                                ▼
                       │                        ┌──────────────┐
                       │                        │ Página       │
                       │                        │ Usuários     │
                       │                        │ [Pendentes]  │
                       │                        └──────┬───────┘
                       │                                │
                       │                        ┌───────┴───────┐
                       │                        ▼               ▼
                       │                 ┌──────────┐   ┌──────────┐
                       │                 │ Ativar   │   │ Ativar   │
                       │                 │ Individual│   │ em Lote  │
                       │                 └────┬─────┘   └────┬─────┘
                       │                      │              │
                       │                      └──────┬───────┘
                       │                             │
                       │                             ▼
                       │                     ┌──────────────┐
                       │                     │ Vincular a   │
                       │                     │ TODOS emps   │
                       │                     │ (automático) │
                       │                     └──────┬───────┘
                       │                            │
                       ▼                            ▼
               ┌───────────────────────────────────────────┐
               │  Corretor pode acessar Portal do Corretor │
               │  com todos os empreendimentos visíveis    │
               └───────────────────────────────────────────┘
```

---

## 8. Considerações de Segurança

1. **Validação de CPF**: Validação real no backend (não apenas formato)
2. **CPF único**: Verificar duplicidade antes de criar
3. **Rate limiting**: Considerar adicionar limite de tentativas de cadastro
4. **Email de confirmação**: Opcional - já que admin ativa manualmente
5. **CRECI único**: Considerar validar unicidade do CRECI também

