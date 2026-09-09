-- 02-seed.dev.sql — SEED DEV TEMPORAL (descartable)
-- Para tener algo que mostrar en front/back/mobile sin crear a mano.
-- Para volver a esquema limpio: borrar este archivo + `podman-compose down -v && up`.
-- Corre solo la primera vez (volumen vacío), después de 01-schema.sql.

INSERT INTO users (name, email, avatar_url) VALUES
  ('Demo Duoc', 'demo@duoc.cl', NULL),
  ('Mobile Dev', 'mobile@dev.cl', NULL)
ON CONFLICT (email) DO NOTHING;

-- Inserta 2 datos de ejemplo asociados al usuario demo
WITH demo AS (SELECT id FROM users WHERE email = 'demo@duoc.cl' LIMIT 1)
INSERT INTO datos (title, content, author_id, tags)
SELECT
  'Dato de prueba web',
  'Este dato viene del seed dev. Sirve para verificar que el front lee del back y Postgres.',
  demo.id,
  ARRAY['dev','web']
FROM demo
WHERE NOT EXISTS (SELECT 1 FROM datos WHERE title = 'Dato de prueba web');

WITH demo AS (SELECT id FROM users WHERE email = 'demo@duoc.cl' LIMIT 1)
INSERT INTO datos (title, content, author_id, tags)
SELECT
  'Dato desde mobile',
  'Si tu celular en LAN ve este dato vía http://TU_IP:3001/api, la red Podman está bien.',
  demo.id,
  ARRAY['dev','mobile']
FROM demo
WHERE NOT EXISTS (SELECT 1 FROM datos WHERE title = 'Dato desde mobile');
