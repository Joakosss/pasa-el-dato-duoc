import assert from 'node:assert/strict';
import test from 'node:test';
import { agregarMensajeSinDuplicados } from '../src/lib/chat/combinar-mensajes.ts';

test('combina mensajes anteriores y nuevos en orden cronológico', () => {
  const mensajes = [
    { id: '2', enviadoEn: '2026-01-02T00:00:00Z' },
    { id: '1', enviadoEn: '2026-01-01T00:00:00Z' },
    { id: '3', enviadoEn: '2026-01-03T00:00:00Z' },
  ].reduce(agregarMensajeSinDuplicados, []);
  assert.deepEqual(mensajes.map((mensaje) => mensaje.id), ['1', '2', '3']);
});

test('ignora duplicados y no modifica el arreglo original', () => {
  const original = [{ id: '1', enviadoEn: '2026-01-01T00:00:00Z' }];
  assert.equal(agregarMensajeSinDuplicados(original, original[0]), original);
  const resultado = agregarMensajeSinDuplicados(original, { id: '2', enviadoEn: '2026-01-02T00:00:00Z' });
  assert.equal(original.length, 1);
  assert.equal(resultado.length, 2);
});
