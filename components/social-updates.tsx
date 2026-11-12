import { ExternalLink } from "lucide-react";
import { assetPath } from "@public/lib/assets";
import { editableSocialLinks } from "@public/lib/editable-content";
import type { HomeContent, SiteSettings } from "@public/lib/types";

type SocialUpdatesProps = {
  title: React.ReactNode;
  lead: React.ReactNode;
  settings?: SiteSettings;
  home?: HomeContent;
};

export function SocialUpdates({ title, lead, settings, home }: SocialUpdatesProps) {
  const names = ["Instagram", "Facebook", "X"] as const;
  const urls = [settings?.instagramUrl, settings?.facebookUrl, settings?.xUrl];
  const logos = ["instagram.webp", "facebook.png", "x.svg"];

  return (
    <section className="section social-section">
      <div className="section-heading narrow-copy">
        <p className="eyebrow">{home?.socialEyebrow?.trim() || "Social Updates"}</p>
        <h2>{title}</h2>
        <p className="section-lead">{lead}</p>
      </div>
      <div className="social-account-grid">
        {editableSocialLinks.map((link, index) => {
          const name = names[index];
          const label = home?.[`social${name}Label`]?.trim() || link.label;
          const account = home?.[`social${name}Account`]?.trim() || link.account;
          return (
            <a className="social-account-link" key={name} href={urls[index] || link.href} target="_blank" rel="noreferrer" aria-label={`${label} ${account}（新しいタブで開く）`}>
              <span className="social-account-logo" aria-hidden="true">
                <img src={assetPath("/assets/social/" + logos[index])} width={96} height={96} alt="" loading="lazy" decoding="async" />
              </span>
              <span className="social-account-copy"><span className="social-account-name">{label}</span><span className="social-account-id">{account}</span></span>
              <ExternalLink className="social-account-arrow" size={17} aria-hidden="true" />
            </a>
          );
        })}
      </div>
    </section>
  );
}
