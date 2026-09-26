ATUALIZAÇÃO — MODELOS MAIS VISTOS + OPÇÕES POR MODELO

1. index.html agora não mostra os carros do catálogo logo ao abrir.
2. A seção "Modelos mais vistos" aparece no início.
3. Um modelo só entra nessa seção depois que um cliente o pesquisa exatamente ou clica nele.
4. Ao pesquisar um modelo (ex.: Ractis), o cliente é levado para modelos.html e vê TODAS as opções publicadas daquele mesmo modelo.
5. Só depois o cliente escolhe uma unidade e entra em detalhes.html?id=...
6. O contador global usa as funções record_model_view e get_popular_models do Supabase.

SUPABASE:
Execute modelos-mais-vistos.sql uma vez no SQL Editor.
O mesmo SQL também foi acrescentado ao final de supabase-schema.sql.

Se o SQL ainda não tiver sido executado, o site usa temporariamente localStorage para o contador no navegador; para contador global entre clientes, execute o SQL.
