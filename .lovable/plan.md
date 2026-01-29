

# Plano: Simplificar Aba Criativo - Apenas Links

## Objetivo

Remover a funcionalidade de upload de imagens/vídeos e manter apenas o cadastro de links externos. Garantir que links sempre abram em nova aba.

---

## Resumo das Alterações

| Arquivo | Ação |
|---------|------|
| `src/components/marketing/ProjetoCriativos.tsx` | Remover upload, simplificar UI |
| `src/hooks/useTicketCriativos.ts` | Remover mutation de upload e função getSignedUrl |

---

## Alterações Detalhadas

### 1. Componente `ProjetoCriativos.tsx`

**Remover:**
- `useRef` para input de arquivo
- Estado `previewUrl` e `previewType` (não há mais preview de imagem/vídeo)
- Estado `signedUrls` (não há mais URLs assinadas)
- `useEffect` para carregar URLs assinadas
- Função `handleFileSelect`
- Função `handleFileChange`
- Função `handlePreview` (links abrem direto em nova aba)
- Input hidden de arquivo
- Botão "Enviar Arquivo"
- Dialog de preview de imagem/vídeo
- Imports não utilizados: `useRef`, `useEffect`, `Upload`, `Image`, `Video`

**Simplificar:**
- Card exibe apenas ícone de link
- Clique no card abre link em nova aba
- Mensagem vazia atualizada para "Nenhum link cadastrado"

### 2. Hook `useTicketCriativos.ts`

**Remover:**
- Mutation `uploadCriativo`
- Função `getSignedUrl`
- Constante `BUCKET_NAME`

**Manter:**
- Query de busca
- Mutation `addLink`
- Mutation `deleteCriativo` (simplificada, sem lógica de storage)
- Mutation `toggleFinal`

---

## Código Simplificado

### Hook (resumo)

```typescript
export function useTicketCriativos(projetoId: string) {
  // Query: buscar criativos
  // Mutation: addLink
  // Mutation: deleteCriativo (apenas remove do banco)
  // Mutation: toggleFinal
  
  return { criativos, isLoading, addLink, deleteCriativo, toggleFinal };
}
```

### Componente (resumo)

```typescript
export function ProjetoCriativos({ projetoId }) {
  const { criativos, isLoading, addLink, deleteCriativo, toggleFinal } = useTicketCriativos(projetoId);
  
  // Estado: deleteTarget, showLinkForm, linkNome, linkUrl
  
  // Handler: handleAddLink, handleDelete
  // Cada link abre em nova aba via window.open(url, '_blank')
  
  return (
    <Card>
      <CardHeader>
        <Button onClick={() => setShowLinkForm(true)}>Adicionar Link</Button>
      </CardHeader>
      <CardContent>
        <Grid de LinkCards />
      </CardContent>
    </Card>
  );
}
```

### Card de Link Simplificado

```typescript
function LinkCard({ criativo, onDelete, onToggleFinal }) {
  const handleClick = () => {
    window.open(criativo.url, '_blank', 'noopener,noreferrer');
  };
  
  return (
    <div onClick={handleClick}>
      <Link2 icon />
      {/* Ações: marcar final, abrir nova aba, excluir */}
    </div>
  );
}
```

---

## Comportamento Final

1. Apenas botão **"Adicionar Link"** no header
2. Dialog simples com campos Nome (opcional) e URL (obrigatório)
3. Grid de cards com ícone de link
4. Clicar no card abre URL em **nova aba** (`_blank`)
5. Hover mostra ações: marcar como final, abrir em nova aba, excluir
6. Mensagem quando vazio: "Nenhum link cadastrado"

---

## Critérios de Aceite

1. Botão "Enviar Arquivo" removido da interface
2. Input de arquivo removido
3. Dialog de preview de imagem/vídeo removido
4. Links sempre abrem em nova aba (`window.open(..., '_blank')`)
5. Funcionalidades mantidas: adicionar link, marcar como final, excluir
6. Código do hook simplificado sem referências a storage

