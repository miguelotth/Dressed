# LookLoop — Frontend integrado

Interface React + TypeScript + Vite. Autenticação, closet, roupas, looks, perfil e imagens usam a API Express do projeto; **não utilizamos mais o `localStorage` da demonstração**.

Para instruções completas de instalação, execução do PostgreSQL e do Rembg, veja **`../README.md`**.

## Comandos

Na pasta `frontend`:

```powershell
npm install
npm run dev
npm run build
```

Acesse http://localhost:5173. A configuração `vite.config.ts` encaminha chamadas `/api` para http://127.0.0.1:3001. Execute o backend antes do frontend.

## Estrutura

- `src/context/AuthContext.tsx`: sessão e autenticação via cookie HttpOnly.
- `src/context/ClosetContext.tsx`: leitura/gravação de roupas, looks e perfil pela API.
- `src/services/api.ts`: cliente HTTP e upload de imagens.
- `src/pages/AuthPage.tsx`: cadastro e login.
- `src/pages/AddItem.tsx`: upload da foto original e remoção de fundo via Rembg.
- As demais telas preservam o visual do protótipo e agora usam dados reais.

As roupas demonstrativas do frontend antigo não são importadas automaticamente para o banco. Cada nova conta inicia vazia.
