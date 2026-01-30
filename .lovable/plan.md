
# Plano: Implementar Funcionalidade de Importação no Módulo de Planejamento

## Problema Identificado

O botão "Importar" na página de Planejamento existe visualmente, mas **não possui nenhuma funcionalidade** - é apenas um `<Button>` sem `onClick` ou diálogo associado. Isso faz com que nada aconteça quando o usuário clica no botão.

## Solução

Criar um componente completo de importação de itens de planejamento a partir de arquivos Excel/CSV, seguindo o padrão já existente no sistema (`ImportarUnidadesDialog`).

---

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/planejamento/ImportarPlanejamentoDialog.tsx` | **Criar** - Componente de importação |
| `src/pages/Planejamento.tsx` | Modificar - Conectar botão ao diálogo |
| `src/hooks/usePlanejamentoItens.ts` | Adicionar mutation para criação em lote |

---

## Detalhes de Implementação

### 1. Novo Componente: `ImportarPlanejamentoDialog.tsx`

**Fluxo em 5 etapas:**

1. **Upload** - Arrastar/selecionar arquivo Excel ou CSV
2. **Mapear Colunas** - Associar colunas do Excel aos campos do sistema:
   - `item` (obrigatório) - Nome da tarefa
   - `fase` (obrigatório) - Fase do planejamento
   - `status` (obrigatório) - Status inicial
   - `responsavel` (opcional) - Responsável técnico
   - `data_inicio` (opcional) - Data de início
   - `data_fim` (opcional) - Data de fim
   - `obs` (opcional) - Observações
3. **Mapear Valores** - Associar valores do Excel com entidades existentes:
   - Fases: Match por nome ou criar nova
   - Status: Match por nome
   - Responsáveis: Match por nome
4. **Preview** - Visualizar dados processados com indicadores de erros/avisos
5. **Resultado** - Resumo da importação (sucesso, erros, criados)

**Recursos:**
- Detecção automática de colunas por nome (ex: "tarefa" → `item`, "fase" → `fase_id`)
- Sugestões de mapeamento por similaridade
- Validação de campos obrigatórios
- Tratamento de duplicatas (opção ignorar/atualizar)
- Criação automática de fases/status não existentes (com confirmação)
- Parser robusto para CSV com delimitadores `;` ou `,`
- Formatação de datas (dd/mm/yyyy, yyyy-mm-dd, etc.)

**UI Components usados:**
- `Dialog`, `ScrollArea`, `Table`, `Select`, `Checkbox`
- `Badge` para indicar erros/avisos
- `Progress` para etapas
- `Alert` para mensagens de validação

### 2. Modificação: `Planejamento.tsx`

Conectar o botão existente ao novo diálogo:

```tsx
const [importDialogOpen, setImportDialogOpen] = useState(false);

// No botão existente
<Button 
  variant="outline" 
  size="sm" 
  disabled={!empreendimentoId}
  onClick={() => setImportDialogOpen(true)}
>
  <Upload className="h-4 w-4 mr-2" />
  Importar
</Button>

// Adicionar o diálogo
<ImportarPlanejamentoDialog
  open={importDialogOpen}
  onOpenChange={setImportDialogOpen}
  empreendimentoId={empreendimentoId}
/>
```

### 3. Hook: Adicionar Criação em Lote

Adicionar ao `usePlanejamentoItens.ts`:

```tsx
const createItemsBulk = useMutation({
  mutationFn: async (items: PlanejamentoItemCreate[]) => {
    const { data: userData } = await supabase.auth.getUser();
    
    const itemsWithUser = items.map((item, index) => ({
      ...item,
      created_by: userData.user?.id,
      ordem: item.ordem ?? index + 1
    }));
    
    const { data, error } = await supabase
      .from('planejamento_itens')
      .insert(itemsWithUser)
      .select();

    if (error) throw error;
    return data;
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['planejamento-itens'] });
    toast.success(`${data.length} itens importados com sucesso`);
  },
  onError: (error) => {
    toast.error('Erro ao importar itens: ' + error.message);
  }
});
```

---

## Campos do Sistema para Mapeamento

| Campo | Obrigatório | Tipo | Aliases para Detecção |
|-------|-------------|------|----------------------|
| item | Sim | Texto | tarefa, task, item, nome, descricao, atividade |
| fase | Sim | Lookup | fase, etapa, phase, categoria |
| status | Sim | Lookup | status, situacao, estado, state |
| responsavel | Não | Lookup | responsavel, responsável, owner, assignee |
| data_inicio | Não | Data | inicio, início, data_inicio, start |
| data_fim | Não | Data | fim, término, data_fim, end, prazo |
| obs | Não | Texto | obs, observacao, observações, notes, comentario |

---

## Tratamento de Dados

### Parsing de Datas
Suportar múltiplos formatos:
- `dd/mm/yyyy` (BR)
- `yyyy-mm-dd` (ISO)
- `mm/dd/yyyy` (US)

### Parsing de Valores
- Normalizar strings (trim, uppercase para comparação)
- Remover acentos para matching

### Mapeamento de Entidades
1. Match exato por nome
2. Match por similaridade (> 70%)
3. Sugerir criação de nova entidade

---

## Comportamento Esperado

1. Admin clica em "Importar"
2. Arrasta arquivo Excel para o diálogo
3. Sistema detecta colunas automaticamente
4. Usuário ajusta mapeamentos se necessário
5. Sistema mostra preview com validação
6. Usuário confirma importação
7. Itens são criados no banco de dados
8. Planilha é atualizada automaticamente

---

## Dependências

- `xlsx` (já instalado) - Parsing de Excel
- Hooks existentes: `usePlanejamentoFases`, `usePlanejamentoStatus`, `useFuncionariosSeven`

