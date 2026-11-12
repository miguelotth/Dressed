# Integração concluída

O frontend deste pacote já está integrado ao backend do LookLoop. Leia o `README.md` da raiz do projeto para instruções e testes de ponta a ponta.

O endpoint `GET /api/closet` fornece perfil, roupas e looks. As fotos são recuperadas com cookie de sessão através de `/api/images/:id`. As operações de edição são feitas por `POST`, `PATCH` e `DELETE` na API. O serviço Python FastAPI na porta 7000 processa as imagens pelo Rembg.
