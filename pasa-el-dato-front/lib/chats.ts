// TODO: reemplazar por fetch real al backend cuando exista contrato de chats.
// Por ahora datos mock deterministas para habilitar lista + empty sin inventar API.
export interface ChatListItem {
  id: string;
  otherUserName: string;
  productTitle: string;
  lastMessagePreview: string;
  lastMessageAt: string;
  unreadCount: number;
  sold?: boolean;
}

const MOCK_CHATS: ChatListItem[] = [
  {
    id: "chat-1",
    otherUserName: "Camila Rojas",
    productTitle: "Calculadora científica",
    lastMessagePreview: "¿Sigue disponible para mañana en sede?",
    lastMessageAt: "2026-09-09T15:30:00.000Z",
    unreadCount: 2,
  },
  {
    id: "chat-2",
    otherUserName: "Tú",
    productTitle: "Libro de redes",
    lastMessagePreview: "Sí, disponible. ¿Puedes retirar hoy?",
    lastMessageAt: "2026-09-08T18:15:00.000Z",
    unreadCount: 0,
  },
  {
    id: "chat-3",
    otherUserName: "Valentina Paredes",
    productTitle: "Teclado mecánico",
    lastMessagePreview: "Perfecto, nos vemos a las 12",
    lastMessageAt: "2026-09-07T12:00:00.000Z",
    unreadCount: 0,
  },
  {
    id: "chat-4",
    otherUserName: "Tú",
    productTitle: "Bicicleta aro 29",
    lastMessagePreview: "Puedo ofrecerte 2 cuotas sin interés",
    lastMessageAt: "2026-09-06T19:45:00.000Z",
    unreadCount: 1,
  },
  {
    id: "chat-5",
    otherUserName: "Fernanda Lira",
    productTitle: "Monitor 24 pulgadas",
    lastMessagePreview: "¿Tiene pixeles muertos o detalle?",
    lastMessageAt: "2026-09-05T11:20:00.000Z",
    unreadCount: 3,
  },
  {
    id: "chat-6",
    otherUserName: "Tú",
    productTitle: "Audífonos Bluetooth",
    lastMessagePreview: "Sí, incluyen caja de carga y cable extra",
    lastMessageAt: "2026-09-04T16:05:00.000Z",
    unreadCount: 1,
  },
  {
    id: "chat-7",
    otherUserName: "Sofía Mendoza",
    productTitle: "Mochila antirrobo",
    lastMessagePreview: "¿Puedes entregar en metro Bellavista?",
    lastMessageAt: "2026-09-03T09:40:00.000Z",
    unreadCount: 2,
  },
  {
    id: "chat-8",
    otherUserName: "Tú",
    productTitle: "Silla gamer",
    lastMessagePreview: "Confirmado para el viernes entonces",
    lastMessageAt: "2026-09-02T14:10:00.000Z",
    unreadCount: 0,
  },
  {
    id: "chat-9",
    otherUserName: "Antonia Vera",
    productTitle: "Tablet con lápiz",
    lastMessagePreview: "Quedo atenta a tu respuesta",
    lastMessageAt: "2026-09-01T10:25:00.000Z",
    unreadCount: 0,
  },
  {
    id: "chat-10",
    otherUserName: "Tú",
    productTitle: "Cámara réflex",
    lastMessagePreview: "Sí, va con el lente 18-55 incluido",
    lastMessageAt: "2026-08-30T17:55:00.000Z",
    unreadCount: 0,
  },
  {
    id: "chat-11",
    otherUserName: "Paula Núñez",
    productTitle: "Guitarra acústica",
    lastMessagePreview: "Vendida ayer, ¡gracias por tu interés!",
    lastMessageAt: "2026-08-29T13:00:00.000Z",
    unreadCount: 3,
    sold: true,
  },
  {
    id: "chat-12",
    otherUserName: "Tú",
    productTitle: "Zapatillas running",
    lastMessagePreview: "Vendidas, ¡gracias por tu compra!",
    lastMessageAt: "2026-08-28T08:30:00.000Z",
    unreadCount: 0,
    sold: true,
  },
  {
    id: "chat-13",
    otherUserName: "Daniela Flores",
    productTitle: "Impresora multifuncional",
    lastMessagePreview: "Ya se vendió esta mañana",
    lastMessageAt: "2026-08-27T20:15:00.000Z",
    unreadCount: 0,
    sold: true,
  },
  {
    id: "chat-14",
    otherUserName: "Tú",
    productTitle: "Set herramientas 108 piezas",
    lastMessagePreview: "Vendido, ¡gracias por tu compra!",
    lastMessageAt: "2026-08-26T12:45:00.000Z",
    unreadCount: 0,
    sold: true,
  },
  {
    id: "chat-15",
    otherUserName: "Javiera Salas",
    productTitle: "Cuaderno iPad + funda",
    lastMessagePreview: "Ya encontró nuevo dueño",
    lastMessageAt: "2026-08-25T18:00:00.000Z",
    unreadCount: 0,
    sold: true,
  },
];

interface GetActiveChatsOptions {
  empty?: boolean;
}

export async function getActiveChats(
  options: GetActiveChatsOptions = {},
): Promise<ChatListItem[]> {
  if (options.empty) return [];
  return [...MOCK_CHATS].sort((a, b) =>
    b.lastMessageAt.localeCompare(a.lastMessageAt),
  );
}
