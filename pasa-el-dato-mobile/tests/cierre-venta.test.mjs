import assert from 'node:assert/strict';
import test from 'node:test';
import { cerrarVentaYActivarCalificacion } from '../src/lib/chat/cierre-venta.ts';

function entorno({ cierre, consulta, activacion, vigente = () => true }) {
  const llamadas = [];
  return {
    llamadas,
    operaciones: {
      cerrar: async () => { llamadas.push('cerrar'); return cierre(); },
      consultar: async () => { llamadas.push('consultar'); return consulta(); },
      activar: async () => { llamadas.push('activar'); return activacion(); },
      sesionVigente: vigente,
    },
  };
}

const transaccion = (id = 'comprador', activa = false) => ({
  comprador: { id, nombre: 'Comprador' },
  calificacionActivada: activa,
});
const falla = async () => { throw new Error('sin conexión'); };

test('cierra y activa la calificación una sola vez', async () => {
  const e = entorno({ cierre: async () => transaccion(), consulta: falla, activacion: async () => ({ calificacionActivada: true }) });
  assert.deepEqual(await cerrarVentaYActivarCalificacion('comprador', e.operaciones), { estado: 'completada' });
  assert.deepEqual(e.llamadas, ['cerrar', 'activar']);
});

test('recupera un cierre confirmado tras perder la respuesta sin repetir el cierre', async () => {
  const e = entorno({ cierre: falla, consulta: async () => transaccion(), activacion: async () => ({ calificacionActivada: true }) });
  assert.deepEqual(await cerrarVentaYActivarCalificacion('comprador', e.operaciones), { estado: 'completada' });
  assert.deepEqual(e.llamadas, ['cerrar', 'consultar', 'activar']);
});

test('no activa una venta registrada para otro comprador', async () => {
  const e = entorno({ cierre: async () => transaccion('otro'), consulta: falla, activacion: falla });
  assert.deepEqual(await cerrarVentaYActivarCalificacion('comprador', e.operaciones), { estado: 'otro_comprador' });
  assert.deepEqual(e.llamadas, ['cerrar']);
});

test('informa el resultado incierto si falla la consulta posterior', async () => {
  const e = entorno({ cierre: falla, consulta: falla, activacion: falla });
  assert.deepEqual(await cerrarVentaYActivarCalificacion('comprador', e.operaciones), { estado: 'resultado_incierto' });
  assert.deepEqual(e.llamadas, ['cerrar', 'consultar']);
});

test('informa que la activación está pendiente cuando falla', async () => {
  const e = entorno({ cierre: async () => transaccion(), consulta: falla, activacion: falla });
  assert.deepEqual(await cerrarVentaYActivarCalificacion('comprador', e.operaciones), { estado: 'activacion_pendiente' });
  assert.deepEqual(e.llamadas, ['cerrar', 'activar']);
});

test('no activa tras cambiar de sesión durante el cierre', async () => {
  let vigente = true;
  const e = entorno({
    cierre: async () => { vigente = false; return transaccion(); },
    consulta: falla,
    activacion: falla,
    vigente: () => vigente,
  });
  assert.deepEqual(await cerrarVentaYActivarCalificacion('comprador', e.operaciones), { estado: 'sesion_cambiada' });
  assert.deepEqual(e.llamadas, ['cerrar']);
});

test('no vuelve a activar una calificación ya activada', async () => {
  const e = entorno({ cierre: async () => transaccion('comprador', true), consulta: falla, activacion: falla });
  assert.deepEqual(await cerrarVentaYActivarCalificacion('comprador', e.operaciones), { estado: 'completada' });
  assert.deepEqual(e.llamadas, ['cerrar']);
});
