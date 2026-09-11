import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service.js';

describe('PrismaService', () => {
  let module: TestingModule;
  let service: PrismaService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    await module.init();

    service = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('debe conectarse a PostgreSQL', async () => {
    const resultado = await service.$queryRaw<Array<{ valor: number }>>`
      SELECT 1 AS valor
    `;

    expect(resultado).toEqual([{ valor: 1 }]);
  });
});