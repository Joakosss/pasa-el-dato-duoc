import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { ListarComunasQueryDto } from './listar-comunas-query.dto.js';

describe('ListarComunasQueryDto', () => {
  it('convierte un ciudadId numérico recibido por URL', async () => {
    const dto = plainToInstance(ListarComunasQueryDto, { ciudadId: '1' });

    const errores = await validate(dto);

    expect(dto.ciudadId).toBe(1);
    expect(errores).toHaveLength(0);
  });

  it('exige ciudadId: su ausencia produce 400', async () => {
    const dto = plainToInstance(ListarComunasQueryDto, {});

    const errores = await validate(dto);

    expect(errores.map((error) => error.property)).toContain('ciudadId');
  });

  it('rechaza un ciudadId que no sea un entero positivo', async () => {
    const dto = plainToInstance(ListarComunasQueryDto, { ciudadId: 'texto' });

    const errores = await validate(dto);

    expect(errores.map((error) => error.property)).toContain('ciudadId');
  });
});
