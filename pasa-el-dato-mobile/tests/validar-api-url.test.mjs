import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const codigo = ts.transpileModule(
  readFileSync(new URL('../src/config/validar-api-url.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;
const modulo = { exports: {} };
new Function('module', 'exports', codigo)(modulo, modulo.exports);
const { validarApiUrl } = modulo.exports;

test('permite HTTP y usa el emulador como respaldo solo en desarrollo', () => {
  assert.equal(validarApiUrl(undefined, true), 'http://10.0.2.2:3001/api');
  assert.equal(validarApiUrl(' http://192.168.1.10:3001/api/ ', true), 'http://192.168.1.10:3001/api');
});

test('requiere HTTPS explícito fuera de desarrollo', () => {
  assert.equal(validarApiUrl('https://example.org/api/', false), 'https://example.org/api');
  for (const valor of [undefined, '', '  ', 'http://example.org/api', 'ftp://example.org/api', 'no es una url']) {
    assert.throws(() => validarApiUrl(valor, false));
  }
});

test('rechaza credenciales, consultas y fragmentos incluso en desarrollo', () => {
  for (const valor of [
    'https://usuario:clave@example.org/api',
    'https://example.org/api?token=secreto',
    'https://example.org/api#fragmento',
  ]) {
    for (const desarrollo of [true, false]) {
      assert.throws(() => validarApiUrl(valor, desarrollo), (error) => {
        assert.ok(!error.message.includes('secreto'));
        assert.ok(!error.message.includes('clave'));
        return true;
      });
    }
  }
});
