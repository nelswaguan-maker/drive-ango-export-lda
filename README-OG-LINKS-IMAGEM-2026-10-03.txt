ATUALIZAÇÃO — PREVIEW DE IMAGEM NOS LINKS

- Os links públicos gerados pelo catálogo passam a usar /carro/STOCK-ID.
- O Vercel encaminha /carro/:id para /api/car?id=:id.
- A função server-side consulta o anúncio publicado no Supabase e injeta og:title, og:description, og:url, og:image e Twitter Card antes de a página ser entregue.
- A imagem usada no preview é a capa do anúncio (image/images[0]).
- O HTML recebido pelo navegador inclui <base href="/"> para manter CSS/JS/imagens relativos funcionando.
- Os links antigos detalhes.html?id=... continuam no projeto; a mudança só afeta os links públicos gerados pelo catálogo.
