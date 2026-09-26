ATUALIZAÇÃO DRIVE — 2026-09-26

Incluído:
- Links públicos de anúncios no formato /carro/STOCK, com rewrite Vercel para detalhes.html.
- Partilha de anúncios atualizada para /carro/STOCK.
- Tema Claro/Noturno/Sistema na página de detalhes, usando a mesma preferência driveTheme do site.
- Menu Definições no painel de Administração (tema, contacto e site/partilha), apenas para Proprietários Principais.
- Promoções agora permitem escolher a imagem diretamente da galeria/ficheiros; a imagem é enviada automaticamente ao Supabase Storage, no bucket existente car-images, pasta promotions/.
- Mantidos os avisos sobre a DRIVE não ser a SBT Japan.
- Não foi criado SQL novo nesta atualização; a imagem das promoções reutiliza o bucket car-images e as políticas já existentes de upload de administradores.
