import { defineConfig } from "prisma/config";

const url = process.env.DATABASE_URL;

// Base de datos de sombra para `prisma migrate dev` y `migrate diff
// --from-migrations` (HU-UBI-01, T-05/T-08): mismo servidor que la BD
// principal, con el nombre de BD y el sufijo `_shadow`.
const urlShadow = url?.replace(/\/([^/]+)$/, "/$1_shadow");

// Definir la configuración de Prisma
export default defineConfig({
  schema: "prisma/schema.prisma", //Archivo que prisma leerá y actualizará
  datasource: {
    url,
    shadowDatabaseUrl: urlShadow,
  },
});
