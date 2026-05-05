export function PageHeader({
  title,
  eyebrow,
  action
}: {
  title: string;
  eyebrow?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <div className="mb-2 text-sm font-medium text-slate-500">{eyebrow}</div> : null}
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">{title}</h1>
      </div>
      {action}
    </div>
  );
}
