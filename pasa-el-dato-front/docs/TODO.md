# TODO Front — Pasa el Dato

## Notificación Duoc (`components/layout/NotificationDuoc.tsx`)

- [x] Tipado estricto `NotificationDuocProps` (todo requerido)
- [x] Skeleton separado para `Suspense`
- [ ] Fetch datos reales (`GET /notifications/active`) con fallback local
- [ ] Reemplazar copy fallback (`Anuncios Duoc` / `Ver más` / `link="#"`) por datos reales del back
- [ ] Ajustar `revalidate` (hoy 300s) según frecuencia de anuncios
- [ ] Decidir `link` interno vs externo (`target="_blank"`, `rel`)

## Home (`app/page.tsx`)

- [ ] Origen async destacados y patrocinados (hoy placeholders locales)
