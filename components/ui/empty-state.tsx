export function EmptyState({
  title,
  text,
  actions
}: {
  title: string;
  text?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="card-premium p-10 text-center">
      <div className="mx-auto mb-5 h-1.5 w-16 rounded-full bg-slate-950" />
      <div className="text-2xl font-semibold tracking-tight text-slate-950">{title}</div>
      {text ? <div className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{text}</div> : null}
      {actions ? <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div> : null}
    </div>
  );
}
