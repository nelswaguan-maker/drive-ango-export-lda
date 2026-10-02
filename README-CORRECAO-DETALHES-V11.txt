DRIVE ANGO — V11 — CORREÇÃO DA ROTA DOS DETALHES

Correção aplicada:
- A rota pública /carro/:id agora é reescrita diretamente para detalhes.html?id=:id.
- Isso evita o 404 do Vercel quando a função /api/car não é disponibilizada/roteada na implantação.
- O detalhes.html?id=... antigo continua funcionando.
- detalhes.js continua aceitando também /carro/:id e registra o carro em driveRecentlyViewed.
- Vistos recentemente continuam limitados a 4 cards na home.
- Histórico continua usando o mesmo localStorage driveRecentlyViewed.
- ANGO ASSISTANT continua arrastável.
- Rodapé da página de detalhes foi preservado.

IMPORTANTE:
Depois de substituir o projeto no Vercel, faça um novo Deploy. O ZIP local não altera automaticamente a versão já publicada.
