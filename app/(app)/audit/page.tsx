import { listAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const entries = await listAudit();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">
          Audit log
        </h1>
        <p className="text-sm text-zinc-500">
          Every admin mutation, newest first
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-5 py-3 font-semibold">When</th>
              <th className="px-5 py-3 font-semibold">Action</th>
              <th className="px-5 py-3 font-semibold">Target</th>
              <th className="px-5 py-3 font-semibold">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {entries.map((e) => (
              <tr key={e.id} className="hover:bg-zinc-50">
                <td className="whitespace-nowrap px-5 py-3 text-zinc-500">
                  {e.at
                    ? e.at.toLocaleString("en-ZA", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </td>
                <td className="px-5 py-3">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 font-mono text-xs text-zinc-700">
                    {e.action}
                  </span>
                </td>
                <td className="max-w-40 truncate px-5 py-3 font-mono text-xs text-zinc-500">
                  {e.target}
                </td>
                <td className="max-w-72 truncate px-5 py-3 text-xs text-zinc-500">
                  {e.details || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && (
          <div className="p-8 text-center text-sm text-zinc-500">
            Nothing yet — admin actions will appear here.
          </div>
        )}
      </div>
    </div>
  );
}
