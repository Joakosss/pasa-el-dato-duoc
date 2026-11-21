import type { CierreVentaRespuesta } from '@/lib/api/publicaciones';

type Transaccion = Pick<CierreVentaRespuesta, 'comprador' | 'calificacionActivada'>;

export type ResultadoCierreVenta =
  | { estado: 'completada' }
  | { estado: 'otro_comprador' }
  | { estado: 'activacion_pendiente' }
  | { estado: 'resultado_incierto' }
  | { estado: 'sesion_cambiada' };

export async function cerrarVentaYActivarCalificacion(
  compradorId: string,
  operaciones: {
    cerrar: () => Promise<Transaccion>;
    consultar: () => Promise<Transaccion>;
    activar: () => Promise<{ calificacionActivada: boolean }>;
    sesionVigente: () => boolean;
  },
): Promise<ResultadoCierreVenta> {
  if (!operaciones.sesionVigente()) return { estado: 'sesion_cambiada' };

  let transaccion: Transaccion;
  try {
    transaccion = await operaciones.cerrar();
  } catch {
    if (!operaciones.sesionVigente()) return { estado: 'sesion_cambiada' };
    try {
      transaccion = await operaciones.consultar();
    } catch {
      return operaciones.sesionVigente()
        ? { estado: 'resultado_incierto' }
        : { estado: 'sesion_cambiada' };
    }
  }

  if (!operaciones.sesionVigente()) return { estado: 'sesion_cambiada' };
  if (transaccion.comprador.id !== compradorId) return { estado: 'otro_comprador' };
  if (transaccion.calificacionActivada) return { estado: 'completada' };

  try {
    const resultado = await operaciones.activar();
    if (!operaciones.sesionVigente()) return { estado: 'sesion_cambiada' };
    return { estado: resultado.calificacionActivada ? 'completada' : 'activacion_pendiente' };
  } catch {
    return operaciones.sesionVigente()
      ? { estado: 'activacion_pendiente' }
      : { estado: 'sesion_cambiada' };
  }
}
