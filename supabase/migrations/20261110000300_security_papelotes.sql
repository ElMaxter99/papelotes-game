-- Seguridad específica de Supabase (no se ejecuta en PGlite): RLS deny-all para las tablas del juego.
alter table game_ideas enable row level security;
alter table rounds     enable row level security;
alter table drawings   enable row level security;
alter table votes      enable row level security;
grant all on all tables in schema public to service_role;
grant execute on all functions in schema public to service_role;
