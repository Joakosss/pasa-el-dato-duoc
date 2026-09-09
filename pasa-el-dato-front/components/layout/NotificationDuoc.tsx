export type NotificationDuocProps = {
  titulo: string;
  mensaje: string;
  msj_btn: string;
  link: string;
};

export function NotificationDuoc({ titulo, mensaje, msj_btn, link }: NotificationDuocProps) {
  return (
    <section
      aria-label={titulo}
      className="mb-6 flex flex-col justify-between gap-3 rounded-xl bg-navy px-6 py-4 sm:flex-row sm:items-center"
    >
      <div className="flex flex-1 flex-col gap-1">
        <p className="text-sm font-bold text-white">{titulo}</p>
        <p className="text-sm font-normal text-white/80">{mensaje}</p>
      </div>
      <a
        href={link}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy shadow-sm transition-colors hover:bg-gold-hover focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-navy"
      >
        {msj_btn}
      </a>
    </section>
  );
}

export function NotificationDuocSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="mb-6 flex animate-pulse flex-col justify-between gap-3 rounded-xl bg-navy px-6 py-4 sm:flex-row sm:items-center"
    >
      <div className="flex flex-1 flex-col gap-1">
        <div className="h-4 w-48 rounded bg-white/20" />
        <div className="h-4 w-full max-w-md rounded bg-white/20" />
      </div>
      <div className="h-9 w-full shrink-0 rounded-lg bg-white/20" />
    </div>
  );
}
