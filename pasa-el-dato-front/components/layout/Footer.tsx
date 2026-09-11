import Link from "next/link";
import { APP_NAME, ROUTES } from "@/config/constants";

export function Footer() {
  return (
    <footer className="mt-8 border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy">
                <span className="text-xs font-bold text-gold">PD</span>
              </div>
              <span className="text-sm font-bold text-navy">{APP_NAME}</span>
            </div>
            <p className="text-xs leading-relaxed text-gray-500">
              El marketplace universitario donde los estudiantes compran y venden
              entre ellos.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-navy">Categorías</h4>
            <ul className="space-y-2 text-xs text-gray-500">
              <li>Libros y apuntes</li>
              <li>Electrónica</li>
              <li>Servicios académicos</li>
              <li>Ropa y accesorios</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-navy">Soporte</h4>
            <ul className="space-y-2 text-xs text-gray-500">
              <li>Centro de ayuda</li>
              <li>Reglas de la comunidad</li>
              <li>Seguridad</li>
              <li>Contacto</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-navy">Legal</h4>
            <ul className="space-y-2 text-xs text-gray-500">
              <li>
                <Link
                  href={ROUTES.terms}
                  className="transition-colors hover:text-navy"
                >
                  Términos de uso
                </Link>
              </li>
              <li>Privacidad</li>
              <li>Cookies</li>
            </ul>
          </div>
        </div>
        <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-6 sm:flex-row">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} {APP_NAME}. Todos los derechos reservados.
          </p>
          <p className="text-xs text-gray-400">
            Proyecto Duoc_UC - Ingeniería en Informática
          </p>
        </div>
      </div>
    </footer>
  );
}
