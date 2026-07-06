"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions";
import { canAccess, ROLE_LABELS, type AdminRole } from "@/lib/adminAuth";
import { Icon } from "@/components/Icon";

const NAV: { href: string; label: string; icon: string }[] = [
  { href: "/", label: "Live map", icon: "map" },
  { href: "/rides", label: "Rides", icon: "rides" },
  { href: "/parcels", label: "Parcels", icon: "parcels" },
  { href: "/finance", label: "Finance", icon: "finance" },
  { href: "/pricing", label: "Pricing", icon: "pricing" },
  { href: "/zones", label: "Surge zones", icon: "zones" },
  { href: "/users", label: "Users", icon: "users" },
  { href: "/applications", label: "Applications", icon: "applications" },
  { href: "/verifications", label: "Verifications", icon: "verifications" },
  { href: "/support", label: "Support", icon: "support" },
  { href: "/announcements", label: "Announcements", icon: "announcements" },
  { href: "/admins", label: "Admins", icon: "admins" },
  { href: "/audit", label: "Audit log", icon: "audit" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export default function Shell({
  children,
  role,
  name,
}: {
  children: React.ReactNode;
  role: AdminRole;
  name: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = NAV.filter((item) => canAccess(role, item.href));

  const nav = (
    <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-4">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`group flex items-center gap-3.5 rounded-full px-4 py-2.5 text-[15px] font-bold transition-all ${
              active
                ? "bg-sift text-white shadow-soft"
                : "text-charcoal hover:bg-bone"
            }`}
          >
            <Icon
              name={item.icon}
              size={24}
              color={active ? "#ffffff" : undefined}
              className={active ? "" : "text-ink/80"}
            />
            <span className="tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <Link href="/" className="flex items-center gap-3 px-5 py-5">
      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-line">
        <Image src="/brand/logo-full.png" alt="Sift" width={44} height={44} />
      </div>
      <div className="leading-none">
        <p className="text-xl font-extrabold tracking-tighter text-ink">Sift</p>
        <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-slate">
          Admin
        </p>
      </div>
    </Link>
  );

  const signOut = (
    <div className="p-3">
      <div className="rounded-3xl bg-bone p-3">
        <div className="mb-2 flex items-center gap-3 px-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-extrabold text-white">
            {(name || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink">{name}</p>
            <p className="truncate text-xs text-slate">{ROLE_LABELS[role]}</p>
          </div>
        </div>
        <form action={logout}>
          <button className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-3 py-2.5 text-sm font-bold text-ink ring-1 ring-line transition hover:bg-canvas">
            <Icon name="logout" size={18} />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-canvas">
      {/* Desktop sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-line bg-lifted md:flex">
        {brand}
        <div className="mx-5 border-t border-line" />
        {nav}
        {signOut}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-lifted shadow-lift">
            {brand}
            <div className="mx-5 border-t border-line" />
            {nav}
            {signOut}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 border-b border-line bg-lifted px-4 py-3 md:hidden">
          <button
            onClick={() => setOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-bone text-ink"
            aria-label="Open menu"
          >
            <Icon name="menu" size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-line">
              <Image src="/brand/logo-full.png" alt="Sift" width={32} height={32} />
            </div>
            <span className="text-lg font-extrabold tracking-tighter text-ink">
              Sift
            </span>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
