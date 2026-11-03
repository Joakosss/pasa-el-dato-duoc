import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { ListarComunasQueryDto } from './listar-comunas-query.dto.js';

describe('ListarComunasQueryDto', () => {
  it('convierte un regionId numérico recibido por URL', async () => {
    const dto = plainToInstance(ListarComunasQueryDto, { regionId: '13' });

    const errores = await validate(dto);

    expect(dto.regionId).toBe(13);
    expect(errores).toHaveLength(0);
  });

  it('convierte un ciudadId numérico recibido por URL', async () => {
    const dto = plainToInstance(ListarComunasQueryDto, { ciudadId: '1' });

    const errores = await validate(dto);

    expect(dto.ciudadId).toBe(1);
    expect(errores).toHaveLength(0);
  });

  it('acepta ambos parámetros: la exclusividad la resuelve el servicio', async () => {
    const dto = plainToInstance(ListarComunasQueryDto, {
      regionId: '13',
      ciudadId: '1',
    });

    const errores = await validate(dto);

    expect(dto.regionId).toBe(13);
    expect(dto.ciudadId).toBe(1);
    expect(errores).toHaveLength(0);
  });

  it('acepta parámetros vacíos: la exclusividad la resuelve el servicio', async () => {
    const dto = plainToInstance(ListarComunasQueryDto, {});

    const errores = await validate(dto);

    expect(errores).toHaveLength(0);
  });

  it('rechaza un regionId que no sea un entero positivo', async () => {
    const dto = plainToInstance(ListarComunasQueryDto, { regionId: 'texto' });

    const errores = await validate(dto);

    expect(errores.map((error) => error.property)).toContain('regionId');
  });

  it('rechaza un ciudadId que no sea un entero positivo', async () => {
    const dto = plainToInstance(ListarComunasQueryDto, { ciudadId: 'texto' });

    const errores = await validate(dto);

    expect(errores.map((error) => error.property)).toContain('ciudadId');
  });
});
