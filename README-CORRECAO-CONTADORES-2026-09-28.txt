CORRECAO 2026-09-28

- Corrigido reconhecimento de marca quando o anúncio começa com ano/data, ex.: 2009/3 TOYOTA HIACE VAN DX.
- Contador dos logotipos passa a usar a marca inferida do próprio anúncio, sem depender de brand_group antigo.
- Páginas Marca e Modelo passam a agrupar usando normalizeModel diretamente, evitando model_group desatualizado.
- Lista de carros da página inicial continua vazia/oculta; os carros são acessados por Marca -> Modelo -> Carros.
- Nenhum anúncio foi apagado do Supabase por esta alteração.
