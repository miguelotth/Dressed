import { useRef, useState, type FormEvent } from 'react';
import { AlertTriangle, Camera, Check, Heart, LockKeyhole, LogOut, Mail, Save, ShieldCheck, Sparkles, Trash2, UserRound } from 'lucide-react';
import { PageHeading, WindowPanel } from '../components/UI';
import { useCloset } from '../context/ClosetContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { initials, readImageFile } from '../utils/helpers';
import { type Accent } from '../types';
export default function Settings(){
  const {clothes,outfits,profile,updateProfile,clearAll}=useCloset();const toast=useToast();const {logout}=useAuth();const navigate=useNavigate();
  const [name,setName]=useState(profile.name);const [email,setEmail]=useState(profile.email);const [wardrobe,setWardrobe]=useState(profile.wardrobeName);
  const [confirmClear,setConfirmClear]=useState(false);const [error,setError]=useState('');const [saving,setSaving]=useState(false);
  const fileRef=useRef<HTMLInputElement>(null);
  const save=async(e:FormEvent)=>{
    e.preventDefault();
    if(!name.trim()||!email.trim()||!wardrobe.trim()){setError('Preencha os campos obrigatórios.');return;}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setError('Digite um e-mail válido.');return;}
    setSaving(true);
    try{await updateProfile({name:name.trim(),email:email.trim(),wardrobeName:wardrobe.trim()});setError('');toast('Suas configurações foram salvas!');}
    catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar as configurações.');}
    finally{setSaving(false)}
  };
  const changePreference=async(key:'dailyInspiration'|'stylingTips'|'emailUpdates',value:boolean)=>{
    try{await updateProfile({[key]:value});toast('Preferência atualizada!');}
    catch(e){toast(e instanceof Error?e.message:'Erro ao alterar preferência.','error');}
  };
  const onAvatar=async(file?:File)=>{
    if(!file)return;
    try{
      const avatar=await readImageFile(file);
      if(avatar.length>260000)throw new Error('Foto de perfil muito grande. Escolha uma imagem menor.');
      await updateProfile({avatar});toast('Foto de perfil atualizada!');
    }catch(e){toast(e instanceof Error?e.message:'Não foi possível carregar a foto.','error')}
  };
  const signOut=async()=>{try{await logout();navigate('/login')}catch(e){toast(e instanceof Error?e.message:'Erro ao sair.','error')}};
  const emptyCloset=async()=>{try{await clearAll();setConfirmClear(false);toast('Seu closet está vazio.','info')}catch(e){toast(e instanceof Error?e.message:'Erro ao esvaziar o closet.','error')}};
  const accents:{name:string;value:Accent;hex:string}[]=[{name:'Berry',value:'berry',hex:'#B24D8F'},{name:'Lilac',value:'lilac',hex:'#8D6BBD'},{name:'Rose',value:'rose',hex:'#C96C82'}];
  return <div className="page-enter"><PageHeading eyebrow="06 / PERSONAL SETTINGS" title="Seu espaço, suas regras." description="Deixe o LookLoop ainda mais com a sua cara."/>
    <div className="settings-layout"><div className="settings-left"><WindowPanel title="YOUR PROFILE" className="profile-panel"><div className="profile-body"><div className="avatar avatar-large">{profile.avatar?<img src={profile.avatar} alt="Sua foto de perfil"/>:initials(profile.name)}</div><h2>{profile.name}</h2><p>{profile.email}</p><span className="profile-badge"><Heart size={15}/> PERSONAL WARDROBE</span><button className="btn btn-secondary" onClick={()=>fileRef.current?.click()}><Camera size={16}/> Alterar foto</button><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e=>{void onAvatar(e.target.files?.[0]);e.target.value=''}}/>{profile.avatar&&<button className="text-link" onClick={()=>void updateProfile({avatar:null}).catch(e=>toast(e.message,'error'))}>Remover foto</button>}<small>YOUR STYLE FILE, ALWAYS YOURS.</small></div></WindowPanel>
    <div className="profile-info-card"><div><UserRound size={18}/><b>{profile.wardrobeName}</b></div><div className="profile-numbers"><span><strong>{clothes.length}</strong> peças</span><span><strong>{outfits.length}</strong> looks salvos</span></div><p>Este espaço existe só para suas peças, combinações e preferências.</p></div><div className="privacy-note"><ShieldCheck size={20}/><div><b>Seu closet é privado</b><p>Roupas, looks e fotos ficam associados à sua conta no banco de dados local. O acesso depende de login.</p></div></div></div>
    <div className="settings-right"><WindowPanel title="01 / THE BASICS"><form onSubmit={save} className="settings-form"><div className="form-section-head"><h2>Informações básicas</h2><p>As informações que aparecem no seu perfil.</p></div><div className="form-grid"><label className="field"><span>Nome de exibição</span><input value={name} onChange={e=>setName(e.target.value)} maxLength={50} required/></label><label className="field"><span>E-mail</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label className="field field-full"><span>Nome do guarda-roupa</span><input value={wardrobe} onChange={e=>setWardrobe(e.target.value)} maxLength={60} required/></label></div><div className="settings-submit">{error&&<span className="form-error">{error}</span>}<button className="btn btn-primary" type="submit" disabled={saving}><Save size={16}/> Salvar alterações</button></div></form></WindowPanel>
    <WindowPanel title="02 / YOUR PREFERENCES"><div className="settings-card-body"><div className="form-section-head"><h2>Suas preferências</h2><p>Personalize como você usa o LookLoop.</p></div>{([{key:'dailyInspiration',title:'Inspiração diária',desc:'Mostrar sugestões de looks para descobrir novas possibilidades.',icon:Sparkles},{key:'stylingTips',title:'Dicas de estilo',desc:'Mostrar dicas de organização e combinação dentro do app.',icon:Heart},{key:'emailUpdates',title:'Atualizações por e-mail',desc:'Preferência visual para uma futura integração de e-mails.',icon:Mail}] as const).map(p=><div className="setting-toggle-row" key={p.key}><div className="setting-icon"><p.icon size={19}/></div><div><b>{p.title}</b><p>{p.desc}</p></div><button role="switch" aria-checked={profile[p.key]} className={`toggle ${profile[p.key]?'toggle-on':''}`} onClick={()=>void changePreference(p.key,!profile[p.key])} aria-label={`Alternar ${p.title}`}><span/></button></div>)}</div></WindowPanel>
    <WindowPanel title="03 / WARDROBE, YOUR WAY"><div className="settings-card-body"><div className="form-section-head"><h2>A sua cara, até nas cores</h2><p>Escolha a cor de destaque do seu LookLoop.</p></div><div className="accent-picker">{accents.map(a=><button className={`accent-choice ${profile.accent===a.value?'accent-choice-active':''}`} key={a.value} onClick={()=>{void updateProfile({accent:a.value}).then(()=>toast('Nova cor aplicada!')).catch(e=>toast(e.message,'error'))}}><span className="accent-swatch" style={{background:a.hex}}>{profile.accent===a.value&&<Check size={20}/>}</span><b>{a.name}</b></button>)}</div></div></WindowPanel>
    <WindowPanel title="04 / YOUR ACCOUNT"><div className="settings-card-body"><div className="form-section-head"><h2>Segurança e dados da conta</h2><p>Gerencie seu espaço pessoal no LookLoop.</p></div>
      <div className="setting-data-row"><div><b><Trash2 size={17}/> Esvaziar meu closet</b><p>Exclui as roupas e os looks desta conta no PostgreSQL, mantendo suas configurações.</p></div><button className="btn btn-secondary" onClick={()=>setConfirmClear(v=>!v)}><Trash2 size={16}/> Esvaziar</button></div>
      {confirmClear&&<div className="confirm-inline"><b><AlertTriangle size={16}/> Apagar roupas e looks?</b><p>Esta ação não poderá ser desfeita.</p><div><button className="btn btn-danger" onClick={()=>void emptyCloset()}>Sim, apagar</button><button className="btn btn-secondary" onClick={()=>setConfirmClear(false)}>Cancelar</button></div></div>}
      <div className="setting-data-row"><div><b><LogOut size={17}/> Sair da conta</b><p>Encerra a sessão neste navegador. Você poderá entrar novamente com seu e-mail e senha.</p></div><button className="btn btn-secondary" onClick={()=>void signOut()}><LogOut size={16}/> Sair</button></div>
      <div className="setting-storage-hint"><LockKeyhole size={15}/> Seus dados são salvos no servidor e protegidos pela sessão da sua conta.</div>
    </div></WindowPanel></div></div>
  </div>;
}
