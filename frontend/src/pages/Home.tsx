import { ArrowRight, ArrowUpRight, Check, ChevronRight, Heart, Layers3, Plus, Shirt, Sparkles, WandSparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCloset } from '../context/ClosetContext';
import { useToast } from '../context/ToastContext';
import ClothingCard from '../components/ClothingCard';
import OutfitPreview from '../components/OutfitPreview';
import { EmptyState, MoreLink, WindowPanel } from '../components/UI';
import { firstName } from '../utils/helpers';
export default function Home() {
  const {clothes,outfits,profile,updateClothing}=useCloset();const toast=useToast();
  const navigate=useNavigate();
  const favoriteCount=clothes.filter(c=>c.favorite).length;
  const latestOutfit=outfits[0];
  return <div className="page-home page-enter">
    <div className="home-greeting"><span className="eyebrow"><Sparkles size={14}/> WELCOME TO YOUR STYLE SPACE</span><div className="home-greeting-line"><h1>Oi, {firstName(profile.name)} <span className="wave">✳</span></h1></div><p>Seu universo de estilo está a um clique de distância.</p></div>
    <section className="hero-panel">
      <div className="hero-copy"><span className="hero-overline">✧ YOUR CLOSET, UPGRADED</span><h2>Seu estilo tem<br/><em>infinitas versões.</em></h2><p>Organize suas peças favoritas, misture possibilidades e descubra looks que são a sua cara.</p><div className="hero-actions"><button className="btn btn-primary" onClick={()=>navigate('/builder')}>Criar um look <ArrowRight size={17}/></button><button className="btn btn-soft" onClick={()=>navigate('/add')}>Adicionar peça <Plus size={16}/></button></div><span className="hero-bottom-caption">PERSONAL STYLE SYSTEM · ALWAYS IN STYLE</span></div>
      <div className="hero-art" aria-hidden="true"><span className="hero-orbit orbit-one"/><span className="hero-orbit orbit-two"/><span className="hero-glow"/><span className="hero-star hero-star-one">✳</span><span className="hero-star hero-star-two">✦</span><div className="hero-card hero-card-back"><Shirt size={62} strokeWidth={1.1}/></div><div className="hero-card hero-card-front"><span>LOOK <strong>01</strong></span><div className="hero-abstract-shirt"><svg viewBox="0 0 170 170" xmlns="http://www.w3.org/2000/svg"><path d="M57 28 72 20 Q86 38 101 20 L117 28 155 48 139 82 123 72 124 148 Q85 161 46 148 L47 72 31 82 15 48Z" fill="#BC91D9" stroke="#855CA9" strokeWidth="2"/><path d="M72 20 Q86 54 101 20" fill="none" stroke="#f5e9ff" strokeWidth="5"/><path d="M48 141 Q85 151 123 141" stroke="#FFF" strokeOpacity=".45" strokeWidth="3" fill="none"/></svg></div><small>made for your mood ✧</small></div><div className="hero-spark-label">100% YOU <span>↗</span></div></div>
    </section>
    <div className="stats-grid">
      <button className="stat-card stat-pink" onClick={()=>navigate('/closet')}><span className="stat-icon"><Shirt size={22}/></span><div><strong>{clothes.length.toString().padStart(2,'0')}</strong><span>peças no closet</span></div><ArrowUpRight size={18} className="stat-arrow"/></button>
      <button className="stat-card stat-lilac" onClick={()=>navigate('/saved')}><span className="stat-icon"><Layers3 size={22}/></span><div><strong>{outfits.length.toString().padStart(2,'0')}</strong><span>looks criados</span></div><ArrowUpRight size={18} className="stat-arrow"/></button>
      <button className="stat-card stat-cream" onClick={()=>navigate('/closet?favorites=1')}><span className="stat-icon"><Heart size={22}/></span><div><strong>{favoriteCount.toString().padStart(2,'0')}</strong><span>peças favoritas</span></div><ArrowUpRight size={18} className="stat-arrow"/></button>
    </div>
    <div className="home-columns">
      <WindowPanel title="01 / YOUR WARDROBE" actions={<MoreLink onClick={()=>navigate('/closet')}>Ver closet</MoreLink>} className="home-wardrobe-panel">
        <div className="section-head"><div><h2>Recém-chegadas <span className="tiny-spark">✦</span></h2><p>As últimas peças que entraram para o seu closet.</p></div></div>
        {clothes.length>0?<div className="recent-grid">{clothes.slice(0,4).map(item=><ClothingCard key={item.id} item={item} mini onClick={()=>navigate(`/closet?item=${item.id}`)} onFavorite={()=>{void updateClothing(item.id,{favorite:!item.favorite}).catch(e=>toast(e instanceof Error?e.message:'Falha ao favoritar.','error'))}}/>)}</div>:<EmptyState icon={Shirt} title="Seu closet começa aqui" description="Adicione a primeira peça e comece a criar combinações." action={<button className="btn btn-primary" onClick={()=>navigate('/add')}>Adicionar peça <Plus size={16}/></button>}/>}
      </WindowPanel>
      <div className="home-aside">
        <WindowPanel title="02 / STYLE MEMO" className="style-memo-panel">
          {latestOutfit?<><div className="memo-heading"><span className="memo-label"><Heart size={13}/> SEU ÚLTIMO LOOK</span><span className="memo-date">✧ LOOK FILE</span></div><div className="memo-illustration"><OutfitPreview items={latestOutfit.itemIds.map(id=>clothes.find(c=>c.id===id)).filter((c):c is NonNullable<typeof c>=>Boolean(c))}/></div><h3>{latestOutfit.name}</h3><p>{latestOutfit.occasion} · {latestOutfit.itemIds.length} peças</p><button className="text-link" onClick={()=>navigate('/saved')}>Ver seus looks <ArrowRight size={15}/></button></>:<EmptyState icon={Heart} title="Seus looks ficam aqui" description="Crie sua primeira combinação para vê-la em destaque." action={<button className="btn btn-secondary" onClick={()=>navigate('/builder')}>Montar look</button>}/>}
        </WindowPanel>
      </div>
    </div>
    <div className="bottom-tiles">
      <button className="inspiration-card" onClick={()=>navigate('/suggestions')}><div><span className="eyebrow"><Sparkles size={14}/> DISCOVER YOUR STYLE</span><h3>Sem ideia do que vestir?</h3><p>Deixa que o LookLoop sugere novas possibilidades com o que você já tem.</p><span className="mini-action">Explorar sugestões <ArrowRight size={15}/></span></div><div className="inspiration-decoration"><WandSparkles size={52}/><span>✧</span></div></button>
      <div className="quick-checklist"><span className="eyebrow">✳ QUICK START</span><h3>Sua próxima inspiração</h3><button onClick={()=>navigate('/add')}><span className="check-icon"><Plus size={14}/></span>Adicione uma nova peça<ChevronRight size={16}/></button><button onClick={()=>navigate('/builder')}><span className="check-icon"><Check size={14}/></span>Monte uma combinação<ChevronRight size={16}/></button><button onClick={()=>navigate('/saved')}><span className="check-icon"><Heart size={14}/></span>Revisite seus looks<ChevronRight size={16}/></button></div>
    </div>
    {clothes.length>0&&<div className="home-bottom-note"><span>✦</span><span>O melhor look é aquele que faz você se sentir você.</span><span>✦</span></div>}
  </div>;
}
