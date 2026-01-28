
Objetivo
- Fazer a etapa “Preview” e principalmente a etapa “Resultado” mostrarem claramente:
  1) Qual(is) linha(s) deram erro
  2) Qual foi o motivo do erro (mensagem legível e completa)
  3) Permitir rolar (scroll) quando houver muitos erros/linhas

Diagnóstico (com base no código atual)
- A etapa 4 (Preview) já tenta exibir `linha.erros.join('; ')` e `linha.avisos.join('; ')`, então “mensagem não aparece” normalmente acontece por um destes motivos:
  - (A) O erro está acontecendo no momento do INSERT (handleImportar) e não na validação (processarDadosFinais). Nesse caso, a UI não tem como mostrar “qual linha falhou”, porque o INSERT em lote falha como um todo e o catch só dá `console.error`.
  - (B) A mensagem existe, mas fica visualmente “inacessível”:
    - a célula tem `max-w-[200px]` e não força quebra de linha (`whitespace-normal / break-words`), então pode parecer “sumiu” dependendo do layout.
    - o ScrollArea do Preview pode não estar calculando altura corretamente por falta de `min-h-0` no container flex da etapa 4, fazendo a área ficar “travada” (sem scroll real) quando há muita coisa.
- A etapa 5 (Resultado) hoje só mostra um resumo (quantidades). Não existe lista detalhada de erros/linhas com scroll. Então, mesmo que o Preview tenha algo, após importar você perde a visão detalhada.

Solução proposta (mudanças no frontend)
1) Corrigir scroll de forma garantida na etapa 4 (Preview)
   - Ajustar o wrapper da etapa preview para permitir que o filho com `flex-1` realmente encolha e ative overflow:
     - Em `{etapa === 'preview'}`: adicionar `min-h-0` no container principal da etapa:
       - De: `className="flex-1 overflow-hidden flex flex-col gap-4 py-4"`
       - Para: `className="flex-1 overflow-hidden flex flex-col gap-4 py-4 min-h-0"`
   - Ajustar o próprio container scrollável:
     - Em vez de depender do Radix ScrollArea (que já deu dor de cabeça antes), trocar o ScrollArea da tabela do Preview por um `div` com `overflow-auto` e altura limitada, igual foi feito na etapa 3:
       - Ex: `div className="flex-1 min-h-0 border rounded-lg overflow-auto"`
     - Isso evita a classe de viewport/h-full do Radix e resolve o scroll de tabela de forma determinística.

2) Garantir que a mensagem do erro “apareça” visualmente (sem ficar truncada/“sumida”)
   - Na célula “Erros/Avisos” (TableCell):
     - Trocar de `className="max-w-[200px]"` para algo que quebre linha:
       - `className="max-w-[320px] whitespace-normal break-words"`
     - Renderizar erros e avisos em lista (um por linha) em vez de `join('; ')`, deixando mais legível:
       - erros: `<ul className="space-y-1"> <li>...</li> </ul>`
       - avisos idem (com ícone)
   - Melhorar as mensagens geradas pelo validador para serem autoexplicativas:
     - Ex: status inválido hoje: `Status inválido: "Disponível"`
       - Passar a: `Status inválido: "Disponível". Valores aceitos: disponivel, reservada, vendida, bloqueada`
     - Isso elimina a dúvida “qual é o válido” diretamente no erro.

3) Criar “Lista de erros com scroll” na etapa 5 (Resultado)
   - Na etapa `resultado`, além do resumo, adicionar um bloco “Linhas com erro” quando `resultado.erros > 0` (ou `linhasComErro.length > 0`):
     - Um painel com:
       - título + badge com quantidade
       - um container com `max-h-[40vh] overflow-y-auto` (scroll garantido)
       - listar cada linha com:
         - número da linha (linha.linha)
         - número da unidade/lote (linha.dados.numero)
         - lista de erros (e opcional avisos)
   - Benefício: após a importação, você consegue ver exatamente quais linhas foram ignoradas e por quê, com scroll funcionando.

4) (Opcional, recomendado) Mostrar erro “do banco” quando o INSERT em lote falhar
   - Problema: se o INSERT em lote falha, hoje não vira erro por linha; vira um erro geral (ex.: constraint, tipo inválido, etc).
   - Ajuste:
     - Adicionar um estado `erroImportacaoGeral: string | null`
     - No `catch` de `handleImportar`, preencher `erroImportacaoGeral` com `error.message` (ou mensagem tratada)
     - Exibir um `<Alert variant="destructive">` no topo do Preview/Resultado com esse detalhe.
   - Observação importante: identificar “qual linha” falhou em um insert em lote não é confiável sem mudar a estratégia (inserir em batches menores ou linha-a-linha). Este plano foca em deixar claro:
     - erros de validação (por linha) e
     - erro geral do backend (quando for o caso).

Arquivos a alterar
- src/components/empreendimentos/ImportarUnidadesDialog.tsx
  - Etapa 4 (preview): ajustar layout/scroll e renderização de erros/avisos
  - Etapa 5 (resultado): adicionar lista detalhada e scrollável de erros
  - Validação: melhorar texto de erros (status inválido com lista de válidos)

Critérios de aceite (o que você deve conseguir fazer depois)
- Importar um arquivo com muitas linhas com erro:
  - No Preview:
    - A coluna “Erros/Avisos” mostra mensagens completas, quebrando linha, sem “sumir”
    - A tabela é rolável (scroll) dentro do modal
  - No Resultado:
    - Existe uma seção “Linhas com erro”
    - A lista tem scroll e mostra linha + motivo claramente
- Se ocorrer falha no INSERT em lote (ex.: constraint), aparece um alerta com a mensagem do erro geral do banco.

Plano de teste (passo a passo)
1) Testar um Excel com 15+ linhas com erros variados (status inválido, valor não numérico, área inválida, número vazio):
   - Confirmar que Preview mostra as mensagens completas e que a tabela rola.
2) Executar a importação:
   - Confirmar que a etapa Resultado mostra a lista de linhas com erro com scroll.
3) Testar responsividade:
   - Abrir o modal em viewport menor (ex.: notebook) e confirmar que a lista/tabela continua rolável e legível.
