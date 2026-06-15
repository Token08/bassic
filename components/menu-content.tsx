import { DrinkMenuGallery } from "@/components/drink-menu-gallery";
import { MenuGallery } from "@/components/menu-gallery";
import { assetPath } from "@/lib/assets";
import { editableMedia } from "@/lib/editable-content";
import { drinkMenuSheets } from "@/lib/menu-data";
import type { DrinkMenuSheet, MenuItem } from "@/lib/types";

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

function resolveDrinkSheet(sheet: DrinkMenuSheet) {
  const src = sheet.image?.url || sheet.src;

  return {
    title: sheet.title,
    src: assetPath(src || "/assets/menu-refresh/drinks/drink-01.webp")
  };
}

function DrinkMenuSheets({ sheets }: { sheets: DrinkMenuSheet[] }) {
  return (
    <div className="menu-block drink-menu-block">
      <div className="menu-block-heading">
        <h2>DRINK&amp;FOOD MENU</h2>
      </div>
      <DrinkMenuGallery sheets={sheets.map(resolveDrinkSheet)} />
    </div>
  );
}

export function MenuContent({
  menu,
  drinkSheets,
  showDrinkSheets = true,
  showFoodMenu = true,
  drinkLead,
  foodLead
}: {
  menu: MenuItem[];
  drinkSheets?: DrinkMenuSheet[];
  showDrinkSheets?: boolean;
  showFoodMenu?: boolean;
  drinkLead?: string;
  foodLead?: string;
}) {
  const foods = menu.filter((item) => item.category === "food").map(resolveMenuItem);
  const sheets = drinkSheets?.length ? drinkSheets : drinkMenuSheets.map((sheet) => ({ ...sheet, isPublished: true }));

  return (
    <section className="section menu-section">
      {drinkLead ? <p className="section-lead narrow-copy">{drinkLead}</p> : null}
      {showDrinkSheets ? <DrinkMenuSheets sheets={sheets} /> : null}
      {foodLead ? <p className="section-lead narrow-copy">{foodLead}</p> : null}
      {showFoodMenu ? <MenuBlock title="FOOD MENU" items={foods} /> : null}
    </section>
  );
}
