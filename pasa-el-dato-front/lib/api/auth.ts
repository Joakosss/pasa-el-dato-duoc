import type {
  IniciarSesionRequestDTO,
  UsuarioAutenticadoDTO,
} from "@/domain/dtos/auth.dto";
import { apiClient } from "./index";

// POST /auth/login { correo, contrasena } -> UsuarioAutenticado (200).
// Los tokens llegan en cookies HttpOnly (las envía/guarda el navegador por
// credentials:"include" global); el cuerpo no contiene tokens.
export async function iniciarSesion(
  payload: IniciarSesionRequestDTO,
): Promise<UsuarioAutenticadoDTO> {
  return apiClient.post<UsuarioAutenticadoDTO>("/auth/login", payload);
}
