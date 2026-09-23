"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { UsuarioAutenticadoDTO } from "@/domain/dtos/auth.dto";

// Sesión UI mínima y no sensible. Los tokens viajan solo en cookies HttpOnly
// (credentials:"include" global); aquí nunca se guardan tokens, run ni claves.
export interface Sesion {
  idCuenta: string;
  correo: string;
  nombreCompleto: string;
  rol: {
    id: number;
    descripcion: string;
  };
}

interface SesionState {
  sesion: Sesion | null;
  iniciarSesion: (dto: UsuarioAutenticadoDTO) => void;
  cerrarSesion: () => void;
}

function construirNombreCompleto(
  usuario: UsuarioAutenticadoDTO["usuario"],
): string {
  return [usuario.pNombre, usuario.sNombre, usuario.pApellido, usuario.sApellido]
    .filter((parte): parte is string => Boolean(parte?.trim()))
    .join(" ");
}

export const useSesionStore = create<SesionState>()(
  persist(
    (set) => ({
      sesion: null,
      iniciarSesion: (dto) =>
        set({
          sesion: {
            idCuenta: dto.idCuenta,
            correo: dto.correo,
            nombreCompleto: construirNombreCompleto(dto.usuario),
            rol: {
              id: dto.usuario.rol.id,
              descripcion: dto.usuario.rol.descripcion,
            },
          },
        }),
      cerrarSesion: () => set({ sesion: null }),
    }),
    {
      name: "pasaeldato:sesion:v1",
      // createJSONStorage difiere el acceso a localStorage al cliente,
      // evitando crash SSR en Next.
      storage: createJSONStorage(() => localStorage),
      // Persiste solo el slice de datos; las acciones no se serializan.
      partialize: (estado) => ({ sesion: estado.sesion }),
    },
  ),
);

export const selectSesion = (estado: SesionState) => estado.sesion;
export const selectEstaAutenticado = (estado: SesionState) =>
  estado.sesion !== null;
export const selectRol = (estado: SesionState) => estado.sesion?.rol ?? null;
