"use client";
import { useEffect } from "react";
export function PublicInteractions() {
  useEffect(() => {
    const labels: {
      close?: string;
      previous?: string;
      next?: string;
      title?: string;
    } = JSON.parse(
      document.getElementById("bassic-editor-interactions")?.textContent ||
        "{}",
    );
    let dialog: HTMLDialogElement | null = null,
      prior: HTMLElement | null = null,
      index = 0,
      images: HTMLButtonElement[] = [];
    const close = () => {
      dialog?.close();
      dialog?.remove();
      dialog = null;
      document.body.classList.remove("modal-open");
      prior?.focus();
    };
    const show = () => {
      if (!dialog) return;
      const button = images[index],
        img = button.querySelector("img");
      if (!img) return;
      const figure = dialog.querySelector("figure")!;
      figure.replaceChildren();
      const copy = img.cloneNode() as HTMLImageElement;
      copy.removeAttribute("style");
      copy.removeAttribute("srcset");
      Object.assign(copy.style, {
        position: "absolute",
        inset: "0",
        width: "100%",
        height: "100%",
        objectFit: "contain",
      });
      copy.loading = "eager";
      figure.append(copy);
      const caption = document.createElement("figcaption");
      const title = document.createElement("strong");
      title.textContent =
        button.closest("figure,article")?.querySelector("figcaption,h3")
          ?.textContent || img.alt;
      caption.append(title);
      const price = button
        .closest("article")
        ?.querySelector(".menu-card-heading strong")?.textContent;
      if (price) {
        const value = document.createElement("span");
        value.textContent = price;
        caption.append(value);
      }
      figure.append(caption);
    };
    const move = (step: number) => {
      index = (index + step + images.length) % images.length;
      show();
    };
    const click = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const step = target.closest<HTMLElement>("[data-drink-step]");
      const dot = target.closest<HTMLElement>("[data-drink-index]") || step;
      if (dot) {
        const group = dot.closest(".drink-menu-gallery");
        const current = Number(
          group?.querySelector<HTMLElement>(
            '[data-drink-index][aria-current="true"]',
          )?.dataset.drinkIndex || 0,
        );
        const slides = Array.from(
          group?.querySelectorAll<HTMLElement>(".drink-menu-sheet") || [],
        );
        const index = step
          ? (current + Number(step.dataset.drinkStep) + slides.length) %
            slides.length
          : Number(dot.dataset.drinkIndex);
        const track = group?.querySelector<HTMLElement>(
          ".drink-menu-sheet-grid",
        );
        if (track && slides[index])
          track.scrollTo({
            left:
              track.scrollLeft +
              slides[index].getBoundingClientRect().left -
              track.getBoundingClientRect().left -
              (track.clientWidth - slides[index].clientWidth) / 2,
            behavior: "smooth",
          });
        return;
      }
      const button = target.closest<HTMLButtonElement>("button[data-gallery]");
      if (!button) return;
      e.preventDefault();
      close();
      prior = button;
      images = Array.from(
        document.querySelectorAll<HTMLButtonElement>(
          `button[data-gallery="${button.dataset.gallery}"]`,
        ),
      );
      index = images.indexOf(button);
      dialog = document.createElement("dialog");
      dialog.className = "image-modal native-image-modal";
      dialog.setAttribute("aria-label", labels.title ?? "拡大写真");
      const figure = document.createElement("figure");
      figure.className = "image-modal-content";
      if (button.dataset.gallery === "drink")
        figure.classList.add("drink-menu-modal-content");
      dialog.append(figure);
      for (const [text, cls, action] of [
        ["閉じる", "image-modal-close", close],
        ["前へ", "image-modal-nav image-modal-nav-prev", () => move(-1)],
        ["次へ", "image-modal-nav image-modal-nav-next", () => move(1)],
      ] as const) {
        if (text !== "閉じる" && images.length < 2) continue;
        const b = document.createElement("button");
        b.type = "button";
        b.className = cls;
        b.textContent =
          (text === "閉じる"
            ? labels.close
            : text === "前へ"
              ? labels.previous
              : labels.next) ?? text;
        b.onclick = action;
        dialog.append(b);
      }
      dialog.addEventListener("cancel", (e) => {
        e.preventDefault();
        close();
      });
      dialog.addEventListener("click", (e) => {
        if (e.target === dialog) close();
      });
      document.body.append(dialog);
      document.body.classList.add("modal-open");
      show();
      let startX: number | null = null;
      figure.addEventListener("pointerdown", (e) => {
        startX = e.clientX;
      });
      figure.addEventListener("pointerup", (e) => {
        if (startX !== null && Math.abs(e.clientX - startX) > 40)
          move(e.clientX < startX ? 1 : -1);
        startX = null;
      });
      dialog.showModal();
    };
    const key = (e: KeyboardEvent) => {
      if (!dialog) return;
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
    };
    const tracks = Array.from(
      document.querySelectorAll<HTMLElement>(".drink-menu-sheet-grid"),
    );
    const syncDots = (track: HTMLElement) => {
      const slides = Array.from(
        track.querySelectorAll<HTMLElement>(".drink-menu-sheet"),
      );
      const nearest = slides.reduce(
        (best, item, index) =>
          Math.abs(
            item.getBoundingClientRect().left +
              item.clientWidth / 2 -
              track.getBoundingClientRect().left -
              track.clientWidth / 2,
          ) <
          Math.abs(
            slides[best].getBoundingClientRect().left +
              slides[best].clientWidth / 2 -
              track.getBoundingClientRect().left -
              track.clientWidth / 2,
          )
            ? index
            : best,
        0,
      );
      const counter = track
        .closest(".drink-menu-gallery")
        ?.querySelector<HTMLElement>("[data-drink-counter]");
      if (counter && counter.dataset.visualTextOverride !== "true")
        counter.textContent = `${nearest + 1} / ${slides.length}`;
      track
        .closest(".drink-menu-gallery")
        ?.querySelectorAll<HTMLElement>("[data-drink-index]")
        .forEach((dot) => {
          const active = Number(dot.dataset.drinkIndex) === nearest;
          dot.classList.toggle("active", active);
          dot.setAttribute("aria-current", String(active));
        });
    };
    const scrollHandlers = tracks.map((track) => {
      const handler = () => syncDots(track);
      track.addEventListener("scroll", handler, { passive: true });
      return () => track.removeEventListener("scroll", handler);
    });
    document.addEventListener("click", click);
    document.addEventListener("keydown", key);
    return () => {
      close();
      document.removeEventListener("click", click);
      document.removeEventListener("keydown", key);
      scrollHandlers.forEach((remove) => remove());
    };
  }, []);
  return null;
}
