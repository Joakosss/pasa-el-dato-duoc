import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { RolUsuarioModule } from './rol-usuario/rol-usuario.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsuarioModule } from './usuario/usuario.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CuentaModule } from './cuenta/cuenta.module.js';
import { SedeModule } from './sede/sede.module.js';
import { EscuelaModule } from './escuela/escuela.module.js';
import { CarreraModule } from './carrera/carrera.module.js';
import { PerfilModule } from './perfil/perfil.module.js';
import { RegionModule } from './region/region.module.js';
import { CiudadModule } from './ciudad/ciudad.module.js';
import { ComunaModule } from './comuna/comuna.module.js';
import { PublicacionModule } from './publicacion/publicacion.module.js';
import { CategoriaModule } from './categoria/categoria.module.js';
import { TipoVentaModule } from './tipo-venta/tipo-venta.module.js';
import { ChatModule } from './chat/chat.module.js';
import { MarcaModule } from './marca/marca.module.js';
import { PublicidadModule } from './publicidad/publicidad.module.js';
import { ReporteUsuarioModule } from './reporte-usuario/reporte-usuario.module.js';

@Module({
  imports: [
    RolUsuarioModule,
    PrismaModule,
    UsuarioModule,
    AuthModule,
    CuentaModule,
    SedeModule,
    EscuelaModule,
    CarreraModule,
    PerfilModule,
    RegionModule,
    CiudadModule,
    ComunaModule,
    PublicacionModule,
    CategoriaModule,
    TipoVentaModule,
    ChatModule,
    MarcaModule,
    PublicidadModule,
    ReporteUsuarioModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
