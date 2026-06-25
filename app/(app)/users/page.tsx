import { toggleBlockAction } from "@/app/actions";
import { listUsers, type AppUser } from "@/lib/users";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await listUsers();
  const riders = users.filter((u) => u.role === "rider").length;
  const drivers = users.filter((u) => u.role === "driver").length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Users</h1>
        <p className="text-sm text-zinc-500">
          {users.length} total · {riders} riders · {drivers} drivers
        </p>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-zinc-200 bg-white sm:block">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Contact</th>
              <th className="px-5 py-3 font-semibold">Role</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {users.map((u) => (
              <tr key={u.uid} className="hover:bg-zinc-50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} />
                    <span className="font-medium text-zinc-900">
                      {u.name || "Unnamed"}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3 text-zinc-600">
                  <div>{u.phone}</div>
                  {u.email && <div className="text-xs text-zinc-400">{u.email}</div>}
                </td>
                <td className="px-5 py-3">
                  <RoleBadge role={u.role} />
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={u.status} />
                </td>
                <td className="px-5 py-3">
                  <BlockToggle user={u} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <Empty />}
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 sm:hidden">
        {users.length === 0 && <Empty />}
        {users.map((u) => (
          <div
            key={u.uid}
            className="rounded-2xl border border-zinc-200 bg-white p-4"
          >
            <div className="flex items-center gap-3">
              <Avatar name={u.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-zinc-900">
                  {u.name || "Unnamed"}
                </p>
                <p className="truncate text-sm text-zinc-500">{u.phone}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <RoleBadge role={u.role} />
              <StatusBadge status={u.status} />
              <BlockToggle user={u} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BlockToggle({ user }: { user: AppUser }) {
  return (
    <form action={toggleBlockAction} className="inline">
      <input type="hidden" name="uid" value={user.uid} />
      <input type="hidden" name="block" value={String(!user.blocked)} />
      {user.blocked ? (
        <button className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-600 hover:bg-rose-100">
          blocked · unblock
        </button>
      ) : (
        <button className="rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-50">
          block
        </button>
      )}
    </form>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-500">
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

function RoleBadge({ role }: { role: AppUser["role"] }) {
  const styles: Record<string, string> = {
    rider: "bg-blue-50 text-blue-700",
    driver: "bg-violet-50 text-violet-700",
    unknown: "bg-zinc-100 text-zinc-500",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[role]}`}
    >
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: AppUser["status"] }) {
  const styles: Record<string, string> = {
    approved: "bg-orange-100 text-orange-700",
    pending: "bg-amber-100 text-amber-700",
    rejected: "bg-rose-100 text-rose-700",
    none: "bg-zinc-100 text-zinc-500",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[status]}`}
    >
      {status === "none" ? "active" : status}
    </span>
  );
}

function Empty() {
  return (
    <div className="p-8 text-center text-sm text-zinc-500">No users yet.</div>
  );
}
