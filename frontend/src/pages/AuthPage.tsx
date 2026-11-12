import { useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Sparkles, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type Mode = 'login'|'register';
export default function AuthPage({mode}:{mode:Mode}) {
  const {login,register}=useAuth();
  const [name,setName]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [confirm,setConfirm]=useState('');
  const [visible,setVisible]=useState(false);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const creating=mode==='register';
  const submit=async(e:FormEvent)=>{
    e.preventDefault();setError('');
    if(creating && password!==confirm){setError('As senhas não coincidem.');return;}
    if(password.length<(creating?10:1)){setError('Use uma senha de pelo menos 10 caracteres.');return;}
    setBusy(true);
    try { if(creating)await register(name.trim(),email.trim(),password);else await login(email.trim(),password); }
    catch (e) {setError(e instanceof Error?e.message:'Não foi possível autenticar.');}
    finally {setBusy(false);}
  };
  return <div className="auth-page">
    <div className="auth-art"><div className="auth-art-inner"><span className="auth-logo">lookloop <span>✳</span></span><span className="auth-kicker">YOUR PERSONAL FASHION COMPUTER</span><div className="auth-art-graphic"><div className="auth-art-orbit">✧</div><div className="auth-art-big">YOUR<br/><em>STYLE.</em><br/>YOUR<br/>LOOP.</div><div className="auth-art-spark">✳</div></div><p>Um lugar para suas peças, suas combinações e todas as versões do seu estilo.</p><span className="auth-footnote">✦ LOOKLOOP STYLE STUDIO · 2026</span></div></div>
    <main className="auth-panel"><div className="auth-mobile-logo">lookloop ✳</div><section className="auth-window"><div className="auth-window-head"><span>✧</span> {creating?'NEW USER / CREATE ACCOUNT':'WELCOME BACK / SIGN IN'} <span className="auth-window-controls">─ □</span></div><div className="auth-window-content"><div className="auth-icon"><Sparkles size={24}/></div><span className="eyebrow">YOUR CLOSET, UPGRADED</span><h1>{creating?'Seu estilo começa aqui.':'Que bom ter você de volta.'}</h1><p className="auth-subtitle">{creating?'Crie sua conta para montar seu closet digital.':'Entre para acessar suas roupas e seus looks.'}</p>
      <form onSubmit={e=>void submit(e)} className="auth-form">
        {creating&&<label className="field"><span>Seu nome</span><div className="auth-input"><UserRound size={17}/><input value={name} onChange={e=>setName(e.target.value)} required minLength={2} maxLength={60} autoComplete="name" placeholder="Como devemos chamar você?"/></div></label>}
        <label className="field"><span>E-mail</span><div className="auth-input"><Mail size={17}/><input value={email} onChange={e=>setEmail(e.target.value)} required type="email" maxLength={254} autoComplete="email" placeholder="voce@exemplo.com"/></div></label>
        <label className="field"><span>Senha</span><div className="auth-input"><LockKeyhole size={17}/><input value={password} onChange={e=>setPassword(e.target.value)} type={visible?'text':'password'} minLength={creating?10:undefined} maxLength={128} required autoComplete={creating?'new-password':'current-password'} placeholder={creating?'Pelo menos 10 caracteres':'Sua senha'}/><button type="button" onClick={()=>setVisible(v=>!v)} aria-label={visible?'Ocultar senha':'Mostrar senha'}>{visible?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>
        {creating&&<label className="field"><span>Confirmar senha</span><div className="auth-input"><LockKeyhole size={17}/><input value={confirm} onChange={e=>setConfirm(e.target.value)} type={visible?'text':'password'} required autoComplete="new-password" placeholder="Repita sua senha"/></div></label>}
        {error&&<div className="form-error" role="alert">{error}</div>}
        <button className="btn btn-primary btn-large auth-submit" type="submit" disabled={busy}>{busy?'Aguarde…':creating?'Criar minha conta':'Entrar no meu closet'} <ArrowRight size={18}/></button>
      </form>
      <p className="auth-switch">{creating?'Já tem uma conta?':'Ainda não tem uma conta?'} <Link to={creating?'/login':'/register'}>{creating?'Fazer login':'Criar conta'}</Link></p>
      <p className="auth-privacy">Cada conta possui um guarda-roupa pessoal. Suas fotos são acessíveis apenas com sua sessão.</p>
    </div></section></main>
  </div>;
}
