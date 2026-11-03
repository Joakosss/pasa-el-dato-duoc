import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { ListarCiudadesQueryDto } from './listar-ciudades-query.dto.js';

describe('ListarCiudadesQueryDto', () => {
  it('convierte un regionId numérico recibido por URL', async () => {
    const dto = plainToInstance(ListarCiudadesQueryDto, { regionId: '13' });

    const errores = await validate(dto);

    expect(dto.regionId).toBe(13);
    expect(errores).toHaveLength(0);
  });

  it('exige regionId: su ausencia produce 400', async () => {
    const dto = plainToInstance(ListarCiudadesQueryDto, {});

    const errores = await validate(dto);

    expect(errores.map((error) => error.property)).toContain('regionId');
  });

  it('rechaza un regionId que no sea un entero positivo', async () => {
    const dto = plainToInstance(ListarCiudadesQueryDto, { regionId: 'texto' });

    const errores = await validate(dto);

    expect(errores.map((error) => error.property)).toContain('regionId');
  });
});
