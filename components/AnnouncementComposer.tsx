"use client";

import { useMemo, useState } from "react";
import { sendAnnouncementAction } from "@/app/actions";
import { Icon } from "@/components/Icon";

export type PickUser = {
  uid: string;
  name: string;
  phone: string;
  role: "rider" | "driver" | "unknown";
};

const AUDIENCES = [
  { value: "all_drivers", label: "All drivers" },
  { value: "all_riders", label: "All riders" },
  { value: "everyone", label: "Everyone" },
  { value: "specific", label: "Specific people…" },
];

export default function AnnouncementComposer({ users }: { users: PickUser[] }) {
  const [audience, setAudience] = useState("all_drivers");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, PickUser>>({});

  const selectedList = Object.values(selected);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return users
      .filter(
        (u) =>
          u.name.toLowerCase().includes(q) || u.phone.toLowerCase().includes(q)
      )
      .slice(0, 15);
  }, [query, users]);

  const toggle = (u: PickUser) =>
    setSelected((s) => {
      const next = { ...s };
      if (next[u.uid]) delete next[u.uid];
      else next[u.uid] = u;
      return next;
    });

  return (
    <form
      action={sendAnnouncementAction}
      className="rounded-3xl border border-line bg-lifted p-7 shadow-soft"
    >
      <label className="block text-sm">
        <span className="mb-1 block text-xs font-semibold text-zinc-500">
          Title
        </span>
        <input
          name="title"
          required
          maxLength={80}
          placeholder="e.g. Driver strike — Thursday"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
        />
      </label>

      <label className="mt-4 block text-sm">
        <span className="mb-1 block text-xs font-semibold text-zinc-500">
          Message
        </span>
        <textarea
          name="body"
          required
          rows={4}
          maxLength={600}
          placeholder="What they need to know…"
          className="w-full resize-y rounded-lg border border-zinc-200 px-3 py-2 text-sm"
        />
      </label>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold text-zinc-500">
            Send to
          </span>
          <select
            name="audience"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
          >
            {AUDIENCES.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold text-zinc-500">
            Severity
          </span>
          <select
            name="severity"
            defaultValue="info"
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
          >
            <option value="info">Update (blue)</option>
            <option value="warning">Notice (amber)</option>
            <option value="critical">Important (red)</option>
          </select>
        </label>
      </div>

      {/* Specific-people picker */}
      {audience === "specific" && (
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4">
          {/* Selected chips + hidden inputs the action reads. */}
          {selectedList.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {selectedList.map((u) => (
                <span
                  key={u.uid}
                  className="inline-flex items-center gap-1.5 rounded-full bg-sift-soft px-3 py-1 text-xs font-semibold text-sift"
                >
                  <input type="hidden" name="targetUids" value={u.uid} />
                  {u.name || u.phone || "User"}
                  <button
                    type="button"
                    onClick={() => toggle(u)}
                    className="text-sift/70 hover:text-sift"
                    aria-label="Remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <Icon name="search" size={16} />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or phone…"
              className="w-full rounded-lg border border-zinc-200 py-2 pl-9 pr-3 text-sm"
            />
          </div>

          {matches.length > 0 && (
            <ul className="mt-2 max-h-56 divide-y divide-zinc-100 overflow-y-auto rounded-lg border border-zinc-100">
              {matches.map((u) => {
                const on = !!selected[u.uid];
                return (
                  <li key={u.uid}>
                    <button
                      type="button"
                      onClick={() => toggle(u)}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-zinc-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ink">
                          {u.name || "—"}
                        </span>
                        <span className="block truncate text-xs text-slate">
                          {u.phone} · {u.role}
                        </span>
                      </span>
                      <span
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                          on
                            ? "border-sift bg-sift text-white"
                            : "border-zinc-300"
                        }`}
                      >
                        {on && <Icon name="check" size={14} className="text-white" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {query.trim() && matches.length === 0 && (
            <p className="mt-2 text-xs text-zinc-400">No matches.</p>
          )}
        </div>
      )}

      <button
        type="submit"
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white"
        style={{ background: "#FF6B2C" }}
      >
        <Icon name="send" size={18} className="text-white" />
        Send announcement
      </button>
      <p className="mt-2 text-center text-xs text-zinc-400">
        They get a push now and a full-screen notice next time they open Sift.
      </p>
    </form>
  );
}
