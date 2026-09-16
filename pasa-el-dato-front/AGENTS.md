<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Regla Momentaneo (solo front)

Todo mock, carcasa o dato sin contrato back vigente lleva sufijo
`Momentaneo` en tipos/clases y `MOMENTANEO` en constantes/funciones.
TODO asociado con formato `TODO[MOMENTANEO]: qué falta + contrato esperado`.
Aplica solo a identificadores de código. No aplica a textos visibles de UI
ni a prosa en español. Prohibido crear un mock nuevo sin este sufijo.
Excepciones vigentes: `PAUSA_DEBOUNCE_MS` (pausa UX permanente).
