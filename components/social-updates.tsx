import { ExternalLink } from "lucide-react";
import { assetPath } from "@/lib/assets";
import { editableSocialLinks, externalEmbeds } from "@/lib/editable-content";
import { site } from "@/lib/site";
import socialFeed from "@/public/data/social-feed.json";

type SocialUpdatesProps = {
  title: React.ReactNode;
  lead: React.ReactNode;
  instagramFallbackLabel?: string;
  xFallbackLabel?: string;
};

export function SocialUpdates({
  title,
  lead,
  instagramFallbackLabel = "Instagramで最新情報を見る",
  xFallbackLabel = "Xで最新情報を見る"
}: SocialUpdatesProps) {
  const instagramWidgetSrc = getLightWidgetSrc(externalEmbeds.instagramWidgetSrc);
  const xWidgetSrc = getHttpsWidgetSrc(externalEmbeds.xWidgetSrc);
  const instagramItems = getFeedItems("instagram");
  const facebookItems = getFeedItems("facebook");
  const xItems = getFeedItems("x");

  return (
    <section className="section social-section">
      <div className="section-heading narrow-copy">
        <p className="eyebrow">Social Updates</p>
        <h2>{title}</h2>
        <p className="section-lead">{lead}</p>
      </div>

      <div className="social-embed-grid">
        <SocialEmbedCard {...editableSocialLinks[0]}>
          {instagramItems.length ? (
            <SocialApiFeed platform="instagram" items={instagramItems} fallbackLabel={instagramFallbackLabel} href={site.instagramUrl} />
          ) : instagramWidgetSrc ? (
            <div className="social-embed-frame instagram-widget-frame">
              <iframe
                title="public bar Bassic. Instagram timeline"
                src={instagramWidgetSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : (
            <SocialProfileCard
              href={site.instagramUrl}
              account="@bassic_official"
              imageSrc={assetPath("/assets/brand/index-logo.png")}
              title="Instagram"
              lead="直近の写真、イベント告知、店内の空気感は公式Instagramで更新しています。"
              buttonLabel={instagramFallbackLabel}
            />
          )}
        </SocialEmbedCard>

        <SocialEmbedCard {...editableSocialLinks[1]}>
          {facebookItems.length ? (
            <SocialApiFeed platform="facebook" items={facebookItems} fallbackLabel="Facebookで最新情報を見る" href={site.facebookUrl} />
          ) : (
            <div className="social-embed-frame facebook-frame">
            <iframe
              title="public bar Bassic. Facebook timeline"
              src={externalEmbeds.facebookPluginUrl}
              width="500"
              height="620"
              loading="lazy"
              referrerPolicy="origin-when-cross-origin"
            />
          </div>
          )}
        </SocialEmbedCard>

        <SocialEmbedCard {...editableSocialLinks[2]}>
          {xItems.length ? (
            <SocialApiFeed platform="x" items={xItems} fallbackLabel={xFallbackLabel} href={site.xUrl} />
          ) : xWidgetSrc ? (
            <div className="social-embed-frame external-social-frame x-frame">
              <iframe
                title="public bar Bassic. X timeline"
                src={xWidgetSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : (
            <SocialProfileCard
              href={site.xUrl}
              account="@bar_Bassic"
              imageSrc={assetPath("/assets/brand/b-logo-mark2.png")}
              title="X"
              lead="X APIの接続後、直近投稿がここに表示されます。現在は公式Xで最新情報をご確認ください。"
              buttonLabel={xFallbackLabel}
            />
          )}
        </SocialEmbedCard>
      </div>

      <div className="social-direct-links">
        {editableSocialLinks.map((link) => (
          <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
            {link.label} <ExternalLink size={15} />
          </a>
        ))}
      </div>
    </section>
  );
}

type SocialFeedItem = {
  id: string;
  platform: string;
  text: string;
  url: string;
  imageUrl?: string | null;
  createdAt?: string | null;
};

type SocialFeedData = {
  feeds?: Record<"instagram" | "facebook" | "x", SocialFeedItem[]>;
};

function SocialApiFeed({
  platform,
  items,
  href,
  fallbackLabel
}: {
  platform: "instagram" | "facebook" | "x";
  items: SocialFeedItem[];
  href: string;
  fallbackLabel: string;
}) {
  return (
    <div className={`social-embed-frame social-api-feed social-api-feed-${platform}`}>
      <div className="social-feed-list">
        {items.map((item) => (
          <a
            key={`${platform}-${item.id}`}
            className={`social-feed-item${item.imageUrl ? "" : " no-image"}`}
            href={item.url || href}
            target="_blank"
            rel="noreferrer"
          >
            {item.imageUrl ? (
              <span className="social-feed-thumb">
                <img src={item.imageUrl} alt="" loading="lazy" />
              </span>
            ) : null}
            <span className="social-feed-copy">
              <span className="social-feed-date">{formatFeedDate(item.createdAt)}</span>
              <span>{item.text}</span>
            </span>
          </a>
        ))}
      </div>
      <a className="social-feed-more" href={href} target="_blank" rel="noreferrer">
        {fallbackLabel} <ExternalLink size={14} />
      </a>
    </div>
  );
}

function SocialEmbedCard({
  label,
  href,
  account,
  children
}: {
  label: string;
  href: string;
  account: string;
  children: React.ReactNode;
}) {
  return (
    <article className="social-embed-card">
      <div className="social-embed-heading">
        <span>{label}</span>
        <a href={href} target="_blank" rel="noreferrer">
          {account} <ExternalLink size={15} />
        </a>
      </div>
      {children}
    </article>
  );
}

function SocialProfileCard({
  href,
  account,
  imageSrc,
  title,
  lead,
  buttonLabel
}: {
  href: string;
  account: string;
  imageSrc: string;
  title: string;
  lead: string;
  buttonLabel: string;
}) {
  return (
    <div className="social-profile-card">
      <img src={imageSrc} alt="public bar Bassic." width={160} height={160} loading="lazy" />
      <div>
        <p className="social-profile-kicker">{account}</p>
        <h3>{title}</h3>
        <p>{lead}</p>
      </div>
      <a className="social-profile-button" href={href} target="_blank" rel="noreferrer">
        {buttonLabel} <ExternalLink size={15} />
      </a>
    </div>
  );
}

function getFeedItems(platform: "instagram" | "facebook" | "x"): SocialFeedItem[] {
  const feedData = socialFeed as SocialFeedData;
  const items = feedData.feeds?.[platform];
  return Array.isArray(items) ? items.filter((item) => item?.url && item?.text).slice(0, 5) : [];
}

function formatFeedDate(value?: string | null) {
  if (!value) {
    return "Latest";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Latest";
  }

  return new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric" }).format(date);
}

function getLightWidgetSrc(src: string) {
  if (!src) {
    return "";
  }

  try {
    const url = new URL(src);
    const isLightWidgetHost = url.hostname === "cdn.lightwidget.com" || url.hostname === "lightwidget.com";
    const isWidgetPath = url.pathname.startsWith("/widgets/");
    return url.protocol === "https:" && isLightWidgetHost && isWidgetPath ? url.toString() : "";
  } catch {
    return "";
  }
}

function getHttpsWidgetSrc(src: string) {
  if (!src) {
    return "";
  }

  try {
    const url = new URL(src);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}
