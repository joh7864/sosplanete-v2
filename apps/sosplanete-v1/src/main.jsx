import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import packageJson from '../package.json';
import { initMiniJeux } from './utils/MiniGamesUtils'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

var v = localStorage.getItem("version");
if(v == null || v !==  packageJson.version)
{
  console.log("Initialisation pour cette nouvelle version", packageJson.version);
  localStorage.setItem('isStayConnected', false); 
  localStorage.setItem('pseudo', "");
  localStorage.setItem('password', "");

  initMiniJeux(true);
}
else
  initMiniJeux(false);

// Stockage du n° de version
localStorage.setItem('version', packageJson.version);

// memo de la date de la session
localStorage.setItem('sessionDate',  Date.now());

// par défaut la mascotte est active
localStorage.setItem('mascotte',  "on");
localStorage.setItem('inProgress',  "off");

console.log("App en Mode", process.env.NODE_ENV);

serviceWorkerRegistration.register();


