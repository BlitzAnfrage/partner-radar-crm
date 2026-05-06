import clsx from "clsx";

type Tone = "dark" | "neutral" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<Tone, string> = {
  dark: "border-slate-950 bg-slate-950 text-white",
  neutral: "border-slate-200 bg-white text-slate-600",
  success: "border-emerald-100 bg-emerald-50 text-emerald-700",
  warning: "border-amber-100 bg-amber-50 text-amber-800",
  danger: "border-red-100 bg-red-50 text-red-700",
  info: "border-blue-100 bg-blue-50 text-blue-700"
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
    <span className={clsx("inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold shadow-sm", toneClasses[tone], className)}>
      {children}
    </span>
  );
}
