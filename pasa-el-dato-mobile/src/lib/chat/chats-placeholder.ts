// Placeholder gráfico de la lista de chats. No hay contrato back vigente
// (el back solo expone auth, usuario, sede, escuela y carrera), así que estos
// datos viven en el cliente y son los mismos del mock temporal del front web.
// TODO: reemplazar por el listado real cuando exista el contrato de chats
// (conversaciones + mensajes + estado de lectura).
// Sin red, sin reglas de negocio.

// Rol del usuario en la conversación: determina en qué pestaña se lista.
export type RolChat = 'comprando' | 'vendiendo';

export interface ChatFeed {
  id: string;
  // "Tú" marca los chats de productos propios (misma convención que el mock
  // web): en esos casos el usuario es el vendedor.
  contraparte: string;
  productoTitulo: string;
  ultimoMensaje: string;
  // ISO 8601. Se ordena por este campo.
  ultimaFecha: string;
  noLeidos: number;
  vendido?: boolean;
}

// Verdadero cuando la conversación es de un producto que el usuario vende.
export function esChatDeVenta(chat: ChatFeed): boolean {
  return chat.contraparte === 'Tú';
}

const CHATS_PLACEHOLDER: ChatFeed[] = [
  {
    id: 'chat-1',
    contraparte: 'Camila Rojas',
    productoTitulo: 'Calculadora científica',
    ultimoMensaje: '¿Sigue disponible para mañana en sede?',
    ultimaFecha: '2026-09-09T15:30:00.000Z',
    noLeidos: 2,
  },
  {
    id: 'chat-2',
    contraparte: 'Tú',
    productoTitulo: 'Libro de redes',
    ultimoMensaje: 'Sí, disponible. ¿Puedes retirar hoy?',
    ultimaFecha: '2026-09-08T18:15:00.000Z',
    noLeidos: 0,
  },
  {
    id: 'chat-3',
    contraparte: 'Valentina Paredes',
    productoTitulo: 'Teclado mecánico',
    ultimoMensaje: 'Perfecto, nos vemos a las 12',
    ultimaFecha: '2026-09-07T12:00:00.000Z',
    noLeidos: 0,
  },
  {
    id: 'chat-4',
    contraparte: 'Tú',
    productoTitulo: 'Bicicleta aro 29',
    ultimoMensaje: 'Puedo ofrecerte 2 cuotas sin interés',
    ultimaFecha: '2026-09-06T19:45:00.000Z',
    noLeidos: 1,
  },
  {
    id: 'chat-5',
    contraparte: 'Fernanda Lira',
    productoTitulo: 'Monitor 24 pulgadas',
    ultimoMensaje: '¿Tiene pixeles muertos o detalle?',
    ultimaFecha: '2026-09-05T11:20:00.000Z',
    noLeidos: 3,
  },
  {
    id: 'chat-6',
    contraparte: 'Tú',
    productoTitulo: 'Audífonos Bluetooth',
    ultimoMensaje: 'Sí, incluyen caja de carga y cable extra',
    ultimaFecha: '2026-09-04T16:05:00.000Z',
    noLeidos: 1,
  },
  {
    id: 'chat-7',
    contraparte: 'Sofía Mendoza',
    productoTitulo: 'Mochila antirrobo',
    ultimoMensaje: '¿Puedes entregar en metro Bellavista?',
    ultimaFecha: '2026-09-03T09:40:00.000Z',
    noLeidos: 2,
  },
  {
    id: 'chat-8',
    contraparte: 'Tú',
    productoTitulo: 'Silla gamer',
    ultimoMensaje: 'Confirmado para el viernes entonces',
    ultimaFecha: '2026-09-02T14:10:00.000Z',
    noLeidos: 0,
  },
  {
    id: 'chat-9',
    contraparte: 'Antonia Vera',
    productoTitulo: 'Tablet con lápiz',
    ultimoMensaje: 'Quedo atenta a tu respuesta',
    ultimaFecha: '2026-09-01T10:25:00.000Z',
    noLeidos: 0,
  },
  {
    id: 'chat-10',
    contraparte: 'Tú',
    productoTitulo: 'Cámara réflex',
    ultimoMensaje: 'Sí, va con el lente 18-55 incluido',
    ultimaFecha: '2026-08-30T17:55:00.000Z',
    noLeidos: 0,
  },
  {
    id: 'chat-11',
    contraparte: 'Paula Núñez',
    productoTitulo: 'Guitarra acústica',
    ultimoMensaje: 'Vendida ayer, ¡gracias por tu interés!',
    ultimaFecha: '2026-08-29T13:00:00.000Z',
    noLeidos: 3,
    vendido: true,
  },
  {
    id: 'chat-12',
    contraparte: 'Tú',
    productoTitulo: 'Zapatillas running',
    ultimoMensaje: 'Vendidas, ¡gracias por tu compra!',
    ultimaFecha: '2026-08-28T08:30:00.000Z',
    noLeidos: 0,
    vendido: true,
  },
  {
    id: 'chat-13',
    contraparte: 'Daniela Flores',
    productoTitulo: 'Impresora multifuncional',
    ultimoMensaje: 'Ya se vendió esta mañana',
    ultimaFecha: '2026-08-27T20:15:00.000Z',
    noLeidos: 0,
    vendido: true,
  },
  {
    id: 'chat-14',
    contraparte: 'Tú',
    productoTitulo: 'Set herramientas 108 piezas',
    ultimoMensaje: 'Vendido, ¡gracias por tu compra!',
    ultimaFecha: '2026-08-26T12:45:00.000Z',
    noLeidos: 0,
    vendido: true,
  },
  {
    id: 'chat-15',
    contraparte: 'Javiera Salas',
    productoTitulo: 'Cuaderno iPad + funda',
    ultimoMensaje: 'Ya encontró nuevo dueño',
    ultimaFecha: '2026-08-25T18:00:00.000Z',
    noLeidos: 0,
    vendido: true,
  },
];

// Listado completo, más reciente primero.
export const CHATS: ChatFeed[] = [...CHATS_PLACEHOLDER].sort((a, b) =>
  b.ultimaFecha.localeCompare(a.ultimaFecha),
);
