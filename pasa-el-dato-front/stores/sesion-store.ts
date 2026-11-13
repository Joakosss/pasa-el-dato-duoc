"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  SesionUsuarioDTO,
  UsuarioAutenticadoDTO,
} from "@/domain/dtos/auth.dto";

// Sesión UI mínima y no sensible. Los tokens viajan solo en cookies HttpOnly
// (credentials:"include" global); aquí nunca se guardan tokens, run ni claves.
// `sedeNombre` no viene en el login: se hidrata desde GET /perfil/me
// (ver usePerfil) y queda cacheada aquí para uso directo en UI.
export interface Sesion {
  idCuenta: string;
  correo: string;
  nombreCompleto: string;
  sedeNombre: string | null;
  rol: {
    id: number;
    descripcion: string;
  };
}

interface SesionState {
  sesion: Sesion | null;
  iniciarSesion: (dto: UsuarioAutenticadoDTO) => void;
  fijarSede: (nombre: string | null) => void;
  cerrarSesion: () => void;
}

function construirNombreCompleto(
  usuario: SesionUsuarioDTO["usuario"],
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
          sesion:
            "usuario" in dto
              ? {
                  idCuenta: dto.idCuenta,
                  correo: dto.correo,
                  nombreCompleto: construirNombreCompleto(dto.usuario),
                  // La sede se hidrata después vía GET /perfil/me.
                  sedeNombre: null,
                  rol: {
                    id: dto.usuario.rol.id,
                    descripcion: dto.usuario.rol.descripcion,
                  },
                }
              : {
                  idCuenta: dto.idCuenta,
                  correo: dto.correo,
                  nombreCompleto: dto.marca.nombre,
                  // Las marcas no tienen sede.
                  sedeNombre: null,
                  rol: {
                    id: dto.marca.rol.id,
                    descripcion: dto.marca.rol.descripcion,
                  },
                },
        }),
      fijarSede: (nombre) =>
        set((estado) =>
          estado.sesion && estado.sesion.sedeNombre !== nombre
            ? { sesion: { ...estado.sesion, sedeNombre: nombre } }
            : estado,
        ),
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
