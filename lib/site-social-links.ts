import { site } from "./site";

export const socialLinkFields = ["instagramUrl", "facebookUrl", "xUrl"] as const;
type SocialLinkField = typeof socialLinkFields[number];

export function resolveSiteSocialLinks(settings?: Partial<Record<SocialLinkField, string>> | null) {
  const hosts: Record<SocialLinkField, string[]> = {
    instagramUrl: ["instagram.com"],
    facebookUrl: ["facebook.com", "m.facebook.com", "mbasic.facebook.com", "fb.me"],
    xUrl: ["x.com", "twitter.com"]
  };
  return Object.fromEntries(socialLinkFields.map((key) => {
    const raw = settings?.[key];
    const value = typeof raw === "string" ? raw.trim() : "";
    try {
      if (value && hosts[key].includes(new URL(value).hostname.replace(/^www\./, ""))) return [key, value];
    } catch { /* Invalid settings use the same standard link as the public site. */ }
    return [key, site[key]];
  })) as Record<SocialLinkField, string>;
}
