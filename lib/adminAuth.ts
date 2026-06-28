/**
 * Lean role-based access for the admin dashboard. Pure crypto + role maps —
 * NO next/headers import here so the Edge middleware can use it too.
 *
 * Session = signed (HMAC-SHA256) cookie holding {role, username, name}. Roles
 * gate which dashboard sections a sub-admin can reach (page-level).
 */

export type AdminRole =
  | "superadmin"
  | "dispatcher"
  | "onboarding"
  | "support"
  | "finance"
  | "fleet";

export const ROLE_LABELS: Record<AdminRole, string> = {
  superadmin: "Super-admin",
  dispatcher: "Dispatcher / Operations",
  onboarding: "Driver Onboarding & Compliance",
  support: "Customer Support",
  finance: "Finance & Billing",
  fleet: "Fleet Manager (read-only)",
};

/** Allowed path prefixes per role. */
export const ROLE_NAV: Record<AdminRole, string[]> = {
  superadmin: [
    "/", "/rides", "/parcels", "/finance", "/pricing", "/zones",
    "/users", "/applications", "/verifications", "/audit", "/admins", "/drivers",
  ],
  dispatcher: ["/", "/rides", "/parcels", "/drivers"],
  onboarding: ["/applications", "/verifications", "/users", "/drivers"],
  support: ["/users", "/rides", "/parcels", "/drivers"],
  finance: ["/finance", "/pricing", "/parcels"],
  fleet: ["/", "/rides", "/drivers"],
};

export function canAccess(role: AdminRole, pathname: string): boolean {
  const allowed = ROLE_NAV[role] ?? [];
  return allowed.some((p) =>
    p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(p + "/")
  );
}

export function firstPage(role: AdminRole): string {
  return (ROLE_NAV[role] ?? ["/"])[0] ?? "/";
}

export const SESSION_COOKIE = "sift_admin_session";

export type AdminSession = {
  role: AdminRole;
  username: string;
  name: string;
};

// --- crypto (Web Crypto — works in Node 20+ and the Edge runtime) ---
const enc = new TextEncoder();

function secret(): string {
  return process.env.ADMIN_PASSWORD || "sift-dev-secret";
}

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBytes(s: string): Uint8Array {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0;
  const str = atob(s + "=".repeat(pad));
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes;
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return b64url(new Uint8Array(sig));
}

export async function signSession(s: AdminSession): Promise<string> {
  const payload = b64url(enc.encode(JSON.stringify(s)));
  return `${payload}.${await hmac(payload)}`;
}

export async function verifySession(
  token: string | undefined
): Promise<AdminSession | null> {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  if (sig !== (await hmac(payload))) return null;
  try {
    const s = JSON.parse(
      new TextDecoder().decode(b64urlToBytes(payload))
    ) as AdminSession;
    return s.role ? s : null;
  } catch {
    return null;
  }
}

// --- password hashing (PBKDF2 via Web Crypto) ---
async function derive(pw: string, salt: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(pw),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 100000, hash: "SHA-256" },
    key,
    256
  );
  return new Uint8Array(bits);
}

export async function hashPassword(pw: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `${b64url(salt)}:${b64url(await derive(pw, salt))}`;
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [saltB, hashB] = stored.split(":");
  if (!saltB || !hashB) return false;
  return b64url(await derive(pw, b64urlToBytes(saltB))) === hashB;
}
