DRIVE ANGO — TURNSTILE LOCALHOST + VERCEL (PRONTO PARA PRODUÇÃO)

Objetivo
--------
Este projeto já usa a mesma Site Key pública do Cloudflare Turnstile no login, cadastro, recuperação de senha e área administrativa.

O código já detecta automaticamente a origem através de window.location.origin para os redirects do Supabase. Portanto não é necessário colocar localhost ou o domínio Vercel dentro do JavaScript.

Hostnames que DEVEM ser autorizados no widget Turnstile
--------------------------------------------------------
Adicione estes hostnames no Cloudflare Turnstile > widget usado pelo DRIVE ANGO:

localhost
127.0.0.1
drive-ango-export-lda.vercel.app

Se o Vercel fornecer outro domínio personalizado/alias, adicione também somente o hostname, sem https://, porta ou caminho.

Exemplo correto:
angoglobalcarsexporter.com
www.angoglobalcarsexporter.com

Exemplos incorretos:
https://drive-ango-export-lda.vercel.app/
drive-ango-export-lda.vercel.app:443

Importante
----------
O Cloudflare Turnstile controla os hostnames autorizados fora do código. O projeto não consegue autorizar localhost ou o Vercel sozinho.

Depois de adicionar os hostnames, não é necessário alterar a Site Key no script.js ou admin.js.

Teste local
-----------
1. Abra o projeto em http://localhost:7700
2. Abra Login.
3. O Turnstile deve carregar sem a mensagem de domínio não autorizado.
4. Teste também Cadastro e Recuperação de senha.
5. Em seguida teste o login da Administração em /admin.html.

Teste no Vercel
---------------
1. Abra https://drive-ango-export-lda.vercel.app
2. Teste Login, Cadastro e Recuperação de senha.
3. Teste /admin.html.

Segurança
---------
- A Site Key é pública e pode ficar no frontend.
- A Secret Key do Turnstile NÃO deve ser colocada em nenhum arquivo HTML/JS deste projeto.
- A validação real do token deve continuar sendo feita pelo Supabase/servidor configurado para Turnstile.
- O CSP do vercel.json já permite os recursos necessários do Turnstile em challenges.cloudflare.com.

Observação sobre produção
-------------------------
Não use uma chave de teste do Turnstile para o site publicado. A mesma Site Key de produção pode funcionar no localhost e no Vercel quando ambos estiverem autorizados no Hostname Management do widget.


IMPORTANTE — VERCEL
O projeto NÃO está limitado a localhost. Ele usa window.location.origin para redirects, portanto funciona no domínio publicado pelo Vercel. Para o Turnstile, o hostname de produção precisa estar autorizado no widget Cloudflare. Exemplo: seu-projeto.vercel.app (sem https:// e sem caminho). Se usar domínio personalizado, autorize também esse hostname.
