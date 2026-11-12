import type { ClothingItem } from '../types';
import GarmentArt from './GarmentArt';
export default function OutfitPreview({ items, variant = 'grid' }: {items: ClothingItem[]; variant?: 'grid' | 'horizontal'}) {
  return <div className={`outfit-preview outfit-preview-${variant}`}>
    {items.slice(0,4).map((item,idx)=><div key={item.id} className={`outfit-piece outfit-piece-${idx}`}>
      <GarmentArt item={item} compact/>
    </div>)}
    {items.length===0 && <span className="outfit-preview-empty">✧</span>}
  </div>;
}
