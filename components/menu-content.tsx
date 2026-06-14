import { DrinkMenuGallery } from "@/components/drink-menu-gallery";
import { MenuGallery } from "@/components/menu-gallery";
import { assetPath } from "@/lib/assets";
import { editableMedia } from "@/lib/editable-content";
import { drinkMenuSheets } from "@/lib/menu-data";
import type { MenuItem } from "@/lib/types";

function resolveMenuItem(item: MenuItem) {
  const image = item.image?.url ? assetPath(item.image.url) : editableMedia.fallbackMenuImages[item.category];

  return {
    ...item,
    resolvedImage: image,
    imageAlt: item.image?.alt || `${item.name}の写真`
  };
}

function MenuBlock({ title, items }: { title: string; items: ReturnType<typeof resolveMenuItem>[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="menu-block">
      <div className="menu-block-heading">
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
        <h2>DRINK</h2>
      </div>
      <DrinkMenuGallery sheets={drinkMenuSheets.map((sheet) => ({ ...sheet, src: assetPath(sheet.src) }))} />
    </div>
  );
}

export function MenuContent({ menu }: { menu: MenuItem[] }) {
  const foods = menu.filter((item) => item.category === "food").map(resolveMenuItem);

  return (
    <section className="section menu-section">
      <DrinkMenuSheets />
      <MenuBlock title="FOOD" items={foods} />
    </section>
  );
}
