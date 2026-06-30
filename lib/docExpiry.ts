/** Driver document expiry helpers — shared by the profile + the expiring list. */

export type ExpiryStatus = "none" | "valid" | "soon" | "expired";

export const DOC_LABELS: Record<string, string> = {
  license: "Driver's licence",
  prdp: "PrDP permit",
  insurance: "Insurance",
};

/** Classify an ISO yyyy-mm-dd date relative to today. */
export function expiryStatus(iso: string | undefined, soonDays = 30): ExpiryStatus {
  if (!iso) return "none";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "none";
  const days = Math.floor((d.getTime() - Date.now()) / 86_400_000);
  if (days < 0) return "expired";
  if (days <= soonDays) return "soon";
  return "valid";
}

/** Worst status across a driver's documents (for a single header flag). */
export function worstExpiry(docExpiry: Record<string, string>): ExpiryStatus {
  const order: ExpiryStatus[] = ["expired", "soon", "valid", "none"];
  let worst: ExpiryStatus = "none";
  for (const v of Object.values(docExpiry ?? {})) {
    const s = expiryStatus(v);
    if (order.indexOf(s) < order.indexOf(worst)) worst = s;
  }
  return worst;
}
