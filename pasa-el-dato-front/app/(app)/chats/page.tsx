import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import {
  ChatList,
  ChatEmptyState,
  ChatListSkeleton,
} from "@/components/chat";
import { getActiveChats } from "@/lib/chats";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = {
  title: "Chats | Pasa el Dato",
};

type ChatTab = "comprando" | "vendiendo";

const TABS: { id: ChatTab; label: string }[] = [
  { id: "comprando", label: "Comprando" },
  { id: "vendiendo", label: "Vendiendo" },
];

function isSellerChat(otherUserName: string): boolean {
  return otherUserName === "Tú";
}

async function ChatsContent({ tab }: { tab: ChatTab }) {
  const chats = await getActiveChats();
  const buying = chats.filter((c) => !isSellerChat(c.otherUserName));
  const selling = chats.filter((c) => isSellerChat(c.otherUserName));
  const visible = tab === "vendiendo" ? selling : buying;

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <h1 className="text-lg font-bold text-navy">Mis chats</h1>
        <Badge variant="active">{chats.length}</Badge>
      </div>

      <nav
        aria-label="Filtrar chats por rol"
        className="mb-4 flex gap-2"
      >
        {TABS.map((t) => {
          const count = t.id === "vendiendo" ? selling.length : buying.length;
          const active = t.id === tab;
          return (
            <Link
              key={t.id}
              href={t.id === "comprando" ? "/chats" : "/chats?tab=vendiendo"}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                active
                  ? "bg-navy text-white"
                  : "border border-gray-200 bg-card text-navy hover:border-gold",
              )}
            >
              {t.label}
              <Badge variant={active ? "promo" : "category"}>{count}</Badge>
            </Link>
          );
        })}
      </nav>

      {visible.length === 0 ? (
        <ChatEmptyState />
      ) : (
        <ChatList chats={visible} />
      )}
    </>
  );
}

type ChatsPageProps = {
  searchParams?: Promise<{ tab?: string }>;
};

export default async function ChatsPage(props: ChatsPageProps) {
  const searchParams = props.searchParams
    ? await props.searchParams
    : undefined;
  const tab: ChatTab =
    searchParams?.tab === "vendiendo" ? "vendiendo" : "comprando";

  return (
    <Container className="py-6">
      <Suspense key={tab} fallback={<ChatListSkeleton />}>
        <ChatsContent tab={tab} />
      </Suspense>
    </Container>
  );
}
