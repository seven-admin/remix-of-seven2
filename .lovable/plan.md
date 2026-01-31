

# Plano: Cadastro de URLs na aba Mídias + Visualização no Portal do Corretor

## Resumo

Adicionar funcionalidade de cadastro de links externos na aba Mídias do empreendimento e permitir que corretores visualizem essas mídias e uma tabela simplificada de valores no Portal do Corretor.

---

## 1. Alteração no Banco de Dados

### 1.1 Adicionar novo tipo ao enum `midia_tipo`

```sql
ALTER TYPE midia_tipo ADD VALUE 'link';
```

Isso permitirá cadastrar mídias do tipo "link" na mesma tabela `empreendimento_midias`.

---

## 2. Atualizar Tipos TypeScript

### 2.1 Arquivo: `src/types/empreendimentos.types.ts`

Adicionar `'link'` ao tipo `MidiaTipo`:

```typescript
export type MidiaTipo = 'imagem' | 'video' | 'tour_virtual' | 'pdf' | 'link';
```

---

## 3. Modificar a Aba de Mídias

### 3.1 Arquivo: `src/components/empreendimentos/MidiasTab.tsx`

Adicionar um formulário simples para cadastrar URLs com:
- Campo **Título** (nome do link)
- Campo **URL** (endereço do link)
- Botão **Adicionar Link**

A seção de links ficará separada das mídias de imagem/vídeo, com uma lista exibindo:
- Título do link
- URL (clicável, abre em nova aba)
- Botão de deletar

### 3.2 Arquivo: `src/hooks/useEmpreendimentoMidias.ts`

Adicionar mutação `useAddMidiaLink` para inserir links diretamente no banco:

```typescript
export function useAddMidiaLink() {
  return useMutation({
    mutationFn: async ({ empreendimentoId, nome, url }: { 
      empreendimentoId: string; 
      nome: string; 
      url: string 
    }) => {
      const { data, error } = await supabase
        .from('empreendimento_midias')
        .insert({
          empreendimento_id: empreendimentoId,
          tipo: 'link',
          nome,
          url,
          is_capa: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    // ... invalidação de queries
  });
}
```

---

## 4. Portal do Corretor - Visualização de Detalhes

### 4.1 Criar nova página: `src/pages/PortalEmpreendimentoDetalhe.tsx`

Quando o corretor clicar em "Ver Unidades" ou em um card de empreendimento, abrirá um dialog/página com:

**Aba 1 - Unidades (atual)**
- Lista de unidades disponíveis para solicitar reserva

**Aba 2 - Tabela de Valores (nova)**
- Tabela simples somente leitura mostrando:
  - Quadra/Bloco
  - Número
  - Valor

**Aba 3 - Mídias/Links (nova)**
- Lista de links cadastrados
- Exibição de imagens/vídeos

### 4.2 Modificar: `src/pages/PortalEmpreendimentos.tsx`

Transformar o dialog atual em um sistema de abas:

```tsx
<Tabs defaultValue="unidades">
  <TabsList>
    <TabsTrigger value="unidades">Unidades</TabsTrigger>
    <TabsTrigger value="valores">Tabela de Valores</TabsTrigger>
    <TabsTrigger value="midias">Mídias</TabsTrigger>
  </TabsList>

  <TabsContent value="unidades">
    {/* Conteúdo atual de seleção de unidades */}
  </TabsContent>

  <TabsContent value="valores">
    <ValoresReadOnlyTable empreendimentoId={selectedEmpId} />
  </TabsContent>

  <TabsContent value="midias">
    <MidiasReadOnlyList empreendimentoId={selectedEmpId} />
  </TabsContent>
</Tabs>
```

---

## 5. Novos Componentes Read-Only para Portal

### 5.1 Criar: `src/components/portal/ValoresReadOnlyTable.tsx`

Tabela simples de visualização:

| Quadra | Lote | Valor |
|--------|------|-------|
| 01 | 01 | R$ 500.000,00 |
| 01 | 02 | R$ 480.000,00 |

Características:
- Sem edição
- Sem ações
- Apenas dados de unidades disponíveis

### 5.2 Criar: `src/components/portal/MidiasReadOnlyList.tsx`

Lista de mídias e links:
- **Links**: exibidos como lista clicável
- **Imagens/Vídeos**: galeria simples de visualização

---

## 6. Resumo dos Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/migrations/...` | Adicionar 'link' ao enum `midia_tipo` |
| `src/types/empreendimentos.types.ts` | Atualizar tipo `MidiaTipo` |
| `src/hooks/useEmpreendimentoMidias.ts` | Adicionar `useAddMidiaLink` |
| `src/components/empreendimentos/MidiasTab.tsx` | Adicionar formulário de cadastro de links |
| `src/pages/PortalEmpreendimentos.tsx` | Adicionar abas de Valores e Mídias |
| `src/components/portal/ValoresReadOnlyTable.tsx` | **Novo** - Tabela read-only de valores |
| `src/components/portal/MidiasReadOnlyList.tsx` | **Novo** - Lista read-only de mídias/links |

---

## 7. Fluxo Visual

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  ADMIN: Aba Mídias do Empreendimento                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Cadastrar Link                                                       │    │
│  │  ┌────────────────────────┐  ┌────────────────────────────────────┐ │    │
│  │  │ Título do Link          │  │ URL                                 │ │    │
│  │  └────────────────────────┘  └────────────────────────────────────┘ │    │
│  │                                                    [ Adicionar Link ] │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  Links Cadastrados:                                                          │
│  • Book Digital - https://drive.google.com/...                    [🗑️]     │
│  • Vídeo Tour - https://youtube.com/...                           [🗑️]     │
└─────────────────────────────────────────────────────────────────────────────┘
```

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  PORTAL CORRETOR: Detalhes do Empreendimento                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  [ Unidades ]  [ Tabela de Valores ]  [ Mídias ]                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Aba "Tabela de Valores":                                                    │
│  ┌────────────┬────────────┬──────────────────┐                              │
│  │ Quadra     │ Lote       │ Valor            │                              │
│  ├────────────┼────────────┼──────────────────┤                              │
│  │ 01         │ 01         │ R$ 500.000,00    │                              │
│  │ 01         │ 02         │ R$ 480.000,00    │                              │
│  └────────────┴────────────┴──────────────────┘                              │
│                                                                              │
│  Aba "Mídias":                                                               │
│  Links:                                                                       │
│  🔗 Book Digital (abre em nova aba)                                          │
│  🔗 Vídeo Tour (abre em nova aba)                                            │
│                                                                              │
│  Galeria:                                                                     │
│  [img1] [img2] [img3]                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

