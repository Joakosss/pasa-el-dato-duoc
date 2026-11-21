import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularLectura } from '../src/lib/chat/calcular-lectura.ts';

const recibido = (id, leido = false) => ({ id, emisorCuentaId: 'otro', leido });
const propio = (id) => ({ id, emisorCuentaId: 'yo', leido: true });
const pagina = (items, nextCursor = null) => ({ items, nextCursor });

test('recupera hasta encontrar el límite leído y selecciona el último recibido', async () => {
  const cursores = [];
  const resultado = await calcularLectura('yo', async (cursor) => {
    cursores.push(cursor);
    return cursor === undefined
      ? pagina([propio('05'), recibido('04'), recibido('03')], '03')
      : pagina([recibido('02', true), recibido('01', true)]);
  }, () => true);
  assert.equal(resultado.mensajeId, '04');
  assert.equal(resultado.mensajes.length, 5);
  assert.deepEqual(cursores, [undefined, '03']);
});

test('acepta el final del historial sin mensajes leídos', async () => {
  const resultado = await calcularLectura('yo', async () => pagina([recibido('02'), propio('01')]), () => true);
  assert.equal(resultado.mensajeId, '02');
});

test('no selecciona mensajes propios', async () => {
  const resultado = await calcularLectura('yo', async () => pagina([propio('01')]), () => true);
  assert.equal(resultado.mensajeId, null);
});

test('no solicita confirmación cuando los mensajes recibidos ya están leídos', async () => {
  const resultado = await calcularLectura('yo', async () => pagina([recibido('02', true), propio('01')]), () => true);
  assert.equal(resultado.completa, true);
  assert.equal(resultado.mensajeId, null);
});

test('no confirma cuando falla una página', async () => {
  const resultado = await calcularLectura('yo', async (cursor) => {
    if (cursor) throw new Error('sin conexión');
    return pagina([recibido('02')], '02');
  }, () => true);
  assert.equal(resultado, null);
});

test('no confirma datos sin indicador de lectura', async () => {
  const resultado = await calcularLectura('yo', async () => pagina([{ id: '01', emisorCuentaId: 'otro' }]), () => true);
  assert.equal(resultado, null);
});

test('detiene cursores repetidos y respeta el límite de páginas', async () => {
  assert.equal(await calcularLectura('yo', async () => pagina([recibido('02')], '02'), () => true), null);
  const limitado = await calcularLectura('yo', async () => pagina([recibido('02')], '01'), () => true, 1);
  assert.equal(limitado.completa, false);
  assert.equal(limitado.continuacion.cursor, '01');
});

test('continúa desde el cursor anterior hasta encontrar el límite leído', async () => {
  const consultas = [];
  const obtener = async (cursor) => {
    consultas.push(cursor);
    return cursor === undefined
      ? pagina([recibido('03')], '03')
      : pagina([recibido('02', true)], '02');
  };
  const primero = await calcularLectura('yo', obtener, () => true, 1);
  assert.equal(primero.completa, false);
  const segundo = await calcularLectura('yo', obtener, () => true, 1, primero.continuacion);
  assert.equal(segundo.completa, true);
  assert.equal(segundo.mensajeId, '03');
  assert.deepEqual(segundo.mensajes.map((mensaje) => mensaje.id), ['03', '02']);
  assert.deepEqual(consultas, [undefined, '03']);
});

test('detecta un ciclo de cursores entre bloques', async () => {
  const obtener = async (cursor) => pagina([recibido('02')], cursor ? '02' : '01');
  const primero = await calcularLectura('yo', obtener, () => true, 1);
  const segundo = await calcularLectura('yo', obtener, () => true, 1, primero.continuacion);
  assert.equal(segundo.completa, false);
  assert.equal(await calcularLectura('yo', obtener, () => true, 1, segundo.continuacion), null);
});

test('descarta la respuesta después de perder el foco o cambiar de sesión', async () => {
  let activo = true;
  const resultado = await calcularLectura('yo', async () => {
    activo = false;
    return pagina([recibido('01')]);
  }, () => activo);
  assert.equal(resultado, null);
});
