import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  //Cuando una ruta recibe un DTO, el ValidationPipe ejecuta las validaciones
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Entrega al controlador los valores normalizados.
    }),
  );
  // El front apunta a NEXT_PUBLIC_API_URL=http://...:<API_PORT>/api
  app.setGlobalPrefix('api');
  // Dev con front en otro origen/puerto (y mobile en LAN): CORS abierto.
  app.enableCors();

  // Define la información general que muestra Swagger.
  const configuracionSwagger = new DocumentBuilder()
    .setTitle('Pasa el Dato Duoc API')
    .setDescription('API para la aplicación Pasa el Dato')
    .setVersion('1.0.0')
    .build();

  const documentoSwagger = () =>
    SwaggerModule.createDocument(app, configuracionSwagger);

  // Publica la interfaz y genera el documento cuando Swagger lo necesita.
  SwaggerModule.setup('docs', app, documentoSwagger);

  const port = Number(process.env.API_PORT ?? process.env.PORT ?? 3001);
  // 0.0.0.0 es clave para que Podman exponga el back a la LAN.
  await app.listen(port, '0.0.0.0');
}
await bootstrap();
