DRIVE ANGO — PACOTE DE MELHORIAS 2026-10-02

Incluído nesta versão:
- ANGO ASSISTANT: recepcionista virtual com consulta do inventário público atual.
- Painel de Utilizadores: contas criadas, utilizadores que fizeram login, logins do dia e lista de contactos.
- Botão WhatsApp no painel ADM para números fornecidos voluntariamente pelos utilizadores.
- Registo de eventos de login para estatísticas.
- Presença dos ADM com heartbeat e estado online/offline no painel.

IMPORTANTE:
- Executar analytics-presence-users.sql no Supabase antes de testar estatísticas/presença.
- O número de WhatsApp do cliente só é usado se tiver sido fornecido na conta e permanece restrito ao painel administrativo.
- O pacote não remove nem substitui as funções existentes.
- O ANGO ASSISTANT usa o inventário real disponível no Supabase quando o catálogo público está carregado; não tem permissões administrativas.
