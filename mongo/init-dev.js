// init-dev.js — SEED DEV TEMPORAL para Mongo (descartable)
// Se ejecuta solo la primera vez (volumen vacío).
// Para esquema limpio: borrar este archivo + `podman-compose down -v && up`.
// Mongo guarda lo flexible: eventos/logs, no la fuente de verdad (esa es Postgres).

db = db.getSiblingDB('pasaeldato');

db.createCollection('dato_events');

db.dato_events.insertMany([
  {
    datoTitle: 'Dato de prueba web',
    action: 'viewed',
    from: 'web-dev',
    at: new Date(),
  },
  {
    datoTitle: 'Dato desde mobile',
    action: 'viewed',
    from: 'mobile-dev',
    at: new Date(),
  },
]);
