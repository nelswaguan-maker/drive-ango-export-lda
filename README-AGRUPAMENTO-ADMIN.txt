AGRUPAMENTO MARCA -> MODELO

1. Execute uma vez o arquivo atualizacao-agrupamento-modelos.sql no Supabase.
2. Entre no painel Administração como Proprietário Principal.
3. Na seção "Agrupamento de marcas e modelos", clique "Agrupar agora".
4. O sistema lê os carros publicados e grava:
   - brand_group = marca reconhecida
   - model_group = família do modelo reconhecida

Exemplos:
2009/3 TOYOTA HIACE VAN DX -> Toyota / Hiace Van
TOYOTA HIACE VAN SUPER GL -> Toyota / Hiace Van
Toyota Dyna 1.5t -> Toyota / Dyna

O nome original (brand/model) do anúncio não é apagado.
