import { EsRunValido } from './run.validator.js';

describe('EsRunValido', () => {
  it('acepta el formato normalizado', () => {
    expect(EsRunValido('12345678-5')).toBe(true);
    expect(EsRunValido('1234567-K')).toBe(true);
  });

  it('rechaza otros formatos', () => {
    expect(EsRunValido('12.345.678-5')).toBe(false);
    expect(EsRunValido('123456785')).toBe(false);
  });

  it('rechaza valores que no son texto', () => {
    expect(EsRunValido(12345678)).toBe(false);
  });

  it('no calcula el dígito verificador', () => {
    // El formato pasa aunque el dígito verificador sea incorrecto.
    expect(EsRunValido('12345678-4')).toBe(true);
  });
});