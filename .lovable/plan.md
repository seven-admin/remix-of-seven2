

# Plano: Implementar Aba "Criativo" com Upload de Imagens nos Tickets de Marketing

## Objetivo

Criar uma nova aba "Criativo" na página de detalhes do ticket de marketing (`MarketingDetalhe.tsx`) onde os usuários poderão fazer upload de imagens relacionadas ao ticket (renders, artes, vídeos, etc.).

---

## Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────┐
│                    MarketingDetalhe.tsx                        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Tabs: Tarefas | Comentários | Histórico | [CRIATIVO]     │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              ↓                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              ProjetoCriativos.tsx (novo)                  │ │
│  │  - Grid de imagens/vídeos                                 │ │
│  │  - Upload múltiplo                                        │ │
│  │  - Preview e exclusão                                     │ │
│  │  - Marcar imagem como "final"                             │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  useTicketCriativos.ts (novo)                  │
│  - Buscar criativos do ticket                                  │
│  - Upload para Supabase Storage                                │
│  - Criar/atualizar/deletar registros                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Supabase Storage                             │
│  Bucket: projetos-arquivos (já existe, privado)                │
│  Path: {projeto_id}/{timestamp}.{ext}                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│               Tabela: ticket_criativos (novo)                  │
│  - id, projeto_id, tipo, nome, url, is_final, created_at       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Etapa 1: Criar Tabela no Banco de Dados

**Arquivo**: Migration SQL

```sql
CREATE TABLE public.ticket_criativos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID NOT NULL REFERENCES public.projetos_marketing(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'imagem', -- 'imagem' ou 'video'
  nome TEXT,
  url TEXT NOT NULL,
  is_final BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para busca rápida
CREATE INDEX idx_ticket_criativos_projeto ON public.ticket_criativos(projeto_id);

-- RLS
ALTER TABLE public.ticket_criativos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Admins podem tudo em criativos"
  ON public.ticket_criativos FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Marketing supervisors podem gerenciar criativos"
  ON public.ticket_criativos FOR ALL
  USING (public.is_marketing_supervisor(auth.uid()));

CREATE POLICY "Usuários autenticados podem visualizar criativos"
  ON public.ticket_criativos FOR SELECT
  TO authenticated
  USING (true);
```

---

## Etapa 2: Configurar Políticas do Bucket Storage

**Arquivo**: Migration SQL

```sql
-- Permitir upload para usuários de marketing
CREATE POLICY "Marketing team can upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'projetos-arquivos' 
    AND (public.is_admin(auth.uid()) OR public.is_marketing_supervisor(auth.uid()))
  );

-- Permitir leitura para usuários autenticados
CREATE POLICY "Authenticated users can view"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'projetos-arquivos');

-- Permitir exclusão para marketing
CREATE POLICY "Marketing team can delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'projetos-arquivos' 
    AND (public.is_admin(auth.uid()) OR public.is_marketing_supervisor(auth.uid()))
  );
```

---

## Etapa 3: Criar Type para Criativo

**Arquivo**: `src/types/marketing.types.ts`

Adicionar novo type:

```typescript
export interface TicketCriativo {
  id: string;
  projeto_id: string;
  tipo: 'imagem' | 'video';
  nome: string | null;
  url: string;
  is_final: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
```

---

## Etapa 4: Criar Hook `useTicketCriativos`

**Arquivo**: `src/hooks/useTicketCriativos.ts`

Funcionalidades:
- `useTicketCriativos(projetoId)` - Buscar criativos
- `uploadCriativo` - Upload de arquivo para storage + insert na tabela
- `deleteCriativo` - Remover do storage + delete na tabela
- `setAsFinal` - Marcar/desmarcar criativo como versão final

Padrão baseado no `useEmpreendimentoMidias.ts` existente.

---

## Etapa 5: Criar Componente `ProjetoCriativos`

**Arquivo**: `src/components/marketing/ProjetoCriativos.tsx`

Layout:
```text
┌─────────────────────────────────────────────────────────────┐
│ Criativos                            [+ Enviar Arquivo]     │
│ 3 arquivos                                                  │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│ │         │  │         │  │         │  │         │         │
│ │  IMG 1  │  │  IMG 2  │  │  VIDEO  │  │  IMG 3  │         │
│ │ [FINAL] │  │         │  │         │  │         │         │
│ └─────────┘  └─────────┘  └─────────┘  └─────────┘         │
│                                                             │
│ Hover: [⭐ Definir Final] [🗑️ Excluir] [↗️ Abrir]          │
└─────────────────────────────────────────────────────────────┘
```

Funcionalidades:
- Grid responsivo de thumbnails
- Upload múltiplo (arrastar e soltar ou clique)
- Preview ao clicar (lightbox simples)
- Badge "FINAL" para versão aprovada
- Botões de ação no hover

---

## Etapa 6: Integrar na Página de Detalhes

**Arquivo**: `src/pages/MarketingDetalhe.tsx`

Alterações:
1. Importar `ProjetoCriativos`
2. Adicionar aba "Criativo" ao `TabsList`
3. Adicionar `TabsContent` para a nova aba

```tsx
import { Image } from 'lucide-react';
import { ProjetoCriativos } from '@/components/marketing/ProjetoCriativos';

// Na TabsList:
<TabsTrigger value="criativo" className="gap-2">
  <Image className="h-4 w-4" />
  Criativo
</TabsTrigger>

// No TabsContent:
<TabsContent value="criativo" className="mt-4">
  <ProjetoCriativos projetoId={projeto.id} />
</TabsContent>
```

---

## Resumo de Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| Migration SQL | Criar tabela `ticket_criativos` + RLS + políticas storage |
| `src/types/marketing.types.ts` | Adicionar interface `TicketCriativo` |
| `src/hooks/useTicketCriativos.ts` | Criar hook completo |
| `src/components/marketing/ProjetoCriativos.tsx` | Criar componente de galeria |
| `src/pages/MarketingDetalhe.tsx` | Adicionar aba "Criativo" |

---

## Detalhes Técnicos

### Upload de Arquivos

O bucket `projetos-arquivos` já existe e é privado. Os arquivos serão organizados por projeto:

```
projetos-arquivos/
  └── {projeto_id}/
      ├── 1706540000000.jpg
      ├── 1706540001000.png
      └── 1706540002000.mp4
```

### URLs de Acesso

Como o bucket é privado, usaremos `createSignedUrl` para gerar URLs temporárias:

```typescript
const { data } = await supabase.storage
  .from('projetos-arquivos')
  .createSignedUrl(filePath, 3600); // 1 hora de validade
```

### Formatos Aceitos

- Imagens: JPG, PNG, WEBP, GIF
- Vídeos: MP4, MOV, WEBM

---

## Critérios de Aceite

1. Usuários podem acessar a aba "Criativo" no detalhe do ticket
2. Usuários podem fazer upload de imagens e vídeos
3. Thumbnails são exibidos em um grid responsivo
4. Usuários podem marcar uma imagem como "versão final"
5. Usuários podem excluir arquivos
6. Usuários podem visualizar arquivos em tamanho maior
7. Apenas usuários de marketing podem fazer upload/exclusão
8. Políticas RLS protegem os dados adequadamente

