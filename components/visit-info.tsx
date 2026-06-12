import { CalendarDays, Cigarette, CircleDollarSign, Clock3 } from "lucide-react";
import type { VisitInfoIcon } from "@/lib/page-content";

export type VisitInfoGridItem = {
  icon: VisitInfoIcon;
  title: string;
  text: string;
};

const visitInfoIcons: Record<VisitInfoIcon, React.ReactNode> = {
  clock: <Clock3 />,
  calendar: <CalendarDays />,
  smoking: <Cigarette />,
  charge: <CircleDollarSign />
};

export function VisitInfoGrid({
  ariaLabel,
  items,
  title,
  lead
}: {
  ariaLabel: string;
  items: VisitInfoGridItem[];
  title?: string;
  lead?: string;
}) {
  return (
    <section className="visit-info-strip" aria-label={ariaLabel}>
      {title || lead ? (
        <div className="visit-info-heading">
          {title ? <h2>{title}</h2> : null}
          {lead ? <p>{lead}</p> : null}
        </div>
      ) : null}
      <div className="visit-info-grid">
        {items.map((item) => (
          <article key={`${item.title}-${item.text}`}>
            {visitInfoIcons[item.icon]}
            <div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
