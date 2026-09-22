import { Test, TestingModule } from '@nestjs/testing';
import { RolUsuarioService } from './rol-usuario.service.js';

describe('RolUsuarioService', () => {
  let service: RolUsuarioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolUsuarioService],
    }).compile();

    service = module.get<RolUsuarioService>(RolUsuarioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
