import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service.js';

describe('Persistencia de RefreshToken', () => {
  let modulo: TestingModule;
  let prisma: PrismaService;

  // Datos exclusivos de esta prueba.
  const correoPrueba = 'refresh-token.prueba@duocuc.cl';
  const tokenHashPrueba = 'hash-refresh-token-prueba';

  async function limpiarDatosPrueba(): Promise<void> {
    // Elimina un token que pudiera quedar de una ejecución interrumpida.
    await prisma.refreshToken.deleteMany({
      where: { tokenHash: tokenHashPrueba },
    });

    // Al eliminar CUENTA, PostgreSQL también elimina sus refresh tokens.
    await prisma.cuenta.deleteMany({
      where: { correo: correoPrueba },
    });
  }

  beforeAll(async () => {
    modulo = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    await modulo.init();

    prisma = modulo.get(PrismaService);
  });

  beforeEach(async () => {
    await limpiarDatosPrueba();
  });

  afterEach(async () => {
    await limpiarDatosPrueba();
  });

  afterAll(async () => {
    await modulo.close();
  });

  it('crea, consulta y revoca un refresh token', async () => {
    // CUENTA puede existir sin USUARIO, por lo que basta para esta prueba.
    const cuenta = await prisma.cuenta.create({
      data: {
        correo: correoPrueba,
        claveHash: 'hash-de-prueba',
        telefono: '12345678',
      },
    });

    const fechaExpiracion = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    );

    // Guarda solamente el hash asociado con la cuenta.
    const tokenCreado = await prisma.refreshToken.create({
      data: {
        tokenHash: tokenHashPrueba,
        fechaExpiracion,
        cuenta: {
          connect: { id_cuenta: cuenta.id_cuenta },
        },
      },
    });

    expect(tokenCreado.fechaRevocacion).toBeNull();

    // tokenHash es UNIQUE, por eso se puede usar con findUnique.
    const tokenEncontrado = await prisma.refreshToken.findUnique({
      where: { tokenHash: tokenHashPrueba },
    });

    expect(tokenEncontrado?.fk_cuenta).toBe(cuenta.id_cuenta);

    // Revocar no elimina la fila: registra cuándo dejó de ser válida.
    const fechaRevocacion = new Date();

    const tokenRevocado = await prisma.refreshToken.update({
      where: { id: tokenCreado.id },
      data: { fechaRevocacion },
    });

    expect(tokenRevocado.fechaRevocacion).toEqual(fechaRevocacion);
  });
});