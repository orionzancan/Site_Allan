# CONCRETANDO — Criando Laços e Casa (Next.js + React + Node.js)

Loja profissional de materiais de construção construída em **Next.js 14 (App Router) + React + TypeScript + Tailwind CSS + Node.js API Routes**, com layout 100% modular e responsivo (**Desktop, Tablet e Mobile com barra inferior nativa**), **Painel de Administração restrito (`/admin`)**, **Calculadora de Cotação por Metro Quadrado (m²)**, **Retirada Grátis na Loja**, **Banco de Dados Local + Supabase** e deploy direto na **Vercel**.

---

## Principais Recursos

### 1. Painel de Administração Restrito (`/admin`)
- Acesso exclusivo protegido por **autenticação server-side em Node.js** (`HMAC-SHA256` + cookie `HTTP-Only`).
- **Configurações Globais do Site** (alteração em tempo real):
  - Nome da loja, slogan, cor principal da marca, faixa de promoções, título/subtítulo/botão do Hero.
  - Desconto PIX (%), frete grátis a partir de (R$), tarifas de frete, WhatsApp, telefone e e-mail.
  - Ativar/desativar **Retirada na Loja**, **Entrega na Obra**, **Modo Manutenção** e **Webhook URL**.
- **CRUD Completo** de Produtos (preço, estoque, promoção, consumo por m²) e Unidades de Retirada na Loja.
- **Gestão de Pedidos** (com atualização de status e código de retirada `RET-XXXXXX`), **Cotações por m²**, **Mensagens de Contato**, **Testador de APIs** e **Backup JSON**.

### 2. Loja Modular e Responsiva (Desktop + Tablet + Mobile)
- Componentes modulares em `src/components/` (`Header`, `HeroSection`, `M2Calculator`, `ProductCatalog`, `StorePickupSection`, `CartDrawer`, `Modals`, `MobileBottomNav`).
- **Mobile-first**: barra de navegação inferior fixa (`Início`, `Cotar m²`, `Catálogo`, `Lojas`, `Carrinho`), drawers em tela cheia e grids adaptativos (`1 -> 2 -> 3 -> 4 colunas`).

### 3. Cotação por Metro Quadrado (m²) & Retirada na Loja
- Cálculo técnico por **Largura × Comprimento/Altura** ou **Área Total (m²)** com margem de **perda técnica** configurável (0%–25%), conversão automática para unidades/sacos/barras/m², envio ao carrinho, salvamento no banco e WhatsApp.
- **Retirada Grátis na Loja (Click & Collect)** com escolha de unidade, data/horário e geração automática de **Código de Retirada (`RET-XXXXXX`)**, ou **Entrega na Obra** com busca automática de endereço via **ViaCEP**.

### 4. Banco de Dados Híbrido (Local Node.js + Supabase) & APIs REST
- **Modo Local**: persiste automaticamente em `.data/concretando-db.json` via Node.js sem precisar de credenciais externas.
- **Modo Produção (Supabase)**: ao configurar `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`, todas as rotas em `src/app/api/*` passam a operar no PostgreSQL do Supabase automaticamente.

---

## Como Rodar Localmente (Node.js 18+)

```bash
# 1. Instale as dependências
npm install

# 2. (Opcional) Copie as variáveis de ambiente
copy .env.example .env.local

# 3. Inicie o servidor Next.js
npm run dev
```

Acesse:
- **Loja**: `http://localhost:3000`
- **Painel Admin**: `http://localhost:3000/admin`
  - E-mail padrão local: `admin@concretando.com.br`
  - Senha padrão local: `Concretando@2026`

---

## Como Publicar na Vercel com Supabase

1. **Supabase**: crie um projeto em [supabase.com](https://supabase.com), abra o **SQL Editor**, cole e execute todo o conteúdo de `supabase/schema.sql`.
2. **GitHub**: faça commit e push desta pasta `Site_Allan`.
3. **Vercel**: importe o repositório em [vercel.com](https://vercel.com) e configure as variáveis de ambiente:
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `ADMIN_SESSION_SECRET` (string longa aleatória)
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Clique em **Deploy**.

---

## Rotas de API (`src/app/api/*`)

| Método | Rota | Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Público | Status da API e motor do banco (`local` ou `supabase`) |
| `GET` / `PUT` | `/api/settings` | Público / **Admin** | Lê ou atualiza todas as configurações globais do site |
| `GET` / `POST` / `DELETE` | `/api/products` | Público / **Admin** | Catálogo e CRUD de produtos |
| `GET` / `POST` / `DELETE` | `/api/stores` | Público / **Admin** | Unidades físicas de retirada na loja |
| `GET` / `POST` | `/api/quotes` | **Admin** / Público | Lista ou cria cotações por m² |
| `GET` / `POST` / `PATCH` | `/api/orders` | **Admin** / Público | Lista, cria pedidos ou atualiza status |
| `GET` / `POST` | `/api/contact` | **Admin** / Público | Mensagens de contato |
| `GET` / `POST` / `DELETE` | `/api/admin/auth` | **Admin** | Sessão segura do administrador |
| `GET` / `POST` | `/api/admin/backup` | **Admin** | Exporta backup JSON ou restaura banco padrão |
