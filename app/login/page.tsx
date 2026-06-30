import Image from "next/image";
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-6">
      {/* Soft brand orbit in the background */}
      <div className="pointer-events-none absolute -right-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-sift-soft blur-3xl" />
      <div className="pointer-events-none absolute -bottom-44 -left-44 h-[26rem] w-[26rem] rounded-full bg-sift-soft blur-3xl" />

      <form
        action={login}
        className="relative w-full max-w-md rounded-[2.5rem] border border-line bg-lifted p-9 shadow-card"
      >
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-line">
            <Image src="/brand/logo-full.png" alt="Sift" width={80} height={80} />
          </div>
          <span className="eyebrow mt-5">Operations</span>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tighter text-ink">
            Sift Admin
          </h1>
          <p className="mt-1.5 text-[15px] font-medium text-slate">
            Sign in to your dashboard
          </p>
        </div>

        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate">
          Username
        </label>
        <input
          name="username"
          placeholder="Leave blank for owner"
          autoComplete="username"
          className="mb-4 w-full rounded-2xl border border-line bg-white px-4 py-3 text-[15px] font-medium text-ink outline-none transition focus:border-sift"
        />

        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate">
          Password
        </label>
        <input
          type="password"
          name="password"
          placeholder="••••••••"
          autoComplete="current-password"
          autoFocus
          className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-[15px] font-medium text-ink outline-none transition focus:border-sift"
        />

        {error && (
          <p className="mt-4 rounded-2xl bg-bad-soft px-4 py-2.5 text-sm font-semibold text-bad">
            Incorrect username or password.
          </p>
        )}

        <button
          type="submit"
          className="mt-6 w-full rounded-full bg-ink py-3.5 text-base font-bold text-canvas transition hover:bg-charcoal"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
