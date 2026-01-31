

# Plano: Acesso Automático a Empreendimentos + Remoção do Simulador

## Resumo

Duas alterações principais:

1. **Corretores com acesso a todos os empreendimentos**: Modificar a lógica para que corretores sempre tenham acesso liberado a todos os empreendimentos, sem necessidade de vincular manualmente na tabela `user_empreendimentos`
2. **Remover Utilidades/Simulador**: Excluir completamente o menu "Utilidades", a página do Simulador e todos os componentes/arquivos relacionados

---

## 1. Acesso Automático dos Corretores aos Empreendimentos

### Estratégia

Em vez de vincular cada corretor a cada empreendimento na tabela `user_empreendimentos` (que pode ficar desatualizada quando novos empreendimentos são criados), a abordagem será:

**Modificar as consultas que filtram empreendimentos por usuário para ignorar o filtro quando o role for `corretor`.**

Isso garante que:
- Corretores sempre veem TODOS os empreendimentos ativos
- Novos empreendimentos aparecem automaticamente para todos os corretores
- Não precisa manter vínculos em `user_empreendimentos` para corretores

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useEmpreendimentos.ts` | Ignorar filtro de `user_empreendimentos` quando role = corretor |
| `src/hooks/useEmpreendimentosSelect.ts` | Mesma lógica |
| Consultas do Portal do Corretor | Retornar todos empreendimentos ativos |

### Lógica Proposta

```typescript
// Em hooks que filtram por user_empreendimentos
const { role } = useAuth();

// Se for corretor, buscar todos os empreendimentos ativos
if (role === 'corretor') {
  return supabase
    .from('empreendimentos')
    .select('*')
    .eq('is_active', true);
}

// Para outros roles, manter filtro por vínculo
// ...
```

---

## 2. Remover Simulador do Sistema

### Arquivos a Excluir

| Caminho | Tipo |
|---------|------|
| `src/pages/Simulador.tsx` | Página |
| `src/components/simulador/DadosClienteCard.tsx` | Componente |
| `src/components/simulador/DadosEntradaCard.tsx` | Componente |
| `src/components/simulador/DadosLoteCard.tsx` | Componente |
| `src/components/simulador/GerarPdfButton.tsx` | Componente |
| `src/components/simulador/OpcaoAVista.tsx` | Componente |
| `src/components/simulador/OpcaoCurtoPrazo.tsx` | Componente |
| `src/components/simulador/OpcaoFinanciamento.tsx` | Componente |
| `src/components/simulador/ResumoCards.tsx` | Componente |
| `src/components/simulador/index.ts` | Index |
| `src/types/simulador.types.ts` | Types |
| `src/lib/calculoFinanciamento.ts` | Lib (verificar se usado em outro lugar) |

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/App.tsx` | Remover rota `/simulador` e import do Simulador |
| `src/components/layout/Sidebar.tsx` | Remover grupo "Utilidades" com item Simulador |

---

## 3. Detalhes de Implementação

### 3.1 Sidebar - Remover Utilidades

```typescript
// REMOVER este bloco completo (linhas 183-191):
// Utilidades
{
  label: 'Utilidades',
  icon: Calculator,
  color: CORES_SIDEBAR.utilidades,
  items: [
    { icon: Calculator, label: 'Simulador', path: '/simulador', moduleName: 'simulador' },
  ],
},
```

Também remover o import do `Calculator` se não for mais usado.

### 3.2 App.tsx - Remover Rota

```typescript
// REMOVER (linha 60):
import Simulador from "./pages/Simulador";

// REMOVER (linhas 328-333):
{/* Utilidades */}
<Route path="/simulador" element={
  <ProtectedRoute moduleName="simulador">
    <Simulador />
  </ProtectedRoute>
} />
```

### 3.3 Hook de Empreendimentos para Corretores

No hook que o Portal do Corretor usa para listar empreendimentos, modificar para:

```typescript
// src/hooks/useIncorporadorEmpreendimentos.ts ou equivalente
export function usePortalEmpreendimentos() {
  const { role, user } = useAuth();
  
  return useQuery({
    queryKey: ['portal-empreendimentos', role, user?.id],
    queryFn: async () => {
      // Corretores veem TODOS os empreendimentos ativos
      if (role === 'corretor') {
        const { data, error } = await supabase
          .from('empreendimentos')
          .select('*')
          .eq('is_active', true)
          .order('nome');
        
        if (error) throw error;
        return data;
      }
      
      // Outros roles: filtrar por vínculo
      // ...
    }
  });
}
```

---

## 4. Resumo de Arquivos

### Excluir (11 arquivos)

- `src/pages/Simulador.tsx`
- `src/components/simulador/DadosClienteCard.tsx`
- `src/components/simulador/DadosEntradaCard.tsx`
- `src/components/simulador/DadosLoteCard.tsx`
- `src/components/simulador/GerarPdfButton.tsx`
- `src/components/simulador/OpcaoAVista.tsx`
- `src/components/simulador/OpcaoCurtoPrazo.tsx`
- `src/components/simulador/OpcaoFinanciamento.tsx`
- `src/components/simulador/ResumoCards.tsx`
- `src/components/simulador/index.ts`
- `src/types/simulador.types.ts`
- `src/lib/calculoFinanciamento.ts`

### Modificar (3 arquivos)

| Arquivo | Alteração |
|---------|-----------|
| `src/App.tsx` | Remover import e rota do Simulador |
| `src/components/layout/Sidebar.tsx` | Remover grupo Utilidades |
| Hook de empreendimentos do Portal | Bypass do filtro para corretores |

---

## 5. Resultado Final

Após as alterações:

1. **Menu Utilidades**: Não aparece mais no sidebar
2. **Rota /simulador**: Retorna 404 (NotFound)
3. **Corretores**: Veem automaticamente todos os empreendimentos ativos no Portal do Corretor, sem necessidade de vínculos manuais em `user_empreendimentos`
4. **Novos empreendimentos**: Aparecem automaticamente para todos os corretores

