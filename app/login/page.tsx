import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  SESSION_COOKIE,
  signSession,
  verifyPassword,
  firstPage,
  type AdminRole,
  type AdminSession,
} from "@/lib/adminAuth";

const GREEN = "#FF6B2C";

async function login(formData: FormData) {
  "use server";
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  let session: AdminSession | null = null;

  // 1) Sub-admin account (username + password).
  if (username) {
    const doc = await getAdminDb().collection("admin_users").doc(username).get();
    const u = doc.data();
    if (
      u &&
      u.active !== false &&
      typeof u.passwordHash === "string" &&
      (await verifyPassword(password, u.passwordHash))
    ) {
      session = {
        role: (u.role as AdminRole) ?? "support",
        username,
        name: (u.name as string) || username,
      };
    }
  }

  // 2) Owner fallback — the shared ADMIN_PASSWORD logs in as super-admin.
  if (!session && password && password === process.env.ADMIN_PASSWORD) {
    session = { role: "superadmin", username: username || "owner", name: "Owner" };
  }

  if (!session) redirect("/login?error=1");

  (await cookies()).set(SESSION_COOKIE, await signSession(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  redirect(firstPage(session.role));
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
      <form
        action={login}
        className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm"
      >
        <div
          className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl text-white"
          style={{ background: GREEN }}
        >
          ⚡
        </div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">
          Sift Admin
        </h1>
        <p className="mb-6 text-sm text-zinc-500">Sign in to your account.</p>

        <input
          name="username"
          placeholder="Username (leave blank for owner)"
          autoComplete="username"
          className="mb-3 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-500"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          autoComplete="current-password"
          autoFocus
          className="mb-3 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-500"
        />
        {error && (
          <p className="mb-3 text-sm text-rose-600">Incorrect username or password.</p>
        )}
        <button
          type="submit"
          className="w-full rounded-lg py-2.5 text-sm font-semibold text-white"
          style={{ background: GREEN }}
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
