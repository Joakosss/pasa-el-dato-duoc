export function ChatListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div aria-hidden="true" aria-label="Cargando chats" className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={`chat-skeleton-${i}`}
          className="flex animate-pulse items-center gap-3 rounded-xl border border-gray-200 bg-card p-4"
        >
          <div className="h-11 w-11 shrink-0 rounded-full bg-gray-200" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-1/3 rounded bg-gray-100" />
            <div className="h-3 w-2/3 rounded bg-gray-100" />
          </div>
          <div className="h-4 w-10 shrink-0 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}
