import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { ListarCarrerasQueryDto } from './listar-carreras-query.dto.js';

describe('ListarCarrerasQueryDto', () => {
  it('permite omitir escuelaId', async () => {
    const dto = plainToInstance(ListarCarrerasQueryDto, {});

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('convierte un escuelaId numérico recibido por URL', async () => {
    const dto = plainToInstance(ListarCarrerasQueryDto, {
      escuelaId: '2',
    });

    const errores = await validate(dto);

    expect(dto.escuelaId).toBe(2);
    expect(errores).toHaveLength(0);
  });

  it('rechaza un escuelaId que no sea un entero positivo', async () => {
    const dto = plainToInstance(ListarCarrerasQueryDto, {
      escuelaId: 'texto',
    });

    const errores = await validate(dto);

    expect(errores.map((error) => error.property)).toContain('escuelaId');
  });
});
