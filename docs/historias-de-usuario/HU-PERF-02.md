# HU-PERF-02 — Actualizar mi perfil

**Como** usuario autenticado  
**quiero** actualizar mi teléfono y mi sede  
**para** mantener vigentes mis datos de contacto y ubicación dentro de la plataforma.

## Criterios de aceptación

- **Dado** sesión válida y datos válidos,
  **cuando** confirmo la actualización,
  **entonces** el sistema guarda los campos enviados y muestra el perfil con los nuevos valores.

- **Dado** sesión válida,
  **cuando** intento actualizar teléfono o sede,
  **entonces** el sistema modifica mi propia cuenta y ningún otro dato; RUN, nombres, apellidos, correo, carrera y rol permanecen sin cambios.

- **Dado** sin sesión válida,
  **cuando** intento actualizar mi perfil,
  **entonces** el sistema rechaza la operación por autenticación requerida.

- **Dado** que envío solo el teléfono,
  **cuando** confirmo la actualización,
  **entonces** el sistema actualiza el teléfono y mantiene la sede sin cambios.

- **Dado** que envío solo la sede,
  **cuando** confirmo la actualización,
  **entonces** el sistema actualiza la sede y mantiene el teléfono sin cambios. No se exige reenviar el teléfono.

- **Dado** que no envío ningún campo,
  **cuando** confirmo la actualización,
  **entonces** el sistema no modifica datos y responde que no existen cambios para guardar.

- **Dado** un teléfono que no cumple el formato chileno definido (8 dígitos),
  **cuando** confirmo la actualización,
  **entonces** el sistema rechaza el cambio e indica el campo inválido, conservando el teléfono anterior.

- **Dado** una sede inexistente o no disponible en el catálogo,
  **cuando** confirmo la actualización,
  **entonces** el sistema rechaza el cambio por sede inválida, conservando la sede anterior.

- **Dado** que actualizo el perfil,
  **cuando** consulto mi perfil (HU-PERF-01),
  **entonces** veo los valores actualizados y nunca datos de autenticación sensibles.

## Reglas de negocio

- Solo un usuario autenticado actualiza su propio perfil.
- Campos editables: teléfono y sede. Sin nombres, apellidos, correo, RUN, carrera ni rol.
- Actualización parcial permitida: teléfono y sede se envían de forma independiente y opcional por campo.
- Si no se envía ningún campo, no se modifica nada.
- El teléfono es obligatorio como dato del perfil, con formato chileno de 8 dígitos, igual que en el registro (HU-REG-01).
- La sede se puede cambiar libremente entre las sedes existentes y disponibles del catálogo. No se aplican restricciones por región, ciudad, comuna, carrera u otra condición.
- Sede o teléfono inválidos: se rechaza el cambio y se conserva el valor anterior.
- Fotografía de perfil fuera de alcance; sin campo, modelo, almacenamiento ni endpoint.
- Auditoría de cambios de perfil fuera de alcance; sin tabla, registro, endpoint ni interfaz.
- Datos de autenticación sensibles no se exponen ni se editan.
- El modelo vigente separa `cuenta` y `usuario`; no se crea una tabla perfil.

## Dependencias

- HU-PERF-01 (consulta de perfil).
- HU-REG-01 (formato de teléfono y catálogo de sedes).
- CU004 y `docs/requerimientos/perfil-usuario.md`.

## Fuera de alcance

- Edición de nombres, apellidos, correo, RUN, carrera o rol.
- Fotografía de perfil.
- Auditoría de cambios de perfil.

## Prioridad

**Alta**

CU004 cubre actualización; completa la gestión de perfil iniciada en HU-PERF-01.

## Dudas pendientes

- Ninguna bloqueante.
- Nota: si R.33 exige auditoría obligatoria para toda modificación de datos de usuario, se debe crear una historia específica de auditoría antes de implementar. No bloquea esta HU mientras la auditoría siga fuera de alcance.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`.
