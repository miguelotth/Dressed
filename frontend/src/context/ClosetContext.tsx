import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, json } from '../services/api';
import type { ClothingItem, Outfit, Profile, StoreState } from '../types';
import { useAuth } from './AuthContext';

const emptyProfile: Profile = { name:'',email:'',wardrobeName:'Meu guarda-roupa',accent:'berry',dailyInspiration:true,stylingTips:true,emailUpdates:false };
const empty:StoreState = { clothes:[],outfits:[],profile:emptyProfile,demo:false };

type NewClothing = Pick<ClothingItem,'name'|'category'|'color'|'hex'|'season'|'occasion'|'style'|'favorite'> & {imageId?:string|null};
type NewOutfit = Pick<Outfit,'name'|'itemIds'|'occasion'|'notes'|'favorite'>;
interface ClosetContextType extends StoreState {
  loading:boolean;
  error:string;
  refresh:()=>Promise<void>;
  addClothing:(item:NewClothing)=>Promise<void>;
  updateClothing:(id:string, changes:Partial<ClothingItem> & {imageId?:string|null})=>Promise<void>;
  deleteClothing:(id:string)=>Promise<void>;
  addOutfit:(outfit:NewOutfit)=>Promise<void>;
  updateOutfit:(id:string,changes:Partial<Outfit>)=>Promise<void>;
  deleteOutfit:(id:string)=>Promise<void>;
  updateProfile:(changes:Partial<Profile> & {avatar?:string|null})=>Promise<void>;
  clearAll:()=>Promise<void>;
}
const Context = createContext<ClosetContextType | null>(null);

export function ClosetProvider({children}:{children:ReactNode}) {
  const {user} = useAuth();
  const [state,setState] = useState<StoreState>(empty);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const refresh = useCallback(async () => {
    setLoading(true);setError('');
    try { const result = await api<StoreState>('/api/closet'); setState(result); }
    catch (e) { setError(e instanceof Error?e.message:'Não foi possível carregar seu closet.'); }
    finally {setLoading(false);}
  }, []);
  useEffect(() => { if(user) void refresh(); },[user?.id,refresh]);
  useEffect(() => { document.documentElement.dataset.accent = state.profile.accent; },[state.profile.accent]);
  const addClothing = useCallback(async (item:NewClothing) => {
    const r = await api<{item:ClothingItem}>('/api/items',{method:'POST',body:json(item)});
    setState(s=>({...s,clothes:[r.item,...s.clothes]}));
  },[]);
  const updateClothing = useCallback(async (id:string,changes:Partial<ClothingItem> & {imageId?:string|null}) => {
    const payload = Object.fromEntries(Object.entries(changes).filter(([key])=>['name','category','color','hex','season','occasion','style','favorite','imageId'].includes(key)));
    const r = await api<{item:ClothingItem}>(`/api/items/${id}`,{method:'PATCH',body:json(payload)});
    setState(s=>({...s,clothes:s.clothes.map(i=>i.id===id?r.item:i)}));
  },[]);
  const deleteClothing = useCallback(async (id:string) => {
    await api(`/api/items/${id}`,{method:'DELETE'});
    // O servidor também remove combinações que ficaram com menos de duas peças.
    await refresh();
  },[refresh]);
  const addOutfit = useCallback(async (outfit:NewOutfit) => {
    const r=await api<{outfit:Outfit}>('/api/outfits',{method:'POST',body:json(outfit)});
    setState(s=>({...s,outfits:[r.outfit,...s.outfits]}));
  },[]);
  const updateOutfit = useCallback(async (id:string,changes:Partial<Outfit>) => {
    const payload=Object.fromEntries(Object.entries(changes).filter(([key])=>['name','occasion','notes','itemIds','favorite'].includes(key)));
    const r=await api<{outfit:Outfit}>(`/api/outfits/${id}`,{method:'PATCH',body:json(payload)});
    setState(s=>({...s,outfits:s.outfits.map(o=>o.id===id?r.outfit:o)}));
  },[]);
  const deleteOutfit = useCallback(async (id:string) => {
    await api(`/api/outfits/${id}`,{method:'DELETE'});
    setState(s=>({...s,outfits:s.outfits.filter(o=>o.id!==id)}));
  },[]);
  const updateProfile = useCallback(async (changes:Partial<Profile> & {avatar?:string|null}) => {
    const r=await api<{profile:Profile}>('/api/profile',{method:'PATCH',body:json(changes)});
    setState(s=>({...s,profile:r.profile}));
  },[]);
  const clearAll=useCallback(async()=>{
    await api('/api/closet/clear',{method:'POST'});
    setState(s=>({...s,clothes:[],outfits:[]}));
  },[]);
  const value=useMemo(()=>({...state,loading,error,refresh,addClothing,updateClothing,deleteClothing,addOutfit,updateOutfit,deleteOutfit,updateProfile,clearAll}),[state,loading,error,refresh,addClothing,updateClothing,deleteClothing,addOutfit,updateOutfit,deleteOutfit,updateProfile,clearAll]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useCloset=()=>{
  const value=useContext(Context);
  if(!value)throw new Error('useCloset requer ClosetProvider');
  return value;
};
