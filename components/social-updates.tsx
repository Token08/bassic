import { ExternalLink } from "lucide-react";
import { assetPath } from "@/lib/assets";
import { editableSocialLinks, externalEmbeds } from "@/lib/editable-content";
import { site } from "@/lib/site";
import { XTimelineScript } from "./x-timeline-script";

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

  return (
    <section className="section social-section">
      <div className="section-heading narrow-copy">
        <p className="eyebrow">Social Updates</p>
        <h2>{title}</h2>
        <p className="section-lead">{lead}</p>
      </div>

      <div className="social-embed-grid">
        <SocialEmbedCard {...editableSocialLinks[0]}>
          {instagramWidgetSrc ? (
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
          <div className="social-embed-frame">
            <iframe
              title="public bar Bassic. Facebook timeline"
              src={externalEmbeds.facebookPluginUrl}
              width="340"
              height="675"
              loading="lazy"
              referrerPolicy="origin-when-cross-origin"
            />
          </div>
        </SocialEmbedCard>

        <SocialEmbedCard {...editableSocialLinks[2]}>
          <div className="social-embed-frame x-frame">
            <a className="twitter-timeline" data-height="675" data-theme="dark" href={externalEmbeds.xTimelineUrl}>
              X timeline by bar_Bassic
            </a>
            <a className="social-fallback-link" href={site.xUrl} target="_blank" rel="noreferrer">
              {xFallbackLabel} <ExternalLink size={15} />
            </a>
          </div>
        </SocialEmbedCard>
      </div>

      <div className="social-direct-links">
        {editableSocialLinks.map((link) => (
          <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
            {link.label} <ExternalLink size={15} />
          </a>
        ))}
      </div>

      <XTimelineScript />
    </section>
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
