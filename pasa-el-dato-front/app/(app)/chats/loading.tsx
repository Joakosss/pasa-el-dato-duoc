import { Container } from "@/components/layout/Container";
import { ChatListSkeleton } from "@/components/chat";

export default function ChatsLoading() {
  return (
    <Container className="py-6">
      <div className="mb-4 h-7 w-40 rounded bg-gray-100" aria-hidden="true" />
      <ChatListSkeleton />
    </Container>
  );
}
