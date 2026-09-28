import { Check } from "lucide-react";

export function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span className="text-foreground/90">{item}</span>
        </li>
      ))}
    </ul>
  );
}
