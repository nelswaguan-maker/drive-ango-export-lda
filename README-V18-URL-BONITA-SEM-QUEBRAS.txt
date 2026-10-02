DRIVE ANGO V18 — URL BONITA ESTÁVEL

Base: V17.

Correção: o roteamento /car/:slug e /carro/:id usa rewrites padrão do Vercel, sem o bloco routes/handle filesystem que estava a causar 404.

URL pública: /car/marca-modelo-ano
Destino interno: /detalhes.html?slug=...

A página detalhes.js já resolve o slug contra o catálogo real e regista o carro em driveRecentlyViewed.
Não alterar login, filtros, histórico, favoritos ou ANGO Assistant.
