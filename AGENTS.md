# Pasa el Dato Duoc

Marketplace para la comunidad Duoc.

## Estado

Proyecto en etapa inicial.
Solo existen esqueletos de frontend y backend.
No asumir funcionalidades implementadas.

## Estructura

- `pasa-el-dato-front/`: frontend.
- `pasa-el-dato-back/`: backend.
- `.opencode/agents/`: agentes del flujo de desarrollo.

## Flujo

explore → proposal → spec + design → tasks → apply → verify → archive

Cada agente debe respetar su fase.
No adelantar responsabilidades de fases posteriores.

## Entorno

El toolchain vive dentro de contenedores Podman: `pnpm@11.5.1` solo existe
dentro de `front`/`back` (instalado vía corepack en sus `Dockerfile.dev`).
El host solo tiene `npm/node` y `node_modules` se ve vacío porque
`compose.yaml` monta volúmenes anónimos sobre `/app/node_modules`
(y `/app/.next` en front). No modificar esos volúmenes.

Nunca correr `lint` ni `tsc` en el host. Con servicios levantados
(`podman-compose up -d --build`, ver `ComandosDocker.md`), ejecutar
dentro del contenedor (`podman compose` y `podman-compose` son equivalentes):

- Front lint: `podman compose exec front pnpm lint`
- Front tipos: `podman compose exec front pnpm exec tsc --noEmit`
- Back lint: `podman compose exec back pnpm lint`

## Reglas

- Inspeccionar antes de asumir.
- Cambiar solo lo necesario.
- No introducir dependencias sin justificación.
- Reportar bloqueos en lugar de inventar decisiones.
- Mantener respuestas breves y evitar repetir información de fases anteriores.