import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class MobilePublicidadService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(idCuenta: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_cuenta: idCuenta },
      select: { fk_sede: true, fk_carrera: true },
    });
    if (!usuario) {
      throw new ForbiddenException('La cuenta no está asociada a un usuario con sede');
    }

    const ahora = new Date();
    const banners = await this.prisma.bannerPublicidad.findMany({
      where: {
        eliminado: false,
        estado: 'APROBADO',
        fechaInicio: { lte: ahora },
        fechaFin: { gte: ahora },
        sedes: { some: { fk_sede: usuario.fk_sede } },
      },
      orderBy: [{ fechaCreacion: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        imagen: true,
        mensaje: true,
        marca: { select: { nombre: true } },
        carrerasMobile: { where: { carreraId: usuario.fk_carrera }, select: { carreraId: true } },
      },
    });

    const items = banners.map((banner) => ({
      id: banner.id,
      imagenUrl: banner.imagen,
      mensaje: banner.mensaje,
      marcaNombre: banner.marca.nombre,
      demostracion: false,
      afin: banner.carrerasMobile.length > 0,
    }));

    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.MOBILE_PUBLICIDAD_DEMO === 'true'
    ) {
      const ejemplos = await this.prisma.publicidadDemoMobile.findMany({
        where: { activa: true },
        orderBy: { id: 'asc' },
        select: {
          id: true,
          empresa: true,
          mensaje: true,
          imagen: true,
          carreras: { where: { carreraId: usuario.fk_carrera }, select: { carreraId: true } },
        },
      });
      items.push(...ejemplos.map((ejemplo) => ({
        id: `demo-${ejemplo.id}`,
        imagenUrl: `data:image/png;base64,${Buffer.from(ejemplo.imagen).toString('base64')}`,
        mensaje: ejemplo.mensaje,
        marcaNombre: ejemplo.empresa,
        demostracion: true,
        afin: ejemplo.carreras.length > 0,
      })));
    }

    return items.sort((a, b) => Number(b.afin) - Number(a.afin));
  }
}
