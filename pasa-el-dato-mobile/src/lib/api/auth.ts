import type { IniciarSesionRequestDTO, LoginResponseDTO } from "@/domain/dtos/auth.dto";
import { apiClient } from "./index";

export async function iniciarSesion(
  payload: IniciarSesionRequestDTO,
): Promise<LoginResponseDTO> {
  return apiClient.post<LoginResponseDTO>("/auth/login", payload);
}
