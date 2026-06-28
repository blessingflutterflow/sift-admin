"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions";

const GREEN = "#FF6B2C";

const NAV = [
  { href: "/", label: "Live map", icon: "🗺️" },
  { href: "/rides", label: "Rides", icon: "🚕" },
  { href: "/parcels", label: "Parcels", icon: "📦" },
  { href: "/finance", label: "Finance", icon: "💳" },
  { href: "/pricing", label: "Pricing", icon: "⚙️" },
  { href: "/zones", label: "Surge zones", icon: "⚡" },
  { href: "/users", label: "Users", icon: "👥" },
  { href: "/applications", label: "Applications", icon: "📋" },
  { href: "/verifications", label: "Verifications", icon: "🪪" },
  { href: "/audit", label: "Audit log", icon: "📜" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "text-white"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
            style={active ? { background: GREEN } : undefined}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-2.5 px-4 py-4">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
        style={{ background: GREEN }}
      >
        ⚡
      </div>
      <div>
        <p className="text-sm font-bold leading-none text-zinc-900">Sift</p>
        <p className="text-xs text-zinc-400">Admin</p>
      </div>
    </div>
  );

  const signOut = (
    <form action={logout} className="p-3">
      <button className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
        Sign out
      </button>
    </form>
  );

  return (
    <div className="flex h-screen bg-zinc-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-200 bg-white md:flex">
        {brand}
        <div className="border-t border-zinc-100" />
        {nav}
        {signOut}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-white shadow-xl">
            {brand}
            <div className="border-t border-zinc-100" />
            {nav}
            {signOut}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3 md:hidden">
          <button
            onClick={() => setOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-lg"
            aria-label="Open menu"
          >
            ☰
          </button>
          <span className="font-bold text-zinc-900">Sift Admin</span>
        </header>

        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
