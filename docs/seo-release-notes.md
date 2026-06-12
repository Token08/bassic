# SEO Release Notes

正式公開URLは `https://www.bassic.jp/index.html` を想定する。

ただし、検索エンジン向けの正規URLは `https://www.bassic.jp/` に統一する。`/` と `/index.html` が別ページとして評価されると検索評価が分散するため、canonical、OGP、JSON-LD、sitemap、robots は `https://www.bassic.jp` 基準で出力する。

## 本番URL方針

- ユーザーが開く入口: `https://www.bassic.jp/index.html`
- canonical: `https://www.bassic.jp/`
- sitemap: `https://www.bassic.jp/sitemap.xml`
- robots: `https://www.bassic.jp/robots.txt`
- GitHub Pages CNAME: `www.bassic.jp`

## 確認コマンド

```bash
$env:NEXT_PUBLIC_SITE_URL="https://www.bassic.jp"; Remove-Item Env:\NEXT_PUBLIC_BASE_PATH -ErrorAction SilentlyContinue; npm run build
$env:NEXT_PUBLIC_SITE_URL="https://www.bassic.jp"; npm run smoke:seo
$env:NEXT_PUBLIC_SITE_URL="https://www.bassic.jp"; npm run smoke:links
```

## 公開後に見るところ

- Google Search Consoleで `https://www.bassic.jp/` をプロパティ登録
- `https://www.bassic.jp/index.html` を開いた時のcanonicalが `https://www.bassic.jp/` になっていることを確認
- Googleビジネスプロフィールの公式サイトURLを `https://www.bassic.jp/` または実運用上必要なら `https://www.bassic.jp/index.html` に統一
- Rich Results Testで `BarOrPub`、`Event`、`FAQPage` を確認
- sitemap送信後、Search Consoleでインデックス登録状況を確認
