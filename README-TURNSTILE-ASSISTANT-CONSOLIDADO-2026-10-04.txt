DRIVE ANGO EXPORT — PACOTE ÚNICO
Turnstile + ANGO Assistant com contexto
Data: 2026-10-04

BASE
Este pacote foi preparado a partir do ZIP verificado DRIVE-ANGO-TURNSTILE-2026-10-03.zip.
A regra foi preservar as funções existentes e acrescentar as duas correções no mesmo pacote.

1) CLOUDFLARE TURNSTILE
- Site Key pública usada no frontend: 0x4AAAAAAFM4-awkXpbdtvAa
- Login de cliente: Turnstile + captchaToken no signInWithPassword.
- Cadastro de cliente: Turnstile + captchaToken no signUp.
- Recuperação de senha: Turnstile + captchaToken no resetPasswordForEmail.
- Login de administrador: Turnstile + captchaToken no signInWithPassword.
- Aceitação de convite de administrador: Turnstile + captchaToken no signUp.
- O frontend aguarda o token por até 15 segundos antes de falhar, evitando o problema de clicar enquanto o widget ainda está a carregar.
- A Secret Key NÃO está neste ZIP e nunca deve ser colocada no frontend. Ela continua configurada no Supabase.

IMPORTANTE APÓS O UPLOAD
1. Fazer deploy deste ZIP.
2. Confirmar que o domínio usado no Turnstile inclui o domínio Vercel atual.
3. Só depois reativar Supabase > Authentication > Attack Protection > Enable Captcha protection.
4. Testar: login cliente, cadastro, recuperação de senha, login ADM e convite ADM.

2) ANGO ASSISTANT — CONTEXTO / “CONSCIÊNCIA”
Não é consciência literal nem um LLM. É uma camada local de contexto e memória grounded no inventário real.
- Mantém preferências da conversa: marca, modelo, carroceria, combustível, orçamento, ano, lugares e transmissão.
- Guarda a memória de pesquisa no navegador para continuar o contexto entre aberturas.
- Entende perguntas de seguimento como “e Honda?”, “mais barato”, “mais caro”, “e esse?”.
- Filtra apenas carros publicados, disponíveis e presentes no inventário carregado.
- Não inventa stock, preço ou características.
- Mostra links para os detalhes reais dos carros encontrados.
- Usa o contacto geral do site para oferecer WhatsApp quando este estiver configurado no painel Admin.
- Português e respostas básicas em inglês.
- Comando de limpeza: “limpa memória”, “reset memory” ou “recomeçar”.

LIMITAÇÃO
Para conversa realmente generativa/LLM, será necessário um serviço de IA no servidor (nunca uma chave secreta no frontend). Este pacote implementa a consciência contextual segura sem expor uma chave de IA.

VALIDAÇÃO REALIZADA
- node --check script.js: OK
- node --check admin.js: OK
- Arquivos HTML/JS preservados e alterações consolidadas no mesmo ZIP.
