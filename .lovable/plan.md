

# Plano: Corrigir Vínculo de Corretor Ausente

## Diagnóstico do Problema

O usuário `teste@mail.com` (CORRETOR TESTE) tem:
- Profile na tabela `profiles`
- Role `corretor` na tabela `user_roles`
- **NÃO TEM** registro na tabela `corretores`

O hook `useMeuCorretor` busca na tabela `corretores` por `user_id` ou `email`. Como não existe registro, retorna `null` e o Portal do Corretor exibe o alerta.

**Causa raiz**: Quando o administrador cria um usuário com role "corretor" pela interface de Usuários, não é criado automaticamente um registro na tabela `corretores`. Diferente do auto-cadastro pela edge function `register-corretor`, que cria tudo corretamente.

---

## Solução Proposta

Modificar a aba Corretores na página de Usuários para:

1. **Detectar corretores sem vínculo**: Mostrar alerta visual quando `corretor_id` é `null`
2. **Criar registro automaticamente**: Botão para criar o registro na tabela `corretores` vinculando ao usuário
3. **Melhorar a ativação**: Quando ativar um corretor sem vínculo, criar o registro automaticamente

---

## Alterações Necessárias

### 1. Atualizar `CorretoresUsuariosTab.tsx`

Adicionar indicador visual e ação para corretores sem vínculo:

- Na tabela, mostrar badge de alerta quando `corretor_id === null`
- Adicionar botão "Criar Vínculo" que cria o registro na tabela `corretores`
- Modificar a ativação para criar o vínculo automaticamente se não existir

### 2. Adicionar mutation `useCreateCorretorVinculo` no hook

Nova mutation para criar registro na tabela `corretores`:

```typescript
export function useCreateCorretorVinculo() {
  return useMutation({
    mutationFn: async (data: { 
      userId: string; 
      email: string; 
      nome: string;
      cpf?: string;
      creci?: string;
    }) => {
      const { error } = await supabase
        .from('corretores')
        .insert({
          user_id: data.userId,
          email: data.email,
          nome_completo: data.nome,
          cpf: data.cpf || null,
          creci: data.creci || null,
          is_active: true
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corretores-usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['meu-corretor'] });
      toast.success('Vínculo de corretor criado com sucesso');
    }
  });
}
```

### 3. Modificar `useActivateCorretor` para criar vínculo

Alterar o hook de ativação para:
1. Verificar se existe registro em `corretores` com o `user_id`
2. Se não existir, criar o registro antes de ativar
3. Continuar com o processo de ativação normal

---

## Interface Atualizada

### Tabela de Corretores

```
┌────┬────────────────┬─────────────┬────────────┬───────────┐
│ ☐  │ Corretor       │ CPF         │ Status     │ Ações     │
├────┼────────────────┼─────────────┼────────────┼───────────┤
│ ☐  │ CORRETOR TESTE │ ⚠️ Sem CPF  │ 🟠 Ativo   │ [Editar]  │
│    │ teste@mail.com │ ⚠️ Vínculo  │ sem vínculo│ [Vincular]│
│    │                │   pendente  │            │           │
└────┴────────────────┴─────────────┴────────────┴───────────┘
```

Badge de alerta:
- `⚠️ Vínculo pendente` - quando `corretor_id === null`
- Botão "Vincular" abre dialog para preencher CPF/CRECI e criar registro

### Dialog de Criação de Vínculo

```
┌─────────────────────────────────────────────────┐
│  Criar Vínculo de Corretor                [X]  │
├─────────────────────────────────────────────────┤
│                                                 │
│  O usuário CORRETOR TESTE possui role de        │
│  corretor mas não tem registro profissional.    │
│                                                 │
│  Preencha os dados obrigatórios:                │
│                                                 │
│  CPF *                                          │
│  [___.___.___-__                            ]   │
│                                                 │
│  CRECI *                                        │
│  [_____________________________             ]   │
│                                                 │
├─────────────────────────────────────────────────┤
│                    [Cancelar]  [Criar Vínculo]  │
└─────────────────────────────────────────────────┘
```

---

## Resumo de Arquivos

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useCorretoresUsuarios.ts` | Adicionar mutation `useCreateCorretorVinculo` |
| `src/hooks/useActivateCorretor.ts` | Criar vínculo automaticamente ao ativar se não existir |
| `src/components/usuarios/CorretoresUsuariosTab.tsx` | Adicionar indicador visual e dialog para criar vínculo |

---

## Resultado Esperado

1. Admin vê claramente quais corretores precisam de vínculo
2. Pode criar o vínculo rapidamente com CPF e CRECI
3. O corretor passa a acessar o Portal do Corretor normalmente
4. Novos corretores ativados terão vínculo criado automaticamente

