import Image from "next/image";
import type { MenuItem } from "@public/lib/types";
export function MenuGallery({
  items,
}: {
  items: (MenuItem & { resolvedImage: string; imageAlt: string })[];
}) {
  return (
    <div className="menu-card-grid">
      {items.map((item) => (
        <article
          key={item.id || item.name}
          className="menu-card"
          data-record={item.id ? `menu:${item.id}` : undefined}
        >
          <button
            className="menu-image-button"
            type="button"
            data-gallery="food"
            aria-label={`${item.name}の写真を拡大表示`}
          >
            <Image
              src={item.resolvedImage}
              alt={item.imageAlt}
              fill
              sizes="(max-width: 900px) 100vw, 33vw"
            />
          </button>
          <div className="menu-card-copy">
            <div className="menu-card-heading">
              <h3>{item.name}</h3>
              {item.price ? <strong>{item.price}</strong> : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
