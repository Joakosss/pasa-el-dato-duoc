import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { ListarSedesQueryDto } from './listar-sedes-query.dto.js';

describe('ListarSedesQueryDto', () => {
  it('permite omitir todos los parámetros', async () => {
    const dto = plainToInstance(ListarSedesQueryDto, {});

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.comunaId).toBeUndefined();
    expect(dto.soloDisponibles).toBeUndefined();
  });

  it('convierte un comunaId numérico recibido por URL', async () => {
    const dto = plainToInstance(ListarSedesQueryDto, { comunaId: '3' });

    const errores = await validate(dto);

    expect(dto.comunaId).toBe(3);
    expect(errores).toHaveLength(0);
  });

  it('rechaza un comunaId que no sea un entero positivo', async () => {
    const dto = plainToInstance(ListarSedesQueryDto, { comunaId: 'texto' });

    const errores = await validate(dto);

    expect(errores.map((error) => error.property)).toContain('comunaId');
  });

  it('interpreta soloDisponibles=true como true', async () => {
    const dto = plainToInstance(ListarSedesQueryDto, {
      soloDisponibles: 'true',
    });

    const errores = await validate(dto);

    expect(dto.soloDisponibles).toBe(true);
    expect(errores).toHaveLength(0);
  });

  it('interpreta cualquier valor distinto de true como false', async () => {
    const dto = plainToInstance(ListarSedesQueryDto, {
      soloDisponibles: 'cualquiera',
    });

    const errores = await validate(dto);

    expect(dto.soloDisponibles).toBe(false);
    expect(errores).toHaveLength(0);
  });
});
