import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/cn";
import type { ChatListItem } from "@/lib/chats";

type ChatState = "pending" | "sold" | "waiting";

function getChatState(chat: ChatListItem): ChatState {
  if (chat.sold) return "sold";
  if (chat.unreadCount > 0) return "pending";
  return "waiting";
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
}

const STATE_STYLES: Record<ChatState, string> = {
  pending: "border-green-200 bg-green-50/60",
  sold: "border-gray-200 bg-gray-100/60 opacity-70",
  waiting: "border-gray-200 bg-card",
};

export function ChatCard({ chat }: { chat: ChatListItem }) {
  const state = getChatState(chat);
  const isSeller = chat.otherUserName === "Tú";

  return (
    <li>
      <Link
        href={`/chats/${chat.id}`}
        aria-label={
          isSeller
            ? `Abrir chat de tu producto ${chat.productTitle}`
            : `Abrir chat sobre ${chat.productTitle} con ${chat.otherUserName}`
        }
        className={cn(
          "card-hover flex items-center gap-3 rounded-xl border p-4 transition hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
          STATE_STYLES[state],
          isSeller && "border-l-4 border-l-gold",
        )}
      >
        <Avatar name={chat.productTitle} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-navy">
              {chat.productTitle}
            </p>
            <span className="shrink-0 text-xs text-gray-400">
              {formatDate(chat.lastMessageAt)}
            </span>
          </div>
          <p
            className={cn(
              "flex items-center gap-1 truncate text-xs",
              isSeller ? "font-semibold text-navy" : "text-gray-500",
            )}
          >
            {isSeller ? (
              <span
                aria-hidden="true"
                className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
              />
            ) : null}
            {chat.otherUserName}
          </p>
          <p className="mt-0.5 truncate text-sm text-gray-500">
            {chat.lastMessagePreview}
          </p>
        </div>
        {state === "pending" ? (
          <Badge variant="active" className="shrink-0 rounded-full">
            {chat.unreadCount}
          </Badge>
        ) : null}
        {state === "sold" ? (
          <Badge variant="reported" className="shrink-0 rounded-full">
            Vendido
          </Badge>
        ) : null}
      </Link>
    </li>
  );
}
