import { sendAnnouncementAction, toggleAnnouncementAction } from "@/app/actions";
import { getAdminDb } from "@/lib/firebaseAdmin";
import PageHeader from "@/components/PageHeader";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  title: string;
  body: string;
  severity: string;
  active: boolean;
  createdAt: string | null;
  seen: number;
};

const SEV: Record<string, { label: string; cls: string }> = {
  info: { label: "Update", cls: "bg-blue-50 text-blue-700" },
  warning: { label: "Notice", cls: "bg-amber-50 text-amber-700" },
  critical: { label: "Important", cls: "bg-red-50 text-red-700" },
};

export default async function AnnouncementsPage() {
  const db = getAdminDb();
  const snap = await db
    .collection("announcements")
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

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
        subtitle="Send a full-screen notice to every driver. It stays on their screen until each driver dismisses it."
      />

      {/* Compose */}
      <form
        action={sendAnnouncementAction}
        className="rounded-3xl border border-line bg-lifted p-7 shadow-soft"
      >
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold text-zinc-500">
            Title
          </span>
          <input
            name="title"
            required
            maxLength={80}
            placeholder="e.g. Driver strike — Thursday"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </label>

        <label className="mt-4 block text-sm">
          <span className="mb-1 block text-xs font-semibold text-zinc-500">
            Message
          </span>
          <textarea
            name="body"
            required
            rows={4}
            maxLength={600}
            placeholder="What drivers need to know…"
            className="w-full resize-y rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </label>

        <label className="mt-4 block text-sm">
          <span className="mb-1 block text-xs font-semibold text-zinc-500">
            Severity
          </span>
          <select
            name="severity"
            defaultValue="info"
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
          >
            <option value="info">Update (blue)</option>
            <option value="warning">Notice (amber)</option>
            <option value="critical">Important (red)</option>
          </select>
        </label>

        <button
          type="submit"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white"
          style={{ background: "#FF6B2C" }}
        >
          <Icon name="send" size={18} className="text-white" />
          Send to all drivers
        </button>
        <p className="mt-2 text-center text-xs text-zinc-400">
          Drivers get a push now and a full-screen notice next time they open Sift.
        </p>
      </form>

      {/* History */}
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
                    <div className="mb-1.5 flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${sev.cls}`}
                      >
                        {sev.label}
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
                      {r.seen === 1 ? "driver" : "drivers"}
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
