

# Plano: Corrigir Visibilidade da Equipe de Criação para Supervisores de Marketing

## Problema Identificado

Os membros da equipe de criação **não aparecem** para usuários com perfis de `diretor_de_marketing` ou `supervisão_de_criação` devido a políticas RLS restritivas.

### Análise das Políticas Atuais

| Tabela | Política | Quem pode ver |
|--------|----------|---------------|
| `profiles` | "Admins can view all profiles" | Apenas `admin` e `super_admin` |
| `profiles` | "Users can view their own profile" | Apenas o próprio perfil |
| `user_roles` | "Admins can view all roles" | Apenas `admin` e `super_admin` |
| `user_roles` | "Users can view their own role" | Apenas a própria role |

### Resultado

Quando a Jéssica (Diretora de Marketing) acessa `/marketing/equipe`:
1. O hook busca roles com acesso ao módulo de marketing - funciona
2. O hook busca `user_roles` para encontrar usuários - **só retorna a própria Jéssica**
3. O hook busca `profiles` dos usuários - **só retorna o perfil da Jéssica**
4. O hook exclui admins da lista - Jéssica não é admin
5. **Resultado**: Apenas 1 membro (Jéssica) aparece, sem os outros da equipe

---

## Solução Proposta

Adicionar políticas RLS que permitam que **supervisores de marketing** vejam os perfis e roles de **outros membros com acesso ao módulo de marketing**.

### Opção Recomendada: Políticas Específicas para Marketing

Criar políticas que usam a função existente `is_marketing_supervisor()` para permitir que supervisores de marketing vejam profiles e roles relevantes.

---

## Alterações Técnicas

### 1. Nova Política RLS na tabela `profiles`

```sql
-- Supervisores de marketing podem ver profiles de usuários com acesso ao módulo de marketing
CREATE POLICY "Marketing supervisors can view marketing team profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- O usuário logado é um supervisor de marketing
  public.is_marketing_supervisor(auth.uid())
  AND
  -- E o perfil pertence a alguém com acesso ao módulo de marketing
  id IN (
    SELECT ur.user_id 
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    JOIN public.modules m ON m.id = rp.module_id
    WHERE m.name = 'projetos_marketing'
    AND rp.can_view = true
    UNION
    SELECT ump.user_id
    FROM public.user_module_permissions ump
    JOIN public.modules m ON m.id = ump.module_id
    WHERE m.name = 'projetos_marketing'
    AND ump.can_view = true
  )
);
```

### 2. Nova Política RLS na tabela `user_roles`

```sql
-- Supervisores de marketing podem ver roles de usuários com acesso ao módulo de marketing
CREATE POLICY "Marketing supervisors can view marketing team roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  -- O usuário logado é um supervisor de marketing
  public.is_marketing_supervisor(auth.uid())
  AND
  -- E a role pertence a alguém com acesso ao módulo de marketing
  user_id IN (
    SELECT ur2.user_id 
    FROM public.user_roles ur2
    JOIN public.role_permissions rp ON rp.role_id = ur2.role_id
    JOIN public.modules m ON m.id = rp.module_id
    WHERE m.name = 'projetos_marketing'
    AND rp.can_view = true
    UNION
    SELECT ump.user_id
    FROM public.user_module_permissions ump
    JOIN public.modules m ON m.id = ump.module_id
    WHERE m.name = 'projetos_marketing'
    AND ump.can_view = true
  )
);
```

---

## Alternativa Simplificada

Se as subqueries forem muito complexas, podemos usar uma abordagem mais simples:

### Permitir que supervisores de marketing vejam TODOS os profiles (somente leitura)

```sql
-- Supervisores de marketing podem ver todos os profiles
CREATE POLICY "Marketing supervisors can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_marketing_supervisor(auth.uid()));
```

```sql
-- Supervisores de marketing podem ver todos os user_roles
CREATE POLICY "Marketing supervisors can view all user_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_marketing_supervisor(auth.uid()));
```

Esta opção é **mais simples** e **mais segura** em termos de performance, mas dá acesso a mais dados do que o estritamente necessário.

---

## Resultado Esperado

Após a aplicação das políticas:

1. Jéssica (Diretora de Marketing) poderá ver todos os membros da equipe
2. Jonas, Kalebe, Priscila, Rafael (Supervisão de Criação) também verão a equipe completa
3. Admins e Super Admins continuam vendo normalmente
4. Usuários sem perfil de marketing não conseguem ver a equipe

---

## Arquivos a Modificar

| Tipo | Ação |
|------|------|
| Migração SQL | Criar nova migração com as políticas RLS |

---

## SQL Completo para Migração

```sql
-- Política para profiles: supervisores de marketing podem ver profiles da equipe
CREATE POLICY "Marketing supervisors can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_marketing_supervisor(auth.uid()));

-- Política para user_roles: supervisores de marketing podem ver roles da equipe
CREATE POLICY "Marketing supervisors can view all user_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_marketing_supervisor(auth.uid()));
```

---

## Critérios de Aceite

1. Diretora de Marketing vê todos os 5 membros da equipe (Jéssica, Jonas, Kalebe, Priscila, Rafael)
2. Supervisores de Criação veem todos os membros da equipe
3. Super Admins e Admins continuam vendo a equipe normalmente
4. Usuários sem acesso ao módulo de marketing não conseguem ver a página
5. As políticas são apenas para SELECT (leitura), não afetam edição

