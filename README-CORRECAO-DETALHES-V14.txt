DRIVE ANGO — V14 — CORREÇÃO DEFINITIVA DO ERRO 404 DOS DETALHES

Causa encontrada:
Os cartões estavam apontando para /carro/ID. Essa rota depende do rewrite do Vercel. Quando o rewrite não é aplicado pelo projeto/deploy, o Vercel devolve 404 antes de detalhes.html carregar.

Correção:
1. Todos os links internos de anúncios agora usam diretamente /detalhes.html?id=ID, que é um arquivo estático real do projeto.
2. O compartilhamento também usa detalhes.html?id=ID para evitar links quebrados.
3. Foi adicionado 404.html como fallback: se alguém abrir um link antigo /carro/ID, o navegador é encaminhado automaticamente para detalhes.html?id=ID.
4. O vercel.json/rewrite foi mantido para compatibilidade, mas a navegação interna não depende mais dele.
5. Não foram alterados login, filtros, ANGO ASSISTANT, vistos recentemente, histórico ou regras de administração.

Teste:
- Clicar em Ver detalhes -> deve abrir /detalhes.html?id=ID.
- Abrir manualmente /carro/ID -> fallback para detalhes.
- Abrir /detalhes.html?id=ID -> funciona diretamente.
