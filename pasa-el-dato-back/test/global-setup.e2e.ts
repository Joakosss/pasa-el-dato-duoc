import { ejecutarSeedDev } from '../src/seed/seed-dev.js';

// Global setup de las pruebas e2e (HU-UBI-01, T-15): garantiza los datos
// dev mínimos (roles, sede Puente Alto, escuela y carrera de prueba) sin
// depender de initdb ni de ejecuciones manuales previas.
export default async function globalSetup(): Promise<void> {
  await ejecutarSeedDev();
}
