"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type DrinkMenuSheet = {
  src: string;
  title: string;
};

export function DrinkMenuGallery({ sheets }: { sheets: readonly DrinkMenuSheet[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const active = activeIndex === null ? null : sheets[activeIndex];

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveIndex(null);
      }
      if (event.key === "ArrowLeft") {
        setActiveIndex((index) => cycleIndex(index, -1));
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((index) => cycleIndex(index, 1));
      }
    };

    document.body.classList.add("modal-open");
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex]);

  const cycleIndex = (index: number | null, direction: -1 | 1) => {
    if (!sheets.length) {
      return null;
    }

    const baseIndex = index ?? currentIndex;
    return (baseIndex + direction + sheets.length) % sheets.length;
  };

  const scrollToSheet = (index: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    const safeIndex = Math.max(0, Math.min(index, sheets.length - 1));
    const target = scroller.children.item(safeIndex) as HTMLElement | null;
    target?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    setCurrentIndex(safeIndex);
  };

  const updateCurrentIndex = () => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    const scrollerCenter = scroller.scrollLeft + scroller.clientWidth / 2;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    Array.from(scroller.children).forEach((child, index) => {
      const element = child as HTMLElement;
      const elementCenter = element.offsetLeft + element.offsetWidth / 2;
      const distance = Math.abs(scrollerCenter - elementCenter);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setCurrentIndex(nearestIndex);
  };

  const openSheet = (index: number) => {
    setCurrentIndex(index);
    setActiveIndex(index);
  };

  const moveModal = (direction: -1 | 1) => {
    setActiveIndex((index) => {
      const nextIndex = cycleIndex(index, direction);
      if (nextIndex !== null) {
        setCurrentIndex(nextIndex);
      }
      return nextIndex;
    });
  };

  const handleTouchEnd = (clientX: number) => {
    if (touchStartX.current === null) {
      return;
    }

    const distance = clientX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(distance) < 44) {
      return;
    }

    moveModal(distance > 0 ? -1 : 1);
  };

  return (
    <>
      <div className="drink-menu-slider" aria-label="ドリンクメニュー表">
        <div className="drink-menu-slider-controls" aria-label="ドリンクメニュー切り替え">
          <button type="button" onClick={() => scrollToSheet(currentIndex - 1)} aria-label="前のドリンクメニュー">
            <ChevronLeft size={20} />
          </button>
          <span>
            {currentIndex + 1} / {sheets.length}
          </span>
          <button type="button" onClick={() => scrollToSheet(currentIndex + 1)} aria-label="次のドリンクメニュー">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="drink-menu-sheet-grid" ref={scrollerRef} onScroll={updateCurrentIndex}>
          {sheets.map((sheet, index) => (
            <figure className="drink-menu-sheet" key={sheet.src}>
              <button type="button" onClick={() => openSheet(index)} aria-label={`${sheet.title}を拡大表示`}>
                <Image src={sheet.src} alt={sheet.title} fill sizes="(max-width: 900px) 88vw, 620px" />
              </button>
              <figcaption>Drink Menu {index + 1}</figcaption>
            </figure>
          ))}
        </div>

        <div className="drink-menu-slider-dots" aria-label="ドリンクメニューのページ">
          {sheets.map((sheet, index) => (
            <button
              type="button"
              key={sheet.src}
              className={index === currentIndex ? "active" : undefined}
              onClick={() => scrollToSheet(index)}
              aria-label={`Drink Menu ${index + 1}を表示`}
              aria-current={index === currentIndex ? "true" : undefined}
            />
          ))}
        </div>
      </div>

      {active ? (
        <div className="image-modal" role="dialog" aria-modal="true" aria-label={`${active.title}の拡大画像`} onClick={() => setActiveIndex(null)}>
          <button className="image-modal-close" type="button" onClick={() => setActiveIndex(null)} aria-label="閉じる">
            <X size={22} />
          </button>
          <button className="image-modal-nav image-modal-nav-prev" type="button" onClick={(event) => { event.stopPropagation(); moveModal(-1); }} aria-label="前のドリンクメニュー">
            <ChevronLeft size={26} />
          </button>
          <button className="image-modal-nav image-modal-nav-next" type="button" onClick={(event) => { event.stopPropagation(); moveModal(1); }} aria-label="次のドリンクメニュー">
            <ChevronRight size={26} />
          </button>
          <figure
            className="image-modal-content drink-menu-modal-content"
            onClick={(event) => event.stopPropagation()}
            onTouchStart={(event) => {
              touchStartX.current = event.changedTouches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              handleTouchEnd(event.changedTouches[0]?.clientX ?? 0);
            }}
          >
            <Image src={active.src} alt={active.title} fill sizes="96vw" />
            <figcaption>
              <strong>{active.title}</strong>
              <span>
                {(activeIndex ?? 0) + 1} / {sheets.length}
              </span>
            </figcaption>
          </figure>
          <div className="image-modal-dots" aria-label="拡大画像のページ">
            {sheets.map((sheet, index) => (
              <button
                type="button"
                key={sheet.src}
                className={index === activeIndex ? "active" : undefined}
                onClick={(event) => {
                  event.stopPropagation();
                  setCurrentIndex(index);
                  setActiveIndex(index);
                }}
                aria-label={`Drink Menu ${index + 1}を表示`}
                aria-current={index === activeIndex ? "true" : undefined}
              />
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
