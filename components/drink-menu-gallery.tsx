import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
export function DrinkMenuGallery({
  sheets,
}: {
  sheets: readonly { src: string; title: string }[];
}) {
  return (
    <div
      className="drink-menu-slider drink-menu-gallery"
      aria-label="ドリンクメニュー表"
    >
      {sheets.length > 1 ? (
        <div
          className="drink-menu-slider-controls"
          aria-label="ドリンクメニュー切り替え"
        >
          <button
            type="button"
            data-drink-step="-1"
            aria-label="前のドリンクメニュー"
          >
            <ChevronLeft size={20} />
          </button>
          <span data-drink-counter>1 / {sheets.length}</span>
          <button
            type="button"
            data-drink-step="1"
            aria-label="次のドリンクメニュー"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      ) : null}
      <div className="drink-menu-sheet-grid">
        {sheets.map((sheet) => (
          <figure className="drink-menu-sheet" key={sheet.src}>
            <button
              type="button"
              data-gallery="drink"
              aria-label={`${sheet.title}を拡大表示`}
            >
              <Image
                src={sheet.src}
                alt={sheet.title}
                fill
                sizes="(max-width: 900px) 88vw, 620px"
              />
            </button>
            <figcaption>{sheet.title}</figcaption>
          </figure>
        ))}
      </div>
      {sheets.length > 1 ? (
        <div
          className="drink-menu-slider-dots"
          aria-label="ドリンクメニューのページ"
        >
          {sheets.map((sheet, index) => (
            <button
              type="button"
              data-drink-index={index}
              key={sheet.src}
              className={index === 0 ? "active" : undefined}
              aria-label={`${sheet.title}を表示`}
              aria-current={index === 0 ? "true" : undefined}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
