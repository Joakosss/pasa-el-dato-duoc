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
GEMINI_MODEL=nombre_de_un_modelo_disponible_en_tu_proyecto
```

`GEMINI_MODEL` es opcional; el código usa `gemini-3.5-flash-lite` por defecto. Comprueba en Google AI Studio que el modelo seleccionado esté disponible para tu proyecto y que tenga cuota gratuita: disponibilidad, cuotas y precios pueden cambiar.

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
7. El análisis es opcional y no bloquea la publicación, incluso si Gemini falla o devuelve `BLOQUEADA`. Las validaciones y los filtros existentes siguen aplicándose. Los cambios de título, precio, descripción o imágenes invalidan el análisis; una respuesta tardía de una versión anterior se descarta.

## Política de moderación

- **APTA**: no se detecta contenido de alto riesgo.
- **REQUIERE_AJUSTES**: hay información insuficiente, incoherencia o riesgo no concluyente. La app recomienda ajustes, pero no bloquea.
- **BLOQUEADA**: Gemini señala un posible riesgo alto. La interfaz advierte que no se recomienda publicar, pero no bloquea el envío.

Gemini es una ayuda de clasificación y calidad; no reemplaza una revisión humana ni políticas formales de la plataforma.

## Privacidad y seguridad

- El endpoint exige JWT.
- Las imágenes aceptadas son JPEG, PNG y WebP, hasta 5 archivos de 5 MB.
- El backend no registra en base de datos las imágenes ni el resultado de esta evaluación.
- No se debe enviar información personal innecesaria en la descripción o las imágenes.
- La respuesta de Gemini se trata como no confiable: el backend valida el JSON, los estados permitidos, límites de texto y rango del puntaje antes de devolverla a Expo.
- El backend espera hasta 60 segundos por intento y reintenta hasta dos veces ante respuestas 503. Los errores entregados al cliente no incluyen el detalle del proveedor.
- Según los términos de Google, el contenido enviado mediante servicios gratuitos puede usarse para mejorar sus productos. Revisar los términos, la legislación aplicable y el aviso de privacidad antes de enviar datos reales; no incluir información personal innecesaria. La app informa del envío a Google antes del análisis.

## Condiciones de despliegue mobile

- `EXPO_PUBLIC_API_URL` debe configurarse explícitamente con HTTPS fuera de desarrollo; no admite credenciales, consulta ni fragmento. En desarrollo se permite HTTP y, sin configuración, se usa la dirección del emulador Android. Esta validación no configura TLS en el servidor ni sustituye la revisión de su certificado y de la infraestructura.
- La búsqueda de publicaciones cercanas envía coordenadas al backend y el mapa utiliza Mapbox. Revisar los registros, proveedores y políticas de retención de la infraestructura antes del despliegue; no asumir que las coordenadas nunca se almacenan.
- La configuración de permisos nativos y los flujos de ubicación, análisis y recomendaciones deben comprobarse en una compilación de desarrollo y dispositivos compatibles. Las pruebas unitarias no verifican el comportamiento nativo ni el flujo completo.

## Recomendaciones mobile

`GET /api/mobile/publicaciones/recomendaciones` requiere sesión. Prioriza publicaciones activas de las categorías de los favoritos disponibles, excluye las propias y las ya marcadas como favoritas, y completa hasta ocho resultados con publicaciones recientes. Sin favoritos, muestra publicaciones recientes. Si falla la consulta, el catálogo habitual permanece disponible.

El código preparado añade un reordenamiento semántico opcional mediante vectores generados con `gemini-embedding-001`. Solo se procesa el título y la descripción de publicaciones cuyo propietario haya autorizado expresamente ese tratamiento desde el detalle de su publicación. La comparación de vectores se realiza en el backend: al consultar recomendaciones no se envían favoritos ni identificadores de cuenta a Google.

El ordenamiento se limita a los candidatos seleccionados por las reglas existentes; no busca en todo el catálogo. Requiere vectores vigentes tanto para alguna publicación favorita como para algún candidato. Si faltan vectores compatibles o la tabla no está disponible, conserva el orden por reglas. La respuesta `basadasEnIa` indica si se utilizó el orden semántico.

La autorización puede retirarse desde mobile. Una edición del título o la descripción, o el borrado lógico, elimina el registro local mediante un disparador preparado en la migración. La retirada impide usos futuros del vector local, pero no recupera información ya enviada a Google.

**Estado de despliegue:** la migración `20261120180000_mobile_consentimiento_ia` se aplicó con autorización a la base `pasaeldato` revisada el 20 de noviembre de 2026. Se verificaron la tabla y el disparador; no se autorizó automáticamente ninguna publicación. Ese día, una llamada autorizada a Gemini con texto ficticio devolvió HTTP 200 y un vector válido de 768 dimensiones. Otros entornos requieren su propio despliegue autorizado. El flujo completo de recomendaciones y la interfaz todavía requieren validación en dispositivo; la cuota gratuita efectiva y la facturación del proyecto no se han verificado. Para el diseño y sus limitaciones, consulta `docs/diseno-recomendaciones-ia-mobile.md`.

## Cuota y tratamiento de datos

Consulta los [límites activos del proyecto en Google AI Studio](https://aistudio.google.com/rate-limit) y los [precios oficiales](https://ai.google.dev/gemini-api/docs/pricing) para el modelo configurado. Los límites se aplican por proyecto, no por clave, y dependen del modelo y nivel; pueden cambiar y no garantizan disponibilidad. No se verificó aquí la cuota ni la facturación de una cuenta concreta.

Según las [condiciones de la API de Gemini](https://ai.google.dev/gemini-api/terms), Google puede usar las entradas y respuestas de servicios gratuitos para proporcionar y mejorar sus productos, y puede recurrir a revisión humana. Evita incluir información personal o sensible en textos e imágenes; informa a las personas antes de enviar contenido y revisa los términos y obligaciones legales aplicables. La documentación de precios distingue este tratamiento del correspondiente a servicios pagos; activar facturación puede generar cargos y debe revisarse antes de hacerlo.

## Archivos principales

### Backend

- `pasa-el-dato-back/src/mobile/ia/gemini-publicaciones.service.ts`
- `pasa-el-dato-back/src/mobile/ia/mobile-ia-publicaciones.controller.ts`
- `pasa-el-dato-back/src/mobile/mobile.module.ts`

### Aplicación móvil

- `pasa-el-dato-mobile/src/lib/api/ia-publicaciones.ts`
- `pasa-el-dato-mobile/src/components/publicar/AsistenteIaPublicacion.tsx`
- `pasa-el-dato-mobile/src/app/(tabs)/publicar.tsx`
