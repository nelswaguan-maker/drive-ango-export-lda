ATUALIZAÇÃO — NAVEGAÇÃO POR MARCAS

- A área "Navegar Por Marca De Carro" agora tem um catálogo fixo de 24 marcas.
- Todos os cartões/logotipos são clicáveis.
- Clique no logotipo -> marca.html?brand=... -> lista de modelos daquela marca.
- Os modelos são agrupados por marca + nome do modelo e organizados por letra.
- Clique no modelo -> modelos.html?brand=...&model=... -> todos os carros daquele modelo.
- A mesma identificação de marca é usada nos filtros.
- Aliases tratados: Mercedes-Benz/Mercedes, Citroen/Citroën, VW/Volkswagen e Landrover/Land Rover.
- Marcas do catálogo sem carros publicados continuam visíveis e clicáveis.

Marcas incluídas:
Toyota, Honda, Nissan, Mazda, Suzuki, Mitsubishi, Daihatsu, Subaru, Hino,
Volkswagen, BMW, Isuzu, Lexus, Mercedes, Audi, Volvo, Land Rover, Ford,
Peugeot, Jeep, Citroën, Jaguar, Hyundai e Kia.


CORREÇÃO FINAL — 2026-09-27
- A marca de cada anúncio é resolvida de forma consistente antes do agrupamento.
- Se o campo marca estiver vazio/incorreto, mas o nome do modelo começar explicitamente por uma marca (ex.: "TOYOTA HIACE..."), o anúncio é colocado na marca correspondente.
- A página da marca usa os carros publicados do catálogo e não mistura modelos de outras marcas.
- Se a consulta online retornar vazia enquanto existir catálogo publicado em cache, a navegação não fica artificialmente vazia.
- A página do modelo usa a mesma resolução de marca.


CORREÇÃO — 2026-09-27 (fluxo final)
- A página inicial não renderiza mais a grelha "Carros disponíveis" com anúncios individuais.
- Os anúncios continuam no catálogo/Supabase e são acessados por Marca → Modelo → carros do modelo.
- A contagem de cada marca usa a mesma resolução de marca usada no agrupamento, inclusive quando o modelo começa por "TOYOTA", "HONDA", etc.
- A página de marca também resolve a marca a partir do nome do modelo antes de agrupar.
- Exemplo: TOYOTA HIACE VAN DX, TOYOTA HIACE VAN SUPER GL e Toyota hiace van DX ficam todos em Toyota → Hiace Van.
