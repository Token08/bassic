import { ExternalLink } from "lucide-react";
import { assetPath } from "@/lib/assets";
import { editableSocialLinks, externalEmbeds } from "@/lib/editable-content";
import { site } from "@/lib/site";
import type { SocialNotice, SocialPlatform } from "@/lib/types";
import socialFeed from "@/public/data/social-feed.json";

type SocialUpdatesProps = {
  title: React.ReactNode;
  lead: React.ReactNode;
  notices?: SocialNotice[];
  instagramFallbackLabel?: string;
  facebookFallbackLabel?: string;
  xFallbackLabel?: string;
};

export function SocialUpdates({
  title,
  lead,
  notices = [],
  instagramFallbackLabel = "Instagramで最新情報を見る",
  facebookFallbackLabel = "Facebookで最新情報を見る",
  xFallbackLabel = "Xで最新情報を見る"
}: SocialUpdatesProps) {
  const instagramNotices = getNoticeItems(notices, "instagram");
  const xNotices = getNoticeItems(notices, "x");
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
          {instagramNotices.length ? (
            <SocialNoticeFeed platform="instagram" items={instagramNotices} fallbackLabel={instagramFallbackLabel} href={site.instagramUrl} />
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
            <SocialApiFeed platform="facebook" items={facebookItems} fallbackLabel={facebookFallbackLabel} href={site.facebookUrl} />
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
          {xNotices.length ? (
            <SocialNoticeFeed platform="x" items={xNotices} fallbackLabel={xFallbackLabel} href={site.xUrl} />
          ) : xItems.length ? (
            <SocialApiFeed platform="x" items={xItems} fallbackLabel={xFallbackLabel} href={site.xUrl} />
          ) : (
            <SocialProfileCard
              href={site.xUrl}
              account="@bar_Bassic"
              imageSrc={assetPath("/assets/brand/b-logo-mark2.png")}
              title="X"
              lead="イベント告知や営業情報は公式Xでも更新しています。管理画面に投稿URLを登録すると、この欄にカード表示できます。"
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

function SocialNoticeFeed({
  platform,
  items,
  href,
  fallbackLabel
}: {
  platform: SocialPlatform;
  items: SocialNotice[];
  href: string;
  fallbackLabel: string;
}) {
  return (
    <div className={`social-embed-frame social-api-feed social-notice-feed social-notice-feed-${platform}`}>
      <div className="social-feed-list">
        {items.map((item) => (
          <a key={`${platform}-${item.id}`} className="social-feed-item no-image social-notice-item" href={item.url} target="_blank" rel="noreferrer">
            <span className="social-feed-copy">
              <span className="social-feed-date">{formatFeedDate(item.date)}</span>
              <span className="social-notice-title">{item.title}</span>
              {item.description ? <span className="social-notice-description">{item.description}</span> : null}
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

function getFeedItems(platform: "facebook" | "x"): SocialFeedItem[] {
  const feedData = socialFeed as SocialFeedData;
  const items = feedData.feeds?.[platform];
  return Array.isArray(items) ? items.filter((item) => item?.url && item?.text).slice(0, 5) : [];
}

function getNoticeItems(notices: SocialNotice[], platform: SocialPlatform): SocialNotice[] {
  return notices
    .filter((notice) => notice.platform === platform && notice.isPublished && notice.url && notice.title)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 5);
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
