import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Portal2026 } from './components/Portal2026';
import { Portal2070 } from './components/Portal2070';
import { motion, AnimatePresence } from 'framer-motion';
import { Hexagon, Radio, Scan } from 'lucide-react';
import './App.css';

function App() {
  const [era, setEra] = useState<'2026' | '2070'>('2026');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const switchEra = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setEra(prev => prev === '2026' ? '2070' : '2026');
      setIsTransitioning(false);
    }, 1000); // 1s de transition "zoom visière"
  };

  return (
    <div className="app-container">
      {/* Three.js Canvas Container */}
      <div className="canvas-container">
        <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
          {era === '2026' ? <Portal2026 /> : <Portal2070 />}
        </Canvas>
      </div>

      {/* Transition Effect (Zoom Visière) */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            className="transition-overlay"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 50, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
        )}
      </AnimatePresence>

      {/* UI Overlay HTML */}
      <div className="ui-overlay">
        <header className="header">
          <div className="logo">
            <Hexagon className="icon" />
            <h1>EVOE {era}</h1>
          </div>
          <button className="switch-btn" onClick={switchEra} disabled={isTransitioning}>
            {era === '2026' ? <Scan className="icon-sm" /> : <Radio className="icon-sm" />}
            {era === '2026' ? 'Ouvrir le Radar 2070' : 'Retour au QG 2026'}
          </button>
        </header>

        {/* Panneau latéral Codex */}
        <aside className="codex-panel">
          <h2>Codex Temporel</h2>
          <div className="mission-list">
            <div className="mission-card">
              <h3>Déchiffrez le signal orbital</h3>
              <p>Vos ancêtres ont localisé une balise de l'Arche...</p>
              <button className="hack-btn">Hacker (+50 pts)</button>
            </div>
            <div className="mission-card">
              <h3>Réalignement des serveurs</h3>
              <p>Stabilité temporelle requise dans le secteur 4.</p>
              <button className="hack-btn">Hacker (+30 pts)</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
