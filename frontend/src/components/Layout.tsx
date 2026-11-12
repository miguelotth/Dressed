import { useEffect, useState, type FormEvent } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Bell, Heart, Home, LayoutGrid, LogOut, Menu, Plus, Search, Settings2, Shirt, WandSparkles, X } from 'lucide-react';
import { useCloset } from '../context/ClosetContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { firstName, initials } from '../utils/helpers';
const navPrimary = [
  {to:'/', label:'Início', icon:Home, end:true},
  {to:'/closet', label:'Meu closet', icon:Shirt},
  {to:'/add', label:'Adicionar peça', icon:Plus},
  {to:'/builder', label:'Montar look', icon:LayoutGrid},
  {to:'/saved', label:'Looks salvos', icon:Heart},
  {to:'/suggestions', label:'Sugestões', icon:WandSparkles},
];
export default function Layout() {
  const {clothes,outfits,profile} = useCloset();
  const {logout}=useAuth(); const toast=useToast();
  const signOut=async()=>{try{await logout();navigate('/login')}catch(e){toast(e instanceof Error?e.message:'Erro ao sair.','error')}};
  const location=useLocation(); const navigate=useNavigate();
  const [menuOpen,setMenuOpen]=useState(false);
  const [globalSearch,setGlobalSearch]=useState('');
  useEffect(()=>setMenuOpen(false),[location]);
  const today = new Intl.DateTimeFormat('pt-BR', {weekday:'short',day:'2-digit',month:'short'}).format(new Date());
  const search = (e: FormEvent)=>{e.preventDefault();navigate(`/closet?q=${encodeURIComponent(globalSearch.trim())}`);setGlobalSearch('')};
  return <div className="app-shell">
    <div className="system-strip"><div><span className="strip-star">✦</span> LOOKLOOP OS <span className="strip-divider">/</span> YOUR PERSONAL FASHION COMPUTER</div><div>LOOKLOOP STUDIO <span className="strip-divider">—</span> {today.toUpperCase()}</div></div>
    <div className="shell-body">
      <aside className={`sidebar ${menuOpen?'sidebar-open':''}`}>
        <div className="sidebar-top"><button className="brand" onClick={()=>navigate('/')} aria-label="Ir para o início"><span className="brand-name">lookloop</span><span className="brand-spark">✳</span></button><div className="brand-caption">YOUR CLOSET, YOUR LOOP.</div></div>
        <div className="sidebar-section-label">YOUR FASHION FILES</div>
        <nav className="sidebar-nav" aria-label="Navegação principal">{navPrimary.map(({to,label,icon:Icon,end})=><NavLink to={to} end={end} key={to} className={({isActive})=>`nav-link ${isActive?'nav-active':''}`}><Icon size={19} strokeWidth={1.85}/><span>{label}</span>{to==='/saved'&&outfits.length>0&&<span className="nav-count">{outfits.length}</span>}</NavLink>)}</nav>
        <div className="sidebar-section-label sidebar-settings-label">PERSONAL SPACE</div>
        <nav className="sidebar-nav"><NavLink to="/settings" className={({isActive})=>`nav-link ${isActive?'nav-active':''}`}><Settings2 size={19} strokeWidth={1.85}/><span>Configurações</span></NavLink></nav>
        <div className="sidebar-bottom"><div className="sidebar-widget"><div className="widget-icon"><Heart size={19}/></div><b>Seu estilo, registrado.</b><p><strong>{clothes.length} peças.</strong> Infinitas maneiras de ser você.</p><small>made with ✧ lookloop</small></div><button className="sidebar-logout" onClick={()=>void signOut()}><LogOut size={16}/> Sair da conta</button><div className="sidebar-version">LOOKLOOP / V1.0 <span>✦</span> EST. 2026</div></div>
      </aside>
      {menuOpen&&<button className="sidebar-scrim" aria-label="Fechar menu" onClick={()=>setMenuOpen(false)}/>}
      <div className="main-column">
        <header className="topbar"><div className="topbar-left"><button className="mobile-menu icon-button" onClick={()=>setMenuOpen(v=>!v)} aria-label={menuOpen?'Fechar menu':'Abrir menu'}>{menuOpen?<X size={22}/>:<Menu size={22}/>}</button><span className="topbar-crumb">MY STYLE SPACE <span className="crumb-sep">/</span> <strong>{navPrimary.find(n=>n.to===location.pathname)?.label || (location.pathname==='/settings'?'Configurações':'LookLoop')}</strong></span></div>
          <div className="topbar-right"><form className="header-search" onSubmit={search}><Search size={17}/><input value={globalSearch} onChange={e=>setGlobalSearch(e.target.value)} aria-label="Pesquisar no closet" placeholder="Buscar no closet..." /></form><button className="topbar-icon" aria-label="Avisos" onClick={()=>navigate('/settings')} title="Preferências de avisos"><Bell size={20}/></button><button className="profile-chip" onClick={()=>navigate('/settings')}><span className="avatar avatar-small">{profile.avatar?<img src={profile.avatar} alt=""/>:initials(profile.name)}</span><span className="profile-chip-name">{firstName(profile.name)}</span><ArrowRight size={15}/></button></div>
        </header>
        <main className="page-container" id="main-content"><Outlet/></main>
        <footer className="app-footer"><span>✳ IGAC Lab Entretenment LTDA.</span><span>FEITO PARA TODOS OS ESTILOS • V1.0</span><span>YOUR CLOSET, YOUR LOOP ✧</span></footer>
      </div>
    </div>
  </div>;
}
