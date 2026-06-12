import type { Metadata } from "next";
import { AccessContent, PageHero } from "@/components/content";
import { PageShell } from "@/components/site-shell";
import { getCmsContents } from "@/lib/microcms";
import { pageHeroes } from "@/lib/page-content";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("access");

export default async function AccessPage() {
  const contents = await getCmsContents();

  return (
    <PageShell>
      <main>
        <PageHero
          eyebrow={pageHeroes.access.eyebrow}
          title={pageHeroes.access.title}
          lead={pageHeroes.access.lead}
          image={pageHeroes.access.image}
          imageAlt={pageHeroes.access.imageAlt}
          className={pageHeroes.access.className}
        />
        <AccessContent note={contents.home.accessNote} />
      </main>
    </PageShell>
  );
}
