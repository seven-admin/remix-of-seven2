

# Plano: Criar Pasta INSTALL com Configuração de Deploy

## Objetivo

Criar uma pasta `INSTALL` contendo arquivos de configuração e documentação para deploy no EasyPanel com Nixpacks.

## Arquivos a Criar

### 1. `INSTALL/nixpacks.toml`

Configuração do Nixpacks para usar Node.js 20:

```toml
[phases.setup]
nixPkgs = ["nodejs_20", "npm"]

[phases.build]
cmds = ["npm ci", "npm run build"]

[start]
cmd = "npx serve dist -s -l 3000"
```

### 2. `INSTALL/README.md`

Documentação de deploy com instruções para EasyPanel:

```markdown
# Guia de Deploy - EasyPanel com Nixpacks

## Requisitos
- Node.js 20.x (configurado automaticamente via nixpacks.toml)

## Configuração no EasyPanel

### Opção 1: Usando nixpacks.toml (Recomendado)
1. Copie o arquivo `nixpacks.toml` para a raiz do projeto
2. O EasyPanel detectará automaticamente a configuração

### Opção 2: Variável de Ambiente
Adicione nas configurações do serviço:
- `NIXPACKS_NODE_VERSION=20`

### Opção 3: Pacote Nix Específico
Altere o pacote de `nodejs` para `nodejs_20`

## Comandos de Build
- Install: `npm ci`
- Build: `npm run build`
- Start: `npx serve dist -s -l 3000`

## Portas
- Aplicação: 3000
```

## Estrutura Final

```
INSTALL/
├── nixpacks.toml    # Configuração para Nixpacks/EasyPanel
└── README.md        # Instruções de deploy
```

## Uso

Quando for fazer deploy, basta copiar o `nixpacks.toml` para a raiz do projeto ou seguir as instruções do README.

