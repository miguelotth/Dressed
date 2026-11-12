import { type ClothingItem, type Occasion } from '../types';
import { isNeutral, occasionScore } from './helpers';
export interface Suggestion {id:string;name:string;items:ClothingItem[];occasion:Occasion;reason:string;tag:string}
const names=['Soft everyday','Effortlessly you','Closet crush','The daily edit','A little extra','Mood of the day','Easy does it','New perspective','The good combo'];
const reasons=['Peças versáteis e confortáveis para acompanhar sua rotina.','Uma combinação de tons que conversa sem esforço.','Misture básicos e detalhes que dão personalidade.','Seu próprio closet tem mais possibilidades do que parece.','Uma escolha prática com um toque especial.','Aposte em contrastes sutis para criar um visual equilibrado.'];
const scorePair=(a:ClothingItem,b:ClothingItem)=>a.color===b.color?2:(isNeutral(a)||isNeutral(b)?5:1);
function pick(list:ClothingItem[],occasion:Occasion,seed:number,preferred?:ClothingItem):ClothingItem|undefined{
  if(!list.length)return undefined;
  const sorted=[...list].sort((a,b)=>{const sa=occasionScore(a,occasion)+(preferred?scorePair(a,preferred):0);const sb=occasionScore(b,occasion)+(preferred?scorePair(b,preferred):0);return sb-sa});
  return sorted[(seed*7+Math.floor(seed/2))%Math.min(3,sorted.length)];
}
export function generateSuggestions(clothes:ClothingItem[],occasion:Occasion,shuffle=0):Suggestion[]{
  const shoes=clothes.filter(c=>c.category==='shoes');const tops=clothes.filter(c=>c.category==='tops');const bottoms=clothes.filter(c=>c.category==='bottoms');const dresses=clothes.filter(c=>c.category==='dresses');
  const outer=clothes.filter(c=>c.category==='outerwear');const bags=clothes.filter(c=>c.category==='bags');const accessories=clothes.filter(c=>c.category==='accessories');
  const results:Suggestion[]=[];const seen=new Set<string>();
  if(!shoes.length||(!dresses.length&&(!tops.length||!bottoms.length)))return [];
  for(let i=0;i<27&&results.length<6;i++){
    const s=i+shuffle*3;const useDress=dresses.length>0&&(i%4===3||!tops.length||!bottoms.length);
    const base=useDress?pick(dresses,occasion,s):pick(tops,occasion,s);
    const second=useDress?undefined:pick(bottoms,occasion,s+1,base);
    const shoe=pick(shoes,occasion,s+2,second||base);
    const layer=i%3===2?pick(outer,occasion,s+4,base):undefined;
    const bag=i%2===0?pick(bags,occasion,s+1):undefined;
    const accessory=i%5===2?pick(accessories,occasion,s+5):undefined;
    const items=[base,second,shoe,layer,bag,accessory].filter((item):item is ClothingItem=>Boolean(item));
    if(items.length<2)continue;
    const key=items.map(c=>c.id).sort().join('|');if(seen.has(key))continue;seen.add(key);
    results.push({id:`s-${shuffle}-${i}`,name:names[(i+shuffle)%names.length],items,occasion,reason:reasons[(i+shuffle)%reasons.length],tag:i%3===0?'COLOR HARMONY':i%3===1?'EASY TO WEAR':'YOUR STYLE MATCH'});
  }
  return results;
}
