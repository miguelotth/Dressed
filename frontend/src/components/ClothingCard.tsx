import { Heart, MoreHorizontal } from 'lucide-react';
import type { ClothingItem } from '../types';
import { CATEGORY_SHORT } from '../types';
import GarmentArt from './GarmentArt';
export default function ClothingCard({item,onClick,onFavorite,mini=false}: {item:ClothingItem;onClick?:()=>void;onFavorite?:()=>void;mini?:boolean}) {
  return <article className={`clothing-card ${mini?'clothing-card-mini':''}`}>
    <button className="clothing-picture" onClick={onClick} aria-label={`Ver ${item.name}`}>
      <GarmentArt item={item}/><span className="picture-deco">✧</span>
      {!mini&&<span className="picture-category">{CATEGORY_SHORT[item.category]}</span>}
    </button>
    {onFavorite&&!mini&&<button className={`favorite-button ${item.favorite?'is-favorite':''}`} onClick={onFavorite} aria-label={item.favorite?'Remover dos favoritos':'Adicionar aos favoritos'}><Heart size={17} fill={item.favorite?'currentColor':'none'}/></button>}
    <div className="clothing-info"><div><h3>{item.name}</h3><span>{item.color} · {CATEGORY_SHORT[item.category]}</span></div>
      {!mini&&<button className="clothing-more" onClick={onClick} aria-label={`Detalhes de ${item.name}`}><MoreHorizontal size={20}/></button>}
    </div>
  </article>;
}
