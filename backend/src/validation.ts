const categories = ['tops','bottoms','dresses','outerwear','shoes','bags','accessories'];
const seasons = ['Todas','Verão','Outono','Inverno','Primavera'];
const occasions = ['Casual','Trabalho','Faculdade','Festa','Passeio','Especial'];
const accents = ['berry','lilac','rose'];
export const uuid = (v: unknown): v is string => typeof v === 'string' && /^[a-f\d]{8}-[a-f\d]{4}-[1-8][a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(v);
export const validEmail = (v: unknown): v is string => typeof v === 'string' && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const str = (v: unknown, max: number, min = 0): v is string => typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;
const isObject = (v: unknown): v is Record<string,unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const hex = (v:unknown) => typeof v === 'string' && /^#[a-f0-9]{6}$/i.test(v);
const bool = (v:unknown): v is boolean => typeof v === 'boolean';
const choices = (opts: string[]) => (v:unknown) => typeof v === 'string' && opts.includes(v);
type Rule = (v:unknown)=>boolean;
const clothingRules: Record<string,Rule> = {
  name:v=>str(v,60,1), category:choices(categories),color:v=>str(v,30,1),hex,season:choices(seasons),occasion:choices(occasions),style:v=>str(v,50),favorite:bool,
  imageId: v=>v === null || uuid(v)
};
const outfitRules: Record<string,Rule> = { name:v=>str(v,60,1),occasion:choices(occasions),notes:v=>str(v,250),favorite:bool,
  itemIds:v=>Array.isArray(v)&&v.length>=2&&v.length<=12&&v.every(uuid)&&new Set(v).size===v.length };
const profileRules: Record<string,Rule> = { name:v=>str(v,60,1),email:validEmail,wardrobeName:v=>str(v,80,1),accent:choices(accents), dailyInspiration:bool,stylingTips:bool,emailUpdates:bool,
  avatar:v=>v===null||(typeof v==='string'&&v.length<=260000&&(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(v))) };
function validate(body:unknown, rules:Record<string,Rule>, required:string[], partial:boolean):string|null {
  if(!isObject(body)) return 'Envie um objeto JSON válido.';
  const keys=Object.keys(body);
  if(keys.length===0) return 'Nenhum campo informado.';
  for (const k of keys) if (!(k in rules) || !rules[k]!(body[k])) return `Campo inválido: ${k}`;
  if(!partial) for(const k of required) if(!(k in body)) return `Campo obrigatório: ${k}`;
  return null;
}
export const validateClothing=(v:unknown,partial=false)=>validate(v,clothingRules,['name','category','color','hex','season','occasion','style'],partial);
export const validateOutfit=(v:unknown,partial=false)=>validate(v,outfitRules,['name','occasion','notes','itemIds'],partial);
export const validateProfile=(v:unknown)=>validate(v,profileRules,[],true);
