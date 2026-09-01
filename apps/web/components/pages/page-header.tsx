interface PageHeaderProps {
  label: string;
  title: string;
  description: string;
}

export function PageHeader({ label, title, description }: PageHeaderProps) {
  return (
    <section className="space-y-2">
      <p className="text-sm font-medium text-primary">{label}</p>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="max-w-2xl text-muted-foreground">{description}</p>
    </section>
  );
}
