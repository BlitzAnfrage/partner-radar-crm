import clsx from "clsx";

export function MetricCard({
  label,
  value,
  detail,
  size = "default",
  inverse = false
}: {
  label: string;
  value: string | number;
  detail?: string;
  size?: "default" | "large";
  inverse?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-[1.5rem] border p-5 shadow-soft",
        inverse ? "border-white/10 bg-[#0d0f14] text-white" : "border-slate-200/70 bg-white/90 text-slate-950",
        size === "large" ? "min-h-52" : "min-h-32"
      )}
    >
      <div className={clsx("text-sm font-medium", inverse ? "text-white/45" : "text-slate-500")}>{label}</div>
      <div className={clsx("mt-3 font-semibold tracking-tight", size === "large" ? "text-6xl" : "text-4xl")}>{value}</div>
      {detail ? <div className={clsx("mt-3 text-sm", inverse ? "text-white/55" : "text-slate-500")}>{detail}</div> : null}
    </div>
  );
}
