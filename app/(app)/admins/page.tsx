import {
  createAdminAction,
  toggleAdminAction,
  deleteAdminAction,
} from "@/app/actions";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { ROLE_LABELS, type AdminRole } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const GREEN = "#FF6B2C";

const ASSIGNABLE: AdminRole[] = [
  "dispatcher", "onboarding", "support", "finance", "fleet", "superadmin",
];

type AdminRow = { username: string; name: string; role: AdminRole; active: boolean };

async function loadAdmins(): Promise<AdminRow[]> {
  const snap = await getAdminDb().collection("admin_users").get();
  return snap.docs
    .map((d) => {
      const x = d.data();
      return {
        username: d.id,
        name: String(x.name ?? d.id),
        role: (x.role as AdminRole) ?? "support",
        active: x.active !== false,
      };
    })
    .sort((a, b) => a.username.localeCompare(b.username));
}

export default async function AdminsPage() {
  const admins = await loadAdmins();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">
          Admins
        </h1>
        <p className="text-sm text-zinc-500">
          Staff accounts. Each role only sees the sections it needs. The owner
          login (shared password) is always a super-admin.
        </p>
      </div>

      {/* Add */}
      <form
        action={createAdminAction}
        className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6"
      >
        <h2 className="mb-3 text-sm font-bold text-zinc-900">Add a sub-admin</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Username" name="username" placeholder="jane" />
          <Field label="Full name" name="name" placeholder="Jane Doe" />
          <Field label="Password (min 6)" name="password" type="password" placeholder="••••••" />
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold text-zinc-500">
              Role
            </span>
            <select
              name="role"
              defaultValue="support"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
            >
              {ASSIGNABLE.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          className="mt-5 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
          style={{ background: GREEN }}
        >
          Create admin
        </button>
      </form>

      {/* List */}
      <div className="rounded-2xl border border-zinc-200 bg-white">
        {admins.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500">
            No sub-admins yet. The owner password still works as super-admin.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {admins.map((a) => (
              <li key={a.username} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-900">{a.name}</span>
                    <span className="text-sm text-zinc-400">@{a.username}</span>
                    {!a.active && (
                      <span className="text-xs text-zinc-400">disabled</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">{ROLE_LABELS[a.role]}</p>
                </div>
                <form action={toggleAdminAction}>
                  <input type="hidden" name="username" value={a.username} />
                  <input type="hidden" name="active" value={(!a.active).toString()} />
                  <button className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50">
                    {a.active ? "Disable" : "Enable"}
                  </button>
                </form>
                <form action={deleteAdminAction}>
                  <input type="hidden" name="username" value={a.username} />
                  <button className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50">
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-semibold text-zinc-500">
        {label}
      </span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required
        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
      />
    </label>
  );
}
