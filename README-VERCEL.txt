DRIVE CARS — PACOTE FINAL PARA VERCEL

Este pacote contém o projeto completo, incluindo:
- index.html e todos os CSS/JS
- perfil e eliminação de conta
- área de administração e proteção de admin
- integração Supabase/configuração
- supabase-schema.sql
- robots.txt
- sitemap.xml
- vercel.json

IMPORTANTE:
1. No Vercel, crie um único projeto e faça upload deste ZIP.
2. O conteúdo deste ZIP deve ser usado na raiz do projeto, onde index.html, robots.txt e sitemap.xml ficam diretamente na raiz.
3. Não crie um segundo projeto para robots/sitemap.
4. Depois do primeiro deployment, teste:
   https://drive-ango-export-lda.vercel.app/robots.txt
   https://drive-ango-export-lda.vercel.app/sitemap.xml
5. O robots.txt e o sitemap.xml já apontam para drive-ango-export-lda.vercel.app.
6. A configuração do Supabase já está incluída no projeto. O SQL não precisa ser executado novamente se as tabelas/funções já foram criadas no projeto Supabase.

NOTA:
Um deployment inicial no Vercel exige uma ação na conta Vercel. Depois de publicado, não é necessário voltar ao Vercel para o site continuar online.


Nome sugerido do projeto no Vercel: drive-ango-export-lda
O item “Administração” do menu público só aparece quando a sessão autenticada pertence exatamente ao email proprietário nelswaguan@gmail.com e a função de administrador do Supabase também confirma o acesso.


ATUALIZAÇÃO: administração para convidados aparece no menu após login; convites levam ao cadastro na página inicial; cadastro exige aceitação de Política de Privacidade e Termos; veículos suportam até 10 URLs de fotos.

CATÁLOGO PARTILHADO / TEMPO REAL
- O catálogo de veículos agora usa a tabela public.drive_cars no Supabase.
- Execute drive-cars-realtime.sql uma vez no SQL Editor do Supabase.
- Depois disso, publicações, edições, reservas, vendidos e reaberturas feitas por qualquer administrador são sincronizadas entre os administradores e a página inicial.
- A edição do veículo inclui Motor e Peso e a carroceria inclui Truck.
- A página Detalhes possui setas ◀ ▶ para navegar pelas fotos.
