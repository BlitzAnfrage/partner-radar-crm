import clsx from "clsx";

export function SectionCard({
  title,
  action,
  children,
  dark = false
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <section className={clsx("rounded-[1.5rem] border p-5 shadow-soft", dark ? "border-white/10 bg-[#0d0f14] text-white" : "border-slate-200/70 bg-white/90 text-slate-950")}>
      {title || action ? (
        <div className="mb-5 flex items-center justify-between gap-3">
          {title ? <h2 className="text-lg font-semibold tracking-tight">{title}</h2> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}
