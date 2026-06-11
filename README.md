# public bar Bassic. website

福岡・天神 親不孝通りのミュージックバー `public bar Bassic.` の新規流入、SEO、Google Map導線、経営陣による更新を目的にしたNext.jsサイトです。

## 使い方

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

## microCMS設定

`.env.example` を `.env.local` にコピーし、microCMSのサービスドメインとAPIキーを設定します。

```bash
MICROCMS_SERVICE_DOMAIN=your-service-domain
MICROCMS_API_KEY=your-api-key
NEXT_PUBLIC_SITE_URL=https://www.bassic.jp
NEXT_PUBLIC_GOOGLE_MAPS_URL=https://www.google.com/maps/search/?api=1&query=public%20bar%20Bassic.%20福岡市中央区天神3-4-19%20WITH天神5F
```

microCMSが未設定の場合は、`lib/fallback-data.ts` の初期データで表示されます。

将来の管理画面/API連携に向けたコンテンツ配置方針は `docs/content-architecture.md` を参照してください。

## 更新できる内容

- `home`: トップ画像、トップ文言、初めての方向け文言、アクセス補足
- `events`: イベント日付、タイトル、出演者、開場/開演、料金、予約方法、画像、公開/非公開
- `menu`: フード/ドリンク名、英語名、価格、説明、カテゴリ
- `party-plans`: 貸切/パーティープラン名、価格、説明

詳しいフィールドは `docs/microcms-schema.md` を参照してください。

## SEO / Google Map

- `BarOrPub` 構造化データを `app/page.tsx` で出力
- `app/sitemap.ts` と `app/robots.ts` で検索エンジン向けファイルを生成
- Google Mapの検索/経路リンクは `lib/site.ts` と `.env.local` で管理
- 店舗情報の表記は `lib/site.ts` に集約

## 公開前に確認すること

- 正しい営業時間
- Googleビジネスプロフィールの公式URL、営業時間、写真、カテゴリ
- Google Mapの地点URL
- Drive素材から使う写真の権利と掲載可否
- `tel:`、`mailto:`、Google Map、Instagram、オンラインストアのリンク
