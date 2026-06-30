"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Periodically re-fetches the current server component (router.refresh()).
 *  Lightweight way to keep a server-rendered list live. */
export default function AutoRefresh({ seconds = 5 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const h = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(h);
  }, [router, seconds]);
  return null;
}
