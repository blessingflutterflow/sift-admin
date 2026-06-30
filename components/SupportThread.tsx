"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const GREEN = "#FF6B2C";

type Msg = {
  id: string;
  text: string;
  senderRole: string; // 'user' | 'admin'
  createdAt: string | null;
};

export default function SupportThread({
  uid,
  userName,
  userRole,
  initialMessages,
}: {
  uid: string;
  userName: string;
  userRole: string;
  initialMessages: Msg[];
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [live, setLive] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);

  // Keep the view pinned to the newest message unless the admin scrolled up.
  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    scrollToBottom(false);
  }, [scrollToBottom]);

  // Poll for new messages (~2.5s) — near-realtime without exposing Firebase
  // credentials to the browser.
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const r = await fetch(`/api/support/${uid}`, { cache: "no-store" });
        if (!r.ok) {
          if (alive) setLive(false);
          return;
        }
        const data = await r.json();
        if (!alive) return;
        setLive(true);
        setMessages((prev) => {
          const next: Msg[] = data.messages ?? [];
          if (next.length !== prev.length || next.at(-1)?.id !== prev.at(-1)?.id) {
            if (atBottomRef.current) requestAnimationFrame(() => scrollToBottom());
            return next;
          }
          return prev;
        });
      } catch {
        if (alive) setLive(false);
      }
    };
    const h = setInterval(tick, 2500);
    return () => {
      alive = false;
      clearInterval(h);
    };
  }, [uid, scrollToBottom]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    atBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const send = async () => {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    setText("");
    // Optimistic bubble.
    const optimistic: Msg = {
      id: `tmp-${Date.now()}`,
      text: t,
      senderRole: "admin",
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    requestAnimationFrame(() => scrollToBottom());
    try {
      await fetch(`/api/support/${uid}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: t }),
      });
    } catch {
      /* the poll will reconcile */
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-200 bg-white px-5 py-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ background: GREEN }}
        >
          {(userName || "?").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-zinc-900">{userName}</p>
          <p className="text-xs capitalize text-zinc-500">{userRole || "user"}</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-zinc-400">
          <span
            className={`h-2 w-2 rounded-full ${live ? "bg-emerald-500" : "bg-zinc-300"}`}
          />
          {live ? "Live" : "Reconnecting…"}
        </span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 space-y-1 overflow-y-auto bg-zinc-50 px-4 py-5"
      >
        {messages.length === 0 ? (
          <p className="mt-10 text-center text-sm text-zinc-400">
            No messages yet — say hello 👋
          </p>
        ) : (
          messages.map((m, i) => {
            const admin = m.senderRole === "admin";
            const showDay =
              i === 0 || dayKey(m.createdAt) !== dayKey(messages[i - 1].createdAt);
            return (
              <div key={m.id}>
                {showDay && (
                  <div className="my-3 flex justify-center">
                    <span className="rounded-full bg-zinc-200/70 px-3 py-0.5 text-[11px] font-medium text-zinc-500">
                      {dayLabel(m.createdAt)}
                    </span>
                  </div>
                )}
                <div className={`flex ${admin ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[78%] ${admin ? "items-end" : "items-start"} flex flex-col`}>
                    <div
                      className={`rounded-2xl px-3.5 py-2 text-sm leading-snug shadow-sm ${
                        admin
                          ? "rounded-br-md text-white"
                          : "rounded-bl-md bg-white text-zinc-800"
                      }`}
                      style={admin ? { background: GREEN } : undefined}
                    >
                      {m.text}
                    </div>
                    <span className="mt-0.5 px-1 text-[10px] text-zinc-400">
                      {admin ? "You" : userName.split(" ")[0]} · {timeLabel(m.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-zinc-200 bg-white px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Type a reply…  (Enter to send, Shift+Enter for a new line)"
            className="max-h-32 flex-1 resize-none rounded-2xl border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-zinc-500"
          />
          <button
            onClick={send}
            disabled={sending || !text.trim()}
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: GREEN }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function dayKey(iso: string | null) {
  if (!iso) return "x";
  return new Date(iso).toDateString();
}
function dayLabel(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
function timeLabel(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}
