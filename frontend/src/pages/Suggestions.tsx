import { useMemo, useState } from 'react';
import { ArrowRight, Check, Heart, Info, RefreshCw, Sparkles, WandSparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import OutfitPreview from '../components/OutfitPreview';
import { EmptyState, PageHeading } from '../components/UI';
import { useCloset } from '../context/ClosetContext';
import { useToast } from '../context/ToastContext';
import { OCCASIONS, type Occasion } from '../types';

import { generateSuggestions } from '../utils/recommend';
export default function Suggestions(){
  const {clothes,outfits,addOutfit}=useCloset();const toast=useToast();const navigate=useNavigate();
  const [occasion,setOccasion]=useState<Occasion>('Casual');const [shuffle,setShuffle]=useState(0);
  const suggestions=useMemo(()=>generateSuggestions(clothes,occasion,shuffle),[clothes,occasion,shuffle]);
  const alreadySaved=(ids:string[])=>outfits.some(o=>o.itemIds.length===ids.length&&ids.every(id=>o.itemIds.includes(id)));
  const [savingId,setSavingId]=useState('');
  const save=async(suggestion:typeof suggestions[number])=>{
    if(alreadySaved(suggestion.items.map(i=>i.id))){toast('Essa combinação já está nos seus looks.','info');return;}
    setSavingId(suggestion.id);
    try{
      await addOutfit({name:suggestion.name,itemIds:suggestion.items.map(i=>i.id),occasion:suggestion.occasion,notes:suggestion.reason,favorite:false});
      toast('Sugestão salva nos seus looks!');
    }catch(e){toast(e instanceof Error?e.message:'Não foi possível salvar o look.','error');}
    finally{setSavingId('')}
  };
  return <div className="page-enter"><PageHeading eyebrow="05 / PERSONAL STYLE IDEAS" title="Sugestões para você" description="Novas possibilidades com as peças que já fazem parte do seu closet." actions={<button className="btn btn-secondary" onClick={()=>navigate('/builder')}><WandSparkles size={17}/> Montar do meu jeito</button>}/>
    <section className="suggest-hero"><div><span className="suggest-hero-tag"><Sparkles size={14}/> STYLE ALGORITHM / V1.0</span><h2>Um closet. <em>Mil possibilidades.</em></h2><p>O LookLoop combina suas peças por categoria, cor e ocasião — sem precisar de inteligência artificial ou serviços pagos.</p></div><div className="suggest-hero-icon"><WandSparkles size={64} strokeWidth={1.3}/><span>✧</span></div></section>
    <div className="suggest-controls"><div><span className="section-kicker">THE OCCASION</span><h3>Qual é a vibe de hoje?</h3><div className="filter-chips">{OCCASIONS.map(o=><button key={o} className={`filter-chip ${occasion===o?'selected':''}`} onClick={()=>{setOccasion(o);setShuffle(0)}}>{o}</button>)}</div></div><button className="btn btn-primary" onClick={()=>{setShuffle(s=>s+1);toast('Novas possibilidades geradas!')}}><RefreshCw size={17}/> Gerar novos looks</button></div>
    <div className="suggest-section-heading"><div><span className="eyebrow"><Sparkles size={14}/> CURATED FOR YOU</span><h2>Combinações que combinam com você <span>✧</span></h2><p>Explore ideias baseadas no que você já tem.</p></div><span className="suggest-count">{suggestions.length} IDEIAS</span></div>
    {suggestions.length?<div className="suggest-grid">{suggestions.map((s,i)=>{const saved=alreadySaved(s.items.map(c=>c.id));return <article className="suggest-card" key={s.id}><div className="suggest-image"><OutfitPreview items={s.items}/><span className="suggest-index">STYLE IDEA #{String(i+1).padStart(2,'0')}</span></div><div className="suggest-card-body"><span className="suggest-card-tag"><Sparkles size={12}/>{s.tag}</span><h3>{s.name}</h3><p>{s.reason}</p><div className="suggest-pieces">{s.items.length} peças · {s.occasion}</div><button className={`btn ${saved?'btn-saved':'btn-primary'} suggest-save`} onClick={()=>void save(s)} disabled={savingId!==''}>{saved?<><Check size={16}/> Já está nos seus looks</>:<><Heart size={16}/> Salvar combinação <ArrowRight size={15}/></>}</button></div></article>})}</div>:
      <EmptyState icon={WandSparkles} title="Precisamos de mais peças para combinar" description="Para gerar sugestões, cadastre pelo menos uma parte de cima, uma parte de baixo e um calçado — ou um vestido e um calçado." action={<button className="btn btn-primary" onClick={()=>navigate('/add')}>Adicionar peças <ArrowRight size={16}/></button>}/>}
    <div className="algorithm-note"><Info size={18}/><div><b>Como funcionam as sugestões?</b><p>Nesta versão inicial, o LookLoop usa um algoritmo simples de regras: combina categorias compatíveis, prioriza a ocasião escolhida e procura harmonizar cores neutras. Não é IA generativa — é uma lógica local e gratuita, pronta para evoluir.</p></div></div>
  </div>;
}
