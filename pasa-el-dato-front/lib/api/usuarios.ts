import type { RegistrarUsuarioRequestDTO } from "@/domain/dtos/cuenta.dto";
import { apiClient } from "./index";

// POST /usuario/validar-run { run } -> boolean (true = disponible).
export async function validarRunDisponible(run: string): Promise<boolean> {
  return apiClient.post<boolean>("/usuario/validar-run", { run });
}

// POST /usuario/validar-correo { correo } -> boolean (true = disponible).
export async function validarCorreoDisponible(correo: string): Promise<boolean> {
  return apiClient.post<boolean>("/usuario/validar-correo", { correo });
}

// POST /usuario/registro { ...dto plano } -> void (201 sin cuerpo).
export async function registrarUsuario(payload: RegistrarUsuarioRequestDTO): Promise<void> {
  await apiClient.post<void>("/usuario/registro", payload);
}



