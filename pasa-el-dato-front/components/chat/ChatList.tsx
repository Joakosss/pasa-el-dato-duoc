import { ChatCard } from "./ChatCard";
import type { ChatListItemTemporal } from "@/lib/chats";

export function ChatList({ chats }: { chats: ChatListItemTemporal[] }) {
  return (
    <ul aria-label="Chats activos" className="space-y-3">
      {chats.map((chat) => (
        <ChatCard key={chat.id} chat={chat} />
      ))}
    </ul>
  );
}
