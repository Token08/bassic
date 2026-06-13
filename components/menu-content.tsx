import { DrinkMenuGallery } from "@/components/drink-menu-gallery";
import { MenuGallery } from "@/components/menu-gallery";
import { assetPath } from "@/lib/assets";
import { editableMedia } from "@/lib/editable-content";
import { drinkMenuSheets } from "@/lib/menu-data";
import { site } from "@/lib/site";
import type { MenuItem } from "@/lib/types";

function resolveMenuItem(item: MenuItem) {
  const image = item.image?.url ? assetPath(item.image.url) : editableMedia.fallbackMenuImages[item.category];

  return {
    ...item,
    resolvedImage: image,
    imageAlt: item.image?.alt || `${item.name}の写真`
  };
}

function MenuBlock({ eyebrow, title, items }: { eyebrow: string; title: string; items: ReturnType<typeof resolveMenuItem>[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="menu-block">
      <div className="menu-block-heading">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      <MenuGallery items={items} />
    </div>
  );
}

function DrinkMenuSheets() {
  return (
    <div className="menu-block drink-menu-block">
      <div className="menu-block-heading">
        <p className="eyebrow">Drink</p>
        <h2>ドリンク</h2>
      </div>
      <DrinkMenuGallery sheets={drinkMenuSheets.map((sheet) => ({ ...sheet, src: assetPath(sheet.src) }))} />
    </div>
  );
}

export function MenuContent({ menu }: { menu: MenuItem[] }) {
  const foods = menu.filter((item) => item.category === "food").map(resolveMenuItem);

  return (
    <section className="section menu-section">
      <div className="section-heading narrow-copy">
        <p className="eyebrow">Food & Drink</p>
        <h2>
          写真で選べる、
          <br />
          Bassic.のメニュー。
        </h2>
        <p className="section-lead">
          ファズ・カレー、タコス＆ポテト、ドリンク各種など、来店前に見やすいよう写真と価格を中心に整理しました。
          店内利用時はチャージを頂戴しています。
        </p>
        <div className="notice-row" aria-label="メニュー利用時の基本情報">
          <span>{site.chargeLabel}</span>
          <span>{site.hoursLabel}</span>
        </div>
      </div>

      <DrinkMenuSheets />
      <MenuBlock eyebrow="Food" title="フード" items={foods} />
    </section>
  );
}
