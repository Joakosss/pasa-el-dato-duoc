import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const ts = require('typescript');

function cargar(ruta, dependencias = {}) {
  const codigo = ts.transpileModule(readFileSync(new URL(ruta, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const modulo = { exports: {} };
  const importar = (nombre) => {
    if (!(nombre in dependencias)) throw new Error(`Importación inesperada: ${nombre}`);
    return dependencias[nombre];
  };
  new Function('require', 'module', 'exports', codigo)(importar, modulo, modulo.exports);
  return modulo.exports;
}

const http = cargar('../src/lib/api/http-client.ts');
const { clasificarErrorDetallePublicacion: clasificar } = cargar(
  '../src/lib/api/error-detalle-publicacion.ts',
  { './http-client': http },
);

test('permite reintentar errores de conexión independientemente del mensaje', () => {
  for (const mensaje of ['Sin red', 'Tiempo de espera agotado', 'Otro mensaje']) {
    assert.deepEqual(clasificar(new http.ErrorConexion(mensaje)), { mensaje, reintentable: true });
  }
});

test('distingue errores HTTP temporales de errores no reintentables', () => {
  for (const status of [408, 429, 500, 503]) {
    assert.equal(clasificar(new http.ApiError(status, 'Error')).reintentable, true);
  }
  for (const status of [400, 401, 403, 404]) {
    assert.equal(clasificar(new http.ApiError(status, 'Error')).reintentable, false);
  }
  assert.equal(clasificar(new http.ApiError(404, 'Mensaje variable')).mensaje, 'Esta publicación ya no está disponible.');
});

test('permite reintentar un error inesperado sin mostrar detalles internos', () => {
  assert.deepEqual(clasificar(new Error('detalle privado')), {
    mensaje: 'No pudimos cargar la publicación. Reintenta.',
    reintentable: true,
  });
});
