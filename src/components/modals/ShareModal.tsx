
import React, { useEffect, useState } from 'react';
import { X, Copy, Check, MessageCircle, Facebook, Twitter, Mail, Share2 } from 'lucide-react';

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

    useEffect(() => {
        // Rilevamento robusto tramite User Agent invece che larghezza schermo.
        // Questo evita che finestre desktop ridimensionate usino i link mobile (che si rompono su PC).
        const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
        const mobileRegex = /android|avantgo|blackberry|bada\/|bb|meego|bs\/|dolfin|kindle|mercury|mobile|mmp|netfront|opera m(ob|in)i|palm|phone|pixi|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i;
        setIsMobileUserAgent(mobileRegex.test(ua));
    }, []);

    // ESC Key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

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
            // FIX CRITICO: Su Desktop usa SEMPRE web.whatsapp.com. 
            // api.whatsapp.com spesso reindirizza alla pagina di download se l'app non è installata o il browser non gestisce l'intent.
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

    return (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-700 shadow-2xl p-6 relative animate-in zoom-in-95">
                
                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-800">
                    <X className="w-5 h-5"/>
                </button>

                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center border-2 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.3)] mx-auto mb-4">
                        <Share2 className="w-8 h-8 text-indigo-500"/>
                    </div>
                    <h3 className="text-xl font-display font-bold text-white mb-1">Condividi Esperienza</h3>
                    <p className="text-xs text-slate-400">Scegli dove inviare il link</p>
                </div>

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
                        onClick={handleCopy}
                        className="absolute right-1 top-1 bottom-1 bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg transition-colors border border-slate-700"
                        title="Copia Link"
                    >
                        {copied ? <Check className="w-4 h-4 text-emerald-500"/> : <Copy className="w-4 h-4"/>}
                    </button>
                </div>
            </div>
        </div>
    );
};
