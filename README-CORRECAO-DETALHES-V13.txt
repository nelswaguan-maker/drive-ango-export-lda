DRIVE ANGO — V13 — CORREÇÃO DEFINITIVA DA PÁGINA DE DETALHES

Esta versão mantém o ANGO ASSISTANT, vistos recentemente, histórico, login, filtros e rodapé.

Correções:
- O conteúdo do ZIP está na RAIZ do projeto. Não existe mais a pasta v11work envolvendo os arquivos.
- vercel.json permanece na raiz para encaminhar /carro/:id para detalhes.html?id=:id.
- detalhes.html?id=... continua funcionando diretamente.
- detalhes.js continua aceitando /carro/:id e detalhes.html?id=... .
- Corrigido também o temporizador da página de detalhes para não tentar acessar car.status antes do carro existir.

IMPORTANTE PARA O DEPLOY:
Ao usar Vercel, o projeto deve ter index.html, detalhes.html e vercel.json diretamente na raiz do Root Directory. Depois faça um novo Deploy.

Teste rápido depois do deploy:
1. Abra a home.
2. Clique em qualquer “Ver detalhes”.
3. A URL deve ficar /carro/ID.
4. A página deve abrir os dados do carro.
5. Também teste manualmente /detalhes.html?id=ID.
