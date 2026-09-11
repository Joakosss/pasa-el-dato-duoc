type Block =
  | { type: "p"; text: string }
  | { type: "ul" | "ol"; items: string[] };

type Section = {
  id: string;
  title: string;
  blocks: Block[];
};

const SECTIONS: Section[] = [
  {
    id: "que-es",
    title: "1. Naturaleza del servicio",
    blocks: [
      {
        type: "p",
        text: "Pasa el Dato Duoc corresponde a un marketplace cerrado y verificado, destinado exclusivamente a estudiantes de Duoc UC. Su finalidad es formalizar el comercio que actualmente se desarrolla a través de mensajería informal, dotándolo de trazabilidad, moderación y un sistema de mensajería que no exige la exposición del número telefónico.",
      },
      {
        type: "p",
        text: "El servicio comprende:",
      },
      {
        type: "ul",
        items: [
          "Publicación de avisos con fotografías.",
          "Búsqueda por sede, categoría y modalidad de venta.",
          "Mensajería en tiempo real.",
          "Sistema de calificaciones.",
          "Panel de administración y espacios publicitarios que financian la plataforma.",
        ],
      },
      {
        type: "p",
        text: "Es preciso señalar lo que el servicio no comprende: no se procesan pagos, no se efectúan despachos ni se realiza verificación presencial de los productos. El pago y la entrega se pactan fuera de la plataforma, bajo exclusiva responsabilidad de las partes. Deberá verificarse el producto en persona con anterioridad a efectuar cualquier pago.",
      },
    ],
  },
  {
    id: "tu-cuenta",
    title: "2. De la cuenta",
    blocks: [
      {
        type: "p",
        text: "El acceso se encuentra reservado a estudiantes con correo institucional @duocuc.cl activo, validado mediante token. La cuenta es personal e intransferible, y su titularidad exige ser mayor de 18 años; tratándose de estudiantes menores de edad debidamente matriculados, la utilización requerirá la autorización del apoderado. Se prohíbe la suplantación de identidad, la duplicidad de cuentas y la cesión de credenciales de acceso. La autenticación se resguarda mediante hash Argon2 y tokens JWT. El usuario será responsable de toda actividad realizada bajo su sesión. La recuperación de clave se efectúa a través del correo institucional.",
      },
      {
        type: "p",
        text: "La cuenta podrá ser suspendida en caso de registro de datos falsos, multiplicidad de cuentas o evasión de bloqueos.",
      },
    ],
  },
  {
    id: "que-puedes-publicar",
    title: "3. Contenido permitido en las publicaciones",
    blocks: [
      {
        type: "p",
        text: "Únicamente se admite la publicación de bienes y servicios lícitos propios de la economía circular estudiantil: libros, apuntes de autoría propia, insumos, tecnología, vestuario y tutorías lícitas.",
      },
      {
        type: "p",
        text: "El título, el precio en pesos chilenos (CLP), el estado declarado y las fotografías deberán corresponder fielmente a lo ofrecido. No se admitirá spam ni la publicación masiva de avisos duplicados.",
      },
      {
        type: "p",
        text: "Se encuentra absolutamente prohibido:",
      },
      {
        type: "ul",
        items: [
          "Drogas, fármacos, alcohol y tabaco.",
          "Armas.",
          "Pornografía y servicios sexuales.",
          "Venta de trabajos académicos, evaluaciones o certificados.",
          "Productos robados, falsificados o pirateados.",
          "Datos personales de terceros.",
          "Préstamos y criptoactivos.",
          "Mascotas.",
          "Todo contenido contrario a la legislación chilena o al Reglamento de Convivencia de Duoc UC.",
        ],
      },
      {
        type: "p",
        text: "La plataforma dispone de filtrado automático y revisión administrativa. La evasión de dichos mecanismos mediante artificios constituirá falta grave.",
      },
    ],
  },
  {
    id: "fotos",
    title: "4. Fotografías e imágenes",
    blocks: [
      {
        type: "p",
        text: "Léase con atención. Con el objeto de proteger al usuario, a terceros y a la institución frente a eventuales acciones por vulneración del derecho a la propia imagen (artículo 19 N° 4 de la Constitución Política de la República, Ley N° 17.336, Ley N° 19.628 y Ley N° 21.719), al publicar cada fotografía se declara lo siguiente:",
      },
      {
        type: "ol",
        items: [
          "Haberla capturado personalmente o contar con autorización escrita de su autor.",
          "Ser propietario del objeto ofrecido o hallarse facultado para su venta.",
          "Contar con el consentimiento de toda persona identificable para su publicación en esta plataforma.",
          "No corresponder a imágenes obtenidas de internet, marketplaces o catálogos.",
        ],
      },
      {
        type: "p",
        text: "Absténgase de publicar:",
      },
      {
        type: "ul",
        items: [
          "Fotografías de terceros sin su consentimiento.",
          "Menores de edad identificables.",
          "Cédulas de identidad, RUT, patentes vehiculares, boletas, direcciones u otros datos identificatorios.",
          "Imágenes de contenido íntimo.",
          "Interiores que expongan accesos o elementos de seguridad.",
          "Logotipos o signos que presenten una réplica como producto original.",
        ],
      },
      {
        type: "p",
        text: "Se recomienda utilizar fotografías propias, sin personas, sin reflejos en espejos y sin fondos que exhiban datos personales.",
      },
      {
        type: "p",
        text: "Licencia de uso otorgada: mediante la publicación se autoriza a GeisCorp y a Duoc UC a almacenar, exhibir, recortar, moderar (manual y automatizadamente, incluso con inteligencia artificial) y reutilizar el material con fines académicos, institucionales o de defensa jurídica, dentro del territorio nacional, a título gratuito, mientras el aviso se mantenga activo y hasta dos años después, para fines de registro y prueba. El usuario conserva la titularidad, otorgándose únicamente la autorización de uso necesaria para la operación del servicio y su defensa.",
      },
      {
        type: "p",
        text: "Ante reclamos de terceros, se procederá a la remoción del contenido dentro de 24 a 48 horas hábiles, canalizados a privacidad@duocuc.cl. El usuario responderá e indemnizará a GeisCorp y a Duoc UC por reclamaciones relativas a derechos de imagen o plagio. La plataforma actúa como intermediaria y no efectúa revisión previa de la totalidad del contenido.",
      },
      {
        type: "p",
        text: "La oferta de falsificaciones presentadas como productos originales dará lugar al bloqueo inmediato de la cuenta.",
      },
    ],
  },
  {
    id: "chat-convivencia",
    title: "5. Mensajería, ubicación y normas de convivencia",
    blocks: [
      {
        type: "p",
        text: "La mensajería tiene por única finalidad la coordinación de transacciones. Se prohíben el acoso, las amenazas, la difamación pública, la divulgación no autorizada de datos personales, el envío de imágenes íntimas, el spam y la solicitud de claves o datos bancarios. El sistema de filtrado se aplica igualmente a los mensajes.",
      },
      {
        type: "p",
        text: "Deberá coordinarse exclusivamente en los puntos seguros sugeridos (campus y comunas indicadas), en horario diurno. Absténgase de compartir el RUT completo o credenciales de acceso. No se garantiza la seguridad física de los encuentros presenciales. El Reglamento de Convivencia de Duoc UC rige asimismo en el entorno digital. Las calificaciones deberán emitirse con veracidad, absteniéndose de expresiones injuriosas.",
      },
    ],
  },
  {
    id: "reportes-sanciones",
    title: "6. Reportes y sanciones",
    blocks: [
      {
        type: "p",
        text: "Ante la detección de contenido o conductas indebidas, deberá utilizarse la función Reportar publicación o usuario. La administración se encuentra facultada para: emitir advertencias, remover avisos, suspender temporalmente o bloquear definitivamente cuentas, y escalar los antecedentes a Duoc UC.",
      },
      {
        type: "p",
        text: "Los hechos de especial gravedad (delitos, fraude, acoso sexual, suplantación de identidad) darán lugar al bloqueo inmediato, conservándose la evidencia para su entrega a la autoridad competente. Podrá interponerse apelación dentro del plazo de 5 días, desde el correo institucional registrado.",
      },
    ],
  },
  {
    id: "privacidad",
    title: "7. Privacidad y protección de datos personales",
    blocks: [
      {
        type: "p",
        text: "Responsable del tratamiento: GeisCorp, por encargo de Duoc UC.",
      },
      {
        type: "p",
        text: "Datos tratados: nombre, correo @duocuc.cl, sede y carrera, perfil, avisos y fotografías, favoritos, reportes, ubicación definida por el usuario, mensajes, IP, dispositivo y registros de auditoría.",
      },
      {
        type: "p",
        text: "Finalidades: operación del servicio, prevención del fraude, moderación, trazabilidad y analítica agregada, así como publicidad segmentada por sede. Los datos no son objeto de venta.",
      },
      {
        type: "p",
        text: "Derechos conferidos por la Ley N° 21.719: acceso, rectificación, cancelación, oposición y portabilidad, ejercibles ante privacidad@duocuc.cl, con respuesta dentro de 15 días hábiles, sin perjuicio del reclamo ante la Agencia de Protección de Datos. La cuenta podrá cerrarse en cualquier momento; no obstante, los registros de bloqueo y auditoría se conservarán por 2 años con fines de defensa jurídica. La protección se implementa mediante HTTPS/TLS, WSS y Argon2; ningún sistema es completamente infalible, por lo que se recomienda no reutilizar contraseñas.",
      },
    ],
  },
  {
    id: "compras",
    title: "8. Transacciones entre estudiantes",
    blocks: [
      {
        type: "p",
        text: "El contrato de compraventa se celebra exclusivamente entre comprador y vendedor. La plataforma no es parte de este, no retiene dinero ni garantiza la calidad o entrega de los productos. Deberán revisarse los antecedentes, formularse las consultas pertinentes y recabarse evidencia (fotografías y registros de mensajería) con anterioridad al pago. El servicio se provee “en el estado en que se encuentra”, con una meta de disponibilidad continua, sin garantía frente a interrupciones de los proveedores de infraestructura o mantenciones del proyecto Capstone. Los espacios publicitarios de terceros constituyen publicidad y no implican aval institucional de Duoc UC, salvo indicación expresa en contrario.",
      },
    ],
  },
  {
    id: "cambios-ley",
    title: "9. Modificaciones, terminación y legislación aplicable",
    blocks: [
      {
        type: "p",
        text: "La cuenta podrá eliminarse desde Perfil > Eliminar. La plataforma podrá poner término al servicio por incumplimiento de los presentes términos. Las modificaciones serán comunicadas con 7 días de antelación por correo electrónico o notificación; la utilización posterior implicará su aceptación. Resulta aplicable la legislación chilena, con domicilio en la ciudad de Santiago y sometimiento a sus tribunales ordinarios de justicia. La eventual nulidad de alguna cláusula no afectará la validez de las restantes.",
      },
    ],
  },
];

export function TermsContent() {
  return (
    <div>
      {SECTIONS.map((section) => (
        <section key={section.id} aria-labelledby={section.id} className="mt-8 first:mt-6">
          <h2 id={section.id} className="text-lg font-semibold text-navy">
            {section.title}
          </h2>
          <div className="mt-3 space-y-3">
            {section.blocks.map((block, i) =>
              block.type === "p" ? (
                <p key={i} className="text-sm leading-relaxed text-gray-600">
                  {block.text}
                </p>
              ) : block.type === "ul" ? (
                <ul key={i} className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-gray-600">
                  {block.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <ol key={i} className="list-decimal space-y-1 pl-5 text-sm leading-relaxed text-gray-600">
                  {block.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              ),
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
