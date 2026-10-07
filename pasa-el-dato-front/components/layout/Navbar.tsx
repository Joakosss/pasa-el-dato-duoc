"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { APP_NAME, ROUTES } from "@/config/constants";
import { LogoutConfirmModal } from "@/components/auth/LogoutConfirmModal";
import { SearchBar } from "./SearchBar";

export function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const perfilButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleCloseSearch = () => {
    setSearchOpen(false);
    searchButtonRef.current?.focus();
  };

  const cerrarMenu = () => {
    setMenuAbierto(false);
  };

  const abrirConfirmacion = () => {
    setMenuAbierto(false);
    setModalAbierto(true);
  };

  useEffect(() => {
    if (!menuAbierto) return;
    const alClickFuera = (evento: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(evento.target as Node)
      ) {
        cerrarMenu();
      }
    };
    const alTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        cerrarMenu();
        perfilButtonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", alClickFuera);
    document.addEventListener("keydown", alTeclar);
    return () => {
      document.removeEventListener("mousedown", alClickFuera);
      document.removeEventListener("keydown", alTeclar);
    };
  }, [menuAbierto]);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex-shrink-0">
            <Link href={ROUTES.home} className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy">
                <span className="text-sm font-bold text-gold">PD</span>
              </div>
              <span className="hidden text-lg font-bold text-navy sm:block">
                {APP_NAME}
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              ref={searchButtonRef}
              type="button"
              aria-label={searchOpen ? "Cerrar búsqueda" : "Abrir búsqueda"}
              aria-expanded={searchOpen}
              aria-controls="mobile-search"
              onClick={() =>
                searchOpen ? handleCloseSearch() : setSearchOpen(true)
              }
              className="flex h-10 w-10 items-center justify-center rounded-full border bg-gray-100 text-navy transition-colors duration-300 ease-out hover:bg-navy hover:text-gray-100 sm:hidden"
            >
              {searchOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              )}
            </button>
            <div className="hidden items-center gap-3 sm:flex">
              <Link
                href={ROUTES.login}
                className="text-sm font-medium text-navy transition hover:text-gold"
              >
                Iniciar sesión
              </Link>
              <button
                type="button"
                onClick={() => setModalAbierto(true)}
                className="cursor-pointer text-sm font-medium text-navy transition hover:text-gold"
              >
                Cerrar sesión
              </button>
              <Link
                href={ROUTES.register}
                className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy transition hover:bg-gold-hover"
              >
                Registrarse
              </Link>
            </div>
            <div ref={menuRef} className="relative sm:hidden">
              <button
                ref={perfilButtonRef}
                type="button"
                aria-label="Usuario"
                aria-haspopup="menu"
                aria-expanded={menuAbierto}
                aria-controls="menu-perfil"
                onClick={() => setMenuAbierto((prev) => !prev)}
                className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-full border bg-gray-100 text-navy hover:bg-navy hover:text-gray-100 transition-colors duration-300 ease-out"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </button>
              {menuAbierto ? (
                <div
                  id="menu-perfil"
                  role="menu"
                  aria-label="Cuenta"
                  className="absolute right-0 top-[calc(100%+8px)] z-50 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                >
                  <Link
                    role="menuitem"
                    href={ROUTES.login}
                    onClick={cerrarMenu}
                    className="block px-4 py-2 text-sm font-medium text-navy transition hover:bg-gold-hover/10 hover:text-navy hover:font-bold"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    role="menuitem"
                    href={ROUTES.register}
                    onClick={cerrarMenu}
                    className="block px-4 py-2 text-sm font-medium text-navy transition hover:bg-gold-hover/10 hover:text-navy hover:font-bold"
                  >
                    Registrarse
                  </Link>
                  <button
                    role="menuitem"
                    type="button"
                    onClick={abrirConfirmacion}
                    className="cursor-pointer block w-full px-4 py-2 text-left text-sm font-medium text-navy transition hover:bg-gold-hover/10 hover:text-navy hover:font-bold"
                  >
                    Cerrar sesión
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <SearchBar
        id="mobile-search"
        variant="panel"
        open={searchOpen}
        onClose={handleCloseSearch}
        autoFocusInput
      />
      <LogoutConfirmModal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
      />
    </header>
  );
}
