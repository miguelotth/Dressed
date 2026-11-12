import { ArrowRight, Sparkles, X, type LucideIcon } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
export function PageHeading({eyebrow,title,description,actions}: {eyebrow:string;title:string;description?:string;actions?:ReactNode}) {
  return <div className="page-heading"><div><div className="eyebrow"><Sparkles size={14}/>{eyebrow}</div><h1>{title}</h1>{description&&<p>{description}</p>}</div>{actions&&<div className="heading-actions">{actions}</div>}</div>;
}
export function WindowPanel({title,children,actions,className=''}: {title:string;children:ReactNode;actions?:ReactNode;className?:string}) {
  return <section className={`window-panel ${className}`}><div className="window-bar"><div className="window-bar-name"><span className="window-star">✦</span>{title}</div><div className="window-bar-right">{actions}<span className="window-control">—</span><span className="window-control">□</span></div></div><div className="window-content">{children}</div></section>;
}
export function EmptyState({icon:Icon=Sparkles,title,description,action}: {icon?: LucideIcon;title:string;description:string;action?:ReactNode}) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={27}/></div><h3>{title}</h3><p>{description}</p>{action}</div>;
}
export function Modal({title,children,onClose,wide=false}: {title:string;children:ReactNode;onClose:()=>void;wide?:boolean}) {
  useEffect(()=>{const handler=(event:KeyboardEvent)=>{if(event.key==='Escape')onClose()};document.addEventListener('keydown',handler);const previous=document.body.style.overflow;document.body.style.overflow='hidden';return ()=>{document.removeEventListener('keydown',handler);document.body.style.overflow=previous};},[onClose]);
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className={`modal-window ${wide?'modal-wide':''}`} role="dialog" aria-modal="true" aria-label={title}>
    <div className="window-bar"><div className="window-bar-name"><span className="window-star">✦</span>{title}</div><button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={17}/></button></div>
    <div className="modal-body">{children}</div>
  </div></div>;
}
export function MoreLink({children,onClick}: {children:ReactNode;onClick:()=>void}) { return <button className="text-link" onClick={onClick}>{children}<ArrowRight size={14}/></button> }
export function Tag({children}: {children:ReactNode}) {return <span className="pill-tag">{children}</span>}
