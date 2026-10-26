import { ejecutarSeedDev } from './seed-dev.js';

// Punto de entrada de `pnpm db:seed:dev`.
await ejecutarSeedDev();

console.log(
  'Seed dev aplicado: roles, sede Puente Alto, escuela, carrera de prueba, estados de publicación y tipos de venta.',
);
