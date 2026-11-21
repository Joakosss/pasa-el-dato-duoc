import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const ts = require('typescript');

function crearEntorno() {
  const eventos = new EventEmitter();
  const llamadas = [];
  const socket = {
    connected: false,
    on: eventos.on.bind(eventos),
    once: eventos.once.bind(eventos),
    off: eventos.off.bind(eventos),
    connect() {
      this.connected = true;
      eventos.emit('connect');
    },
    disconnect() { this.connected = false; },
    timeout() {
      return {
        emit(evento, payload, callback) {
          llamadas.push({ evento, payload });
          callback(null, { items: [], nextCursor: null });
        },
      };
    },
  };
  const codigo = ts.transpileModule(
    readFileSync(new URL('../src/lib/chat/chat-socket.ts', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  const modulo = { exports: {} };
  let opciones;
  const importar = (nombre) => {
    if (nombre === 'socket.io-client') {
      return { io: (url, configuracion) => { opciones = { url, configuracion }; return socket; } };
    }
    if (nombre === '@/config/env') return { env: { apiUrl: 'http://localhost:3001/api' } };
    throw new Error(`Importación inesperada: ${nombre}`);
  };
  new Function('require', 'module', 'exports', codigo)(importar, modulo, modulo.exports);
  return { cliente: modulo.exports.crearSocketChat('token'), socket, eventos, llamadas, opciones };
}

test('notifica cada conexión y retira el listener al desuscribir', async () => {
  const e = crearEntorno();
  let conexiones = 0;
  const quitar = e.cliente.alConectar(() => { conexiones++; });
  await e.cliente.conectar();
  e.eventos.emit('connect');
  assert.equal(conexiones, 2);
  quitar();
  e.eventos.emit('connect');
  assert.equal(conexiones, 2);
  assert.equal(e.opciones.url, 'http://localhost:3001/chat');
  assert.equal(e.opciones.configuracion.auth.token, 'token');
});

test('notifica desconexiones y elimina el listener al desuscribir', () => {
  const e = crearEntorno();
  let desconexiones = 0;
  const quitar = e.cliente.alDesconectar(() => { desconexiones++; });
  e.eventos.emit('disconnect');
  quitar();
  e.eventos.emit('disconnect');
  assert.equal(desconexiones, 1);
});

test('solicita la unión a la conversación con el límite acordado', async () => {
  const e = crearEntorno();
  await e.cliente.conectar();
  const resultado = await e.cliente.unirseAConversacion('conversacion');
  assert.deepEqual(e.llamadas, [{
    evento: 'chat:join_conversacion',
    payload: { conversacionId: 'conversacion', limit: 20 },
  }]);
  assert.deepEqual(resultado, { items: [], nextCursor: null });
});
