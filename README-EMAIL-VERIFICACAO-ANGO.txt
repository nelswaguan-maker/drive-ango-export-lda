ANGÓ GLOBAL CARS — EMAIL DE VERIFICAÇÃO

Este pacote inclui o template:
SUPABASE-EMAIL-VERIFICACAO-ANGO.html

IMPORTANTE:
O nome do remetente e o template de email de confirmação são configurados no painel do Supabase, não no JavaScript do site. O código do site continua a usar o fluxo normal de auth.signUp(), portanto esta alteração NÃO mexe no login.

NO SUPABASE:
1. Authentication > Email Templates > Confirm signup.
2. Assunto:
   Confirma o teu email — Angó Global Cars
3. Cole o conteúdo de SUPABASE-EMAIL-VERIFICACAO-ANGO.html no campo Body.
4. Em configurações de email/remetente, use o nome:
   Angó Global Cars
5. Se houver SMTP próprio configurado, o nome do remetente deve ser configurado também no provedor SMTP.
6. O link de confirmação usa {{ .ConfirmationURL }} e continua a respeitar o redirect já definido pelo site.

IDIOMA:
Este template é a versão portuguesa. O Supabase não troca automaticamente o corpo deste template com base no seletor de idioma do navegador/site. Para confirmação verdadeiramente PT/EN por utilizador será necessário um fluxo de email dinâmico (por exemplo, Edge Function/template externo). Não alterar o login atual para tentar simular isso no cliente.
