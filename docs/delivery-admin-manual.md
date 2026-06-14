# Bassic. 管理画面操作マニュアル

納品先はGitHubを触らず、microCMSの管理画面から更新します。

## 渡すもの

- サイトURL
- microCMS管理画面URL
- ログイン情報
- この操作マニュアル

GitHub、Actions、環境変数、APIキー、DNSは制作・保守側で管理します。

## 更新できる項目

- TOP文言
- TOP画像
- Instagramタイムライン表示
- イベント情報
- メニュー名、価格、画像
- 貸切、レンタル案内
- SNSお知らせカード
- アクセス補足文

## イベントを追加する

1. microCMSで `events` を開きます。
2. `追加` を押します。
3. イベント名、日付、OPEN、START、出演者、料金、予約方法、画像を入力します。
4. `公開する` をオンにします。
5. 保存後、サイトのイベントページを確認します。

## メニューを変更する

1. microCMSで `menu` を開きます。
2. 変更したいメニューを選びます。
3. メニュー名、価格、カテゴリ、画像を編集します。
4. 保存後、サイトのメニューページを確認します。

カテゴリは `food` または `drink` を使います。

## SNSお知らせを追加する

1. microCMSで `social-notices` を開きます。
2. `追加` を押します。
3. SNS種別を選びます。
   - Instagram: `instagram`
   - Facebook: `facebook`
   - X: `x`
4. 投稿URL、表示タイトル、表示日、短い説明を入力します。
5. `公開する` をオンにします。
6. 保存後、TOPページのSNS欄を確認します。

Xは自動タイムラインではなく、投稿URLを貼るカード運用にします。APIキーや定期更新作業が不要で、納品先でも扱いやすい方法です。

## Instagramタイムラインを表示する

Instagramの自動タイムラインは、LightWidgetなどの外部ウィジェットを使います。

1. LightWidget側でInstagramアカウントを連携します。
2. 表示デザインを選び、iframe URLを発行します。
3. microCMSで `home` を開きます。
4. `InstagramウィジェットURL` にiframeの `src` URLだけを貼ります。
5. 保存後、TOPページのInstagram欄を確認します。

投稿ごとにURLを貼る必要はありません。Instagramに投稿すれば、ウィジェット側で反映されます。

## 公開・非公開

一時的に隠したい内容は削除せず、`公開する` をオフにします。再表示したい時はオンに戻します。

## 本番URLへ切り替える時

正式URLが `https://www.bassic.jp` に決まったら、制作側で以下を確認します。

- canonical
- sitemap
- OGP
- hreflang
- Googleビジネスプロフィールの公式サイトURL
- Google Search Console
