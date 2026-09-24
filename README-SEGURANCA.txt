VERIFICAÇÃO DE SEGURANÇA — DRIVE ANGO EXPORT

Data: 2026-09-24

O projeto foi revisto procurando sinais comuns de código malicioso ou de captura indevida de credenciais.

Verificado:
- Não foi encontrado sb_secret_, Service Role Key ou chave privada no código público.
- Não foi encontrado eval(), new Function(), javascript: ou obfuscação evidente.
- Os fluxos de login usam o SDK oficial do Supabase e a chave publicada do projeto.
- Os redirecionamentos encontrados apontam para o domínio atual do projeto ou para serviços esperados (Supabase/WhatsApp).
- O catálogo usa Supabase como fonte de dados compartilhada.

Correções aplicadas:
- Corrigidos robots.txt e sitemap.xml para drive-ango-export-lda.vercel.app.
- Corrigida a referência antiga de domínio no README.
- Adicionados cabeçalhos de segurança no Vercel: nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy e CSP.
- Adicionado rel="noopener noreferrer" aos links que abrem nova aba.
- Reforçada a renderização da página de detalhes para escapar dados do catálogo e aceitar apenas imagens HTTPS.
- Mantida a integração com Supabase, Google Login, WhatsApp e as imagens externas necessárias ao site.
- Mantida a carroceria Van nos filtros públicos.

IMPORTANTE:
Este pacote não garante, por si só, a remoção de um alerta do Google Safe Browsing. O alerta pode ser baseado na reputação/estado de segurança do domínio ou em conteúdo externo. Depois do novo deploy, se o Chrome continuar mostrando "Site perigoso", é necessário verificar o domínio no Google Search Console/Transparency Report e solicitar uma revisão de segurança após confirmar que o deployment ativo corresponde a este pacote.
