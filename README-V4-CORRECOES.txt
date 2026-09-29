DRIVE ANGO — V4 / CORREÇÕES DE ADMINISTRAÇÃO

1. A lista oficial de Proprietários Principais é:
   - nelswaguan@gmail.com
   - editojosejoaquim812@gmail.com
   - jojomilagre@gmail.com

2. O SQL principal é: supabase-schema.sql
   Execute esse ficheiro inteiro no Supabase SQL Editor.

3. Convites novos duram 24 horas.

4. Os ficheiros corrigir-admin.sql, supabase-security-hardening.sql,
   tornar-editojosejoaquim-co-proprietario.sql,
   tornar-jojomilagre-co-proprietario.sql e
   atualizacao-fotos-20-recorte-convites-24h.sql foram marcados como
   consolidados para não voltarem a sobrescrever a regra dos 3 proprietários.

5. drive-cars-realtime.sql continua sendo um complemento e usa a mesma
   função public.is_owner_email().

6. Depois de executar o SQL, faça logout/login das 3 contas para renovar
   a sessão e testar o painel.
