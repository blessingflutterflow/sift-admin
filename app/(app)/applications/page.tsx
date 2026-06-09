import { listApplications, type Application } from "@/lib/applications";
import { reviewAction } from "@/app/actions";

export const dynamic = "force-dynamic";

const GREEN = "#35C77A";

export default async function ApplicationsPage() {
  const apps = await listApplications();
  const pending = apps.filter((a) => a.status === "pending");
  const reviewed = apps.filter((a) => a.status !== "pending");

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">
          Applications
        </h1>
        <p className="text-sm text-zinc-500">
          {pending.length} waiting for review
        </p>
      </div>

      <Section title="Pending review" count={pending.length}>
        {pending.length === 0 ? (
          <Empty label="No applications waiting for review." />
        ) : (
          pending.map((a) => <Card key={a.uid} app={a} />)
        )}
      </Section>

      {reviewed.length > 0 && (
        <Section title="Reviewed" count={reviewed.length}>
          {reviewed.map((a) => (
            <Card key={a.uid} app={a} />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        {title} ({count})
      </h2>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
      {label}
    </div>
  );
}

function StatusBadge({ status }: { status: Application["status"] }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-rose-100 text-rose-700",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function Card({ app }: { app: Application }) {
  const vehicle = app.vehicle ?? {};
  const docs = Object.entries(app.documents ?? {});

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-lg font-bold text-zinc-500">
          {(app.name || "?").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">
              {app.name || "Unnamed driver"}
            </h3>
            <StatusBadge status={app.status} />
          </div>
          <p className="text-sm text-zinc-500">
            {app.phone}
            {app.email ? ` · ${app.email}` : ""}
          </p>
          {app.submittedAt && (
            <p className="mt-0.5 text-xs text-zinc-400">
              Submitted {new Date(app.submittedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
        <Field label="Make" value={vehicle.make} />
        <Field label="Model" value={vehicle.model} />
        <Field label="Year" value={vehicle.year} />
        <Field label="Plate" value={vehicle.plate} />
        <Field label="Colour" value={vehicle.color} />
      </div>

      {docs.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Documents
          </p>
          <div className="flex flex-wrap gap-2">
            {docs.map(([type, url]) => (
              <a
                key={type}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50"
              >
                📄 {type.replace(/_/g, " ")}
              </a>
            ))}
          </div>
        </div>
      )}

      {app.status === "rejected" && app.rejectionReason && (
        <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          Reason: {app.rejectionReason}
        </p>
      )}

      {app.status === "pending" && (
        <div className="mt-5 flex flex-col gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:items-center">
          <form action={reviewAction} className="flex flex-1 items-center gap-2">
            <input type="hidden" name="uid" value={app.uid} />
            <input type="hidden" name="intent" value="reject" />
            <input
              name="reason"
              placeholder="Reason for rejection…"
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />
            <button
              type="submit"
              className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
            >
              Reject
            </button>
          </form>
          <form action={reviewAction}>
            <input type="hidden" name="uid" value={app.uid} />
            <input type="hidden" name="intent" value="approve" />
            <button
              type="submit"
              className="rounded-lg px-5 py-2 text-sm font-semibold text-white"
              style={{ background: GREEN }}
            >
              Approve
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <span className="text-zinc-400">{label}: </span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}
