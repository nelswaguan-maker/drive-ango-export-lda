DRIVE ANGO EXPORT — PRODUÇÃO VERCEL

Domínio de produção do projeto:
https://drive-ango-export-lda.vercel.app/

O código NÃO está limitado a localhost. Os redirects do Supabase usam window.location.origin, portanto adaptam-se automaticamente ao hostname onde o site estiver aberto.

HOSTNAMES DO CLOUDFLARE TURNSTILE
Autorizar no widget Turnstile usado pelo projeto:
- localhost
- 127.0.0.1
- drive-ango-export-lda.vercel.app

IMPORTANTE
A autorização dos hostnames é feita no painel Cloudflare Turnstile, não no HTML/JavaScript. Não colocar a Secret Key no frontend.

VERCEL
O vercel.json já permite os recursos necessários do Cloudflare Turnstile em script-src, connect-src e frame-src.

SUPABASE
No Supabase Authentication > URL Configuration, adicionar:
- https://drive-ango-export-lda.vercel.app
- https://drive-ango-export-lda.vercel.app/index.html
- https://drive-ango-export-lda.vercel.app/admin.html

Para desenvolvimento local, manter também o endereço local que você usa.

TESTE DE PRODUÇÃO
1. Publicar este conteúdo no projeto Vercel.
2. Abrir https://drive-ango-export-lda.vercel.app/
3. Abrir login/cadastro/recuperação e confirmar que o Turnstile aparece.
4. Testar o painel administrativo em /admin.html.
5. Se aparecer domínio não autorizado, conferir os hostnames no widget Cloudflare Turnstile.
