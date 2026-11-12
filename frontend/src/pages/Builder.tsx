import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Heart, Layers3, Plus, RotateCcw, Save, Search, Shirt, Sparkles, WandSparkles, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GarmentArt from '../components/GarmentArt';
import { EmptyState, PageHeading, WindowPanel } from '../components/UI';
import { useCloset } from '../context/ClosetContext';
import { useToast } from '../context/ToastContext';
import { CATEGORIES, CATEGORY_SHORT, OCCASIONS, type Category, type Occasion } from '../types';

const slotOrder:Category[]=['outerwear','tops','bottoms','dresses','shoes','bags','accessories'];
type Selection = Partial<Record<Category,string>>;
const selectItem = (prev:Selection,category:Category,id:string):Selection => {
  const next={...prev,[category]:prev[category]===id?undefined:id};
  if(category==='dresses'&&next.dresses){next.tops=undefined;next.bottoms=undefined}
  if((category==='tops'||category==='bottoms')&&next[category])next.dresses=undefined;
  return next;
};
export default function Builder(){
  const {clothes,outfits,addOutfit,updateOutfit}=useCloset();const toast=useToast();const navigate=useNavigate();const [params]=useSearchParams();
  const editingId=params.get('edit')||'';
  const editing=outfits.find(o=>o.id===editingId);
  const [selection,setSelection]=useState<Selection>({});const [activeCat,setActiveCat]=useState<Category>('tops');const [search,setSearch]=useState('');
  const [name,setName]=useState('');const [occasion,setOccasion]=useState<Occasion>('Casual');const [notes,setNotes]=useState('');
  const [error,setError]=useState('');
  useEffect(()=>{if(editing){const next:Selection={};editing.itemIds.forEach(id=>{const item=clothes.find(c=>c.id===id);if(item)next[item.category]=id});setSelection(next);setName(editing.name);setOccasion(editing.occasion);setNotes(editing.notes)}},[editingId]); // eslint-disable-line react-hooks/exhaustive-deps
  const selectedItems=useMemo(()=>slotOrder.map(c=>clothes.find(item=>item.id===selection[c])).filter((c):c is NonNullable<typeof c>=>Boolean(c)),[clothes,selection]);
  const displayedItems=clothes.filter(item=>item.category===activeCat&&item.name.toLowerCase().includes(search.toLowerCase()));
  const filledSlots=slotOrder.filter(cat=>selection[cat]&&clothes.some(c=>c.id===selection[cat]));
  const add=(cat:Category,id:string)=>{setSelection(s=>selectItem(s,cat,id));setError('')};
  const [saving,setSaving]=useState(false);
  const save=async()=>{
    if(selectedItems.length<2){setError('Escolha pelo menos duas peças para salvar o look.');return;}
    const finalName=name.trim()||`Meu look ${outfits.length+1}`;
    setSaving(true);setError('');
    try {
      if(editing){await updateOutfit(editing.id,{name:finalName,occasion,notes,itemIds:selectedItems.map(c=>c.id)});toast('Look atualizado com sucesso!');}
      else {await addOutfit({name:finalName,itemIds:selectedItems.map(c=>c.id),occasion,notes,favorite:false});toast('Novo look salvo!');}
      navigate('/saved');
    }catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar o look.');}
    finally{setSaving(false)}
  };
  const surprise=()=>{const random= <T,>(arr:T[]):T|undefined=>arr[Math.floor(Math.random()*arr.length)];const tops=clothes.filter(c=>c.category==='tops');const bottoms=clothes.filter(c=>c.category==='bottoms');const dresses=clothes.filter(c=>c.category==='dresses');const shoes=clothes.filter(c=>c.category==='shoes');const newSel:Selection={};if(dresses.length&&Math.random()>.73)newSel.dresses=random(dresses)?.id;else{newSel.tops=random(tops)?.id;newSel.bottoms=random(bottoms)?.id}newSel.shoes=random(shoes)?.id;
    if(Math.random()>.4)newSel.outerwear=random(clothes.filter(c=>c.category==='outerwear'))?.id;
    if(Math.random()>.5)newSel.bags=random(clothes.filter(c=>c.category==='bags'))?.id;
    setSelection(newSel);setError('');toast('Uma nova ideia para seu look!')};
  return <div className="page-enter page-builder"><PageHeading eyebrow="03 / OUTFIT LAB" title={editing?'Editar look':'Montador de looks'} description="Experimente combinações. Encontre seu próximo favorito." actions={<button className="btn btn-secondary" onClick={()=>navigate('/saved')}><Heart size={16}/> Looks salvos</button>}/>
    <div className="builder-toolbar"><div><span className="tiny-caps">LOOKLAB.EXE / CREATIVE MODE</span><h2>Seu espaço de criação <span>✳</span></h2></div><div className="builder-toolbar-actions"><button className="btn btn-soft" onClick={surprise}><WandSparkles size={17}/> Surpreenda-me</button><button className="btn btn-secondary" onClick={()=>{setSelection({});setError('')}}><RotateCcw size={16}/> Limpar</button></div></div>
    <div className="builder-layout"><WindowPanel title="01 / YOUR PIECES" className="builder-catalog"><div className="catalog-inner"><div className="catalog-search search-field"><Search size={16}/><input placeholder="Buscar peça..." value={search} onChange={e=>setSearch(e.target.value)} aria-label="Buscar peças para o look"/></div><div className="catalog-category-tabs">{CATEGORIES.map(cat=><button key={cat} className={activeCat===cat?'active':''} onClick={()=>setActiveCat(cat)}>{CATEGORY_SHORT[cat]}<span>{clothes.filter(c=>c.category===cat).length}</span></button>)}</div><div className="catalog-items">{displayedItems.length?displayedItems.map(item=><button key={item.id} className={`catalog-item ${selection[item.category]===item.id?'selected':''}`} onClick={()=>add(item.category,item.id)} draggable onDragStart={e=>e.dataTransfer.setData('text/plain',item.id)}><span className="catalog-item-art"><GarmentArt item={item} compact/></span><span className="catalog-item-name"><b>{item.name}</b><small>{item.color}</small></span><span className="catalog-check">{selection[item.category]===item.id?<Check size={16}/>:<Plus size={17}/>}</span></button>):<div className="catalog-empty"><Shirt size={23}/><b>Nenhuma peça aqui</b><span>Adicione peças desta categoria ao closet.</span><button className="text-link" onClick={()=>navigate('/add')}>Adicionar peça <ArrowRight size={14}/></button></div>}</div><div className="catalog-tip"><Sparkles size={16}/><span>Clique ou arraste uma peça para a área de criação.</span></div></div></WindowPanel>
    <WindowPanel title="02 / YOUR CANVAS" className="builder-canvas-panel"><div className="canvas-body" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData('text/plain');const item=clothes.find(i=>i.id===id);if(item)add(item.category,item.id)}}><div className="canvas-header"><span className="canvas-label">THE LOOK IN PROGRESS ✧</span><span className="canvas-progress">{filledSlots.length} PEÇAS SELECIONADAS</span></div><div className="canvas-stage"><div className="canvas-stamp">LOOKLOOP<br/><span>STYLE STUDIO</span></div><div className="canvas-spark cs1">✧</div><div className="canvas-spark cs2">✳</div><div className="canvas-spark cs3">✦</div>{selectedItems.length===0?<div className="canvas-empty"><div className="canvas-empty-icon"><Shirt size={42} strokeWidth={1.1}/></div><h3>Seu look começa aqui.</h3><p>Escolha suas peças ao lado para começar a montar.</p><span>DRAG & DROP OR CLICK TO ADD</span></div>:<div className="canvas-items">{selectedItems.map((item,index)=><div key={item.id} className={`canvas-item canvas-item-${index%6}`}><GarmentArt item={item}/><button className="canvas-remove" onClick={()=>setSelection(s=>({...s,[item.category]:undefined}))} title={`Remover ${item.name}`} aria-label={`Remover ${item.name}`}><X size={14}/></button><span className="canvas-item-caption">{CATEGORY_SHORT[item.category]}</span></div>)}</div>}</div><div className="canvas-footer"><span>STYLE IS A LOOP, NOT A RULE.</span><span>✦ LOOKLOOP 2026</span></div></div></WindowPanel>
    <WindowPanel title="03 / LOOK DETAILS" className="builder-details"><div className="details-inner"><div className="detail-top"><span className="tiny-caps">YOUR CREATION</span><h3>O toque final <span>✧</span></h3><p>Dê um nome à combinação e salve para usar depois.</p></div><div className="selected-summary"><span>COMPOSIÇÃO</span>{filledSlots.length?filledSlots.map(cat=>{const item=clothes.find(c=>c.id===selection[cat]);return item?<div key={cat} className="selected-row"><span className="selected-row-art"><GarmentArt item={item} compact/></span><span><b>{CATEGORY_SHORT[cat]}</b><small>{item.name}</small></span><button onClick={()=>setSelection(s=>({...s,[cat]:undefined}))} aria-label={`Remover ${item.name}`}><X size={15}/></button></div>:null}):<div className="no-selection"><Layers3 size={20}/> Seu look está vazio</div>}</div><div className="form-stack"><label className="field"><span>Nome do look</span><input value={name} onChange={e=>setName(e.target.value)} placeholder="Ex.: Sexta-feira favorita" maxLength={45}/></label><label className="field"><span>Ocasião</span><select value={occasion} onChange={e=>setOccasion(e.target.value as Occasion)}>{OCCASIONS.map(o=><option key={o}>{o}</option>)}</select></label><label className="field"><span>Observações</span><textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} maxLength={250} placeholder="Como você quer se sentir nesse look?"/></label></div>{error&&<div className="form-error" role="alert">{error}</div>}<button className="btn btn-primary builder-save" onClick={()=>void save()} disabled={saving}><Save size={17}/>{editing?'Atualizar look':'Salvar meu look'}<ArrowRight size={16}/></button><span className="builder-save-hint">Pelo menos 2 peças para salvar</span></div></WindowPanel></div>
    {clothes.length<2&&<EmptyState title="Adicione mais peças para criar looks" description="Seu montador precisa de pelo menos duas peças para começar." action={<button className="btn btn-primary" onClick={()=>navigate('/add')}>Adicionar roupas <Plus size={16}/></button>}/>}
    <div className="builder-bottom"><button onClick={()=>navigate('/closet')}><ArrowLeft size={15}/> Meu closet</button><span>MAKE IT YOURS ✧</span><button onClick={()=>navigate('/suggestions')}>Precisa de inspiração? <ArrowRight size={15}/></button></div>
  </div>;
}
