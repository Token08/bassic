"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

type DrinkMenuSheet = {
  src: string;
  title: string;
};

export function DrinkMenuGallery({ sheets }: { sheets: readonly DrinkMenuSheet[] }) {
  const [active, setActive] = useState<DrinkMenuSheet | null>(null);

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
      <div className="drink-menu-sheet-grid" aria-label="ドリンクメニュー表">
        {sheets.map((sheet, index) => (
          <figure className="drink-menu-sheet" key={sheet.src}>
            <button type="button" onClick={() => setActive(sheet)} aria-label={`${sheet.title}を拡大表示`}>
              <Image src={sheet.src} alt={sheet.title} fill sizes="(max-width: 900px) 100vw, 50vw" />
            </button>
            <figcaption>Drink Menu {index + 1}</figcaption>
          </figure>
        ))}
      </div>

      {active ? (
        <div className="image-modal" role="dialog" aria-modal="true" aria-label={`${active.title}の拡大画像`} onClick={() => setActive(null)}>
          <button className="image-modal-close" type="button" onClick={() => setActive(null)} aria-label="閉じる">
            <X size={22} />
          </button>
          <figure className="image-modal-content drink-menu-modal-content" onClick={(event) => event.stopPropagation()}>
            <Image src={active.src} alt={active.title} fill sizes="96vw" />
            <figcaption>
              <strong>{active.title}</strong>
            </figcaption>
          </figure>
        </div>
      ) : null}
    </>
  );
}
