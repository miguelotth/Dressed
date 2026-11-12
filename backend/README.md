# LookLoop — Backend v1.0

API para o **LookLoop — Closet Inteligente**, integrada ao frontend React incluído no mesmo ZIP. Leia também o `../README.md` da raiz.

## O que foi implementado

- **Cadastro, login e logout** por e-mail e senha, com hash `scrypt` e sessão por cookie `HttpOnly`.
- **Contas individuais:** roupas, looks, fotos e preferências pertencem à conta autenticada.
- **PostgreSQL:** esquema SQL para usuários, sessões, imagens, roupas, looks e relação entre looks e peças.
- **CRUD** completo de roupas e looks, perfil e consulta consolidada do closet.
- **Upload privado de fotos** (JPEG, PNG, WEBP, até 4 MB), com armazenamento no disco e metadados no PostgreSQL.
- **Remoção de fundo com Rembg**, por um serviço Python/FastAPI local que retorna PNG transparente.
- Validação de entradas, consultas parametrizadas, limite de tentativas de login e de remoção de fundo.
- Testes automatizados básicos de validações e funções de autenticação.

**Não incluído:** redefinição de senha por e-mail, hospedagem em nuvem, análise automática da cor das roupas ou recomendações por IA. O frontend integrado neste ZIP usa a API em vez de `localStorage`. Leia `../README.md` para rodar o conjunto.

## 1. Requisitos

- Node.js **20.19 ou superior** (recomendado Node 22 LTS)
- npm
- PostgreSQL 14+ (pode usar Docker Desktop)
- Python **3.11, 3.12 ou 3.13** para Rembg
- Acesso à internet no primeiro `npm install`, `pip install` e download dos modelos do Rembg

## 2. Instalar PostgreSQL (jeito mais simples)

Abra um terminal na pasta **lookloop-backend**:

```bash
docker compose up -d
```

Isso disponibiliza somente para **desenvolvimento local** o banco na porta `5432`, com usuário `lookloop`, senha `lookloop_dev_password` e banco `lookloop`. Se você já tiver PostgreSQL instalado, pode criar esses recursos manualmente e ajustar `DATABASE_URL`.

## 3. Instalar o backend

```bash
# Na pasta lookloop-backend
cp .env.example .env   # Windows PowerShell: Copy-Item .env.example .env
npm install
npm run db:migrate
npm run dev
```

Valide em `http://localhost:3001/api/health`. O esperado, quando o banco estiver acessível, é:

```json
{"ok":true,"service":"lookloop-api","database":"online"}
```

Se a API retornar erro de conexão, verifique se o Postgres está ligado e se a URL no `.env` está correta.

## 4. Executar o Rembg

Abra **outro terminal** na pasta `lookloop-backend/python-rembg`.

**Windows (PowerShell):**

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 7000
```

Se a versão instalada for 3.11 ou 3.12, troque `-3.13` pela sua. Se o PowerShell bloquear o script de ativação, use `.\.venv\Scripts\python.exe -m pip install -r requirements.txt` e `.\.venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 7000` sem ativar a venv.

**Linux/macOS:**

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 7000
```

Valide em `http://127.0.0.1:7000/health`.

**Atenção:** o modelo `isnet-general-use` é baixado automaticamente na primeira remoção de fundo; isso exige internet, espaço em disco e pode demorar. O resultado depende da iluminação, do fundo e da peça. Você pode mudar o modelo com a variável de ambiente `REMBG_MODEL` do processo Python. O Rembg é open source, mas os pesos dos modelos têm licenças próprias — confira antes de qualquer uso comercial.

## 5. Teste rápido: cadastro e consulta

No navegador, enquanto a API estiver rodando, abra o **console de desenvolvedor** em `http://localhost:5173` (se o frontend estiver aberto), ou use um cliente HTTP como Insomnia/Postman. Para o navegador, o frontend deve configurar o proxy descrito no guia de integração.

```js
// Exemplo no console do navegador com proxy Vite configurado
await fetch('/api/auth/register', {
  method:'POST', headers:{'Content-Type':'application/json'},
  credentials:'include',
  body:JSON.stringify({name:'Usuário Teste',email:'teste@exemplo.com',password:'UmaSenhaForte123!'})
}).then(r=>r.json());
await fetch('/api/closet',{credentials:'include'}).then(r=>r.json());
```

A primeira chamada cria a conta e inicia a sessão; a segunda retorna o closet (inicialmente vazio) e o perfil. Cadastre outra conta para verificar que nenhuma peça da primeira fica disponível na segunda.

## 6. Comandos úteis

```bash
npm run dev        # API com hot reload
npm run db:migrate # Cria as tabelas (pode rodar mais de uma vez)
npm run build      # Compila TypeScript para dist/
npm start          # Executa a versão compilada
npm test           # Testes de validação e segurança
```

## 7. Mapa de endpoints

| Método | Rota | O que faz |
|---|---|---|
| GET | `/api/health` | Testa API e banco |
| POST | `/api/auth/register` | Cadastra conta e abre sessão |
| POST | `/api/auth/login` | Entra na conta |
| GET | `/api/auth/me` | Usuário atual |
| POST | `/api/auth/logout` | Sai da conta |
| GET | `/api/closet` | Dados consolidados: `profile`, `clothes`, `outfits` |
| GET/PATCH | `/api/profile` | Consulta/edita preferências |
| GET | `/api/items` | Lista roupas |
| GET | `/api/items/:id` | Detalha uma roupa |
| POST | `/api/items` | Cadastra roupa |
| PATCH | `/api/items/:id` | Edita roupa |
| DELETE | `/api/items/:id` | Exclui roupa |
| GET | `/api/outfits` | Lista looks |
| POST | `/api/outfits` | Cria look |
| PATCH | `/api/outfits/:id` | Edita look |
| DELETE | `/api/outfits/:id` | Exclui look |
| POST | `/api/closet/clear` | Esvazia roupas e looks da conta |
| POST | `/api/images/upload` | Upload com `multipart/form-data` (campo `file`) |
| POST | `/api/images/remove-background` | Upload e recorte Rembg em uma chamada |
| POST | `/api/images/:id/remove-background` | Recorta imagem previamente enviada |
| GET | `/api/images/:id` | Busca imagem privada com cookie de sessão |
| DELETE | `/api/images/:id` | Exclui imagem não usada por roupa |

Todas as rotas, **exceto** health, register, login e logout, exigem login. As respostas de erro usam `{ "error": "mensagem" }`.

## 8. Organização

```text
lookloop-backend/
├── src/
│   ├── server.ts        # Rotas Express, autenticação, uploads e CRUD
│   ├── config.ts        # Variáveis de ambiente
│   ├── db.ts            # Conexão com PostgreSQL
│   ├── security.ts      # Scrypt, tokens, cookies
│   └── validation.ts    # Regras de validação
├── sql/schema.sql       # Tabelas e índices
├── scripts/migrate.ts   # Migração inicial
├── python-rembg/
│   ├── app.py            # Servidor Python para remover fundo
│   └── requirements.txt
├── tests/               # Testes automatizados básicos
├── docs/                # Guias de API e integração React
├── storage/             # Imagens persistidas (ignorada pelo Git)
├── docker-compose.yml
├── .env.example
└── package.json
```

## 9. Segurança e limitações

- Sessões são armazenadas como **hash SHA-256 de tokens aleatórios**, e senhas usam `scrypt` + salt por conta.
- Endpoints filtram todas as operações por `user_id`, inclusive visualização das fotos. O frontend **nunca** recebe a senha ou acesso direto ao PostgreSQL.
- Dados de contas separadas **não são compartilhados**. URLs de foto são privadas, então exportações e imagens externas precisam de autenticação.
- A API aceita a origem especificada em `WEB_ORIGIN`; em produção, utilize HTTPS, `COOKIE_SECURE=true`, autenticação de origem e um proxy reverso configurado corretamente.
- A pasta `storage/` não é automaticamente limpa de imagens órfãs ao remover peças. Backups do PostgreSQL e da pasta `storage/` devem ser feitos juntos.
- Não implementei exclusão definitiva de conta, redefinição de senha, confirmação de e-mail, antivírus, cotas de armazenamento por usuário, logs de auditoria, Redis para rate limit distribuído ou testes completos ponta a ponta. Esses itens devem ser considerados antes de um lançamento público.
- O objetivo desta entrega é **desenvolvimento local e demonstração acadêmica**, não um sistema pronto para produção pública.

### Observação sobre verificação

O código foi analisado sintaticamente e os testes unitários básicos foram executados, mas **não foi possível fazer `npm install`, levantar Postgres e executar uma requisição real ao Rembg neste ambiente** devido ao acesso à rede. Por isso, depois de instalar localmente, execute `npm run build`, `npm test` e o fluxo de cadastro/upload/remover fundo para validar o conjunto no seu computador.
