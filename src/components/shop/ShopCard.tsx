import { ArrowRight, Award, MapPin, Star } from 'lucide-react';
import type React from 'react';
import { FavoriteBookmarkButton } from '@/components/myspace/FavoriteBookmarkButton';
import { useModal } from '@/context/ModalContext';
import { useUser } from '@/context/UserContext';
import { useMobileCompact } from '@/hooks/ui/useMobileCompact';
import { useDynamicStyles } from '../../hooks/useDynamicStyles'; // NEW HOOK
import { calculateShopRank } from '../../services/shopService';
import type { ShopPartner } from '../../types/index';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface ShopCardProps {
  shop: ShopPartner;
  onOpen: (shop: ShopPartner) => void;
}

const SHOP_PLACEHOLDER_BY_CATEGORY: Record<string, string> = {
  gusto: 'shop_gusto',
  cantina: 'shop_cantina',
  artigianato: 'shop_artigianato',
  moda: 'shop_moda',
};

export const ShopCard: React.FC<ShopCardProps> = ({ shop, onOpen }) => {
  const { user } = useUser();
  const { openModal } = useModal();
  const rank = calculateShopRank(shop);
  const activeProducts = shop.products.filter((p) => p.status === 'active');

  const placeholderCat = SHOP_PLACEHOLDER_BY_CATEGORY[shop.category] || 'shop';

  // MD compact band (same as previous innerWidth < MD) — not useMobileDetect (LG).
  const isMobile = useMobileCompact();

  // 2. Hook Stili Dinamici
  const titleStyle = useDynamicStyles('shop_card_title', isMobile);

  return (
    <div
      className={`relative bg-[#020617] border rounded-[2rem] overflow-hidden transition-all hover:border-slate-600 group flex h-64 cursor-pointer ${shop.badge === 'gold' ? 'border-amber-500/40 shadow-2xl shadow-amber-900/10 ring-1 ring-amber-500/10' : 'border-slate-800 shadow-xl'}`}
    >
      <button
        type="button"
        aria-label={`Apri bottega ${shop.name}`}
        onClick={() => onOpen(shop)}
        className="absolute inset-0 z-0 cursor-pointer border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 focus-visible:ring-inset"
      />
      <div className="w-1/3 h-full relative overflow-hidden shrink-0 border-r border-slate-800/50 pointer-events-none z-[1]">
        <ImageWithFallback
          src={shop.imageUrl}
          alt={shop.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
          category={placeholderCat}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-80"></div>
        {shop.badge === 'gold' && (
          <div className="absolute top-6 left-6 bg-amber-500 text-black text-[8px] font-black px-3 py-1 rounded-full shadow-2xl flex items-center gap-1.5 uppercase tracking-tighter ring-2 ring-black/30 z-floating-panel">
            <Award className="w-3 h-3" /> SPONSOR
          </div>
        )}
      </div>

      <div className="flex-1 p-6 flex flex-col justify-between overflow-hidden relative z-[1] pointer-events-none">
        <div className="w-full min-w-0">
          <div className="flex justify-between items-start mb-4 w-full gap-2">
            <div className="flex-1 min-w-0">
              {/* DYNAMIC STYLE */}
              <h4
                className={`mb-1 group-hover:text-indigo-400 transition-colors leading-none truncate ${titleStyle}`}
              >
                {shop.name}
              </h4>
              <div className="flex items-center gap-2 text-slate-500 text-[8px] font-black uppercase tracking-[0.2em] truncate">
                <MapPin className="w-3.5 h-3.5 text-amber-500" /> {shop.address}
              </div>
            </div>
            <div className="flex items-start gap-2 shrink-0 ml-2">
              <div className="relative z-[1] pointer-events-auto pt-0.5">
                <FavoriteBookmarkButton
                  userId={user?.role === 'guest' ? null : user?.id}
                  entityKind="shop"
                  entityId={shop.id}
                  onRequireAuth={() => openModal('auth')}
                  size="sm"
                />
              </div>
              <div className="bg-slate-950/60 border border-slate-800 p-2 rounded-xl flex flex-col items-center min-w-[70px] shadow-inner">
                <div className="flex items-center gap-1 text-amber-500 font-black text-xl">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{shop.rating.toFixed(1)}</span>
                </div>
                <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">
                  Rating
                </span>
              </div>
            </div>
          </div>
          {activeProducts.length > 0 && (
            <div className="flex gap-2 mt-1 overflow-x-auto no-scrollbar pb-2">
              {activeProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2 flex flex-col shrink-0 group-hover:bg-indigo-900/40 group-hover:border-indigo-500/30 transition-all text-left"
                >
                  <span className="text-[9px] font-black text-white uppercase tracking-tight truncate max-w-[120px] group-hover:text-indigo-300">
                    {product.name}
                  </span>
                  <span className="text-xs font-mono font-black text-emerald-400">
                    €{product.price.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-between items-center pt-4 border-t border-slate-800/50 w-full shrink-0">
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-600 font-black uppercase tracking-[0.2em] mb-0.5">
              Rank TDS
            </span>
            <span className="text-indigo-400 font-black font-mono text-base leading-none">
              #{rank.toFixed(0)}
            </span>
          </div>
          <span className="bg-indigo-600 group-hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-black uppercase text-[9px] tracking-[0.15em] transition-all shadow-xl group-hover:shadow-indigo-500/30 flex items-center justify-center">
            Vedi Bottega <ArrowRight className="w-3.5 h-3.5 ml-2" />
          </span>
        </div>
      </div>
    </div>
  );
};
