import { ExternalLink, Facebook, Instagram } from "lucide-react";
import { editableSocialLinks } from "@/lib/editable-content";
import type { HomeContent, SiteSettings } from "@/lib/types";

type SocialUpdatesProps = {
  title: React.ReactNode;
  lead: React.ReactNode;
  settings?: SiteSettings;
  home?: HomeContent;
};

export function SocialUpdates({ title, lead, settings, home }: SocialUpdatesProps) {
  const names = ["Instagram", "Facebook", "X"] as const;
  const urls = [settings?.instagramUrl, settings?.facebookUrl, settings?.xUrl];

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
                {name === "Instagram" ? <Instagram size={32} strokeWidth={1.6} /> : name === "Facebook" ? <Facebook size={32} strokeWidth={1.6} /> : (
                  <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.64 7.584H.47l8.6-9.835L0 1.154h7.594l5.243 6.932zM17.61 20.644h2.039L6.486 3.24H4.298z" /></svg>
                )}
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
