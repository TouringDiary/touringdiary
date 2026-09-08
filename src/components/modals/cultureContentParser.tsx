import React from 'react';

/**
 * Parses smart content and returns formatted React elements.
 * Cleans legacy markdown annotations (such as bold markers and bullet list symbols)
 * and formats title lines (prefixes with "TITOLO:" or fully capitalized lines)
 * into semantic headings.
 */
export function renderCultureContent(text: string): React.ReactNode {
  if (!text) return null;

  const cleanText = text.replace(/\*\*/g, '').replace(/^\s*[*-]\s+/gm, '');
  const lines = cleanText.split('\n');
  const keyCounts = new Map<string, number>();
  const nextKey = (kind: string, sample: string) => {
    const base = `${kind}:${sample.slice(0, 64)}`;
    const n = (keyCounts.get(base) ?? 0) + 1;
    keyCounts.set(base, n);
    return `${base}#${n}`;
  };

  const blocks: React.ReactNode[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.toUpperCase().startsWith('TITOLO:')) {
      const contentWithoutPrefix = trimmed.substring(7).trim();
      let splitMatch = contentWithoutPrefix.match(/^(.+?)(\.|!|\?)(\s+|$)(.*)/s);

      while (splitMatch) {
        const titlePart = splitMatch[1] + splitMatch[2];
        const bodyPart = splitMatch[4];
        const titleTrimmed = titlePart.trim();
        const isInitialsOrAbbr =
          /^[A-Za-z]\.?$/i.test(titleTrimmed) ||
          /^[A-Za-z]\.[A-Za-z]\.?$/i.test(titleTrimmed) ||
          /^(mons|sac|don|prof|dott|sec)\.?$/i.test(titleTrimmed);

        if (isInitialsOrAbbr && bodyPart.trim().length > 0) {
          const nextMatch = bodyPart.match(/^(.+?)(\.|!|\?)(\s+|$)(.*)/s);
          if (nextMatch) {
            splitMatch = [
              splitMatch[0],
              splitMatch[1] + splitMatch[2] + " " + nextMatch[1],
              nextMatch[2],
              nextMatch[3],
              nextMatch[4],
            ];
            continue;
          }
        }
        break;
      }

      if (splitMatch && splitMatch[4].trim().length > 0) {
        const titlePart = splitMatch[1] + splitMatch[2];
        const bodyPart = splitMatch[4];
        blocks.push(
          <React.Fragment key={nextKey('titolo-inline', titlePart)}>
            <h3 className="text-amber-500 font-display font-bold text-2xl md:text-3xl mt-8 mb-2 leading-tight tracking-tight uppercase border-b border-amber-500/10 pb-1 w-fit">
              {titlePart.replace(/[.:]$/, '')}{' '}
            </h3>
            <p className="text-slate-300 font-serif text-lg leading-relaxed text-justify mb-4">
              {bodyPart}
            </p>
          </React.Fragment>,
        );
        continue;
      }
      blocks.push(
        <h3
          key={nextKey('titolo', contentWithoutPrefix)}
          className="text-amber-500 font-display font-bold text-2xl md:text-3xl mt-8 mb-2 leading-tight tracking-tight uppercase border-b border-amber-500/10 pb-1 w-fit"
        >
          {contentWithoutPrefix.replace(/[.:]$/, '')}
        </h3>,
      );
      continue;
    }

    const isOldSchoolTitle =
      trimmed.length > 3 &&
      trimmed.length < 80 &&
      trimmed === trimmed.toUpperCase() &&
      !trimmed.endsWith('.') &&
      /\p{L}/u.test(trimmed);

    if (isOldSchoolTitle) {
      blocks.push(
        <h3
          key={nextKey('caps', trimmed)}
          className="text-amber-500 font-display font-bold text-2xl md:text-3xl mt-8 mb-2 leading-tight tracking-tight uppercase border-b border-amber-500/10 pb-1 w-fit"
        >
          {trimmed.replace(/:$/, '')}
        </h3>,
      );
      continue;
    }

    blocks.push(
      <p
        key={nextKey('p', trimmed)}
        className="text-slate-300 font-serif text-lg leading-relaxed text-justify mb-4"
      >
        {trimmed}
      </p>,
    );
  }

  return <div className="space-y-4">{blocks}</div>;
}
