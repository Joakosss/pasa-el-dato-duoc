// HU-ADM-05: espejo front de /admin/palabras-bloqueadas (contrato vigente).
// Lista global ordenada por termino asc; crear 1..100; eliminar 204.
// La normalizacion (trim + lower es-CL) y la coincidencia exacta las decide el back.

export interface PalabraBloqueadaDTO {
  id: string;
  termino: string;
  fechaCreacion: string;
}

export interface CrearPalabraBloqueadaRequestDTO {
  termino: string;
}

export const TERMINO_BLOQUEADO_MAX_LEN = 100 as const;
