import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const GREEN = "#35C77A";

async function login(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  if (password && password === process.env.ADMIN_PASSWORD) {
    (await cookies()).set("sift_admin_auth", "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours
    });
    redirect("/applications");
  }
  redirect("/login?error=1");
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
        <p className="mb-6 text-sm text-zinc-500">Sign in to review drivers.</p>

        <input
          type="password"
          name="password"
          placeholder="Admin password"
          autoFocus
          className="mb-3 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-zinc-500"
        />
        {error && (
          <p className="mb-3 text-sm text-rose-600">Incorrect password.</p>
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
