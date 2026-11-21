import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const { createStore } = require('zustand/vanilla');

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function diferida() {
  let resolver;
  let rechazar;
  const promesa = new Promise((resolve, reject) => {
    resolver = resolve;
    rechazar = reject;
  });
  return { promesa, resolver, rechazar };
}

function entorno(api) {
  const cuenta = { idCuenta: 'cuenta-1' };
  const sesion = createStore(() => ({ sesion: cuenta }));
  const codigo = ts.transpileModule(
    readFileSync(new URL('../src/stores/favoritos-store.ts', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  const modulo = { exports: {} };
  const dependencias = {
    zustand: require('zustand'),
    '@/lib/api/favoritos': api,
    '@/lib/api/http-client': { ApiError },
    '@/stores/sesion-store': { useSesionStore: sesion },
  };
  const importar = (nombre) => {
    if (!(nombre in dependencias)) throw new Error(`Importación inesperada: ${nombre}`);
    return dependencias[nombre];
  };
  new Function('require', 'module', 'exports', codigo)(importar, modulo, modulo.exports);
  return { store: modulo.exports.useFavoritosStore, sesion, cuenta };
}

test('comparte consultas y propaga marcar y quitar a todos los observadores', async () => {
  const carga = diferida();
  let consultas = 0;
  let marcas = 0;
  let quitas = 0;
  const e = entorno({
    obtenerEstadoFavorito: () => { consultas++; return carga.promesa; },
    marcarFavorito: async () => { marcas++; return { esFavorito: true }; },
    quitarFavorito: async () => { quitas++; },
  });
  const observados = [];
  e.store.subscribe((estado) => observados.push(estado.entradas.producto?.esFavorito));
  const primera = e.store.getState().cargar('producto', 'token', e.cuenta);
  await e.store.getState().cargar('producto', 'token', e.cuenta);
  assert.equal(consultas, 1);
  carga.resolver({ esFavorito: false });
  await primera;
  await e.store.getState().alternar('producto', 'token', e.cuenta);
  assert.equal(e.store.getState().entradas.producto.esFavorito, true);
  await e.store.getState().alternar('producto', 'token', e.cuenta);
  assert.equal(e.store.getState().entradas.producto.esFavorito, false);
  assert.deepEqual(observados, [null, false, false, true, true, false]);
  assert.equal(marcas, 1);
  assert.equal(quitas, 1);
});

test('mantiene el estado desconocido ante fallo y permite reintentar sin modificar favoritos', async () => {
  const respuesta = diferida();
  let consultas = 0;
  let modificaciones = 0;
  const e = entorno({
    obtenerEstadoFavorito: () => {
      consultas++;
      return consultas === 1 ? Promise.reject(new Error('sin conexión')) : respuesta.promesa;
    },
    marcarFavorito: async () => { modificaciones++; return { esFavorito: true }; },
    quitarFavorito: async () => { modificaciones++; },
  });

  await e.store.getState().cargar('producto', 'token', e.cuenta);
  assert.equal(e.store.getState().entradas.producto.esFavorito, null);
  assert.equal(e.store.getState().entradas.producto.errorCarga, true);
  await e.store.getState().alternar('producto', 'token', e.cuenta);
  assert.equal(modificaciones, 0);

  const primera = e.store.getState().cargar('producto', 'token', e.cuenta);
  await e.store.getState().cargar('producto', 'token', e.cuenta);
  assert.equal(consultas, 2);
  assert.equal(e.store.getState().entradas.producto.cargando, true);
  respuesta.resolver({ esFavorito: true });
  await primera;
  assert.equal(e.store.getState().entradas.producto.esFavorito, true);
  assert.equal(e.store.getState().entradas.producto.errorCarga, false);
  assert.equal(modificaciones, 0);
});

test('impide operaciones simultáneas para la misma publicación', async () => {
  const cambio = diferida();
  let marcas = 0;
  const e = entorno({
    obtenerEstadoFavorito: async () => ({ esFavorito: false }),
    marcarFavorito: () => { marcas++; return cambio.promesa; },
    quitarFavorito: async () => {},
  });
  await e.store.getState().cargar('producto', 'token', e.cuenta);
  const primero = e.store.getState().alternar('producto', 'token', e.cuenta);
  await e.store.getState().alternar('producto', 'token', e.cuenta);
  assert.equal(marcas, 1);
  assert.equal(e.store.getState().entradas.producto.actualizando, true);
  cambio.resolver({ esFavorito: true });
  await primero;
  assert.equal(e.store.getState().entradas.producto.esFavorito, true);
});

test('conserva el estado anterior ante un rechazo confirmado', async () => {
  const e = entorno({
    obtenerEstadoFavorito: async () => ({ esFavorito: true }),
    marcarFavorito: async () => ({ esFavorito: true }),
    quitarFavorito: async () => { throw new ApiError(403, 'prohibido'); },
  });
  await e.store.getState().cargar('producto', 'token', e.cuenta);
  await assert.rejects(e.store.getState().alternar('producto', 'token', e.cuenta), /prohibido/);
  assert.equal(e.store.getState().entradas.producto.esFavorito, true);
  assert.equal(e.store.getState().entradas.producto.actualizando, false);
});

test('reconsulta el estado tras una respuesta de modificación perdida', async () => {
  let estadoServidor = true;
  let quitas = 0;
  const e = entorno({
    obtenerEstadoFavorito: async () => ({ esFavorito: estadoServidor }),
    marcarFavorito: async () => ({ esFavorito: true }),
    quitarFavorito: async () => {
      quitas++;
      estadoServidor = false;
      throw new Error('sin conexión');
    },
  });
  await e.store.getState().cargar('producto', 'token', e.cuenta);
  await assert.rejects(e.store.getState().alternar('producto', 'token', e.cuenta), /sin conexión/);
  assert.equal(e.store.getState().entradas.producto.esFavorito, null);
  assert.equal(e.store.getState().entradas.producto.errorCarga, true);
  await e.store.getState().alternar('producto', 'token', e.cuenta);
  assert.equal(quitas, 1);
  await e.store.getState().cargar('producto', 'token', e.cuenta);
  assert.equal(e.store.getState().entradas.producto.esFavorito, false);
  assert.equal(quitas, 1);
});

test('descarta respuestas tardías al cambiar de cuenta', async () => {
  const carga = diferida();
  const e = entorno({
    obtenerEstadoFavorito: () => carga.promesa,
    marcarFavorito: async () => ({ esFavorito: true }),
    quitarFavorito: async () => {},
  });
  const pendiente = e.store.getState().cargar('producto', 'token', e.cuenta);
  e.sesion.setState({ sesion: { idCuenta: 'cuenta-2' } });
  carga.resolver({ esFavorito: true });
  await pendiente;
  assert.deepEqual(e.store.getState().entradas, {});
});

test('descarta una modificación tardía después de cambiar de cuenta', async () => {
  const cambio = diferida();
  const e = entorno({
    obtenerEstadoFavorito: async () => ({ esFavorito: false }),
    marcarFavorito: () => cambio.promesa,
    quitarFavorito: async () => {},
  });
  await e.store.getState().cargar('producto', 'token', e.cuenta);
  const pendiente = e.store.getState().alternar('producto', 'token', e.cuenta);
  const nuevaCuenta = { idCuenta: 'cuenta-2' };
  e.sesion.setState({ sesion: nuevaCuenta });
  await e.store.getState().cargar('producto', 'otro-token', nuevaCuenta);
  cambio.resolver({ esFavorito: true });
  await pendiente;
  assert.equal(e.store.getState().entradas.producto.esFavorito, false);
});
