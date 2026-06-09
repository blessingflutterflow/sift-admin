import { getAdminDb } from "./firebaseAdmin";

export type AppUser = {
  uid: string;
  name: string;
  phone: string;
  email: string;
  role: "rider" | "driver" | "unknown";
  status: "none" | "pending" | "approved" | "rejected";
};

export async function listUsers(): Promise<AppUser[]> {
  const snap = await getAdminDb().collection("users").get();
  const users = snap.docs.map((d) => {
    const x = d.data();
    const role = x.role === "rider" || x.role === "driver" ? x.role : "unknown";
    return {
      uid: d.id,
      name: x.name ?? "",
      phone: x.phone ?? "",
      email: x.email ?? "",
      role,
      status: (x.status ?? "none") as AppUser["status"],
    } satisfies AppUser;
  });
  users.sort((a, b) => a.name.localeCompare(b.name));
  return users;
}
