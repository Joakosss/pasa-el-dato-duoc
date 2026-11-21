import assert from 'node:assert/strict';
import test from 'node:test';
import { recuperarMensajesReconexión } from '../src/lib/chat/sincronizar-reconexion.ts';

const mensaje = (id) => ({ id });
const pagina = (ids, nextCursor) => ({ items: ids.map(mensaje), nextCursor });

test('recupera páginas hasta encontrar la referencia exacta', async () => {
  const consultas = [];
  const resultado = await recuperarMensajesReconexión(
    pagina(['nuevo-2', 'nuevo-1'], 'cursor-1'),
    'referencia',
    async (cursor) => {
      consultas.push(cursor);
      return cursor === 'cursor-1'
        ? pagina(['otro-conocido', 'intermedio'], 'cursor-2')
        : pagina(['referencia', 'anterior'], 'cursor-3');
    },
    () => true,
  );
  assert.equal(resultado.completa, true);
  assert.deepEqual(consultas, ['cursor-1', 'cursor-2']);
  assert.deepEqual(resultado.mensajes.map((item) => item.id), [
    'nuevo-2', 'nuevo-1', 'otro-conocido', 'intermedio', 'referencia', 'anterior',
  ]);
});

test('conserva resultados parciales y cursor si falla la red', async () => {
  const resultado = await recuperarMensajesReconexión(
    pagina(['nuevo'], 'cursor'),
    'referencia',
    async () => { throw new Error('sin conexión'); },
    () => true,
  );
  assert.equal(resultado.completa, false);
  assert.equal(resultado.siguienteCursor, 'cursor');
  assert.deepEqual(resultado.mensajes.map((item) => item.id), ['nuevo']);
});

test('detiene cursores repetidos y no informa sincronización completa', async () => {
  let llamadas = 0;
  const resultado = await recuperarMensajesReconexión(
    pagina(['nuevo'], 'cursor'),
    'referencia',
    async () => { llamadas++; return pagina([], 'cursor'); },
    () => true,
  );
  assert.equal(resultado.completa, false);
  assert.equal(llamadas, 1);
});

test('respeta el límite de páginas y descarta respuestas tras cancelar', async () => {
  let llamadas = 0;
  const limitada = await recuperarMensajesReconexión(
    pagina(['nuevo'], 'cursor'),
    'referencia',
    async () => { llamadas++; return pagina(['intermedio'], 'otro'); },
    () => true,
    1,
  );
  assert.equal(limitada.completa, false);
  assert.equal(llamadas, 1);

  let vigente = true;
  const cancelada = await recuperarMensajesReconexión(
    pagina(['nuevo'], 'cursor'),
    'referencia',
    async () => { vigente = false; return pagina(['referencia'], null); },
    () => vigente,
  );
  assert.equal(cancelada.completa, false);
  assert.deepEqual(cancelada.mensajes.map((item) => item.id), ['nuevo']);
});

test('continúa desde el cursor pendiente después de alcanzar el límite', async () => {
  const consultas = [];
  const obtenerPagina = async (cursor) => {
    consultas.push(cursor);
    return cursor === 'primero'
      ? pagina(['intermedio'], 'segundo')
      : pagina(['referencia'], 'tercero');
  };
  const primero = await recuperarMensajesReconexión(
    pagina(['nuevo'], 'primero'), 'referencia', obtenerPagina, () => true, 1,
  );
  assert.equal(primero.completa, false);
  assert.equal(primero.siguienteCursor, 'segundo');
  const segundo = await recuperarMensajesReconexión(
    pagina([], primero.siguienteCursor), 'referencia', obtenerPagina, () => true, 1,
  );
  assert.equal(segundo.completa, true);
  assert.deepEqual(consultas, ['primero', 'segundo']);
  assert.deepEqual(segundo.mensajes.map((item) => item.id), ['referencia']);
});

test('considera completa la recuperación al alcanzar el final', async () => {
  const resultado = await recuperarMensajesReconexión(
    pagina(['nuevo'], 'cursor'),
    'referencia',
    async () => pagina(['antiguo'], null),
    () => true,
  );
  assert.equal(resultado.completa, true);
});
