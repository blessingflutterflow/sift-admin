"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toggleBlockAction } from "@/app/actions";
import type { AppUser } from "@/lib/users";

const GREEN = "#FF6B2C";
type Tab = "all" | "rider" | "driver";

export default function UsersTable({ users }: { users: AppUser[] }) {
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");

  const counts = useMemo(
    () => ({
      all: users.length,
      rider: users.filter((u) => u.role === "rider").length,
      driver: users.filter((u) => u.role === "driver").length,
    }),
    [users]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return users.filter((u) => {
      if (tab !== "all" && u.role !== tab) return false;
      if (!needle) return true;
      return (
        u.name.toLowerCase().includes(needle) ||
        u.phone.toLowerCase().includes(needle) ||
        u.email.toLowerCase().includes(needle) ||
        u.plate.toLowerCase().includes(needle)
      );
    });
  }, [users, tab, q]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-xl bg-zinc-100 p-1">
          {(["all", "rider", "driver"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold capitalize transition ${
                tab === t ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
              }`}
            >
              {t === "all" ? "All" : `${t}s`} ({counts[t]})
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, phone or plate…"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 sm:w-72"
        />
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-zinc-200 bg-white sm:block">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Contact</th>
              <th className="px-5 py-3 font-semibold">Vehicle / Plate</th>
              <th className="px-5 py-3 font-semibold">Role</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.map((u) => (
              <tr key={u.uid} className="hover:bg-zinc-50">
                <td className="px-5 py-3">
                  <Link
                    href={`/users/${u.uid}`}
                    className="flex items-center gap-3 font-medium text-zinc-900 hover:underline"
                  >
                    <Avatar name={u.name} />
                    {u.name || "Unnamed"}
                  </Link>
                </td>
                <td className="px-5 py-3 text-zinc-600">
                  <div>{u.phone}</div>
                  {u.email && <div className="text-xs text-zinc-400">{u.email}</div>}
                </td>
                <td className="px-5 py-3 text-zinc-600">
                  {u.role === "driver" ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span>{u.vehicle || "—"}</span>
                        <DocFlag flag={u.docFlag} />
                      </div>
                      {u.plate && (
                        <div className="text-xs font-semibold uppercase text-zinc-500">
                          {u.plate}
                        </div>
                      )}
                    </>
                  ) : (
                    "—"
                  )}
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
        {filtered.length === 0 && <Empty />}
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 sm:hidden">
        {filtered.length === 0 && <Empty />}
        {filtered.map((u) => (
          <div key={u.uid} className="rounded-2xl border border-zinc-200 bg-white p-4">
            <Link href={`/users/${u.uid}`} className="flex items-center gap-3">
              <Avatar name={u.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-zinc-900">
                  {u.name || "Unnamed"}
                </p>
                <p className="truncate text-sm text-zinc-500">{u.phone}</p>
                {u.plate && (
                  <p className="truncate text-xs font-semibold uppercase text-zinc-500">
                    {u.plate}
                  </p>
                )}
              </div>
            </Link>
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
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[role]}`}>
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
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[status]}`}>
      {status === "none" ? "active" : status}
    </span>
  );
}

function DocFlag({ flag }: { flag: AppUser["docFlag"] }) {
  if (flag === "expired") {
    return (
      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-600">
        docs expired
      </span>
    );
  }
  if (flag === "soon") {
    return (
      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
        docs expiring
      </span>
    );
  }
  return null;
}

function Empty() {
  return <div className="p-8 text-center text-sm text-zinc-500">No matching users.</div>;
}
