import { Sparkles } from 'lucide-react';
import { AI_PUBLIC_DISCLOSURE_TEXT } from '@/services/media/provenanceService';

type AiGeneratedImageDisclosureProps = {
  className?: string;
  compact?: boolean;
};

/** Dicitura AI pubblica obbligatoria (§36.7) — basata su metadata strutturato, non su URL. */
export const AiGeneratedImageDisclosure = ({
  className = '',
  compact = false,
}: AiGeneratedImageDisclosureProps) => (
  <p
    className={`flex items-start gap-2 text-slate-400 ${compact ? 'text-[10px] leading-snug' : 'text-xs leading-relaxed'} ${className}`}
  >
    <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" aria-hidden />
    <span>{AI_PUBLIC_DISCLOSURE_TEXT}</span>
  </p>
);
