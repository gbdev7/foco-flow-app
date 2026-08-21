import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ServiceCardProps {
  icon?: ReactNode;
  title: string;
  description: string;
  href?: string;
  cta?: string;
  className?: string;
  onClick?: () => void;
}

export function ServiceCard({
  icon,
  title,
  description,
  cta = "Saiba mais",
  className,
  onClick,
}: ServiceCardProps) {
  return (
    <article
      onClick={onClick}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-5",
        "transition-all duration-300 hover:-translate-y-1 hover:border-foreground/20 hover:shadow-[var(--shadow-pop,0_8px_24px_rgba(15,23,42,0.08))]",
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px scale-x-0 bg-foreground/30 transition-transform duration-300 group-hover:scale-x-100"
      />

      <div className="flex items-start justify-between gap-3">
        <span className="grid size-10 place-items-center rounded-lg border border-border bg-muted text-lg transition-colors duration-300 group-hover:bg-foreground group-hover:text-background">
          {icon}
        </span>
        <ArrowUpRight className="size-4 -translate-x-1 translate-y-1 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
      </div>

      <h2 className="mt-4 text-base font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>

      <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
        {cta}
        <ArrowUpRight className="size-3" />
      </span>
    </article>
  );
}

export default ServiceCard;
