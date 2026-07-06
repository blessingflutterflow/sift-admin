import { toggleAnnouncementAction } from "@/app/actions";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { listUsers } from "@/lib/users";
import PageHeader from "@/components/PageHeader";
import AnnouncementComposer, {
  type PickUser,
} from "@/components/AnnouncementComposer";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  title: string;
  body: string;
  severity: string;
  audience: string;
  targetCount: number;
  active: boolean;
  createdAt: string | null;
  seen: number;
};

const SEV: Record<string, { label: string; cls: string }> = {
  info: { label: "Update", cls: "bg-blue-50 text-blue-700" },
  warning: { label: "Notice", cls: "bg-amber-50 text-amber-700" },
  critical: { label: "Important", cls: "bg-red-50 text-red-700" },
};

function audienceLabel(a: string, n: number): string {
  switch (a) {
    case "all_riders":
      return "All riders";
    case "everyone":
      return "Everyone";
    case "specific":
      return `${n} ${n === 1 ? "person" : "people"}`;
    default:
      return "All drivers";
  }
}

export default async function AnnouncementsPage() {
  const db = getAdminDb();
  const [snap, users] = await Promise.all([
    db.collection("announcements").orderBy("createdAt", "desc").limit(50).get(),
    listUsers(),
  ]);

  const pickUsers: PickUser[] = users.map((u) => ({
    uid: u.uid,
    name: u.name,
    phone: u.phone,
    role: u.role,
  }));

  const rows: Row[] = await Promise.all(
    snap.docs.map(async (d) => {
      const m = d.data();
      const seen = (await d.ref.collection("reads").count().get()).data().count;
      const ts = m.createdAt?.toDate?.() as Date | undefined;
      return {
        id: d.id,
        title: String(m.title ?? ""),
        body: String(m.body ?? ""),
        severity: String(m.severity ?? "info"),
        audience: String(m.audience ?? "all_drivers"),
        targetCount: Array.isArray(m.targetUids) ? m.targetUids.length : 0,
        active: m.active !== false,
        createdAt: ts
          ? ts.toLocaleString("en-ZA", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })
          : null,
        seen,
      };
    })
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-7 sm:px-8 sm:py-10">
      <PageHeader
        eyebrow="Broadcast"
        icon="announcements"
        title="Announcements"
        subtitle="Send a full-screen notice to drivers, riders, or specific people. It stays on their screen until each one dismisses it."
      />

      <AnnouncementComposer users={pickUsers} />

      <h2 className="mb-3 mt-9 text-sm font-bold text-zinc-900">Sent</h2>
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-line bg-lifted p-6 text-sm text-slate">
          No announcements yet.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const sev = SEV[r.severity] ?? SEV.info;
            return (
              <div
                key={r.id}
                className="rounded-2xl border border-line bg-lifted p-5 shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${sev.cls}`}
                      >
                        {sev.label}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-600">
                        {audienceLabel(r.audience, r.targetCount)}
                      </span>
                      {!r.active && (
                        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-bold text-zinc-500">
                          Paused
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-ink">{r.title}</p>
                    <p className="mt-0.5 text-sm text-slate line-clamp-2">
                      {r.body}
                    </p>
                    <p className="mt-2 text-xs text-zinc-400">
                      {r.createdAt ?? "—"} · Seen by {r.seen}{" "}
                      {r.seen === 1 ? "person" : "people"}
                    </p>
                  </div>

                  <form action={toggleAnnouncementAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <input
                      type="hidden"
                      name="active"
                      value={(!r.active).toString()}
                    />
                    <button
                      type="submit"
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold ${
                        r.active
                          ? "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                          : "bg-sift-soft text-sift"
                      }`}
                    >
                      {r.active ? "Pause" : "Reactivate"}
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
