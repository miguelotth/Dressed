# Exemplos de chamadas HTTP

Configure o proxy Vite conforme `INTEGRACAO_FRONTEND.md`; no navegador, use `fetch('/api/...')` com `credentials: 'include'`. Se estiver usando Insomnia, Postman ou `curl`, as chamadas são diretas em `http://localhost:3001/api/...` e o cliente deve preservar cookies entre requisições.

## Criar conta

```http
POST /api/auth/register
Content-Type: application/json

{"name":"Pessoa Teste","email":"pessoa@exemplo.com","password":"SenhaDeTeste123!"}
```

Retorna HTTP `201`, `{ "user": { "id": "...", "name": "...", "email": "..." } }` e cookie `lookloop_session`.

## Login

```http
POST /api/auth/login
Content-Type: application/json

{"email":"pessoa@exemplo.com","password":"SenhaDeTeste123!"}
```

## Cadastrar peça (foto opcional)

```http
POST /api/items
Content-Type: application/json

{"name":"Camisa preta","category":"tops","color":"Preto","hex":"#33313A","season":"Todas","occasion":"Casual","style":"Básico","favorite":false}
```

Com imagem, inclua `"imageId":"<uuid retornado pelo upload>"` no JSON.

## Editar roupa

```http
PATCH /api/items/<uuid>
Content-Type: application/json

{"favorite":true,"occasion":"Faculdade"}
```

## Cadastrar look

```http
POST /api/outfits
Content-Type: application/json

{"name":"Look da faculdade","occasion":"Faculdade","notes":"Confortável","itemIds":["<uuid roupa 1>","<uuid roupa 2>"],"favorite":false}
```

As duas peças devem existir na conta **atual**, e o look precisa ter pelo menos 2 peças.

## Upload e recorte com Rembg

1. Faça upload com `multipart/form-data` no campo `file` para `POST /api/images/upload`.
2. Receba `{ "imageId": "...", "imageUrl": "/api/images/...", "isProcessed": false }`.
3. Faça `POST /api/images/<imageId>/remove-background` (não precisa de body).
4. Receba outro `imageId`, um `imageUrl` de PNG transparente e `isProcessed: true`.
5. Utilize o ID original ou processado ao cadastrar a roupa. A imagem será exibida em `<img src="/api/images/<uuid>"/>` enquanto o usuário estiver autenticado.

Alternativa: `POST /api/images/remove-background` aceita diretamente o arquivo e retorna somente a imagem **recortada** já armazenada.

## Códigos de resposta

- `200` operação concluída; `201` recurso criado.
- `400` corpo inválido, campo incorreto ou ID fora do padrão.
- `401` login necessário / sessão expirada.
- `403` origem não autorizada ou recurso de outra conta.
- `404` recurso não encontrado ou pertencente a outra conta.
- `409` e-mail já utilizado ou imagem vinculada a roupa.
- `413` imagem ou corpo JSON muito grande.
- `429` limite temporário de tentativas.
- `502`, `503`, `504` falha, indisponibilidade ou timeout do Rembg.
- `500` falha interna do servidor.
