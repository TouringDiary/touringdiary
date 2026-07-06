import type { User } from '@/types/users';
import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Check, MessageCircle, Facebook, Twitter, Mail, Share2 } from 'lucide-react';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    text: string;
    url: string;
}

export const ShareModal = ({ isOpen, onClose, title, text, url }: ShareModalProps) => {
    const [copied, setCopied] = useState(false);
    const [isMobileUserAgent, setIsMobileUserAgent] = useState(false);

    const isMobile = useMobileDetect();
    const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
    const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
    const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
    const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
    const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);
    const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle, isMobile);

    useEffect(() => {
        const ua = navigator.userAgent || navigator.vendor || (window as Window & { opera?: string }).opera;
        const mobileRegex = /android|avantgo|blackberry|bada\/|bb|meego|bs\/|dolfin|kindle|mercury|mobile|mmp|netfront|opera m(ob|in)i|palm|phone|pixi|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i;
        setIsMobileUserAgent(mobileRegex.test(ua ?? ''));
    }, []);

    useGlobalModalEscape(isOpen, onClose);

    if (!isOpen) return null;

    const fullText = `${text}\n\n${url}`;
    const encodedText = encodeURIComponent(fullText);
    const encodedUrl = encodeURIComponent(url);

    const handleCopy = () => {
        navigator.clipboard.writeText(fullText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const socialLinks = [
        {
            id: 'whatsapp',
            label: 'WhatsApp',
            icon: <MessageCircle className="w-5 h-5" />,
            color: 'bg-[#25D366] hover:bg-[#20bd5a]',
            href: isMobileUserAgent
                ? `https://api.whatsapp.com/send?text=${encodedText}`
                : `https://web.whatsapp.com/send?text=${encodedText}`
        },
        {
            id: 'facebook',
            label: 'Facebook',
            icon: <Facebook className="w-5 h-5 fill-current" />,
            color: 'bg-[#1877F2] hover:bg-[#166fe5]',
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        },
        {
            id: 'twitter',
            label: 'X (Twitter)',
            icon: <Twitter className="w-5 h-5 fill-current" />,
            color: 'bg-black hover:bg-slate-800',
            href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodedUrl}`
        },
        {
            id: 'email',
            label: 'Email',
            icon: <Mail className="w-5 h-5" />,
            color: 'bg-slate-700 hover:bg-slate-600',
            href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodedText}`
        }
    ];

    return createPortal(
        <div
            className={`td-modal-overlay ${overlayShell} !items-center`}
            style={{ zIndex: Z_OVERLAY }}
            onClick={onClose}
        >
            <div
                className={`${containerShell} max-w-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900`}
                style={{ zIndex: Z_MODAL }}
                onClick={(e) => e.stopPropagation()}
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
                    <h3 id="share-modal-title" className={`${modalTitleShell} mb-1`}>Condividi Esperienza</h3>
                    <p id="share-modal-desc" className={`${modalSubtitleShell} mb-6`}>Scegli dove inviare il link</p>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {socialLinks.map(link => (
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
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 pr-12 flex items-center">
                            <span className="text-xs text-slate-400 truncate w-full font-mono">{url}</span>
                        </div>
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="absolute right-1 top-1 bottom-1 bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg transition-colors border border-slate-700"
                            title="Copia Link"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
