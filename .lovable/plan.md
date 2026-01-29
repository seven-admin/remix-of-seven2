
# Plano: Nova Aba "Atividades" no Forecast do Portal do Incorporador

## Objetivo

Criar uma nova aba no Forecast do Portal do Incorporador com:
1. **Lista funcional de atividades** com clique para ver detalhes
2. **Calendário de atividades** integrado
3. Filtros por tipo, status e período
4. Todos os dados filtrados pelos empreendimentos vinculados ao incorporador

---

## Estrutura Proposta

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Forecast do Incorporador                                                │
│                                                                          │
│  [Dashboard]  [Atividades]     ← Nova aba com Tabs                      │
│                                                                          │
│  ──────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  Quando "Atividades" selecionada:                                       │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ Filtros: [Tipo ▼] [Status ▼] [Mês ▼]                               │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────┐ ┌──────────────────────────────────────┐  │
│  │  Calendário Compacto     │ │        Lista de Atividades           │  │
│  │  [< Janeiro 2025 >]      │ │  ┌────────────────────────────────┐  │  │
│  │  D S T Q Q S S           │ │  │ 📞 Ligação - João Silva       │  │  │
│  │  • • •   •               │ │  │    29/01 14:00 - Pendente      │  │  │
│  │     •    • •             │ │  └────────────────────────────────┘  │  │
│  │                          │ │  ┌────────────────────────────────┐  │  │
│  │  [Legenda: 1-2, 3-5...]  │ │  │ 🏠 Visita - Maria Souza        │  │  │
│  │                          │ │  │    28/01 10:00 - Concluída     │  │  │
│  └──────────────────────────┘ │  └────────────────────────────────┘  │  │
│                               │         ...mais atividades...        │  │
│                               └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Alterações Técnicas

### 1. Adicionar `empreendimento_ids` ao tipo de filtro (src/types/atividades.types.ts)

```typescript
export interface AtividadeFilters {
  // ... campos existentes ...
  empreendimento_id?: string;
  empreendimento_ids?: string[]; // NOVO: suporte a múltiplos empreendimentos
}
```

### 2. Atualizar função de filtros (src/hooks/useAtividades.ts)

```typescript
function applyAtividadesFilters(query: any, filters?: AtividadeFilters) {
  let q = query as any;
  // ... filtros existentes ...
  
  // Suporte a múltiplos empreendimentos (novo)
  if (filters?.empreendimento_ids?.length) {
    q = q.in('empreendimento_id', filters.empreendimento_ids);
  } else if (filters?.empreendimento_id) {
    q = q.eq('empreendimento_id', filters.empreendimento_id);
  }
  
  // ... resto dos filtros ...
}
```

### 3. Criar componente de Lista de Atividades para Portal (src/components/portal-incorporador/AtividadesListaPortal.tsx)

Componente dedicado com:
- Lista de atividades com scroll
- Clique para abrir diálogo de detalhes
- Badge de status e tipo
- Indicador de atraso
- Filtros inline (tipo, status)

```typescript
interface AtividadesListaPortalProps {
  empreendimentoIds: string[];
}

export function AtividadesListaPortal({ empreendimentoIds }: AtividadesListaPortalProps) {
  const [filters, setFilters] = useState<AtividadeFilters>({
    empreendimento_ids: empreendimentoIds
  });
  const [page, setPage] = useState(1);
  const [detalheAtividadeId, setDetalheAtividadeId] = useState<string | null>(null);
  
  const { data: atividadesData, isLoading } = useAtividades({ 
    filters, 
    page, 
    pageSize: 20 
  });
  
  // ... renderização da lista com clique para detalhes
}
```

### 4. Atualizar página do Forecast do Portal (src/pages/portal-incorporador/PortalIncorporadorForecast.tsx)

Adicionar sistema de abas:

```typescript
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function PortalIncorporadorForecast() {
  const [tab, setTab] = useState<'dashboard' | 'atividades'>('dashboard');
  
  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="atividades" className="gap-2">
            <Calendar className="h-4 w-4" />
            Atividades
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      {tab === 'dashboard' && (
        // Conteúdo atual do dashboard
      )}
      
      {tab === 'atividades' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <CalendarioCompacto empreendimentoIds={empreendimentoIds} />
          </div>
          <div className="lg:col-span-2">
            <AtividadesListaPortal empreendimentoIds={empreendimentoIds} />
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Arquivos a Modificar/Criar

| Arquivo | Acao |
|---------|------|
| `src/types/atividades.types.ts` | Adicionar `empreendimento_ids` ao tipo `AtividadeFilters` |
| `src/hooks/useAtividades.ts` | Atualizar `applyAtividadesFilters` para suportar array de IDs |
| `src/components/portal-incorporador/AtividadesListaPortal.tsx` | **CRIAR** - Componente de lista de atividades |
| `src/pages/portal-incorporador/PortalIncorporadorForecast.tsx` | Adicionar sistema de abas e integrar componentes |

---

## Fluxo de Dados

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ useIncorporadorEmpreendimentos()                                        │
│   → Retorna empreendimentoIds vinculados ao incorporador                │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
┌───────────────────────────────────┐   ┌───────────────────────────────────┐
│ CalendarioCompacto                │   │ AtividadesListaPortal             │
│   empreendimentoIds=[...]         │   │   empreendimentoIds=[...]         │
└─────────────────────┬─────────────┘   └─────────────────────┬─────────────┘
                      │                                       │
                      ▼                                       ▼
┌───────────────────────────────────┐   ┌───────────────────────────────────┐
│ useCalendarioAtividades           │   │ useAtividades                     │
│   .in('empreendimento_id', ids)   │   │   .in('empreendimento_id', ids)   │
└───────────────────────────────────┘   └───────────────────────────────────┘
```

---

## Componente AtividadesListaPortal - Detalhes

### Funcionalidades

1. **Lista com scroll** - ScrollArea com altura definida
2. **Card de atividade clicável** - Abre `AtividadeDetalheDialog`
3. **Badges visuais** - Tipo, status, indicador de atraso
4. **Filtros inline** - Tipo e Status como Select
5. **Paginacao** - Controles de pagina no rodape

### Layout do Card de Atividade

```text
┌────────────────────────────────────────────────────────────────┐
│ 📞 [Ligação]  [Pendente]                           [Atrasada!] │
│ Contato inicial com cliente                                    │
│ 👤 João Silva  •  🏢 Residencial Aurora  •  29/01 às 14:00    │
└────────────────────────────────────────────────────────────────┘
```

---

## Seguranca

- RLS existente na tabela `atividades` garante que incorporadores so vejam atividades dos seus empreendimentos
- Filtro no frontend e uma camada extra de seguranca e otimizacao

---

## Resultado Esperado

1. Nova aba "Atividades" visivel no Forecast do Portal do Incorporador
2. Calendario compacto na lateral esquerda
3. Lista de atividades clicavel na direita
4. Filtros por tipo e status funcionais
5. Clique em atividade abre dialogo de detalhes completo
6. Todos os dados filtrados pelos empreendimentos do incorporador

---

## Criterios de Aceite

1. Abas "Dashboard" e "Atividades" funcionam corretamente
2. Lista exibe apenas atividades dos empreendimentos vinculados
3. Calendario sincronizado com a lista
4. Clique em atividade abre detalhes
5. Filtros de tipo e status funcionam
6. Paginacao funciona corretamente
7. Layout responsivo em mobile
