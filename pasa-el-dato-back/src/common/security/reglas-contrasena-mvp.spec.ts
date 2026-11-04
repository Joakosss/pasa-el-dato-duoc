import { describe, expect, it } from 'vitest';
import {
  MAX_CONTRASENA_MVP_LEN,
  MIN_CONTRASENA_MVP_LEN,
  validarContrasenaMvp,
} from './reglas-contrasena-mvp.js';

describe('reglas-contrasena-mvp', () => {
  it('acepta una contraseña válida', () => {
    expect(
      validarContrasenaMvp('a'.repeat(MIN_CONTRASENA_MVP_LEN)),
    ).toEqual({
      ok: true,
    });
  });

  it('rechaza vacía', () => {
    expect(validarContrasenaMvp('')).toEqual({
      ok: false,
      codigo: 'VACIA',
    });
  });

  it('rechaza si tiene espacios al inicio o al final', () => {
    expect(validarContrasenaMvp(' clave')).toEqual({
      ok: false,
      codigo: 'TRIM',
    });
    expect(validarContrasenaMvp('clave ')).toEqual({
      ok: false,
      codigo: 'TRIM',
    });
  });

  it('rechaza si es menor al mínimo', () => {
    expect(
      validarContrasenaMvp('a'.repeat(MIN_CONTRASENA_MVP_LEN - 1)),
    ).toEqual({
      ok: false,
      codigo: 'MIN_LEN',
    });
  });

  it('rechaza si excede el máximo', () => {
    expect(
      validarContrasenaMvp('a'.repeat(MAX_CONTRASENA_MVP_LEN + 1)),
    ).toEqual({
      ok: false,
      codigo: 'MAX_LEN',
    });
  });
});
