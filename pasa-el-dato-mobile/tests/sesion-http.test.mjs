import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
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
const { ApiError, ErrorConexion, HttpClient } = http;
const { crearCoordinadorSesion, ErrorRenovacionIncierta } = cargar('../src/lib/api/coordinador-sesion.ts', {
  './http-client': http,
});

function diferida() {
  let resolver;
  let rechazar;
  const promesa = new Promise((resolve, reject) => {
    resolver = resolve;
    rechazar = reject;
  });
  return { promesa, resolver, rechazar };
}

function entorno() {
  let estado = { identidad: {}, tokens: { accessToken: 'acceso-a', refreshToken: 'refresh-a' } };
  const renovacion = diferida();
  const iniciada = diferida();
  let marcador = null;
  let llamadas = 0;
  let cierres = 0;
  const descartados = [];
  const coordinador = crearCoordinadorSesion({
    obtener: () => estado,
    renovar: () => { llamadas += 1; iniciada.resolver(); return renovacion.promesa; },
    guardar: async (tokens) => { estado = { ...estado, tokens }; },
    leerMarcador: async () => marcador,
    guardarMarcador: async (token) => { marcador = token; },
    borrarMarcador: async () => { marcador = null; },
    cerrar: () => { cierres += 1; estado = null; },
    descartar: async (tokens) => { descartados.push(tokens); },
  });
  return {
    coordinador, renovacion, iniciada, descartados,
    obtener: () => estado,
    cambiar: (nuevo) => { estado = nuevo; },
    llamadas: () => llamadas,
    cierres: () => cierres,
    marcador: () => marcador,
  };
}

test('comparte la renovación concurrente y reconoce el token anterior', async () => {
  const e = entorno();
  const primero = e.coordinador.renovarAcceso('acceso-a');
  const segundo = e.coordinador.renovarAcceso('acceso-a');
  await e.iniciada.promesa;
  assert.equal(e.llamadas(), 1);
  e.renovacion.resolver({ accessToken: 'acceso-b', refreshToken: 'refresh-b' });
  assert.deepEqual(await Promise.all([primero, segundo]), ['acceso-b', 'acceso-b']);
  assert.equal(e.coordinador.validarAcceso('acceso-a'), 'acceso-b');
  assert.equal(e.marcador(), null);
});

test('solicitudes concurrentes esperan la persistencia y reciben su error', async () => {
  const identidad = {};
  let estado = { identidad, tokens: { accessToken: 'a', refreshToken: 'ra' } };
  const escritura = diferida();
  const escribiendo = diferida();
  let marcador = null;
  const coordinador = crearCoordinadorSesion({
    obtener: () => estado,
    renovar: async () => ({ accessToken: 'b', refreshToken: 'rb' }),
    guardar: async (tokens) => {
      estado = { identidad, tokens };
      escribiendo.resolver();
      await escritura.promesa;
    },
    cerrar: () => {},
    descartar: async () => {},
    leerMarcador: async () => marcador,
    guardarMarcador: async (token) => { marcador = token; },
    borrarMarcador: async () => { marcador = null; },
  });
  const primera = coordinador.renovarAcceso('a');
  const errorPrimera = assert.rejects(primera, ErrorRenovacionIncierta);
  await escribiendo.promesa;
  const segunda = coordinador.renovarAcceso('a');
  const errorSegunda = assert.rejects(segunda, ErrorRenovacionIncierta);
  escritura.rechazar(new Error('fallo de almacenamiento'));
  await Promise.all([errorPrimera, errorSegunda]);
  await assert.rejects(coordinador.renovarAcceso('a'), ErrorRenovacionIncierta);
  assert.equal(marcador, 'ra');
});

test('descarta la renovación tardía al cambiar de cuenta', async () => {
  const e = entorno();
  const pendiente = e.coordinador.renovarAcceso('acceso-a');
  await e.iniciada.promesa;
  const otra = { identidad: {}, tokens: { accessToken: 'otra-cuenta', refreshToken: 'otro-refresh' } };
  e.cambiar(otra);
  e.renovacion.resolver({ accessToken: 'acceso-b', refreshToken: 'refresh-b' });
  await assert.rejects(pendiente, ErrorConexion);
  assert.equal(e.obtener(), otra);
  assert.deepEqual(e.descartados, [{ accessToken: 'acceso-b', refreshToken: 'refresh-b' }]);
  assert.throws(() => e.coordinador.validarAcceso('acceso-a'), ErrorConexion);
});

test('descarta la renovación si se cerró sesión', async () => {
  const e = entorno();
  const pendiente = e.coordinador.renovarAcceso('acceso-a');
  await e.iniciada.promesa;
  e.cambiar(null);
  e.renovacion.resolver({ accessToken: 'acceso-b', refreshToken: 'refresh-b' });
  await assert.rejects(pendiente, ErrorConexion);
  assert.equal(e.obtener(), null);
  assert.equal(e.descartados.length, 1);
});

test('no reutiliza un refresh cuya rotación quedó incierta', async () => {
  const e = entorno();
  const pendiente = e.coordinador.renovarAcceso('acceso-a');
  await e.iniciada.promesa;
  e.renovacion.rechazar(new ErrorConexion('sin conexión'));
  await assert.rejects(pendiente, ErrorRenovacionIncierta);
  await assert.rejects(e.coordinador.renovarAcceso('acceso-a'), ErrorRenovacionIncierta);
  assert.equal(e.llamadas(), 1);
  assert.notEqual(e.obtener(), null);
  assert.equal(e.coordinador.requiereReautenticacion(), true);
  await assert.rejects(e.coordinador.cerrarSesion(async () => {
    assert.fail('No se debe revocar un refresh incierto');
  }), ErrorRenovacionIncierta);
  e.cambiar({ identidad: {}, tokens: { accessToken: 'cuenta-nueva', refreshToken: 'refresh-nuevo' } });
  assert.equal(e.coordinador.requiereReautenticacion(), false);
});

test('un marcador persistido impide renovar y cerrar tras reiniciar', async () => {
  const estado = { identidad: {}, tokens: { accessToken: 'acceso-a', refreshToken: 'refresh-a' } };
  let llamadas = 0;
  const coordinador = crearCoordinadorSesion({
    obtener: () => estado,
    renovar: async () => { llamadas++; throw new Error('inesperado'); },
    guardar: async () => {},
    cerrar: () => {},
    descartar: async () => {},
    leerMarcador: async () => 'refresh-a',
    guardarMarcador: async () => {},
    borrarMarcador: async () => {},
  });
  await assert.rejects(coordinador.renovarAcceso('acceso-a'), ErrorRenovacionIncierta);
  assert.equal(coordinador.requiereReautenticacion(), true);
  await assert.rejects(coordinador.cerrarSesion(async () => {
    assert.fail('No se debe revocar un token incierto');
  }), ErrorRenovacionIncierta);
  assert.equal(llamadas, 0);
});

test('una escritura anterior no sobrescribe el marcador de la cuenta nueva', async () => {
  let estado = { identidad: {}, tokens: { accessToken: 'a', refreshToken: 'ra' } };
  let marcador = null;
  const escrituraA = diferida();
  const inicioA = diferida();
  const inicioB = diferida();
  const respuestaB = diferida();
  const coordinador = crearCoordinadorSesion({
    obtener: () => estado,
    leerMarcador: async () => marcador,
    guardarMarcador: async (token) => {
      if (token === 'ra') { inicioA.resolver(); await escrituraA.promesa; }
      marcador = token;
    },
    borrarMarcador: async () => { marcador = null; },
    renovar: async (token) => {
      assert.equal(token, 'rb');
      inicioB.resolver();
      return respuestaB.promesa;
    },
    guardar: async (tokens) => { estado = { ...estado, tokens }; },
    cerrar: () => {},
    descartar: async () => {},
  });
  const anterior = coordinador.renovarAcceso('a');
  const rechazoAnterior = assert.rejects(anterior, ErrorConexion);
  await inicioA.promesa;
  estado = { identidad: {}, tokens: { accessToken: 'b', refreshToken: 'rb' } };
  const nueva = coordinador.renovarAcceso('b');
  escrituraA.resolver();
  await rechazoAnterior;
  await inicioB.promesa;
  assert.equal(marcador, 'rb');
  respuestaB.resolver({ accessToken: 'b2', refreshToken: 'rb2' });
  await nueva;
});

test('el cierre tras reiniciar detecta directamente el marcador incierto', async () => {
  const estado = { identidad: {}, tokens: { accessToken: 'a', refreshToken: 'ra' } };
  let revocaciones = 0;
  const coordinador = crearCoordinadorSesion({
    obtener: () => estado,
    renovar: async () => { throw new Error('inesperado'); },
    guardar: async () => {},
    cerrar: () => { assert.fail('La sesión debe conservarse'); },
    descartar: async () => {},
    leerMarcador: async () => 'ra',
    guardarMarcador: async () => {},
    borrarMarcador: async () => {},
  });
  await assert.rejects(
    coordinador.cerrarSesion(async () => { revocaciones++; }),
    ErrorRenovacionIncierta,
  );
  assert.equal(coordinador.requiereReautenticacion(), true);
  assert.equal(revocaciones, 0);
});

test('si no se guardan los tokens renovados conserva el marcador para recuperar', async () => {
  const identidad = {};
  let estado = { identidad, tokens: { accessToken: 'a', refreshToken: 'ra' } };
  let marcador = null;
  const coordinador = crearCoordinadorSesion({
    obtener: () => estado,
    renovar: async () => ({ accessToken: 'b', refreshToken: 'rb' }),
    guardar: async (tokens) => {
      estado = { identidad, tokens };
      throw new Error('fallo al guardar');
    },
    cerrar: () => { assert.fail('La sesión debe conservarse'); },
    descartar: async () => {},
    leerMarcador: async () => marcador,
    guardarMarcador: async (token) => { marcador = token; },
    borrarMarcador: async () => { marcador = null; },
  });
  await assert.rejects(coordinador.renovarAcceso('a'), ErrorRenovacionIncierta);
  assert.equal(coordinador.requiereReautenticacion(), true);
  assert.equal(marcador, 'ra');

  estado = { identidad: {}, tokens: { accessToken: 'a', refreshToken: 'ra' } };
  const reiniciado = crearCoordinadorSesion({
    obtener: () => estado,
    renovar: async () => { assert.fail('No se debe reutilizar el token'); },
    guardar: async () => {},
    cerrar: () => { assert.fail('La sesión debe conservarse'); },
    descartar: async () => {},
    leerMarcador: async () => marcador,
    guardarMarcador: async () => {},
    borrarMarcador: async () => {},
  });
  await assert.rejects(reiniciado.renovarAcceso('a'), ErrorRenovacionIncierta);
});

test('un fallo al preparar el marcador no envía la renovación', async () => {
  const estado = { identidad: {}, tokens: { accessToken: 'acceso-a', refreshToken: 'refresh-a' } };
  let llamadas = 0;
  const coordinador = crearCoordinadorSesion({
    obtener: () => estado,
    renovar: async () => { llamadas++; throw new Error('inesperado'); },
    guardar: async () => {},
    cerrar: () => {},
    descartar: async () => {},
    leerMarcador: async () => null,
    guardarMarcador: async () => { throw new Error('almacenamiento no disponible'); },
    borrarMarcador: async () => {},
  });
  await assert.rejects(coordinador.renovarAcceso('acceso-a'), (error) =>
    error instanceof ErrorConexion && !(error instanceof ErrorRenovacionIncierta));
  assert.equal(coordinador.requiereReautenticacion(), false);
  assert.equal(llamadas, 0);
});

test('solo cierra la sesión vigente ante rechazo confirmado del refresh', async () => {
  const e = entorno();
  const pendiente = e.coordinador.renovarAcceso('acceso-a');
  await e.iniciada.promesa;
  e.renovacion.rechazar(new ApiError(401, 'Sesión inválida'));
  await assert.rejects(pendiente, ErrorConexion);
  assert.equal(e.cierres(), 1);
  assert.equal(e.obtener(), null);
});

test('no cierra otra cuenta ante rechazo tardío del refresh', async () => {
  const e = entorno();
  const pendiente = e.coordinador.renovarAcceso('acceso-a');
  await e.iniciada.promesa;
  const otra = { identidad: {}, tokens: { accessToken: 'otra-cuenta', refreshToken: 'otro-refresh' } };
  e.cambiar(otra);
  e.renovacion.rechazar(new ApiError(401, 'Sesión inválida'));
  await assert.rejects(pendiente, ApiError);
  assert.equal(e.cierres(), 0);
  assert.equal(e.obtener(), otra);
});

test('el cierre confirmado revoca y elimina únicamente la sesión vigente', async () => {
  const e = entorno();
  const recibidos = [];
  await e.coordinador.cerrarSesion(async (tokens) => { recibidos.push(tokens); });
  assert.deepEqual(recibidos, [{ accessToken: 'acceso-a', refreshToken: 'refresh-a' }]);
  assert.equal(e.cierres(), 1);
  assert.equal(e.obtener(), null);
});

test('el cierre confirmado elimina el marcador obsoleto después de revocar', async () => {
  let estado = { identidad: {}, tokens: { accessToken: 'a', refreshToken: 'nuevo' } };
  let marcador = 'anterior';
  const operaciones = [];
  const coordinador = crearCoordinadorSesion({
    obtener: () => estado,
    renovar: async () => { throw new Error('inesperado'); },
    guardar: async () => {},
    cerrar: () => { operaciones.push('cerrar'); estado = null; },
    descartar: async () => {},
    leerMarcador: async () => marcador,
    guardarMarcador: async (token) => { marcador = token; },
    borrarMarcador: async () => { operaciones.push('borrar'); marcador = null; },
  });
  await coordinador.cerrarSesion(async () => { operaciones.push('revocar'); });
  assert.deepEqual(operaciones, ['revocar', 'borrar', 'cerrar']);
  assert.equal(marcador, null);
  assert.equal(estado, null);
});

test('un fallo al cerrar conserva la sesión y permite reintentar', async () => {
  const e = entorno();
  await assert.rejects(
    e.coordinador.cerrarSesion(async () => { throw new ErrorConexion('sin red'); }),
    ErrorConexion,
  );
  assert.notEqual(e.obtener(), null);
  assert.equal(e.cierres(), 0);
  assert.equal(e.coordinador.requiereReautenticacion(), false);
  await e.coordinador.cerrarSesion(async () => {});
  assert.equal(e.cierres(), 1);
});

test('el cierre espera la renovación y revoca los nuevos tokens', async () => {
  const e = entorno();
  const renovando = e.coordinador.renovarAcceso('acceso-a');
  const recibidos = [];
  const cerrando = e.coordinador.cerrarSesion(async (tokens) => { recibidos.push(tokens); });
  await assert.rejects(e.coordinador.renovarAcceso('acceso-a'), ErrorConexion);
  await e.iniciada.promesa;
  e.renovacion.resolver({ accessToken: 'acceso-b', refreshToken: 'refresh-b' });
  await renovando;
  await cerrando;
  assert.deepEqual(recibidos, [{ accessToken: 'acceso-b', refreshToken: 'refresh-b' }]);
  assert.equal(e.cierres(), 1);
});

test('un cierre que espera una renovación incierta conserva la sesión', async () => {
  const e = entorno();
  const renovando = e.coordinador.renovarAcceso('acceso-a');
  const cerrando = e.coordinador.cerrarSesion(async () => {
    assert.fail('No se debe revocar un refresh incierto');
  });
  await e.iniciada.promesa;
  e.renovacion.rechazar(new ErrorConexion('sin conexión'));
  await assert.rejects(renovando, ErrorRenovacionIncierta);
  await assert.rejects(cerrando, ErrorRenovacionIncierta);
  assert.equal(e.coordinador.requiereReautenticacion(), true);
  assert.notEqual(e.obtener(), null);
  assert.equal(e.cierres(), 0);
});

test('una respuesta de cierre tardía no borra una cuenta nueva', async () => {
  const e = entorno();
  const revocacion = diferida();
  const inicio = diferida();
  const cerrando = e.coordinador.cerrarSesion(() => { inicio.resolver(); return revocacion.promesa; });
  await inicio.promesa;
  const otra = { identidad: {}, tokens: { accessToken: 'otra-cuenta', refreshToken: 'otro-refresh' } };
  e.cambiar(otra);
  revocacion.resolver();
  await assert.rejects(cerrando, ErrorConexion);
  assert.equal(e.obtener(), otra);
  assert.equal(e.cierres(), 0);
});

test('no renueva al recibir un 401 por contraseña incorrecta', async () => {
  const anterior = globalThis.fetch;
  let renovaciones = 0;
  let solicitudes = 0;
  globalThis.fetch = async () => {
    solicitudes += 1;
    return Response.json({ message: 'Credenciales inválidas' }, { status: 401 });
  };
  try {
    const cliente = new HttpClient('https://ejemplo.invalid', {
      validarAcceso: (token) => token,
      prepararAcceso: async (token) => token,
      renovarAcceso: async () => { renovaciones += 1; return 'nuevo'; },
    });
    await assert.rejects(cliente.patch('/auth/password', {}, { accessToken: 'actual' }), ApiError);
    assert.equal(solicitudes, 1);
    assert.equal(renovaciones, 0);
  } finally {
    globalThis.fetch = anterior;
  }
});

test('renueva y reintenta una vez ante sesión inválida', async () => {
  const anterior = globalThis.fetch;
  const tokens = [];
  globalThis.fetch = async (_url, opciones) => {
    tokens.push(opciones.headers.get('Authorization'));
    return tokens.length === 1
      ? Response.json({ message: 'Sesión inválida' }, { status: 401 })
      : Response.json({ ok: true });
  };
  try {
    const cliente = new HttpClient('https://ejemplo.invalid', {
      validarAcceso: (token) => token,
      prepararAcceso: async (token) => token,
      renovarAcceso: async () => 'nuevo',
    });
    assert.deepEqual(await cliente.get('/datos', { accessToken: 'actual' }), { ok: true });
    assert.deepEqual(tokens, ['Bearer actual', 'Bearer nuevo']);
  } finally {
    globalThis.fetch = anterior;
  }
});

test('rechaza la respuesta de una cuenta anterior', async () => {
  const anterior = globalThis.fetch;
  const respuesta = diferida();
  let vigente = true;
  globalThis.fetch = () => respuesta.promesa;
  try {
    const cliente = new HttpClient('https://ejemplo.invalid', {
      validarAcceso: (token) => {
        if (!vigente) throw new ErrorConexion('La sesión cambió');
        return token;
      },
      prepararAcceso: async (token) => token,
      renovarAcceso: async () => 'nuevo',
    });
    const pendiente = cliente.get('/datos', { accessToken: 'anterior' });
    await new Promise((resolver) => setImmediate(resolver));
    vigente = false;
    respuesta.resolver(Response.json({ dato: 'privado' }));
    await assert.rejects(pendiente, ErrorConexion);
  } finally {
    globalThis.fetch = anterior;
  }
});

test('el cliente espera la preparación antes de enviar', async () => {
  const anterior = globalThis.fetch;
  const preparacion = diferida();
  let solicitudes = 0;
  globalThis.fetch = async () => {
    solicitudes++;
    return Response.json({ ok: true });
  };
  try {
    const cliente = new HttpClient('https://ejemplo.invalid', {
      validarAcceso: (token) => token,
      prepararAcceso: () => preparacion.promesa,
      renovarAcceso: async () => 'nuevo',
    });
    const pendiente = cliente.get('/datos', { accessToken: 'actual' });
    await new Promise((resolver) => setImmediate(resolver));
    assert.equal(solicitudes, 0);
    preparacion.resolver('actual');
    assert.deepEqual(await pendiente, { ok: true });
    assert.equal(solicitudes, 1);
  } finally {
    globalThis.fetch = anterior;
  }
});

test('el cliente no envía si falla la preparación', async () => {
  const anterior = globalThis.fetch;
  let solicitudes = 0;
  globalThis.fetch = async () => { solicitudes++; return Response.json({}); };
  try {
    const cliente = new HttpClient('https://ejemplo.invalid', {
      validarAcceso: (token) => token,
      prepararAcceso: async () => { throw new ErrorRenovacionIncierta(); },
      renovarAcceso: async () => 'nuevo',
    });
    await assert.rejects(cliente.get('/datos', { accessToken: 'actual' }), ErrorRenovacionIncierta);
    assert.equal(solicitudes, 0);
  } finally {
    globalThis.fetch = anterior;
  }
});

for (const falla of [false, true]) {
  test(`HTTP espera al coordinador durante la persistencia (fallo=${falla})`, async () => {
    const identidad = {};
    let estado = { identidad, tokens: { accessToken: 'a', refreshToken: 'ra' } };
    let marcador = null;
    let solicitudes = 0;
    const escribiendo = diferida();
    const escritura = diferida();
    const anterior = globalThis.fetch;
    const coordinador = crearCoordinadorSesion({
      obtener: () => estado,
      renovar: async () => ({ accessToken: 'b', refreshToken: 'rb' }),
      guardar: async (tokens) => {
        estado = { identidad, tokens };
        escribiendo.resolver();
        await escritura.promesa;
      },
      cerrar: () => {},
      descartar: async () => {},
      leerMarcador: async () => marcador,
      guardarMarcador: async (valor) => { marcador = valor; },
      borrarMarcador: async () => { marcador = null; },
    });
    globalThis.fetch = async (_url, opciones) => {
      solicitudes++;
      assert.equal(opciones.headers.get('Authorization'), 'Bearer b');
      return Response.json({ ok: true });
    };
    try {
      const renovacion = coordinador.renovarAcceso('a');
      const resultadoRenovacion = falla
        ? assert.rejects(renovacion, ErrorRenovacionIncierta)
        : renovacion;
      await escribiendo.promesa;
      const solicitud = new HttpClient('https://ejemplo.invalid', coordinador)
        .get('/datos', { accessToken: 'b' });
      const resultadoSolicitud = falla
        ? assert.rejects(solicitud, ErrorRenovacionIncierta)
        : solicitud;
      await new Promise((resolver) => setImmediate(resolver));
      assert.equal(solicitudes, 0);
      if (falla) escritura.rechazar(new Error('fallo de almacenamiento'));
      else escritura.resolver();
      await resultadoRenovacion;
      if (falla) {
        await resultadoSolicitud;
        assert.equal(solicitudes, 0);
      } else {
        assert.deepEqual(await resultadoSolicitud, { ok: true });
        assert.equal(solicitudes, 1);
      }
    } finally {
      globalThis.fetch = anterior;
    }
  });
}

test('el almacenamiento serializa el cierre y la sesión siguiente', async () => {
  const primera = diferida();
  const operaciones = [];
  let valor = null;
  const secure = {
    setItemAsync: async (_clave, dato) => {
      operaciones.push(`guardar:${dato}`);
      if (dato === 'anterior') await primera.promesa;
      valor = dato;
    },
    deleteItemAsync: async () => { operaciones.push('borrar'); valor = null; },
    getItemAsync: async () => valor,
  };
  const { almacenamientoSeguro } = cargar('../src/lib/storage/secure-storage.ts', {
    'expo-secure-store': secure,
    'react-native': { Platform: { OS: 'android' } },
  });
  const guardarAnterior = almacenamientoSeguro.setItem('sesion', 'anterior');
  const borrar = almacenamientoSeguro.removeItem('sesion');
  const guardarNuevo = almacenamientoSeguro.setItem('sesion', 'nueva');
  primera.resolver();
  await Promise.all([guardarAnterior, borrar, guardarNuevo]);
  assert.deepEqual(operaciones, ['guardar:anterior', 'borrar', 'guardar:nueva']);
  assert.equal(await almacenamientoSeguro.getItem('sesion'), 'nueva');
});

test('el inicio de sesión confirmado se escribe una sola vez', async () => {
  const escrituras = [];
  const almacenamientoSeguro = {
    getItem: async () => null,
    setItem: async (clave, valor) => { escrituras.push({ clave, valor }); },
    removeItem: async () => {},
  };
  const { useSesionStore } = cargar('../src/stores/sesion-store.ts', {
    zustand: require('zustand'),
    'zustand/middleware': require('zustand/middleware'),
    '@/lib/storage/secure-storage': { almacenamientoSeguro },
  });
  await useSesionStore.persist.rehydrate();
  escrituras.length = 0;
  await useSesionStore.getState().iniciarSesion({
    idCuenta: 'prueba',
    correo: 'prueba@correo.duoc.cl',
    accessToken: 'access-prueba',
    refreshToken: 'refresh-prueba',
    usuario: {
      pNombre: 'Prueba',
      sNombre: null,
      pApellido: 'Apellido',
      sApellido: 'Apellido',
      rol: { id: 1, descripcion: 'Estudiante' },
    },
  });
  assert.equal(escrituras.length, 1);
  const guardado = JSON.parse(escrituras[0].valor).state;
  assert.deepEqual(guardado.sesion, useSesionStore.getState().sesion);
  assert.deepEqual(guardado.tokens, useSesionStore.getState().tokens);
});

test('un fallo al persistir un nuevo inicio conserva la sesión anterior', async () => {
  let fallo = false;
  const almacenamientoSeguro = {
    getItem: async () => null,
    setItem: async () => {
      if (fallo) throw new Error('almacenamiento no disponible');
    },
    removeItem: async () => {},
  };
  const { useSesionStore } = cargar('../src/stores/sesion-store.ts', {
    zustand: require('zustand'),
    'zustand/middleware': require('zustand/middleware'),
    '@/lib/storage/secure-storage': { almacenamientoSeguro },
  });
  await useSesionStore.persist.rehydrate();

  const login = (id) => ({
    idCuenta: id,
    correo: `${id}@correo.duoc.cl`,
    accessToken: `access-${id}`,
    refreshToken: `refresh-${id}`,
    usuario: {
      pNombre: 'Prueba',
      sNombre: null,
      pApellido: 'Apellido',
      sApellido: 'Apellido',
      rol: { id: 1, descripcion: 'Estudiante' },
    },
  });
  await useSesionStore.getState().iniciarSesion(login('anterior'));
  const anterior = useSesionStore.getState().sesion;
  fallo = true;
  await assert.rejects(
    useSesionStore.getState().iniciarSesion(login('nueva')),
    /almacenamiento no disponible/,
  );
  assert.equal(useSesionStore.getState().sesion, anterior);
});

test('un cierre durante el ingreso no restaura la sesión al hidratar', async () => {
  const inicioEscritura = diferida();
  const finalizarEscritura = diferida();
  let valor = null;
  let demorar = false;
  const secure = {
    getItemAsync: async () => valor,
    setItemAsync: async (_clave, dato) => {
      if (demorar) {
        demorar = false;
        inicioEscritura.resolver();
        await finalizarEscritura.promesa;
      }
      valor = dato;
    },
    deleteItemAsync: async () => { valor = null; },
  };
  const { almacenamientoSeguro } = cargar('../src/lib/storage/secure-storage.ts', {
    'expo-secure-store': secure,
    'react-native': { Platform: { OS: 'android' } },
  });
  const dependencias = {
    zustand: require('zustand'),
    'zustand/middleware': require('zustand/middleware'),
    '@/lib/storage/secure-storage': { almacenamientoSeguro },
  };
  const { useSesionStore } = cargar('../src/stores/sesion-store.ts', dependencias);
  await useSesionStore.persist.rehydrate();
  demorar = true;
  const ingreso = useSesionStore.getState().iniciarSesion({
    idCuenta: 'prueba',
    correo: 'prueba@correo.duoc.cl',
    accessToken: 'access-prueba',
    refreshToken: 'refresh-prueba',
    usuario: {
      pNombre: 'Prueba',
      sNombre: null,
      pApellido: 'Apellido',
      sApellido: 'Apellido',
      rol: { id: 1, descripcion: 'Estudiante' },
    },
  });
  const rechazo = assert.rejects(ingreso, /sesión cambió/);
  await inicioEscritura.promesa;
  useSesionStore.getState().cerrarSesion();
  finalizarEscritura.resolver();
  await rechazo;
  await almacenamientoSeguro.getItem('pasaeldato.sesion.v1');
  const reiniciado = cargar('../src/stores/sesion-store.ts', dependencias).useSesionStore;
  await reiniciado.persist.rehydrate();
  assert.equal(reiniciado.getState().sesion, null);
  assert.equal(reiniciado.getState().tokens, null);
});

test('el store Zustand propaga fallos al persistir tokens renovados', async () => {
  let fallo = false;
  let guardado = null;
  const almacenamientoSeguro = {
    getItem: async () => null,
    setItem: async (_clave, valor) => {
      if (fallo) throw new Error('almacenamiento no disponible');
      guardado = valor;
    },
    removeItem: async () => {},
  };
  const { useSesionStore } = cargar('../src/stores/sesion-store.ts', {
    zustand: require('zustand'),
    'zustand/middleware': require('zustand/middleware'),
    '@/lib/storage/secure-storage': { almacenamientoSeguro },
  });
  await useSesionStore.persist.rehydrate();

  await useSesionStore.getState().renovarTokens({
    accessToken: 'prueba-a',
    refreshToken: 'prueba-r',
  });
  assert.equal(JSON.parse(guardado).state.tokens.refreshToken, 'prueba-r');

  fallo = true;
  await assert.rejects(
    useSesionStore.getState().renovarTokens({
      accessToken: 'prueba-b',
      refreshToken: 'prueba-r2',
    }),
    /almacenamiento no disponible/,
  );
});

test('una escritura fallida no bloquea operaciones posteriores', async () => {
  let valor = null;
  const secure = {
    setItemAsync: async (_clave, dato) => {
      if (dato === 'fallida') throw new Error('error de almacenamiento');
      valor = dato;
    },
    deleteItemAsync: async () => { valor = null; },
    getItemAsync: async () => valor,
  };
  const { almacenamientoSeguro } = cargar('../src/lib/storage/secure-storage.ts', {
    'expo-secure-store': secure,
    'react-native': { Platform: { OS: 'android' } },
  });
  await assert.rejects(almacenamientoSeguro.setItem('sesion', 'fallida'));
  await almacenamientoSeguro.setItem('sesion', 'nueva');
  assert.equal(await almacenamientoSeguro.getItem('sesion'), 'nueva');
});

test('no reintenta una operación tras un fallo de conexión', async () => {
  const anterior = globalThis.fetch;
  let solicitudes = 0;
  globalThis.fetch = async () => {
    solicitudes += 1;
    throw new TypeError('falló la red');
  };
  try {
    const cliente = new HttpClient('https://ejemplo.invalid');
    await assert.rejects(cliente.post('/publicaciones', { titulo: 'Prueba' }), ErrorConexion);
    assert.equal(solicitudes, 1);
  } finally {
    globalThis.fetch = anterior;
  }
});
