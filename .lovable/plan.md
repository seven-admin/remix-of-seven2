
# Plano: CRUD Completo para Webhooks (Adicionar Editar)

## Problema atual

O formulario de webhook so permite **criar** novos registros. Para alterar o evento, URL ou descricao de um webhook existente, o usuario precisa excluir e recadastrar, o que e improdutivo.

## O que sera feito

Transformar o dialog de webhook em um formulario de criacao **e edicao**, reutilizando o mesmo componente. Alem disso, adicionar a opcao "Editar" no menu de acoes de cada webhook na tabela.

## Mudancas detalhadas

### Arquivo: `src/pages/Configuracoes.tsx`

1. **Novo estado para edicao**
   - Adicionar `editingWebhook` (tipo `Webhook | null`) para controlar se o dialog esta em modo edicao
   - Quando `editingWebhook` e nulo, o dialog funciona como criacao; quando preenchido, funciona como edicao

2. **Funcao `handleEditWebhook`**
   - Recebe o webhook selecionado
   - Preenche o formulario com os valores atuais (`evento`, `url`, `descricao`)
   - Abre o dialog em modo edicao

3. **Atualizar `onSubmitWebhook`**
   - Se `editingWebhook` estiver preenchido, chama `updateWebhook.mutateAsync` com o ID do webhook
   - Caso contrario, chama `createWebhook.mutateAsync` (comportamento atual)
   - Ao fechar/concluir, limpa `editingWebhook`

4. **Botao "Editar" no DropdownMenu**
   - Adicionar item "Editar" com icone `Pencil` no menu de acoes de cada webhook (antes do "Testar")

5. **Titulo dinamico do Dialog**
   - "Adicionar Webhook" quando criando
   - "Editar Webhook" quando editando

6. **Botao de submit dinamico**
   - Texto "Adicionar" quando criando
   - Texto "Salvar Alteracoes" quando editando

7. **Reset ao fechar**
   - Ao fechar o dialog (via botao Cancelar ou clique fora), limpar `editingWebhook` e resetar o formulario

### Nenhum arquivo novo sera criado

Todas as mudancas sao no `src/pages/Configuracoes.tsx`. O hook `useUpdateWebhook` ja existe e ja aceita atualizacoes parciais de `evento`, `url` e `descricao`.

## Fluxo do usuario

1. Clica no menu "..." de um webhook existente
2. Seleciona "Editar"
3. Dialog abre pre-preenchido com os dados atuais
4. Altera o que precisar (evento, URL, descricao)
5. Clica "Salvar Alteracoes"
6. Webhook atualizado sem precisar excluir e recriar
