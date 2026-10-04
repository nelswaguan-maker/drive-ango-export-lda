CORREÇÃO — DETALHES 404

A versão consolidada anterior introduziu /carro/:id -> /api/car e alterou driveCarUrl para /carro/ID.
Isso voltou a quebrar a página de detalhes.

Nesta versão:
- driveCarUrl voltou para detalhes.html?id=ID;
- o rewrite /carro/:id aponta para detalhes.html?id=:id, mantendo compatibilidade;
- o endpoint /api/car foi removido da versão pública para evitar outra rota de detalhes;
- a política CSP continua permitindo Cloudflare Turnstile;
- as funções Turnstile e ANGO Assistant foram preservadas;
- a raiz do ZIP contém diretamente os arquivos do site, sem uma pasta ango-build intermediária.
