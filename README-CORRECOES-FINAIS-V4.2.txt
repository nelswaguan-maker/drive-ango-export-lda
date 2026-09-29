DRIVE ANGO — CORREÇÕES FINAIS V4.2

1. WhatsApp por administrador
- O administrador pode guardar o seu próprio WhatsApp em Definições → Contacto e WhatsApp.
- Ao publicar um carro novo, o contacto é gravado no próprio anúncio.
- A página inicial, detalhes e compra usam o contacto do administrador que publicou o anúncio.
- O contacto antigo global em localStorage fica apenas como fallback para anúncios antigos.

2. Contadores reais
- Sedan, SUV, Hatchback, Pick up, Truck, Coupe, Station Wagon e Van usam a contagem real de anúncios publicados.
- Números fixos foram removidos.

3. Catálogo público
- Marca, Modelo e Favoritos usam a resposta pública do Supabase como fonte de verdade quando a consulta funciona.
- Um resultado online vazio não é substituído pelo cache local.

4. Segurança do anúncio
- drive_cars ganhou publisher_phone.
- O trigger de autorização considera também esse campo.

5. Arquivos alterados
- admin.js
- cars-data.js
- script.js
- detalhes.js
- compra.js
- compra.css
- marca.js
- modelos.js
- favoritos.html
- supabase-schema.sql
- README-ATUALIZACAO-2026-09-26.txt
- README-V4.2-SEGURANCA.txt
- README-CORRECOES-FINAIS-V4.2.txt

Importante: depois de publicar esta versão, o supabase-schema.sql atualizado precisa ser executado no projeto Supabase para a coluna publisher_phone existir no banco.
