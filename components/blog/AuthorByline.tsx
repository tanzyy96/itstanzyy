function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function AuthorByline({ name, date }: { name: string; date: string }) {
  const formatted = new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex items-center gap-3 py-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--fm-avatar)] text-xs font-semibold text-[var(--fm-ink)]">
        {initials(name)}
      </div>
      <p className="text-sm text-[var(--fm-ink)]">
        <span className="font-semibold">{name}</span>{" "}
        <span className="text-[var(--fm-faint)]">· {formatted}</span>
      </p>
    </div>
  );
}
