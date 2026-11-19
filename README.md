# CONCRETANDO — Criando Laços e Casa

Site profissional e funcional de e-commerce para **loja de materiais de construção**, desenvolvido a partir da identidade visual da marca (**Preto Obsidiana + Vermelho Concreto + elementos de alvenaria**), com arquitetura híbrida de **Banco de Dados Local + Supabase**, **APIs REST Serverless para Vercel**, **Calculadora de Cotação por Metro Quadrado (m²)** e **Retirada Grátis na Loja (Click & Collect)**.

---

## Principais Funcionalidades

- **Calculadora Técnica de Cotação por Metro Quadrado (m²)**:
  - Cálculo por **Largura × Comprimento/Altura** ou **Área Total Direta (m²)**.
  - Margem configurável de **perda técnica / recortes** (0% a 25%, com atalhos rápidos de 5%, 8%, 10% e 15%).
  - Conversão automática para a unidade de venda (`un`, `barra`, `m²`, `sc`, `painel`), custo por m², desconto PIX (5%) e envio direto para o **Carrinho**, **Banco de Dados** ou **WhatsApp**.
- **Retirada Grátis na Loja (Click & Collect)**:
  - Seleção de unidade física (Matriz SP, Unidade Sul e Hub Campinas), data e janela de horário para retirada em doca Drive-Thru.
  - Geração automática de **Código de Retirada (`RET-XXXXXX`)** ao finalizar o pedido.
  - Alternância instantânea para **Entrega na Obra** com busca automática de endereço via **API ViaCEP** e cálculo de frete.
- **Sistema de Banco de Dados Híbrido (Local + Supabase)**:
  - **Modo Local (`IndexedDB` + fallback `localStorage`)**: funciona 100% offline/localmente sem precisar instalar servidor ou banco externo. Inclui **Exportação/Importação JSON** e cadastro dinâmico de produtos.
  - **Modo Nuvem (`Supabase PostgreSQL`)**: ao publicar na Vercel com as variáveis do Supabase configuradas, o sistema detecta `/api/health` automaticamente e persiste tudo no PostgreSQL.
- **Arquitetura Pronta para APIs (`/api/*`)**:
  - Endpoints REST padronizados (Vercel Serverless Functions), suporte a autenticação por `X-API-Key`, integração nativa com **ViaCEP**, **WhatsApp** e **Webhooks** (`WEBHOOK_ORDERS_URL`) para ERPs/CRMs.

---

## Estrutura do Projeto

```text
Site_Allan/
├── index.html                  # Loja completa (funciona direto no navegador e na Vercel)
├── assets/
│   ├── images/                 # Imagens locais de alta resolução
│   └── styles/main.css         # Design System CONCRETANDO
├── js/
│   ├── config.js               # Configurações de modo DB, PIX, frete e integrações
│   ├── data/seedData.js        # Catálogo inicial, lojas físicas e rendimentos por m²
│   ├── db/
│   │   ├── localAdapter.js     # Banco de Dados Local (IndexedDB + Backup JSON)
│   │   ├── supabaseAdapter.js  # Cliente para APIs Vercel -> Supabase
│   │   └── database.js         # Repositório unificado com fallback automático
│   ├── services/
│   │   ├── apiClient.js        # Hub de APIs (ViaCEP, WhatsApp, frete, testador REST)
│   │   └── quoteCalculator.js  # Motor de cálculo técnico por m²
│   └── app.js                  # Controlador completo da interface
├── api/                        # Vercel Serverless Functions (Node.js)
│   ├── _lib/supabase.js        # Cliente Supabase compartilhado + CORS + Webhooks
│   ├── health.js               # GET /api/health
│   ├── products.js             # GET / POST /api/products
│   ├── stores.js               # GET /api/stores
│   ├── quotes.js               # GET / POST /api/quotes
│   ├── orders.js               # GET / POST /api/orders
│   └── contact.js              # POST /api/contact
├── supabase/
│   └── schema.sql              # Script SQL completo (tabelas, índices, RLS e seed)
├── package.json                # Dependências para as Serverless Functions da Vercel
├── vercel.json                 # Configuração de rotas e headers CORS na Vercel
└── .env.example                # Modelo de variáveis de ambiente
```

---

## Como Usar Localmente (Agora Mesmo)

1. Abra o arquivo `index.html` diretamente no navegador (Chrome, Edge ou Firefox), **ou** use a extensão *Live Server* no VS Code.
2. O site iniciará automaticamente no **Banco de Dados Local (IndexedDB)** com todo o catálogo, calculadora por m², carrinho, retirada na loja e painel operacional funcionando.

---

## Como Publicar na Vercel com Banco de Dados Supabase

### Passo 1 — Criar o Banco no Supabase
1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto.
2. No menu lateral, clique em **SQL Editor** → **New Query**.
3. Copie todo o conteúdo de `supabase/schema.sql`, cole no editor e clique em **Run**.
4. Em **Project Settings → API**, copie:
   - `Project URL` (`SUPABASE_URL`)
   - `anon public` (`SUPABASE_ANON_KEY`)
   - `service_role` (`SUPABASE_SERVICE_ROLE_KEY`)

### Passo 2 — Publicar na Vercel
1. Faça commit e push deste repositório para o **GitHub**.
2. Acesse [vercel.com](https://vercel.com) → **Add New Project** → importe o repositório `Site_Allan`.
3. Em **Environment Variables**, adicione:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - *(Opcional)* `CONCRETANDO_API_KEY` (protege o `POST /api/products`)
   - *(Opcional)* `WEBHOOK_ORDERS_URL` (recebe notificações automáticas de novos pedidos e cotações)
4. Clique em **Deploy**.

A Vercel instalará automaticamente o `@supabase/supabase-js` do `package.json`, ativará todas as rotas `/api/*` e o indicador no topo do site mudará automaticamente para **Supabase Cloud (Vercel API)**.

---

## Documentação Rápida das APIs REST

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Verifica status da API e conexão com o Supabase |
| `GET` | `/api/products` | Lista produtos (aceita `?category=`, `?promo=true`, `?search=`) |
| `POST` | `/api/products` | Cadastra/atualiza produto (aceita header `X-API-Key`) |
| `GET` | `/api/stores` | Lista unidades físicas disponíveis para retirada na loja |
| `GET` | `/api/quotes` | Lista cotações por m² registradas |
| `POST` | `/api/quotes` | Salva nova cotação por m² (dispara webhook se configurado) |
| `GET` | `/api/orders` | Lista pedidos registrados |
| `POST` | `/api/orders` | Cria pedido com geração automática de `pickup_code` (`RET-XXXXXX`) |
| `POST` | `/api/contact` | Registra mensagem de contato / orçamento |
