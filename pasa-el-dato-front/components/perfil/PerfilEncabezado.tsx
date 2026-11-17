"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Icono, type IconoNombre } from "@/components/ui/Icono";
import { ROUTES } from "@/config/constants";
import { useContadorFavoritos } from "@/hooks/use-contador-favoritos";
import type { PerfilRespuestaDTO } from "@/domain/dtos";
import { cn } from "@/lib/utils/cn";

interface PerfilEncabezadoProps {
  perfil: PerfilRespuestaDTO;
}

interface Accion {
  href: string;
  icono: IconoNombre;
  titulo: string;
  subtitulo: string;
}

// S4.2: en móvil las acciones son tarjetas-fila con chevron; desde `sm` se
// convierten en botones con ícono en el header.
export function PerfilEncabezado({ perfil }: PerfilEncabezadoProps) {
  const { total } = useContadorFavoritos();

  const nombres = [perfil.pNombre, perfil.sNombre]
    .filter((parte): parte is string => Boolean(parte?.trim()))
    .join(" ");
  const apellidos = [perfil.pApellido, perfil.sApellido]
    .filter((parte): parte is string => Boolean(parte?.trim()))
    .join(" ");
  const nombreCompleto = [nombres, apellidos].filter(Boolean).join(" ");

  // total null = sin dato (cargando o error): el número se omite y el
  // subtítulo queda neutro (S5.4).
  const hayContador = typeof total === "number" && total > 0;

  const acciones: Accion[] = [
    {
      href: ROUTES.favoritos,
      icono: "corazon",
      titulo: "Favoritos",
      subtitulo: hayContador
        ? `${total} ${
            total === 1 ? "publicación guardada" : "publicaciones guardadas"
          }`
        : "Guarda publicaciones para verlas aquí.",
    },
    {
      href: ROUTES.misPublicaciones,
      icono: "publicaciones",
      titulo: "Mis publicaciones",
      subtitulo: "Revisa, edita o elimina las publicaciones de tu cuenta.",
    },
    {
      href: ROUTES.miPerfilEditar,
      icono: "editar",
      titulo: "Editar perfil",
      subtitulo: "Actualiza tu teléfono y tu sede.",
    },
    {
      href: ROUTES.miPerfilSeguridad,
      icono: "contrasena",
      titulo: "Cambiar contraseña",
      subtitulo: "Actualiza el acceso a tu cuenta.",
    },
  ];

  return (
    <header className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:gap-4 sm:text-left">
          <Avatar
            name={nombreCompleto}
            size="xl"
            variant="perfil"
            className="h-20 w-20 text-2xl sm:h-14 sm:w-14 sm:text-base"
          />
          <div className="min-w-0">
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-3">
              <h1 className="break-words text-xl font-bold text-navy sm:text-2xl">
                {nombreCompleto}
              </h1>
              <Badge variant="promo">{perfil.rol.descripcion}</Badge>
            </div>
            <p className="mt-1 break-all text-sm text-gray-500">
              {perfil.correo}
            </p>
          </div>
        </div>

        {/* S4.2: acciones como botones con ícono desde `sm`. */}
        <nav
          aria-label="Acciones del perfil"
          className="hidden shrink-0 flex-wrap justify-end gap-2 sm:flex"
        >
          {acciones.map((accion) => (
            <Link
              key={accion.href}
              href={accion.href}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-navy transition hover:border-gold hover:bg-gold/10 focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <Icono
                nombre={accion.icono}
                size={16}
                className={cn(
                  accion.icono === "corazon" && hayContador && "text-gold",
                )}
                relleno={accion.icono === "corazon" && hayContador}
              />
              {accion.titulo}
              {accion.icono === "corazon" && hayContador ? (
                <span className="rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-bold text-navy">
                  {total}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
      </div>

      {/* S4.2: en móvil, tarjetas-fila navegables con chevron. */}
      <ul className="space-y-3 sm:hidden">
        {acciones.map((accion) => (
          <li key={accion.href}>
            <Link
              href={accion.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl border bg-card p-4 transition active:opacity-90",
                accion.icono === "corazon"
                  ? "border-gold"
                  : "border-gray-200",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                  accion.icono === "corazon"
                    ? "bg-[#fff1f2] text-red-500"
                    : "bg-[#e6f4ff] text-navy",
                )}
              >
                <Icono
                  nombre={accion.icono}
                  size={22}
                  relleno={accion.icono === "corazon"}
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-bold text-navy">
                  {accion.titulo}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-gray-500">
                  {accion.subtitulo}
                </span>
              </span>
              <Icono nombre="chevron" size={22} className="text-navy" />
            </Link>
          </li>
        ))}
      </ul>
    </header>
  );
}
