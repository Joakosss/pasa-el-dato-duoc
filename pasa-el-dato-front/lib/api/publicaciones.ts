import { HttpClient } from "./http-client";

export type EstadoPublicacionAsignablePorPropietario =
  | "En curso"
  | "Pausada"
  | "Vendida";

export interface CambiarEstadoPublicacionRespuesta {
  id: string;
  estado: {
    id: number;
    descripcion: string;
  };
}

export class PublicacionesApi {
  constructor(private readonly http: HttpClient) {}

  cambiarEstadoPublicacion(
    publicacionId: string,
    estado: EstadoPublicacionAsignablePorPropietario,
  ): Promise<CambiarEstadoPublicacionRespuesta> {
    return this.http.patch<CambiarEstadoPublicacionRespuesta>(
      `/publicaciones/${publicacionId}/estado`,
      { estado },
    );
  }
}
