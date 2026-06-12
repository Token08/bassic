import Script from "next/script";
import { ExternalLink } from "lucide-react";
import { editableSocialLinks, externalEmbeds } from "@/lib/editable-content";
import { site } from "@/lib/site";

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
  return (
    <section className="section social-section">
      <div className="section-heading narrow-copy">
        <p className="eyebrow">Social Updates</p>
        <h2>{title}</h2>
        <p className="section-lead">{lead}</p>
      </div>
      <div className="social-embed-grid">
        <SocialEmbedCard {...editableSocialLinks[0]}>
          <div className="social-embed-frame instagram-frame">
            <blockquote
              className="instagram-media"
              data-instgrm-captioned
              data-instgrm-permalink={externalEmbeds.instagramProfileUrl}
              data-instgrm-version="14"
            >
              <a href={externalEmbeds.instagramProfileUrl} target="_blank" rel="noreferrer">
                {instagramFallbackLabel}
              </a>
            </blockquote>
          </div>
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
          <div className="social-embed-frame">
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
      <Script src="https://www.instagram.com/embed.js" strategy="lazyOnload" />
      <Script src="https://platform.twitter.com/widgets.js" strategy="lazyOnload" />
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
