import Link from "next/link";
import { listThreads } from "@/lib/support";
import AutoRefresh from "@/components/AutoRefresh";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const threads = await listThreads();
  const waiting = threads.filter((t) => t.unreadForAdmin).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-7 sm:px-8 sm:py-10">
      <AutoRefresh seconds={5} />
      <PageHeader
        eyebrow="Conversations"
        icon="support"
        title="Support"
        subtitle={`${threads.length} conversation${threads.length === 1 ? "" : "s"} · ${waiting} waiting for a reply`}
      />

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        {threads.length === 0 ? (
          <p className="p-8 text-center text-sm text-zinc-500">
            No support messages yet.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {threads.map((t) => (
              <li key={t.uid}>
                <Link
                  href={`/support/${t.uid}`}
                  className="flex items-center gap-3 p-4 hover:bg-zinc-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-500">
                    {(t.userName || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-900">
                        {t.userName}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs capitalize text-zinc-500">
                        {t.userRole || "user"}
                      </span>
                      {t.unreadForAdmin && (
                        <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                          new
                        </span>
                      )}
                    </div>
                    <p className="truncate text-sm text-zinc-500">
                      {t.lastMessage}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-zinc-400">
                    {t.lastAt ? new Date(t.lastAt).toLocaleString() : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
