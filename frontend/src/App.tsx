import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { useAuth } from './context/AuthContext';
import { ClosetProvider, useCloset } from './context/ClosetContext';
import Home from './pages/Home';
import Closet from './pages/Closet';
import AddItem from './pages/AddItem';
import Builder from './pages/Builder';
import Saved from './pages/Saved';
import Suggestions from './pages/Suggestions';
import Settings from './pages/Settings';
import AuthPage from './pages/AuthPage';

function LoadingScreen({text}:{text:string}) {return <div className="state-screen"><div className="state-screen-icon">✳</div><h2>lookloop</h2><p>{text}</p></div>;}
function LoadedCloset() {
  const {loading,error,refresh}=useCloset();
  if(loading) return <LoadingScreen text="Organizando seu guarda-roupa…"/>;
  if(error) return <div className="state-screen"><h2>Não conseguimos abrir seu closet</h2><p role="alert">{error}</p><button className="btn btn-primary" onClick={()=>void refresh()}>Tentar novamente</button></div>;
  return <Layout/>;
}
function Protected() {
  const {user}=useAuth();
  if(!user)return <Navigate to="/login" replace/>;
  return <ClosetProvider key={user.id}><LoadedCloset/></ClosetProvider>;
}
export default function App(){
  const {user,loading,connectionError,retry}=useAuth();
  if(loading) return <LoadingScreen text="Verificando sua sessão…"/>;
  if(connectionError)return <div className="state-screen"><h2>Não foi possível conectar à API</h2><p role="alert">{connectionError}</p><button className="btn btn-primary" onClick={()=>void retry()}>Tentar novamente</button><small>Confira se o backend e o PostgreSQL estão em execução.</small></div>;
  return <Routes>
    <Route path="/login" element={user?<Navigate to="/" replace/>:<AuthPage mode="login"/>}/>
    <Route path="/register" element={user?<Navigate to="/" replace/>:<AuthPage mode="register"/>}/>
    <Route element={<Protected/>}>
      <Route index element={<Home/>}/>
      <Route path="closet" element={<Closet/>}/>
      <Route path="add" element={<AddItem/>}/>
      <Route path="builder" element={<Builder/>}/>
      <Route path="saved" element={<Saved/>}/>
      <Route path="suggestions" element={<Suggestions/>}/>
      <Route path="settings" element={<Settings/>}/>
    </Route>
    <Route path="*" element={<Navigate to={user?'/':'/login'} replace/>}/>
  </Routes>;
}
