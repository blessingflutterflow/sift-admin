"use client";

import { Icon as Iconify } from "@iconify/react";

/** Semantic name → Solar bold-duotone icon. Keeps the whole admin on one
 *  consistent icon language (replaces the old emojis). */
export const ICONS: Record<string, string> = {
  // nav
  map: "solar:map-point-wave-bold-duotone",
  rides: "solar:routing-2-bold-duotone",
  parcels: "solar:box-bold-duotone",
  finance: "solar:wallet-money-bold-duotone",
  pricing: "solar:tuning-square-2-bold-duotone",
  zones: "solar:bolt-circle-bold-duotone",
  users: "solar:users-group-rounded-bold-duotone",
  applications: "solar:document-add-bold-duotone",
  verifications: "solar:verified-check-bold-duotone",
  support: "solar:chat-round-line-bold-duotone",
  admins: "solar:shield-user-bold-duotone",
  audit: "solar:clipboard-list-bold-duotone",
  announcements: "solar:megaphone-bold-duotone",
  // ui
  search: "solar:magnifer-bold-duotone",
  logout: "solar:logout-2-bold-duotone",
  menu: "solar:hamburger-menu-bold-duotone",
  close: "solar:close-circle-bold-duotone",
  back: "solar:alt-arrow-left-bold-duotone",
  send: "solar:plain-2-bold-duotone",
  phone: "solar:phone-rounded-bold-duotone",
  mail: "solar:letter-bold-duotone",
  star: "solar:star-bold-duotone",
  car: "solar:wheel-bold-duotone",
  plate: "solar:posts-carousel-horizontal-bold-duotone",
  doc: "solar:document-text-bold-duotone",
  calendar: "solar:calendar-bold-duotone",
  block: "solar:forbidden-circle-bold-duotone",
  check: "solar:check-circle-bold-duotone",
  warning: "solar:danger-triangle-bold-duotone",
  online: "solar:user-check-rounded-bold-duotone",
  category: "solar:tag-bold-duotone",
  money: "solar:banknote-2-bold-duotone",
  add: "solar:add-circle-bold-duotone",
  trash: "solar:trash-bin-trash-bold-duotone",
  edit: "solar:pen-2-bold-duotone",
  bolt: "solar:bolt-bold-duotone",
};

export function Icon({
  name,
  size = 22,
  className,
  color,
}: {
  name: string;
  size?: number;
  className?: string;
  color?: string;
}) {
  return (
    <Iconify
      icon={ICONS[name] ?? name}
      width={size}
      height={size}
      className={className}
      color={color}
    />
  );
}
