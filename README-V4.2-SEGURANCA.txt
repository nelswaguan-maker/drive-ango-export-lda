DRIVE ANGO — V4.2

Correções desta versão:
1. Convite de administrador: accept_admin_invite() marca a transação localmente para que protect_profile_privileges aceite a promoção legítima.
2. RLS de drive_cars: visitantes só conseguem SELECT em anúncios published=true; administradores continuam a poder ver não publicados.
3. Storage car-images: upload fica limitado à pasta do utilizador autenticado; edição/remoção verifica o anúncio associado quando aplicável. promotions/<user-id>/... continua permitido.
4. INSERT de drive_cars força created_by para auth.uid() para impedir atribuição a outro utilizador.
5. Cada anúncio novo guarda publisher_phone do administrador que o publicou. Os botões WhatsApp/Ligar usam esse contacto no catálogo público, detalhes e compra.
6. Contadores de carroceria na página inicial são calculados em tempo real a partir dos anúncios publicados; deixaram de usar números fixos.
7. Páginas Marca, Modelo e Favoritos deixaram de substituir uma consulta online vazia por cache local, evitando mostrar anúncios ocultos quando o Supabase responde corretamente.

Executar: supabase-schema.sql e depois storage-car-images.sql. Não executar SQLs antigos que recriem estas policies. O antigo drive-cars-realtime.sql também foi neutralizado nesta V4.2.
