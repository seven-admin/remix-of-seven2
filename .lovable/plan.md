
# Plano: Exibir Mapa de Unidades no Portal do Corretor

## Resumo

Adicionar uma nova aba "Mapa" na página de detalhes do empreendimento (`PortalEmpreendimentoDetalhe.tsx`) no Portal do Corretor. Esta aba exibirá o mapa interativo das unidades para empreendimentos do tipo **loteamento** ou **condomínio** que possuam mapa configurado.

---

## Contexto Atual

1. **MapaInterativo**: Componente já existe e funciona em `src/components/mapa/MapaInterativo.tsx`
   - Aceita props: `empreendimentoId` e `readonly` (opcional)
   - Exibe mapa com polígonos/marcadores coloridos por status
   - Permite zoom, pan e clique para ver detalhes da unidade
   
2. **PortalEmpreendimentoDetalhe**: Página atual tem 2 abas:
   - **Unidades**: Tabela com unidades disponíveis para seleção
   - **Mídias**: Lista de mídias do empreendimento

3. **Tipos com Mapa**: Somente `loteamento` e `condominio` usam mapa interativo

---

## Implementação Proposta

### Modificar `src/pages/PortalEmpreendimentoDetalhe.tsx`

Adicionar uma terceira aba "Mapa" que:
1. **Só aparece** para empreendimentos do tipo `loteamento` ou `condominio`
2. **Exibe** o componente `MapaInterativo` em modo **readonly**
3. **Permite** ao corretor visualizar a disponibilidade de unidades no mapa

---

## Interface Visual

```
┌────────────────────────────────────────────────────────────────────────────┐
│  ← Voltar   RESIDENCIAL PRIMAVERA                                          │
│             Campo Grande, MS                                                │
├────────────────────────────────────────────────────────────────────────────┤
│  [Unidades]  [Mapa]  [Mídias]                                              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                                                                    │   │
│  │                     MAPA INTERATIVO                                │   │
│  │                                                                    │   │
│  │     ┌───┐  ┌───┐  ┌───┐  ┌───┐                                    │   │
│  │     │ 1 │  │ 2 │  │ 3 │  │ 4 │  Quadra A                          │   │
│  │     └───┘  └───┘  └───┘  └───┘                                    │   │
│  │                                                                    │   │
│  │     ┌───┐  ┌───┐  ┌───┐  ┌───┐                                    │   │
│  │     │ 5 │  │ 6 │  │ 7 │  │ 8 │  Quadra B                          │   │
│  │     └───┘  └───┘  └───┘  └───┘                                    │   │
│  │                                                                    │   │
│  │  [Zoom +] [Zoom -] [Reset]                Legenda: ■ ■ ■ ■ ■      │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  Clique em uma unidade para ver detalhes                                   │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Código a Modificar

### `src/pages/PortalEmpreendimentoDetalhe.tsx`

```typescript
// Adicionar import
import { MapaInterativo } from '@/components/mapa/MapaInterativo';
import { Map } from 'lucide-react';

// Verificar se empreendimento suporta mapa
const suportaMapa = empreendimento?.tipo === 'loteamento' || empreendimento?.tipo === 'condominio';

// Adicionar aba Mapa (condicional)
<TabsList>
  <TabsTrigger value="unidades" className="flex items-center gap-2">
    <Building2 className="h-4 w-4" />
    Unidades
  </TabsTrigger>
  {suportaMapa && (
    <TabsTrigger value="mapa" className="flex items-center gap-2">
      <Map className="h-4 w-4" />
      Mapa
    </TabsTrigger>
  )}
  <TabsTrigger value="midias" className="flex items-center gap-2">
    <Image className="h-4 w-4" />
    Mídias
  </TabsTrigger>
</TabsList>

// Conteúdo da aba Mapa
{suportaMapa && (
  <TabsContent value="mapa" className="space-y-4">
    <MapaInterativo empreendimentoId={id!} readonly />
  </TabsContent>
)}
```

---

## Comportamento

### Corretor Visualiza Mapa

1. Acessa detalhes de um empreendimento tipo loteamento/condomínio
2. Vê 3 abas: Unidades, Mapa, Mídias
3. Clica em "Mapa"
4. Visualiza o mapa interativo com:
   - Polígonos/marcadores coloridos por status
   - Legenda de cores
   - Zoom e pan
   - Ao clicar em uma unidade, vê popup com detalhes

### Modo Readonly

O mapa será exibido em modo `readonly`:
- **Sem** botão de edição
- **Sem** possibilidade de criar/mover polígonos
- Apenas visualização e interação básica

---

## Empreendimentos Sem Mapa Configurado

Se o empreendimento suporta mapa mas não tem imagem configurada:
- O componente `MapaInterativo` já exibe mensagem apropriada
- "Faça upload da imagem do mapa do empreendimento para começar a marcar as unidades"
- **Obs**: No Portal do Corretor (readonly), essa mensagem deve ser adaptada para não mostrar upload

### Ajuste Necessário no MapaInterativo

Quando não há mapa e está em modo `readonly`, exibir mensagem simples:
```
"Mapa não configurado para este empreendimento"
```

Em vez de mostrar o formulário de upload.

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/PortalEmpreendimentoDetalhe.tsx` | Adicionar aba "Mapa" condicional com MapaInterativo readonly |
| `src/components/mapa/MapaInterativo.tsx` | Ajustar comportamento quando não há mapa + readonly |

---

## Resultado Final

1. **Empreendimentos loteamento/condomínio**: Exibem 3 abas (Unidades, Mapa, Mídias)
2. **Outros tipos (prédio/comercial)**: Mantêm 2 abas (Unidades, Mídias)
3. **Mapa configurado**: Corretor visualiza interativamente
4. **Mapa não configurado**: Mensagem informativa
5. **Modo readonly**: Sem opções de edição, apenas visualização
