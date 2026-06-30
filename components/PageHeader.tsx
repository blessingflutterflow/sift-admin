import { Icon } from "@/components/Icon";

/** Editorial page header: eyebrow (dot + uppercase) → big bold title → muted
 *  subtitle, with an optional actions slot on the right. */
export default function PageHeader({
  eyebrow,
  icon,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  icon?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <span className="eyebrow mb-2.5">{eyebrow}</span>}
        <div className="flex items-center gap-3">
          {icon && (
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sift-soft text-sift">
              <Icon name={icon} size={26} className="text-sift" />
            </span>
          )}
          <h1 className="text-3xl font-extrabold tracking-tighter text-ink">
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="mt-2 text-[15px] font-medium text-slate">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
