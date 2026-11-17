# Asistente IA para publicaciones móviles

## Objetivo

La aplicación móvil incorpora un asistente visible en la pantalla **Publicar**. Usa Gemini para:

- analizar temporalmente título, descripción e imágenes;
- mostrar un puntaje de calidad de 0 a 100;
- identificar problemas de seguridad o contenido;
- sugerir mejoras concretas;
- proponer un título y una descripción mejorados que el usuario puede aplicar de forma explícita.

El usuario conserva la decisión final sobre las sugerencias.

## Arquitectura

```text
Expo mobile
  └─ POST /api/mobile/ia/publicaciones/analizar (JWT + multipart)
       └─ Backend NestJS: src/mobile/ia
            └─ Gemini API generateContent
```

La aplicación móvil **no conoce ni almacena** la clave de Gemini. La clave se configura exclusivamente en el contenedor/entorno del backend.

## Configuración requerida

Agregar estas variables al entorno del backend, sin versionarlas:

```env
GEMINI_API_KEY=tu_clave_de_google_ai_studio
GEMINI_MODEL=gemini-2.5-flash
```

`GEMINI_MODEL` es opcional; si no se define se utiliza `gemini-2.5-flash`.

No agregar `GEMINI_API_KEY` a:

- `pasa-el-dato-mobile/.env.local`;
- `app.json`;
- `EXPO_PUBLIC_*`;
- archivos versionados;
- código fuente o documentación con una clave real.

## Flujo funcional

1. La persona completa título y descripción y selecciona opcionalmente imágenes.
2. Presiona **Analizar con IA**.
3. La app envía texto e imágenes mediante `multipart/form-data` al backend autenticado.
4. El backend conserva los archivos solo en memoria durante la solicitud, los envía a Gemini y no los persiste.
5. Gemini devuelve una respuesta JSON estructurada y validada por el backend.
6. La app muestra:
   - estado de moderación: `APTA`, `REQUIERE_AJUSTES` o `BLOQUEADA`;
   - puntaje de calidad;
   - resumen, hallazgos y sugerencias;
   - botones para aplicar el título o la descripción sugerida.
7. Si Gemini devuelve `BLOQUEADA`, la publicación queda bloqueada en la interfaz hasta que el usuario modifique el contenido. Todo cambio de título, descripción o imágenes invalida el análisis anterior.

## Política de moderación

- **APTA**: no se detecta contenido de alto riesgo.
- **REQUIERE_AJUSTES**: hay información insuficiente, incoherencia o riesgo no concluyente. La app recomienda ajustes, pero no bloquea.
- **BLOQUEADA**: hay alto riesgo evidente, por ejemplo productos ilegales/peligrosos, estafas, datos personales o explotación. La interfaz impide publicar mientras ese análisis siga vigente.

Gemini es una ayuda de clasificación y calidad; no reemplaza una revisión humana ni políticas formales de la plataforma.

## Privacidad y seguridad

- El endpoint exige JWT.
- Las imágenes aceptadas son JPEG, PNG y WebP, hasta 5 archivos de 5 MB.
- El backend no registra en base de datos las imágenes ni el resultado de esta evaluación.
- No se debe enviar información personal innecesaria en la descripción o las imágenes.
- La respuesta de Gemini se trata como no confiable: el backend valida el JSON, los estados permitidos, límites de texto y rango del puntaje antes de devolverla a Expo.
- Se aplica un timeout de 20 segundos hacia Gemini y los errores no exponen la clave ni el detalle del proveedor.

## Archivos principales

### Backend

- `pasa-el-dato-back/src/mobile/ia/gemini-publicaciones.service.ts`
- `pasa-el-dato-back/src/mobile/ia/mobile-ia-publicaciones.controller.ts`
- `pasa-el-dato-back/src/mobile/mobile.module.ts`

### Aplicación móvil

- `pasa-el-dato-mobile/src/lib/api/ia-publicaciones.ts`
- `pasa-el-dato-mobile/src/components/publicar/AsistenteIaPublicacion.tsx`
- `pasa-el-dato-mobile/src/app/(tabs)/publicar.tsx`
