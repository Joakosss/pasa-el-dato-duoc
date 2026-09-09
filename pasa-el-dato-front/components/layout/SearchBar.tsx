export function SearchBar() {
  return (
    <section className="sticky top-16 z-40 border-b border-gray-200 bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col items-stretch gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-6 lg:px-8">
        <select
          aria-label="Categoría"
          defaultValue="todos"
          className="w-full flex-shrink-0 cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-navy transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gold sm:w-56"
        >
          <option value="todos">Todas las categorías</option>
          <option value="libros">Libros y apuntes</option>
          <option value="electronica">Electrónica</option>
          <option value="servicios">Servicios académicos</option>
          <option value="ropa">Ropa y accesorios</option>
          <option value="arriendos">Arriendos</option>
          <option value="arte">Arte y diseño</option>
        </select>
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar libros, electrónica, servicios..."
            aria-label="Buscar"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-navy transition placeholder:text-gray-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gold"
          />
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
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
        </div>
      </div>
    </section>
  );
}
