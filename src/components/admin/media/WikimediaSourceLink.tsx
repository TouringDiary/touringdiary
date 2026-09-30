import { ExternalLink } from 'lucide-react';

function isAllowedCommonsOrWikidataUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return (
      host === 'commons.wikimedia.org' ||
      host === 'www.wikidata.org' ||
      host.endsWith('.wikimedia.org')
    );
  } catch {
    return false;
  }
}

type WikimediaSourceLinkProps = {
  sourceUrl?: string | null;
  label?: string;
};

export const WikimediaSourceLink = ({
  sourceUrl,
  label = 'Apri su Wikimedia Commons',
}: WikimediaSourceLinkProps) => {
  const href = sourceUrl?.trim() ?? '';
  if (!href || !isAllowedCommonsOrWikidataUrl(href)) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </a>
  );
};
