// Rol derivado del usuario respecto de la publicación de la conversación.
// No viene en el contrato del listado: se infiere comparando `publicacion.id`
// con las publicaciones propias (GET /publicaciones/me).
export type RolConversacion = "VENDIENDO" | "COMPRANDO" | "DESCONOCIDO";

// Estado de lectura visible en la burbuja:
// - propio: "leido" (lo leyó la contraparte) o "enviado".
// - recibido: "leido" o "no-leido".
export type EstadoLecturaMensaje = "leido" | "enviado" | "no-leido";
