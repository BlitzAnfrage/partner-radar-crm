import clsx from "clsx";

type Tone = "dark" | "neutral" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<Tone, string> = {
  dark: "bg-slate-950 text-white",
  neutral: "bg-slate-100 text-slate-600",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-red-50 text-red-700",
  info: "bg-blue-50 text-blue-700"
};

export function StatusPill({
  children,
  tone = "neutral",
  className
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span className={clsx("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", toneClasses[tone], className)}>
      {children}
    </span>
  );
}
