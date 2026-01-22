# Alumni Dashboard - Instruções de Uso

## Visão Geral

Dashboard corporativo modular para acompanhamento de métricas e KPIs da Alumni.

### Características
- 7 módulos independentes (Vendas B2C, B2B, Customer Care, Cancelamentos, Cobrança, Alunos Ativos, Marketing)
- Integração com Google Sheets e Excel
- Mapeamento configurável de colunas
- Visual executivo para CEO e investidores
- Autenticação básica

---

## Estrutura de Pastas

```
alumni-dashboard/
├── config/
│   └── data_sources.yaml     # Configuração de fontes e mapeamento de colunas
├── src/
│   ├── app/                   # Páginas Next.js (App Router)
│   │   ├── page.tsx           # Visão Geral
│   │   ├── vendas-b2c/        # Módulo Vendas B2C
│   │   ├── vendas-b2b/        # Módulo Vendas B2B
│   │   ├── customer-care/     # Módulo Customer Care
│   │   ├── cancelamentos/     # Módulo Cancelamentos
│   │   ├── cobranca/          # Módulo Cobrança
│   │   ├── alunos-ativos/     # Módulo Alunos Ativos
│   │   ├── marketing/         # Módulo Marketing
│   │   ├── login/             # Página de Login
│   │   └── api/               # API Routes
│   ├── components/
│   │   ├── ui/                # Componentes de UI (KPICard, Charts, etc)
│   │   ├── layout/            # Layout (Header, Sidebar, ModuleContainer)
│   │   └── modules/           # Componentes específicos de módulos
│   ├── lib/
│   │   ├── config/            # Carregamento de configuração
│   │   ├── data/              # Loaders de dados (Google Sheets, Excel)
│   │   └── utils/             # Utilitários (formatação, etc)
│   └── types/                 # Tipos TypeScript
└── package.json
```

---

## Instalação

```bash
# Clone ou navegue até o diretório
cd alumni-dashboard

# Instale as dependências
npm install

# Inicie em modo desenvolvimento
npm run dev

# Acesse: http://localhost:3000
```

---

## Configuração de Fontes de Dados

### Passo 1: Editar o arquivo `config/data_sources.yaml`

Para cada módulo, configure:

```yaml
vendas_b2c:
  name: "Vendas B2C"
  enabled: true

  # Fonte de dados
  source:
    type: "google_sheets"  # Opções: google_sheets | excel
    url: "https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit"
    sheet_name: "Nome da Aba"

  # Mapeamento de colunas (CRÍTICO!)
  column_mapping:
    data_venda: "Data"              # Nome interno : Nome na planilha
    faturamento: "Valor_Total"
    produto: "Produto"
    aluno_id: "ID_Aluno"
```

### Passo 2: Obter ID da planilha Google Sheets

A URL da planilha tem o formato:
```
https://docs.google.com/spreadsheets/d/[ID_AQUI]/edit
```

Copie o ID e substitua em `url`.

### Passo 3: Mapear colunas

O sistema usa nomes internos que devem ser mapeados para os nomes reais das suas colunas.

**Exemplo:** Se sua planilha tem uma coluna chamada "Valor da Venda", mapeie assim:

```yaml
column_mapping:
  faturamento: "Valor da Venda"
```

---

## Conectar Nova Planilha

1. Abra `config/data_sources.yaml`
2. Localize o módulo desejado
3. Altere a `url` para o link da nova planilha
4. Atualize o `sheet_name` com o nome correto da aba
5. Ajuste o `column_mapping` conforme os nomes das colunas
6. Reinicie o servidor (`npm run dev`)

---

## Alterar Mapeamento de Colunas

1. Abra `config/data_sources.yaml`
2. Localize o módulo e a seção `column_mapping`
3. Altere apenas o valor (lado direito) para o novo nome:

```yaml
# Antes
column_mapping:
  faturamento: "Valor_Total"

# Depois (se a coluna mudou de nome)
column_mapping:
  faturamento: "Valor_Vendido"
```

4. **Não altere** o nome interno (lado esquerdo)
5. Reinicie o servidor

---

## Adicionar Novo Módulo

1. Crie uma nova entrada no `data_sources.yaml`:

```yaml
novo_modulo:
  name: "Nome do Módulo"
  description: "Descrição"
  enabled: true

  source:
    type: "google_sheets"
    url: "URL_DA_PLANILHA"
    sheet_name: "Nome da Aba"

  column_mapping:
    campo1: "Coluna1"
    campo2: "Coluna2"
```

2. Crie os tipos em `src/types/index.ts`
3. Adicione o loader em `src/lib/data/dataLoader.ts`
4. Crie a página em `src/app/novo-modulo/page.tsx`
5. Adicione ao menu em `src/components/layout/Sidebar.tsx`

---

## Requisitos para Planilhas

### Google Sheets
- A planilha deve estar **pública** (ou configurar credenciais)
- Para tornar pública: Compartilhar > "Qualquer pessoa com o link"

### Excel Local
- Use `type: "excel"` e `path: "./data/arquivo.xlsx"`
- Coloque o arquivo na pasta `data/`

---

## Autenticação

### Credenciais padrão (demo)
- **E-mail:** `investidor@alumni.com`
- **Senha:** `Alumni@2024`

### Adicionar novos usuários

Edite `src/app/login/page.tsx`:

```typescript
const DEMO_USERS = [
  { email: 'novo@email.com', password: 'Senha123', name: 'Nome', role: 'admin' },
  // ...
];
```

**Nota:** Em produção, substitua por autenticação real (NextAuth, etc).

---

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Iniciar produção
npm run start

# Lint
npm run lint
```

---

## API Endpoints

### Carregar dados de um módulo
```
GET /api/data/[module]
GET /api/data/vendas-b2c
GET /api/data/vendas-b2c?refresh=true  # Força atualização
```

### Invalidar cache
```
POST /api/data/[module]
```

---

## Cores dos Módulos

| Módulo | Cor |
|--------|-----|
| Vendas B2C | Verde (#10B981) |
| Vendas B2B | Azul (#3B82F6) |
| Customer Care | Roxo (#8B5CF6) |
| Cancelamentos | Vermelho (#EF4444) |
| Cobrança | Laranja (#F59E0B) |
| Alunos Ativos | Ciano (#06B6D4) |
| Marketing | Rosa (#EC4899) |

---

## Cache

- Dados são cacheados por 15 minutos por padrão
- Para alterar: edite `CACHE_DURATION` em `src/lib/data/dataLoader.ts`
- Use o botão "Atualizar" no dashboard para forçar refresh

---

## Suporte

Para dúvidas ou problemas, verifique:
1. Se a planilha está acessível
2. Se o mapeamento de colunas está correto
3. Logs do console do navegador
4. Logs do terminal (servidor)

---

## Preparação para BI/Banco de Dados

A arquitetura está preparada para migração futura:

1. **Camada de abstração:** `src/lib/data/dataLoader.ts` pode ser adaptado para qualquer fonte
2. **Tipos definidos:** Todos os dados são tipados em `src/types/index.ts`
3. **Configuração centralizada:** `data_sources.yaml` pode incluir conexões de banco
4. **API pronta:** Endpoints REST para integração com outras ferramentas

Para migrar para banco de dados:
1. Adicione novo loader (ex: `postgresLoader.ts`)
2. Altere `type` no config para `"postgres"`
3. Implemente conexão e queries
4. O restante do sistema continua igual
