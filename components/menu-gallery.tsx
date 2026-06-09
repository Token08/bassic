"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import type { MenuItem } from "@/lib/types";

type GalleryItem = MenuItem & {
  resolvedImage: string;
  imageAlt: string;
};

export function MenuGallery({ items }: { items: GalleryItem[] }) {
  const [active, setActive] = useState<GalleryItem | null>(null);

  useEffect(() => {
    if (!active) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActive(null);
      }
    };

    document.body.classList.add("modal-open");
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [active]);

  return (
    <>
      <div className="menu-card-grid">
        {items.map((item) => (
          <article key={`${item.category}-${item.name}`} className="menu-card">
            <button className="menu-image-button" type="button" onClick={() => setActive(item)} aria-label={`${item.name}の写真を拡大表示`}>
              <Image src={item.resolvedImage} alt={item.imageAlt} fill sizes="(max-width: 900px) 100vw, 33vw" />
            </button>
            <div className="menu-card-copy">
              <div className="menu-card-heading">
                <div>
                  <p className="menu-category">{item.category === "food" ? "Food" : "Drink"}</p>
                  <h3>{item.name}</h3>
                  {item.englishName ? <p>{item.englishName}</p> : null}
                </div>
                {item.price ? <strong>{item.price}</strong> : null}
              </div>
              {item.description ? <p className="muted">{item.description}</p> : null}
            </div>
          </article>
        ))}
      </div>

      {active ? (
        <div className="image-modal" role="dialog" aria-modal="true" aria-label={`${active.name}の拡大写真`} onClick={() => setActive(null)}>
          <button className="image-modal-close" type="button" onClick={() => setActive(null)} aria-label="閉じる">
            <X size={22} />
          </button>
          <figure className="image-modal-content" onClick={(event) => event.stopPropagation()}>
            <Image src={active.resolvedImage} alt={active.imageAlt} fill sizes="96vw" />
            <figcaption>
              <strong>{active.name}</strong>
              {active.price ? <span>{active.price}</span> : null}
            </figcaption>
          </figure>
        </div>
      ) : null}
    </>
  );
}
