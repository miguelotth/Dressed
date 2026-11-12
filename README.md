# LOOKLOOP — Projeto integrado (Frontend + Backend + Rembg)

Esta versão integra o frontend original do LookLoop com a API Express e o PostgreSQL. As roupas, fotos, looks e preferências passam a pertencer à conta autenticada. A identidade visual rosa/lilás Y2K do frontend foi mantida, assim como a remoção anterior do selo "Seu closet está online" na Home.

## Organização

```text
LookLoop/
├── frontend/          React 18, TypeScript, Vite e CSS
│   ├── src/pages/     Home, Closet, Add Item, Builder, Saved, Suggestions, Settings e AuthPage
│   ├── src/context/   AuthContext e ClosetContext (conectados à API)
│   └── src/services/  Cliente HTTP (fetch, credenciais e upload)
├── backend/           API Node.js + Express + TypeScript
│   ├── sql/           Esquema PostgreSQL
│   ├── python-rembg/  Serviço Python para remoção de fundo
│   ├── src/           Endpoints REST e autenticação
│   └── storage/       Imagens privadas (não colocar em repositório público)
└── README.md
```

## Requisitos no Windows

- Node.js **22** (ou 20.19+), npm e VS Code
- **Docker Desktop** rodando, com suporte a contêineres Linux (para o PostgreSQL)
- Python **3.11, 3.12 ou 3.13** (para Rembg)
- Internet na primeira instalação das dependências e no primeiro download do modelo Rembg

## Inicie na ordem a seguir

### 1 — PostgreSQL (terminal na pasta `backend`)

```powershell
cd backend
docker compose up -d
```

Se você já executou esse comando antes e o contêiner continua ativo, não precisa recriar o banco.

### 2 — API (ainda na pasta `backend`)

```powershell
# Execute apenas se backend/.env ainda não existir:
Copy-Item .env.example .env
npm install
npm run db:migrate
npm run dev
```

> **Importante:** preserve qualquer `backend/.env` local que você já tenha configurado. O ZIP só inclui `.env.example`, nunca suas credenciais. Se alterou a porta, confira se `frontend/vite.config.ts` aponta para ela.

Acesse **http://localhost:3001/api/health**. Você deverá ver `"ok":true` e `"database":"online"`.

### 3 — Rembg (novo terminal, na pasta `backend/python-rembg`)

```powershell
cd backend\python-rembg
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app:app --host 127.0.0.1 --port 7000
```

Troque `-3.13` por `-3.12` ou `-3.11` caso essa seja a sua versão instalada. Caso o PowerShell bloqueie a ativação, não mude as políticas de segurança: execute diretamente `\.venv\Scripts\python.exe -m pip install -r requirements.txt` e depois `\.venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 7000`.

Acesse **http://127.0.0.1:7000/health** e confira `"ok":true`. O modelo `isnet-general-use` é baixado automaticamente na **primeira remoção de fundo** (pode demorar).

### 4 — Frontend (novo terminal, na pasta `frontend`)

```powershell
cd frontend
npm install
npm run dev
```

Acesse **http://localhost:5173/**. A porta 5173 é necessária para a configuração padrão de sessão e o proxy do Vite. Caso outra aplicação já use essa porta, encerre-a antes de iniciar o frontend.

**Atenção sobre os caminhos:** os exemplos acima de `cd` pressupõem que você abra cada terminal na **raiz do projeto LookLoop**. Se o terminal já estiver em `backend`, entre em `python-rembg` diretamente; se estiver em `frontend`, volte à raiz antes de usar `cd backend`.

## Teste de funcionamento em 8 passos

1. Abra o LookLoop no navegador; na tela de autenticação, clique em **Criar conta**.
2. Cadastre um nome, um e-mail de teste e uma senha de pelo menos 10 caracteres. Você deve entrar automaticamente no closet vazio.
3. Vá a **Adicionar peça**, escolha uma foto PNG/JPG/WEBP de até 4 MB e clique em **Remover fundo com Rembg** (o serviço Python deve estar iniciado).
4. Compare as opções **Foto original** e **Sem fundo**; selecione a preferida, preencha os detalhes e salve.
5. Confirme que a peça aparece em **Meu closet**. Edite-a ou favorite-a e recarregue a página: a mudança deve permanecer.
6. Adicione pelo menos outra peça, crie e salve um look. Em **Looks salvos**, confira se ele permanece após atualizar a página.
7. Em **Configurações**, altere a cor e o nome do guarda-roupa, depois saia da conta e entre novamente.
8. Crie uma **segunda conta** com outro e-mail: ela deverá começar com um closet vazio, sem acesso às fotos e às roupas da conta anterior.

## O que foi integrado

| Recurso | Situação |
|---|---|
| Cadastro, login, logout, sessão persistente | ✅ API + frontend |
| Roupas por conta (cadastrar, ver, editar, excluir, favoritar) | ✅ PostgreSQL |
| Upload de imagem com proteção por sessão | ✅ API + armazenamento em disco |
| Recorte por Rembg | ✅ Serviço Python local; seleção original/recorte |
| Looks por conta (criar, editar, excluir, favoritar) | ✅ PostgreSQL |
| Perfil e preferências | ✅ PostgreSQL |
| Sugestões | ✅ Regras no frontend com roupas da conta |
| Responsividade e tema rosa/lilás Y2K | ✅ CSS original preservado |
| Redefinição de senha por e-mail | ❌ Não implementada |
| Hospedagem em nuvem e envio de e-mails | ❌ Não implementados |
| Limpeza automática de imagens antigas não utilizadas | ❌ Ainda não implementada |

O **frontend anterior usava `localStorage` e roupas demonstrativas**. Nesta versão, usuários novos começam com um closet vazio, e as roupas antigas salvas apenas no navegador **não são importadas automaticamente**. Isso evita misturar dados entre contas. Se você quiser migrar dados da demonstração mais tarde, será necessário implementar um importador.

## Como a conexão funciona

O frontend chama `/api/...` pela mesma origem onde o Vite é servido. A configuração `frontend/vite.config.ts` redireciona essas requisições a `127.0.0.1:3001`, permitindo que o navegador envie o cookie de sessão `HttpOnly` sem armazenar senhas ou tokens em `localStorage`.

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- `GET /api/closet`, `PATCH /api/profile`
- `POST/GET/PATCH/DELETE /api/items...` e `/api/outfits...`
- `POST /api/images/upload` e `POST /api/images/remove-background`
- `GET /api/images/:id` (imagem privada; exige autenticação)

Veja `backend/docs/API_EXEMPLOS.md` e `backend/sql/schema.sql` para mais detalhes.

## Erros comuns

- **"Não foi possível conectar à API"**: verifique se `npm run dev` está ativo no backend e se `/api/health` responde.
- **Banco de dados indisponível**: abra Docker Desktop e execute `docker compose up -d` dentro de `backend`.
- **Erro ao processar foto / Rembg indisponível**: inicie o serviço Python na porta 7000; teste `/health`. É possível salvar a foto **original** enquanto ele estiver desligado.
- **"Este e-mail já está cadastrado"**: entre com a conta existente ou use um segundo e-mail de teste.
- **Erro ao abrir foto após trocar de usuário**: fotografias só podem ser carregadas pela conta proprietária; faça login na conta que as enviou.
- **Foto de perfil grande demais**: selecione uma imagem menor. Avatares são comprimidos no navegador e têm limite de tamanho menor que o upload de roupas.
- **npm install sem conexão**: execute em um computador com acesso ao registro do npm; não inclua `node_modules` no ZIP.

## Desenvolvimento e segurança

Esta configuração é indicada para **desenvolvimento local/avaliação acadêmica**, não para disponibilização pública diretamente. Se decidir publicar, configure HTTPS (`COOKIE_SECURE=true`), CORS/origem correta, gerenciamento de segredos, política de arquivos, backups e proteção adicional para operações de imagem. Nunca publique `.env`, diretórios `storage`, dados do PostgreSQL ou tokens de sessão.

Testes existentes do backend: `npm test` (validação/autenticação). Para conferir o frontend, use `npm run build` após instalar as dependências. O ZIP foi montado sem `node_modules`, `.env`, `.venv` e imagens pessoais.
