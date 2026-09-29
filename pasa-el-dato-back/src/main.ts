import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Convierte el encabezado Cookie en request.cookies.
  app.use(cookieParser());

  //Cuando una ruta recibe un DTO, el ValidationPipe ejecuta las validaciones
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Entrega al controlador los valores normalizados.
    }),
  );
  // El front apunta a NEXT_PUBLIC_API_URL=http://...:<API_PORT>/api
  app.setGlobalPrefix('api');

  const frontendOrigin = process.env.FRONTEND_ORIGIN;

  // Con cookies necesitamos declarar un origen concreto.
  if (!frontendOrigin) {
    throw new Error('Falta la variable de entorno FRONTEND_ORIGIN');
  }

  app.enableCors({
    origin: frontendOrigin,
    // Permite que el navegador incluya cookies en solicitudes al backend.
    credentials: true,
  });

  // Define la información general que muestra Swagger.
  const configuracionSwagger = new DocumentBuilder()
    .setTitle('Pasa el Dato Duoc API')
    .setDescription('API para la aplicación Pasa el Dato')
    .setVersion('1.0.0')
    // Documenta la cookie que exige POST /api/auth/refresh.
    .addCookieAuth('refreshToken', { type: 'apiKey' }, 'refreshToken')
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
