import Link from "next/link";
import { notFound } from "next/navigation";
import { getThread } from "@/lib/support";
import SupportThread from "@/components/SupportThread";

export const dynamic = "force-dynamic";

export default async function SupportThreadPage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;
  const { thread, messages } = await getThread(uid);
  if (!thread) notFound();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-zinc-100 bg-white px-4 py-2.5">
        <Link
          href="/support"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-800"
        >
          ← All conversations
        </Link>
      </div>
      <div className="min-h-0 flex-1">
        <SupportThread
          uid={uid}
          userName={thread.userName}
          userRole={thread.userRole}
          initialMessages={messages}
        />
      </div>
    </div>
  );
}
