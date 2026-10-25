import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import StartupScreen from './components/StartupScreen';
import './index.css';
function Review() {
 const [error,setError]=useState(false);
 const [phase,setPhase]=useState('profile');
 const update=(failure,nextPhase)=>{ setError(failure); setPhase(nextPhase); window.scrollTo(0,0); };
 return <><StartupScreen phase={phase} error={error} onRetry={()=>update(false,'profile')} onLogout={()=>update(false,'session')}/><div style={{padding:20,display:'flex',gap:20,flexWrap:'wrap'}}><button onClick={()=>update(true,'profile')}>Simulate connection failure</button><button onClick={()=>update(false,'session')}>Simulate session restoration</button><button onClick={()=>update(false,'profile')}>Simulate backend wake-up</button><button onClick={()=>document.documentElement.classList.toggle('dark')}>Toggle review appearance</button></div></>;
}
createRoot(document.getElementById('root')).render(<BrowserRouter><Review/></BrowserRouter>);
