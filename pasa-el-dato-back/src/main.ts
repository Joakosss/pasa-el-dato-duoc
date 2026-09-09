import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // El front apunta a NEXT_PUBLIC_API_URL=http://...:<API_PORT>/api
  app.setGlobalPrefix('api');
  // Dev con front en otro origen/puerto (y mobile en LAN): CORS abierto.
  app.enableCors();
  const port = Number(process.env.API_PORT ?? process.env.PORT ?? 3001);
  // 0.0.0.0 es clave para que Podman exponga el back a la LAN.
  await app.listen(port, '0.0.0.0');
}
await bootstrap();
