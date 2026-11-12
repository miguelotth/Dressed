import { useRef, useState, type DragEvent, type FormEvent } from 'react';
import { ArrowRight, Camera, Check, CircleHelp, ImagePlus, Plus, Scissors, Shirt, Sparkles, UploadCloud, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GarmentArt from '../components/GarmentArt';
import { PageHeading, WindowPanel } from '../components/UI';
import { useCloset } from '../context/ClosetContext';
import { useToast } from '../context/ToastContext';
import { CATEGORIES, CATEGORY_LABELS, COLORS, OCCASIONS, SEASONS, type Category, type ClothingItem, type Occasion, type Season } from '../types';
import { readImageFile } from '../utils/helpers';
import { sendImage, type ImageResult } from '../services/api';
export default function AddItem() {
  const {addClothing}=useCloset(); const toast=useToast(); const navigate=useNavigate(); const fileRef=useRef<HTMLInputElement>(null);
  const [name,setName]=useState(''); const [category,setCategory]=useState<Category>('tops'); const [color,setColor]=useState(COLORS[0]); const [season,setSeason]=useState<Season>('Todas'); const [occasion,setOccasion]=useState<Occasion>('Casual'); const [style,setStyle]=useState('Essencial');
  const [selectedFile,setSelectedFile]=useState<File|null>(null);
  const [originalPreview,setOriginalPreview]=useState('');
  const [processedResult,setProcessedResult]=useState<ImageResult|null>(null);
  const [useProcessed,setUseProcessed]=useState(false);
  const [busy,setBusy]=useState(false); const [drag,setDrag]=useState(false); const [error,setError]=useState('');
  const fileImage = useProcessed && processedResult ? processedResult.imageUrl : originalPreview;
  const item:ClothingItem={id:'preview',name:name||'Sua nova peça',category,color:color.label,hex:color.hex,season,occasion,style,image:fileImage||undefined,favorite:false,createdAt:new Date().toISOString()};
  const processFile=async(file?:File)=>{
    if(!file||busy)return;
    setError('');setBusy(true);
    try {
      const preview=await readImageFile(file);
      setOriginalPreview(preview);setSelectedFile(file);setProcessedResult(null);setUseProcessed(false);
      toast('Foto carregada! Confira a prévia.');
    }catch(e){setError(e instanceof Error?e.message:'Erro ao carregar imagem.');}
    finally{setBusy(false)}
  };
  const removePhoto=()=>{setSelectedFile(null);setOriginalPreview('');setProcessedResult(null);setUseProcessed(false);setError('');};
  const drop=(e:DragEvent<HTMLButtonElement>)=>{e.preventDefault();setDrag(false);void processFile(e.dataTransfer.files?.[0])};
  const removeBackground=async()=>{
    if(!selectedFile)return;
    setError('');setBusy(true);
    try {
      const result=await sendImage(selectedFile,true);
      setProcessedResult(result);setUseProcessed(true);
      toast('Fundo removido! Você pode comparar as duas versões.');
    }catch(e){setError(e instanceof Error?e.message:'Falha ao remover o fundo.');toast('Não foi possível remover o fundo.','error');}
    finally{setBusy(false)}
  };
  const submit=async(e:FormEvent)=>{
    e.preventDefault();
    if(!name.trim()){setError('Informe um nome para a peça.');return;}
    setError('');setBusy(true);
    try {
      const imageId = selectedFile ? (useProcessed && processedResult ? processedResult.imageId : (await sendImage(selectedFile)).imageId) : null;
      await addClothing({name:name.trim(),category,color:color.label,hex:color.hex,season,occasion,style,favorite:false,imageId});
      toast('Peça adicionada ao seu closet!');navigate('/closet');
    }catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar a peça.');}
    finally{setBusy(false)}
  };
  return <div className="page-enter"><PageHeading eyebrow="02 / NEW CLOSET FILE" title="Adicionar peça" description="Uma nova peça, um universo de novas combinações." actions={<button className="btn btn-secondary" onClick={()=>navigate('/closet')}>Voltar ao closet <ArrowRight size={16}/></button>}/>
    <div className="add-stepper"><span className="step-pill active"><span>01</span> Foto da peça</span><span className="step-line"/><span className="step-pill active"><span>02</span> Detalhes</span><span className="step-line"/><span className="step-pill"><span>03</span> Salvar no closet</span></div>
    <form onSubmit={submit} className="add-layout"><div className="add-left"><WindowPanel title="01 / UPLOAD YOUR PIECE"><div className="upload-body"><button type="button" className={`upload-zone ${drag?'upload-drag':''}`} onClick={()=>!busy&&fileRef.current?.click()} onDragEnter={e=>{e.preventDefault();setDrag(true)}} onDragOver={e=>e.preventDefault()} onDragLeave={e=>{e.preventDefault();setDrag(false)}} onDrop={drop} disabled={busy}><div className="upload-icon"><UploadCloud size={32}/></div><strong>{fileImage?'Trocar imagem':'Arraste sua foto até aqui'}</strong><span>ou clique para escolher uma imagem</span><span className="upload-choose"><ImagePlus size={15}/> Escolher arquivo</span><small>PNG, JPG ou WEBP · até 4 MB</small></button><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e=>{void processFile(e.target.files?.[0]);e.target.value=''}}/>
      {fileImage&&<button className="remove-photo" type="button" onClick={removePhoto} disabled={busy}><X size={16}/> Remover foto enviada</button>}
      <div className="background-info"><div className="background-info-icon"><Scissors size={20}/></div><div><b>Remoção automática de fundo · Rembg</b><p>Recorte sua roupa usando o serviço Python local. Compare o resultado com a foto original antes de salvar.</p><span className="status-tag">Integração disponível</span></div></div>
      {selectedFile&&<div className="photo-options"><button type="button" className="btn btn-primary" onClick={()=>void removeBackground()} disabled={busy}><Scissors size={15}/>{busy?'Processando…':processedResult?'Processar novamente':'Remover fundo com Rembg'}</button>
       {processedResult&&<><button type="button" className={`btn btn-secondary ${!useProcessed?'photo-active':''}`} onClick={()=>setUseProcessed(false)} disabled={busy}>Foto original</button><button type="button" className={`btn btn-secondary ${useProcessed?'photo-active':''}`} onClick={()=>setUseProcessed(true)} disabled={busy}>Sem fundo</button></>}
      </div>}
      {selectedFile&&<p className="photo-note">{useProcessed?'Visualizando a versão sem fundo (PNG transparente).':'Visualizando a foto original.'} {busy?'Aguarde a operação terminar.':''}</p>}
      {selectedFile&&<div className="photo-notice"><strong>Importante:</strong> o primeiro recorte pode demorar enquanto o Rembg baixa e carrega o modelo. Se o serviço Python não estiver ligado, você ainda poderá salvar a foto original.</div>}
      <div className="tip-box"><Sparkles size={18}/><p><strong>Dica LookLoop:</strong> fotografe a peça sozinha, com boa iluminação e um fundo simples para valorizar o resultado.</p></div></div></WindowPanel>
      <WindowPanel title="02 / LIVE PREVIEW" className="preview-panel"><div className="preview-card"><div className="preview-art"><GarmentArt item={item}/></div><div className="preview-label"><div><strong>{item.name}</strong><span>{CATEGORY_LABELS[category]}</span></div><span className="dot-color" style={{background:color.hex}}/></div></div><p className="preview-disclaimer"><Camera size={14}/> Visualização da peça no seu closet</p></WindowPanel></div>
      <div className="add-right"><WindowPanel title="03 / THE DETAILS"><div className="form-stack"><div className="form-intro"><h2>Vamos conhecer sua peça <span>✧</span></h2><p>Essas informações ajudam a organizar seu closet e a montar sugestões mais interessantes.</p></div><label className="field"><span>Nome da peça <em>*</em></span><input value={name} onChange={e=>{setName(e.target.value);setError('')}} maxLength={60} placeholder="Ex.: Camisa oversized azul" autoFocus/></label><label className="field"><span>Categoria <em>*</em></span><select value={category} onChange={e=>setCategory(e.target.value as Category)}>{CATEGORIES.map(c=><option value={c} key={c}>{CATEGORY_LABELS[c]}</option>)}</select></label><div className="field"><span>Cor principal</span><div className="swatch-grid">{COLORS.map(c=><button key={c.label} type="button" onClick={()=>setColor(c)} className={`color-swatch ${c.label===color.label?'swatch-active':''}`} title={c.label} aria-label={`Cor ${c.label}`} aria-pressed={c.label===color.label}><span style={{background:c.hex}}/>{c.label===color.label&&<Check size={13}/>}</button>)}</div><small className="field-hint">Selecionada: {color.label}</small></div><div className="form-grid"><label className="field"><span>Estação</span><select value={season} onChange={e=>setSeason(e.target.value as Season)}>{SEASONS.map(s=><option key={s}>{s}</option>)}</select></label><label className="field"><span>Ocasião</span><select value={occasion} onChange={e=>setOccasion(e.target.value as Occasion)}>{OCCASIONS.map(s=><option key={s}>{s}</option>)}</select></label></div><label className="field"><span>Estilo / anotação</span><input value={style} onChange={e=>setStyle(e.target.value)} maxLength={50} placeholder="Ex.: Básico, romântico, streetwear..."/></label>
      {error&&<div className="form-error" role="alert">{error}</div>}
      <div className="form-footer"><span><CircleHelp size={15}/> Você pode editar os detalhes mais tarde.</span><button className="btn btn-primary btn-large" disabled={busy} type="submit"><Plus size={18}/> Salvar no closet <ArrowRight size={17}/></button></div></div></WindowPanel><div className="add-side-note"><div className="note-icon"><Shirt size={19}/></div><div><b>Seu closet, seu jeito.</b><p>Não é obrigatório enviar uma foto: se preferir, usamos uma ilustração provisória para representar a peça.</p></div></div></div></form>
  </div>;
}
