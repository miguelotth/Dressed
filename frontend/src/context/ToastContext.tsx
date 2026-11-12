import { CheckCircle2, Info, X, AlertCircle } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
type Toast = { id: number; message: string; type: 'success' | 'info' | 'error' };
const ToastContext = createContext<(message: string, type?: Toast['type'])=>void>(()=>{});
export const ToastProvider = ({ children }: {children: ReactNode}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((message: string, type: Toast['type'] = 'success') => {
    setToasts(s=>[...s.slice(-2), {id:Date.now()+Math.random(),message,type}]);
  }, []);
  useEffect(() => {
    if (!toasts.length) return;
    const timer = window.setTimeout(()=>setToasts(s=>s.slice(1)), 3500);
    return ()=>window.clearTimeout(timer);
  }, [toasts]);
  return <ToastContext.Provider value={toast}>
    {children}
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map(t=><div className={`toast toast-${t.type}`} key={t.id}>
        {t.type === 'success' ? <CheckCircle2 size={19}/> : t.type==='error' ? <AlertCircle size={19}/> : <Info size={19}/>}<span>{t.message}</span>
        <button onClick={()=>setToasts(s=>s.filter(a=>a.id!==t.id))} aria-label="Fechar aviso"><X size={16}/></button>
      </div>)}
    </div>
  </ToastContext.Provider>;
};
export const useToast = () => useContext(ToastContext);
