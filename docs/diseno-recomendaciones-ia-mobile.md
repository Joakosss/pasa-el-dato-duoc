# Recomendaciones semánticas para mobile

## Alcance

Añadir una opción de recomendaciones basadas en similitud de texto utilizando
embeddings de Gemini, exclusivamente para mobile. El catálogo web y sus
contratos permanecen intactos. La versión actual por categorías y publicaciones
recientes continúa como respaldo.

## Autorización por publicación

- El propietario puede autorizar expresamente el envío a Google del título y
  descripción actuales de una publicación para generar su representación
  numérica y usarla en recomendaciones. Las imágenes, datos de cuenta e
  identificadores de usuario no se envían al proveedor.
- El aviso debe indicar que Google puede usar los datos del nivel gratuito para
  mejorar sus productos y que puede existir revisión humana. La elección es
  opcional y no afecta la publicación.
- Las publicaciones existentes y nuevas no quedan autorizadas por defecto.
  Un endpoint autenticado comprueba la propiedad de la publicación antes de
  registrar la autorización. El registro debe existir antes de la llamada a
  Google, y asociarse a una huella del título y descripción vigentes.
- El propietario puede retirar la autorización en cualquier momento desde
  mobile. La retirada elimina el vector local y evita que una respuesta tardía
  lo vuelva a guardar. Una solicitud de procesamiento que ya comenzó podría
  llegar a Google después de la retirada; no puede recuperarse contenido que
  Google ya recibió.
- Si el título o descripción cambia, la huella deja de coincidir y el vector no
  se utiliza. Se requiere una nueva autorización para el texto modificado.
  Esto aplica también a ediciones hechas desde web.
- Una autorización fallida o un error del proveedor no debe impedir crear,
  editar, consultar o eliminar la publicación.

## Recomendación y degradación

- Generar embeddings solo a partir del texto autorizado de cada publicación;
  no enviar a Google favoritos, perfiles ni identificadores.
- Comparar localmente vectores compatibles de publicaciones candidatas y de
  publicaciones favoritas autorizadas, verificando huella, modelo y dimensiones.
- Respetar visibilidad, exclusión de publicaciones propias y favoritas, y límite
  de resultados del endpoint existente.
- Con ausencia de autorización, vectores suficientes o configuración, fallos de
  proveedor o cuota agotada, mantener las recomendaciones actuales por reglas.
  No bloquear el feed ni presentar el respaldo como resultado de IA.
- Limitar datos y concurrencia, validar vectores de respuesta y no registrar
  textos, vectores ni claves en logs. Las cuotas son por proyecto y pueden
  cambiar; el nivel gratuito no garantiza capacidad ni disponibilidad.

## Persistencia y despliegue

La tabla mobile registra autorización, huella, modelo, estado de procesamiento,
identificador de operación, vector y fecha. Un identificador por intento permite
que una respuesta de Gemini se guarde únicamente si la autorización y el
contenido siguen vigentes. La migración es aditiva y **no se aplica sin
autorización expresa del responsable de la base**.

La autorización y el vector se eliminan al retirar el consentimiento o eliminar
la publicación. La huella se valida antes de cada uso; una edición no autoriza
automáticamente el texto nuevo. Los datos ya enviados a Google se rigen por sus
condiciones de servicio.

## Fuentes y límites

- [Embeddings de Gemini](https://ai.google.dev/gemini-api/docs/embeddings).
- [Precios](https://ai.google.dev/gemini-api/docs/pricing) y
  [límites de uso](https://ai.google.dev/gemini-api/docs/rate-limits).
- [Condiciones de la API](https://ai.google.dev/gemini-api/terms).
- La cuota y facturación específicas deben revisarse en
  [Google AI Studio](https://aistudio.google.com/rate-limit); no fueron
  consultadas ni verificadas en la cuenta del proyecto.

La revisión legal y de privacidad aplicable al despliegue sigue siendo
responsabilidad del proyecto; este diseño no constituye asesoría legal.
