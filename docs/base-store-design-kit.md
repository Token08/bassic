# BASE store design kit

`https://bassic.official.ec/` を新サイト `https://www.bassic.jp/` の空気感に寄せながら、商品一覧を読みやすくするための移植キットです。BASE管理画面にはログインせず、貼り付け用のCSSと反映手順としてまとめています。

## ねらい

- 黒、深赤、アイボリー、ゴールドを基調にして、Bassic.本サイトと同じ印象に寄せる。
- 商品名、価格、SOLD OUT、詳細導線を常に読めるようにする。
- スマホで商品カードが詰まらないよう、1列または広めのカード表示にする。
- BASEのカート、検索、言語/通貨、法定表記、プライバシーポリシーを隠さない。

## 現状確認メモ

2026-06-14時点の公開ストアはBASE標準テーマの `theme--0` で、主なDOMは以下でした。

- ページ本体: `body.tempTop.template.theme--0`
- ヘッダー: `#mainHeader`
- ナビ: `#main_navigation`
- 商品一覧: `#products .product_list_wrap`
- 商品カード: `.product_list`
- 商品名: `.product_list .title`
- 価格: `.product_list .price`
- SOLD OUT: `.product_list .item_meta.soldOut`, `.soldOutText`
- フッター: `#mainFooter`

## 貼り付け用CSS

BASEの「HTML編集 App」またはテーマ編集でCSSを追記できる場所に、以下を追加してください。既存CSSの末尾に入れると上書きが効きやすいです。

```css
/* Bassic. BASE store visual refresh */
:root {
  --bassic-ink: #120d0b;
  --bassic-paper: #fff7e6;
  --bassic-paper-strong: #fffdf5;
  --bassic-muted: #71655b;
  --bassic-line: rgba(255, 247, 217, 0.16);
  --bassic-gold: #d7b66a;
  --bassic-red: #6f0f15;
  --bassic-red-bright: #9f1720;
  --bassic-night: #0b0908;
  --bassic-night-soft: #18110f;
  --bassic-ivory: #fff7d9;
  --bassic-shadow: 0 14px 34px rgba(0, 0, 0, 0.28);
}

body.tempTop.template.theme--0 {
  background:
    radial-gradient(circle at 18% 0%, rgba(111, 15, 21, 0.34), transparent 34%),
    linear-gradient(135deg, #0b0908, #190b0b 58%, #0b0908) !important;
  color: var(--bassic-ivory) !important;
  font-family: "Helvetica Neue", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif !important;
  line-height: 1.75;
}

body.tempTop.template.theme--0 a {
  color: inherit;
  text-decoration: none;
}

body.tempTop.template.theme--0 .container {
  width: min(1180px, calc(100% - 32px)) !important;
  max-width: 1180px !important;
  margin-right: auto !important;
  margin-left: auto !important;
}

body.tempTop.template.theme--0 .headNavi {
  color: rgba(255, 247, 217, 0.86) !important;
}

body.tempTop.template.theme--0 .headNavi a,
body.tempTop.template.theme--0 .languageSelect,
body.tempTop.template.theme--0 .cart,
body.tempTop.template.theme--0 .base {
  color: rgba(255, 247, 217, 0.86) !important;
}

body.tempTop.template.theme--0 .itemSearch__form {
  overflow: hidden;
  border: 1px solid rgba(255, 247, 217, 0.22);
  border-radius: 8px;
  background: rgba(255, 247, 217, 0.08);
}

body.tempTop.template.theme--0 .itemSearch__field {
  color: var(--bassic-ivory) !important;
  background: transparent !important;
}

body.tempTop.template.theme--0 .itemSearch__btn {
  color: var(--bassic-ivory) !important;
  background: rgba(111, 15, 21, 0.7) !important;
}

body.tempTop.template.theme--0 #mainHeader {
  position: relative;
  min-height: 260px !important;
  height: auto !important;
  display: grid;
  place-items: center;
  overflow: hidden;
  padding: 54px 20px 42px !important;
  background:
    linear-gradient(90deg, rgba(8, 6, 5, 0.88), rgba(111, 15, 21, 0.64) 46%, rgba(8, 6, 5, 0.78)),
    linear-gradient(0deg, rgba(8, 6, 5, 0.86), rgba(8, 6, 5, 0.18)) !important;
  color: var(--bassic-ivory) !important;
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.34);
}

body.tempTop.template.theme--0 #mainHeader > div:first-child p {
  margin: 0 0 18px !important;
  color: var(--bassic-gold) !important;
  font-size: clamp(0.78rem, 2vw, 0.9rem) !important;
  font-weight: 900 !important;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

body.tempTop.template.theme--0 #logo {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
}

body.tempTop.template.theme--0 #logo .logoImage {
  width: clamp(128px, 18vw, 190px) !important;
  height: auto !important;
  max-width: 190px !important;
  filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.5));
}

body.tempTop.template.theme--0 #main_navigation {
  margin: 0 auto !important;
  padding: 14px 0 20px !important;
  color: var(--bassic-ivory) !important;
}

body.tempTop.template.theme--0 #main_navigation .row {
  display: flex !important;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px 24px;
  margin: 0 !important;
  padding: 0 !important;
}

body.tempTop.template.theme--0 #main_navigation .column {
  width: auto !important;
  margin: 0 !important;
}

body.tempTop.template.theme--0 #main_navigation .mainHeaderNavColor {
  display: inline-flex;
  min-height: 38px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 247, 217, 0.22);
  border-radius: 8px;
  padding: 8px 15px;
  background: rgba(255, 247, 217, 0.06);
  color: rgba(255, 247, 217, 0.9) !important;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: background 160ms ease, border-color 160ms ease, transform 160ms ease;
}

body.tempTop.template.theme--0 #main_navigation .mainHeaderNavColor:hover {
  border-color: rgba(215, 182, 106, 0.52);
  background: rgba(111, 15, 21, 0.58);
  transform: translateY(-1px);
}

body.tempTop.template.theme--0 #products {
  margin: 0 !important;
  padding: clamp(36px, 5vw, 62px) 0 clamp(64px, 7vw, 92px) !important;
}

body.tempTop.template.theme--0 #products::before {
  display: block;
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto 24px;
  color: var(--bassic-gold);
  content: "ONLINE STORE";
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.14em;
}

body.tempTop.template.theme--0 .product_list_wrap.row {
  display: grid !important;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 22px !important;
  width: min(1180px, calc(100% - 32px)) !important;
  margin: 0 auto !important;
  padding: 0 !important;
  list-style: none !important;
}

body.tempTop.template.theme--0 .product_list {
  position: relative !important;
  display: block !important;
  width: auto !important;
  height: auto !important;
  min-height: 360px;
  margin: 0 !important;
  overflow: hidden !important;
  border: 1px solid rgba(255, 247, 217, 0.14);
  border-radius: 8px;
  background: rgba(255, 247, 217, 0.06);
  box-shadow: var(--bassic-shadow);
  transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}

body.tempTop.template.theme--0 .product_list:hover {
  border-color: rgba(215, 182, 106, 0.48);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.34);
  transform: translateY(-2px);
}

body.tempTop.template.theme--0 .product_list > a {
  position: absolute !important;
  inset: 0 !important;
  z-index: 5 !important;
  display: block !important;
  width: 100% !important;
  height: 100% !important;
}

body.tempTop.template.theme--0 .product_list .image_container {
  position: relative !important;
  width: 100% !important;
  height: 360px !important;
  overflow: hidden !important;
  background: #241b17;
}

body.tempTop.template.theme--0 .product_list .image_resize {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  transition: transform 220ms ease, filter 220ms ease;
}

body.tempTop.template.theme--0 .product_list:hover .image_resize {
  filter: saturate(1.08) contrast(1.06);
  transform: scale(1.025);
}

body.tempTop.template.theme--0 .product_list .label_image.list {
  position: absolute !important;
  top: 12px !important;
  left: 12px !important;
  z-index: 8 !important;
  max-width: 42% !important;
  height: auto !important;
}

body.tempTop.template.theme--0 .product_list .item_meta {
  position: absolute !important;
  right: 0 !important;
  bottom: 0 !important;
  left: 0 !important;
  top: auto !important;
  z-index: 7 !important;
  display: grid !important;
  min-height: 134px !important;
  align-content: end;
  gap: 8px;
  width: 100% !important;
  height: auto !important;
  margin: 0 !important;
  padding: 58px 18px 18px !important;
  background:
    linear-gradient(0deg, rgba(11, 9, 8, 0.94), rgba(11, 9, 8, 0.76) 48%, rgba(11, 9, 8, 0)) !important;
  color: var(--bassic-ivory) !important;
  opacity: 1 !important;
}

body.tempTop.template.theme--0 .product_list .title {
  width: 100% !important;
  height: auto !important;
  max-height: none !important;
  margin: 0 !important;
  overflow: visible !important;
  color: var(--bassic-ivory) !important;
  font-size: clamp(0.98rem, 1.45vw, 1.08rem) !important;
  font-weight: 800 !important;
  line-height: 1.48 !important;
  letter-spacing: 0 !important;
  text-align: left !important;
}

body.tempTop.template.theme--0 .product_list .price {
  width: 100% !important;
  height: auto !important;
  color: var(--bassic-gold) !important;
  font-size: 1.03rem !important;
  font-weight: 900 !important;
  line-height: 1.2 !important;
  text-align: left !important;
}

body.tempTop.template.theme--0 .product_list .detail {
  position: static !important;
  display: inline-flex !important;
  width: fit-content !important;
  min-height: 34px;
  align-items: center;
  justify-content: center;
  margin-top: 3px !important;
  border: 1px solid rgba(255, 247, 217, 0.28);
  border-radius: 6px;
  padding: 7px 12px !important;
  background: var(--bassic-red-bright) !important;
  color: var(--bassic-ivory) !important;
  font-size: 0.78rem !important;
  font-weight: 900 !important;
  line-height: 1.2 !important;
}

body.tempTop.template.theme--0 .product_list .detailText {
  margin: 0 !important;
  color: inherit !important;
  font-size: inherit !important;
  font-weight: inherit !important;
  line-height: inherit !important;
}

body.tempTop.template.theme--0 .product_list .item_meta.soldOut {
  background:
    linear-gradient(0deg, rgba(18, 13, 11, 0.96), rgba(18, 13, 11, 0.82) 52%, rgba(18, 13, 11, 0.2)) !important;
}

body.tempTop.template.theme--0 .soldOutText {
  width: fit-content !important;
  margin: 0 0 2px !important;
  border: 1px solid rgba(255, 247, 217, 0.28);
  border-radius: 999px;
  padding: 5px 11px !important;
  background: rgba(159, 23, 32, 0.9);
  color: var(--bassic-ivory) !important;
  font-size: 0.78rem !important;
  font-weight: 900 !important;
  line-height: 1.2 !important;
  letter-spacing: 0.08em;
}

body.tempTop.template.theme--0 #mainFooter {
  border-top: 1px solid rgba(255, 247, 217, 0.14);
  padding: 28px 16px 34px !important;
  background:
    linear-gradient(90deg, rgba(8, 6, 5, 0.96), rgba(111, 15, 21, 0.72), rgba(8, 6, 5, 0.94)) !important;
  color: rgba(255, 247, 217, 0.78) !important;
}

body.tempTop.template.theme--0 #mainFooter ul {
  display: flex !important;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px 20px;
  margin: 0 !important;
  padding: 0 !important;
}

body.tempTop.template.theme--0 #mainFooter li {
  margin: 0 !important;
}

body.tempTop.template.theme--0 #mainFooter .footerNav {
  color: rgba(255, 247, 217, 0.82) !important;
  font-size: 0.82rem !important;
  font-weight: 800;
}

body.tempTop.template.theme--0 #mainFooter .footerNav:hover {
  color: #fff !important;
}

@media (max-width: 760px) {
  body.tempTop.template.theme--0 .container {
    width: min(100% - 24px, 560px) !important;
  }

  body.tempTop.template.theme--0 #mainHeader {
    min-height: 220px !important;
    padding: 44px 16px 34px !important;
  }

  body.tempTop.template.theme--0 #logo .logoImage {
    width: clamp(112px, 34vw, 150px) !important;
  }

  body.tempTop.template.theme--0 #main_navigation .row {
    gap: 8px;
  }

  body.tempTop.template.theme--0 #main_navigation .mainHeaderNavColor {
    min-height: 36px;
    padding: 7px 12px;
    font-size: 0.76rem;
  }

  body.tempTop.template.theme--0 #products::before,
  body.tempTop.template.theme--0 .product_list_wrap.row {
    width: min(100% - 24px, 560px) !important;
  }

  body.tempTop.template.theme--0 .product_list_wrap.row {
    grid-template-columns: 1fr !important;
    gap: 18px !important;
  }

  body.tempTop.template.theme--0 .product_list {
    min-height: 360px;
  }

  body.tempTop.template.theme--0 .product_list .image_container {
    height: min(72vw, 390px) !important;
    min-height: 320px;
  }

  body.tempTop.template.theme--0 .product_list .item_meta {
    min-height: 126px !important;
    padding: 52px 16px 16px !important;
  }
}

@media (max-width: 420px) {
  body.tempTop.template.theme--0 .product_list .image_container {
    height: 330px !important;
  }

  body.tempTop.template.theme--0 .product_list .title {
    font-size: 0.96rem !important;
    line-height: 1.45 !important;
  }

  body.tempTop.template.theme--0 .product_list .price {
    font-size: 1rem !important;
  }
}
```

## 画像の使い方

CSSだけでも反映できます。より新サイトらしくする場合は、BASEのHTML編集 Appまたはテーマのファイルアップロード機能に以下をアップロードし、必要に応じてヘッダー背景として使ってください。

- ロゴ候補: `public/assets/brand/b-logo-mark2.png`
- 背景候補: `public/assets/brand/topbar.jpg`
- 強めのメインビジュアル候補: `public/assets/brand/toppage.jpg`
- 商品一覧前の雰囲気写真候補: `public/assets/brand/top-slides/hero-01.jpg` から `hero-10.jpg`

`www.bassic.jp` 配下の画像URLは、現時点では直接参照できない可能性があるため、BASE側へアップロードしたURLを使うのが安全です。ヘッダー背景を追加する場合は、上のCSS内の `#mainHeader` に次のような `background-image` を足してください。

```css
body.tempTop.template.theme--0 #mainHeader {
  background-image:
    linear-gradient(90deg, rgba(8, 6, 5, 0.88), rgba(111, 15, 21, 0.64) 46%, rgba(8, 6, 5, 0.78)),
    linear-gradient(0deg, rgba(8, 6, 5, 0.86), rgba(8, 6, 5, 0.18)),
    url("BASEにアップロードしたtopbar.jpgのURL") !important;
  background-position: center bottom !important;
  background-size: cover !important;
}
```

## BASEでの反映手順

1. BASE管理画面で「Apps」から「HTML編集 App」を開く。
2. 現在のテーマを複製、または新規テーマとして編集する。
3. 既存コードを全コピーしてバックアップを保存する。
4. CSSの末尾に「貼り付け用CSS」を追加する。
5. 画像を使う場合はBASEへアップロードし、CSS内のURLを差し替える。
6. プレビューでPCとスマホを確認する。
7. 問題なければ保存し、管理画面の「デザイン」から該当テーマを選択して反映する。

BASE公式のHTML編集 Appでは、テーマを作成してHTML/CSSを編集し、プレビュー後に保存、デザイン画面からテーマを選択する流れです。直接編集したテーマはBASE側の自動更新が適用されない場合があるため、バックアップを必ず残してください。

- HTML編集 App: https://apps.thebase.com/detail/107
- BASE U HTML編集: https://baseu.jp/8249

## 公開前チェックリスト

- PCで商品カードが3〜4列程度に並び、商品名と価格が常に読める。
- スマホで商品カードが1列になり、画像、商品名、価格、詳細ボタンが窮屈でない。
- SOLD OUTの商品が通常商品と区別できる。
- 商品詳細ページへ遷移できる。
- カート、検索、言語/通貨切り替えが消えていない。
- `home`, `about`, `contact` が押せる。
- プライバシーポリシー、特定商取引法に基づく表記が押せる。
- 新サイトと並べたときに、黒/深赤/アイボリー/ゴールドの統一感がある。

## 戻すとき

追加したCSSブロック全体を削除するか、バックアップしておいた編集前テーマに戻してください。HTMLや商品データには触れない構成なので、戻す作業はCSSの削除だけで済む想定です。
