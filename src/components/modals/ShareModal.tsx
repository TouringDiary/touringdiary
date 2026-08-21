import { Check, Copy, Facebook, Mail, MessageCircle, Share2, Twitter } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_MODAL, Z_OVERLAY } from '@/constants/zIndex';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  text: string;
  url: string;
}

/** UA mobile for WhatsApp deep-link — distinct from useMobileDetect (viewport breakpoint). */
function prefersMobileWhatsApp(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export const ShareModal = ({ isOpen, onClose, title, text, url }: ShareModalProps) => {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const isMobile = useMobileDetect();
  const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
  const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
  const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
  const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
  const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);
  const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle, isMobile);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    if (!copyError) return;
    const timer = window.setTimeout(() => setCopyError(false), 3000);
    return () => window.clearTimeout(timer);
  }, [copyError]);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      setCopyError(false);
    }
  }, [isOpen]);

  useGlobalModalEscape(isOpen, onClose);

  if (!isOpen) return null;

  const fullText = `${text}\n\n${url}`;
  const encodedText = encodeURIComponent(fullText);
  const encodedUrl = encodeURIComponent(url);

  const handleCopy = async () => {
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
  };

  const socialLinks = [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: <MessageCircle className="w-5 h-5" />,
      color: 'bg-[#25D366] hover:bg-[#20bd5a]',
      href: prefersMobileWhatsApp()
        ? `https://api.whatsapp.com/send?text=${encodedText}`
        : `https://web.whatsapp.com/send?text=${encodedText}`,
    },
    {
      id: 'facebook',
      label: 'Facebook',
      icon: <Facebook className="w-5 h-5 fill-current" />,
      color: 'bg-[#1877F2] hover:bg-[#166fe5]',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      id: 'twitter',
      label: 'X (Twitter)',
      icon: <Twitter className="w-5 h-5 fill-current" />,
      color: 'bg-black hover:bg-slate-800',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodedUrl}`,
    },
    {
      id: 'email',
      label: 'Email',
      icon: <Mail className="w-5 h-5" />,
      color: 'bg-slate-700 hover:bg-slate-600',
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodedText}`,
    },
  ];

  return createPortal(
    <div
      className={`td-modal-overlay ${overlayShell}`}
      style={{ zIndex: Z_OVERLAY }}
      role="presentation"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full cursor-default border-0 bg-transparent p-0"
        onClick={onClose}
      />
      <div
        className={`relative ${containerShell} max-w-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900`}
        style={{ zIndex: Z_MODAL }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        aria-describedby="share-modal-desc"
      >
        <CloseButton
          onClose={onClose}
          variant="primary"
          position="absolute"
          className={`${closeOffsetShell} z-local-overlay`}
        />

        <div className={`${bodyShell} text-center`}>
          <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center border-2 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.3)] mx-auto mb-4">
            <Share2 className="w-8 h-8 text-indigo-500" aria-hidden />
          </div>
          <h3 id="share-modal-title" className={`${modalTitleShell} mb-1`}>
            Condividi Esperienza
          </h3>
          <p id="share-modal-desc" className={`${modalSubtitleShell} mb-6`}>
            Scegli dove inviare il link
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {socialLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-xs uppercase shadow-lg transition-transform active:scale-95 ${link.color}`}
              >
                {link.icon} {link.label}
              </a>
            ))}
          </div>

          <div className="relative">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 pr-14 flex items-center min-h-[52px]">
              <span className="text-xs text-slate-400 truncate w-full font-mono">{url}</span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700 flex items-center justify-center"
              title="Copia Link"
              aria-label={copied ? 'Link copiato' : copyError ? 'Copia non riuscita' : 'Copia link'}
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-500" aria-hidden />
              ) : (
                <Copy className="w-4 h-4" aria-hidden />
              )}
            </button>
          </div>
          <p className="mt-2 min-h-[1.25rem] text-xs font-bold" role="status" aria-live="polite">
            {copied ? (
              <span className="text-emerald-500">Link copiato</span>
            ) : copyError ? (
              <span className="text-red-400">Copia non riuscita</span>
            ) : null}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
};
