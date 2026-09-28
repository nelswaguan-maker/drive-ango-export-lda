CORREÇÃO LOGIN / ADMINISTRADORES — 2026-09-28

- Login normal continua separado do painel.
- Os três proprietários são reconhecidos pelo email.
- Administradores convidados precisam ser aceitos pelo convite ou ter role=admin e blocked=false.
- O acesso ao admin.html agora é validado com public.is_current_user_admin() depois do signInWithPassword.
- Uma conta comum autenticada não pode entrar no painel apenas por conhecer a URL/admin.html.
- Nenhum anúncio, contador ou agrupamento foi alterado.
