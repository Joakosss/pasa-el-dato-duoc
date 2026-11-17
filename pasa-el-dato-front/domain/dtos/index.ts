export type {
  CuentaBaseDTO,
  UsuarioDTO,
  MarcaDTO,
  CuentaDTO,
  CreateUsuarioDTO,
  CreateMarcaDTO,
  UpdateCuentaDTO,
  DesactivarCuentaRequestDTO,
} from "./cuenta.dto";
export type { EscuelaDTO, CarreraDTO, SedeDTO } from "./catalogo.dto";
export type {
  ActualizarPerfilRequestDTO,
  ListadoCalificacionesDTO,
  ListarCalificacionesQuery,
  PerfilCarreraDTO,
  PerfilRespuestaDTO,
  PerfilRolDTO,
  PerfilSedeDTO,
  ReputacionDTO,
  CalificacionRecibidaDTO,
} from "./perfil.dto";
export type { RegistroUsuarioBorrador, SnapshotsRegistro } from "./registro.dto";
export { REGISTRO_USUARIO_INICIAL } from "./registro.dto";
export type {
  IniciarConversacionRequestDTO,
  IniciarConversacionRespuestaDTO,
} from "./chat.dto";
export type {
  CrearMarcaAdminRequestDTO,
  MarcaAdminCreadaDTO,
} from "./marca.dto";
export type {
  EstadoBannerDTO,
  CrearBannerRequestDTO,
  BannerCreadoDTO,
  BannerAdminDTO,
  ListarBannersAdminQueryDTO,
  PaginaBannersAdminDTO,
  RechazarBannerRequestDTO,
  BannerActivoDTO,
  BannersActivosRespuestaDTO,
  BannerMarcaDTO,
  ListarBannersMarcaQueryDTO,
  PaginaBannersMarcaDTO,
} from "./banner.dto";
export type {
  FavoritoDTO,
  ListarFavoritosQueryDTO,
  PaginaFavoritosDTO,
} from "./favorito.dto";

