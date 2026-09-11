import { defineConfig } from "prisma/config";

// Definir la configuración de Prisma
export default defineConfig({
  schema: "prisma/schema.prisma", //Archivo que prisma leerá y actualizará
  datasource: {
    url: process.env.DATABASE_URL,
  },
});