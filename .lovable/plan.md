
# Plano: Reestruturação do Portal do Corretor

## Resumo das Mudanças

Transformar a experiência do Portal do Corretor com três melhorias:
1. **Mudar de modal para página** - Ao clicar em "Ver Detalhes", abre uma página dedicada ao invés de modal
2. **Unificar Unidades e Tabela de Valores** - Uma única aba com lista tabular + filtro + seleção múltipla
3. **Estilizar header** - Aplicar cor de fundo escura igual à sidebar (HSL 0 0% 18%)

---

## 1. Nova Estrutura de Rotas

### Rotas Atuais
```
/portal-corretor/empreendimentos  →  Lista de cards
```

### Novas Rotas
```
/portal-corretor/empreendimentos       →  Lista de cards
/portal-corretor/empreendimentos/:id   →  Página de detalhe com abas
```

### Alteração em `src/App.tsx`
```tsx
<Route path="empreendimentos" element={<PortalEmpreendimentos />} />
<Route path="empreendimentos/:id" element={<PortalEmpreendimentoDetalhe />} />
```

---

## 2. Nova Página de Detalhe do Empreendimento

### Arquivo: `src/pages/PortalEmpreendimentoDetalhe.tsx` (novo)

Estrutura com duas abas:

| Aba | Conteúdo |
|-----|----------|
| **Unidades** | Tabela com Quadra, Lote, Valor + filtro por quadra + checkboxes para seleção |
| **Mídias** | Links e galeria de imagens/vídeos (já existente) |

### Aba Unidades Unificada
- Lista estilo tabela corrida (semelhante à aba "Tabela de Valores" atual)
- Adicionar coluna de checkbox para seleção múltipla
- Manter filtro por Quadra/Bloco
- Footer fixo com resumo da seleção e botão "Solicitar Reserva"
- Mostrar apenas unidades disponíveis

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  ← Voltar                             Empreendimento: Reserva do Lago        │
├─────────────────────────────────────────────────────────────────────────────┤
│  [ Unidades ]  [ Mídias ]                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Filtrar: [Todas as quadras ▼]                                               │
│                                                                              │
│  ┌────┬────────────┬────────────┬──────────────────┐                         │
│  │ ☐  │ Quadra     │ Lote       │ Valor            │                         │
│  ├────┼────────────┼────────────┼──────────────────┤                         │
│  │ ☑  │ 01         │ 01         │ R$ 500.000,00    │                         │
│  │ ☐  │ 01         │ 02         │ R$ 480.000,00    │                         │
│  │ ☑  │ 02         │ 01         │ R$ 520.000,00    │                         │
│  └────┴────────────┴────────────┴──────────────────┘                         │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  2 unidades selecionadas                                                     │
│  Total: R$ 1.020.000,00                  [ Limpar ] [ Solicitar Reserva ]   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Ajustar Página de Listagem

### Arquivo: `src/pages/PortalEmpreendimentos.tsx`

Modificações:
- Remover todo o código do Dialog
- Alterar botão "Ver Detalhes" para usar `navigate`
- Remover estados do modal (selectedEmpId, etc.)

```tsx
// Antes
<Button onClick={() => setSelectedEmpId(emp.id)}>
  Ver Detalhes
</Button>

// Depois
<Button onClick={() => navigate(`/portal-corretor/empreendimentos/${emp.id}`)}>
  Ver Detalhes
</Button>
```

---

## 4. Atualizar Header do Portal (Cor Escura)

### Arquivo: `src/components/portal/PortalLayout.tsx`

A sidebar usa as variáveis CSS:
- `--sidebar-background: 0 0% 18%` (fundo escuro)
- `--sidebar-foreground: 0 0% 95%` (texto claro)

### Alterações no Header

**Antes:**
```tsx
<header className="bg-background/95 ...">
  <Link className="text-muted-foreground hover:text-foreground">
  <p className="text-sm font-medium">{profile?.full_name}</p>
```

**Depois:**
```tsx
<header className="bg-sidebar ...">
  <Link className="text-sidebar-foreground/70 hover:text-sidebar-foreground">
  <p className="text-sm font-medium text-sidebar-foreground">{profile?.full_name}</p>
```

### Mudanças Específicas:
- Header: `bg-sidebar` ao invés de `bg-background/95`
- Border: `border-sidebar-border` ao invés de `border-b`
- Links inativos: `text-sidebar-foreground/70`
- Links ativos: `bg-primary text-primary-foreground` (manter)
- Hover: `hover:bg-sidebar-accent`
- Nome do usuário: `text-sidebar-foreground`
- Rótulo "Corretor": `text-sidebar-foreground/60`
- Logo: Adicionar `brightness-0 invert opacity-90` igual à sidebar principal

### Navegação Mobile
- Mesmo tratamento de cores para consistência

---

## 5. Atualizar routeTitles

Adicionar rota dinâmica para página de detalhe:

```tsx
const routeTitles: Record<string, { title: string; subtitle?: string }> = {
  // ... rotas existentes
};

// No componente, verificar se é rota de detalhe:
const isEmpreendimentoDetalhe = location.pathname.startsWith('/portal-corretor/empreendimentos/');
```

Na página de detalhe, o título será renderizado pelo próprio componente (não pelo PortalLayout).

---

## 6. Resumo de Arquivos

| Arquivo | Ação |
|---------|------|
| `src/App.tsx` | Adicionar rota `/portal-corretor/empreendimentos/:id` |
| `src/pages/PortalEmpreendimentoDetalhe.tsx` | **Novo** - Página de detalhe com abas |
| `src/pages/PortalEmpreendimentos.tsx` | Simplificar - remover modal, usar navigate |
| `src/components/portal/PortalLayout.tsx` | Aplicar cores da sidebar no header |
| `src/components/portal/ValoresReadOnlyTable.tsx` | Remover (será incorporado na nova página) |

---

## Detalhes Técnicos

### Nova Página de Detalhe
```tsx
// src/pages/PortalEmpreendimentoDetalhe.tsx
export default function PortalEmpreendimentoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: empreendimento } = useEmpreendimentos();
  const { data: unidades } = useUnidades(id);
  
  // Filtro e seleção
  const [filtroBloco, setFiltroBloco] = useState('todos');
  const [unidadesSelecionadas, setUnidadesSelecionadas] = useState([]);
  
  // Apenas unidades disponíveis
  const unidadesDisponiveis = unidades?.filter(u => u.status === 'disponivel');
  
  return (
    <div>
      {/* Header com botão voltar e nome */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/portal-corretor/empreendimentos')}>
          <ArrowLeft /> Voltar
        </Button>
        <h1>{empreendimento?.nome}</h1>
      </div>
      
      <Tabs defaultValue="unidades">
        <TabsList>
          <TabsTrigger value="unidades">Unidades</TabsTrigger>
          <TabsTrigger value="midias">Mídias</TabsTrigger>
        </TabsList>
        
        <TabsContent value="unidades">
          {/* Tabela com checkbox + filtro */}
        </TabsContent>
        
        <TabsContent value="midias">
          <MidiasReadOnlyList empreendimentoId={id} />
        </TabsContent>
      </Tabs>
      
      {/* Footer fixo com seleção */}
    </div>
  );
}
```

### Estilos do Header
```tsx
// Classes CSS para o header escuro
<header className="sticky top-0 z-50 w-full border-b border-sidebar-border bg-sidebar">
  <Link className={cn(
    'px-3 py-2 rounded-md text-sm font-medium transition-colors',
    isActive
      ? 'bg-primary text-primary-foreground'
      : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
  )}>
```
