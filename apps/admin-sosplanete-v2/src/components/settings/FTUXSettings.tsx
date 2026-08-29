import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Loader2, Save, MoveUp, MoveDown, Plus, Trash2, Target, Image as ImageIcon, Upload, RefreshCw, ImagePlus, Edit2 } from 'lucide-react';
import { getAuthData } from '@/utils/storage';
import { getAssetUrl } from '@/utils/assets';
import { Input } from '@/components/ui/Input';

interface OnboardingStep {
  id: number;
  badge: string;
  title: string;
  targetId: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  explanation: string;
  imageUrl?: string;
}

const DEFAULT_STEPS: OnboardingStep[] = [
  { id: 1, badge: 'Étape 1 / 12', title: '🚀 Bienvenue à bord, Agent !', targetId: 'hud-agent-profile', position: 'bottom', explanation: "Vous appartenez à l'équipage de l'Arche Temporelle. Votre bio-stabilité et votre identité d'agent s'affichent ici. Vos éco-gestes réels restaurent l'avenir planétaire !" },
  { id: 2, badge: 'Étape 2 / 12', title: '🌍 La Passerelle & Les Secteurs Écologiques', targetId: 'sector-orb-guide', position: 'bottom', explanation: "Voici la Terre en 2026 entourée de ses orbes cristallines de secteurs écologiques (Eau, Énergie, Biodiversité, Recyclage...). Cliquez sur un orbe 3D pour ouvrir ses éco-missions." },
  { id: 3, badge: 'Étape 3 / 12', title: '⚡ Le Codex & Impulsion d\'une Mission', targetId: 'hud-active-mission-card', position: 'left', explanation: "Quand vous accomplissez une action éco-responsable dans la vraie vie, cliquez sur 'Impulser'. Vous gagnez des points IT (Impulsions Temporelles) et réduisez l'empreinte carbone collective de l'équipage." },
  { id: 4, badge: 'Étape 4 / 12', title: '⚡ La Puissance des Impulsions Temporelles (IT)', targetId: 'mission-card-it-counter', position: 'left', explanation: "Les IT représentent la puissance de l'énergie vitale envoyée vers le futur. Chaque éco-geste réel accompli génère des IT. Plus vous accumulez d'IT, plus le futur se régénère rapidement et évolue dans le bon sens !" },
  { id: 5, badge: 'Étape 5 / 12', title: '🌕 L\'Arène des Défis Temporels', targetId: 'hud-moon-arena', position: 'bottom', explanation: "Cliquez sur la Lune en orbite ou le badge d'un joueur pour entrer dans l'arène des défis. Défiez les équipes adverses avec un chrono (24h/48h) et un gage d'équipe !" },
  { id: 6, badge: 'Étape 6 / 12', title: '📊 TERRE 2070 : % RÉGÉNÉRÉE', targetId: 'hud-completion-bar', position: 'bottom', explanation: "Suivez la jauge de régénération planétaire en direct. Plus votre équipage accomplit d'éco-gestes réels, plus le score d'accomplissement augmente et plus la Terre se refroidit à l'horizon 2070 !" },
  { id: 7, badge: 'Étape 7 / 12', title: '⏳ Projection Temporelle : Cap sur 2070', targetId: 'hud-epoch-switch', position: 'bottom', explanation: "Basculez à tout moment vers l'ère 2070 pour explorer la Terre régénérée dans le futur et visualiser en direct l'impact à long terme des actions de votre équipage !" },
  { id: 8, badge: 'Étape 8 / 12', title: '🔮 Extrapolation 2070 & Bilan d\'Impact', targetId: 'panel-extrapolation-2070', position: 'right', explanation: "Explorez le tableau d'extrapolation 2070 ! Visualisez le recul du Jour de Dépassement Mondial, la glace arctique préservée et les équivalences en piscines d'eau potable et camions évités." },
  { id: 9, badge: 'Étape 9 / 12', title: '🚀 Radar Temporel & Évolution des Vaisseaux', targetId: 'panel-radar-2070', position: 'left', explanation: "Chaque vaisseau possède 5 niveaux d'évolution. Vous franchissez des paliers technologiques selon votre progression globale de régénération :\n- N1 (0%) : Friction Thermique\n- N2 (25%) : Voiles Photovoltaïques\n- N3 (45%) : Fusion Magnétique\n- N4 (65%) : Résonance Quantique\n- N5 (85%) : Singularité Protonique" },
  { id: 10, badge: 'Étape 10 / 12', title: '🏆 Podium 3D & Progression', targetId: 'btn-podium-leaderboard', position: 'left', explanation: "Consultez le classement général sur le podium holographique 3D et cliquez sur n'importe quel avatar d'agent pour inspecter sa fiche, ses badges et son palmarès." },
  { id: 11, badge: 'Étape 11 / 12', title: '💬 Com-Link & Messagerie d\'Équipage', targetId: 'chat-panel-container', position: 'left', explanation: "Ouvrez le Com-Link spatial pour dialoguer en direct avec votre équipage, coordonner vos actions éco-responsables et débriefer vos stratégies de mission !" },
  { id: 12, badge: 'Étape 12 / 12', title: '📡 Canal WhatsApp Équipe & Alertes', targetId: 'hud-btn-whatsapp', position: 'left', explanation: "Rejoignez le groupe WhatsApp officiel de votre équipe pour recevoir instantanément les notifications de défis reçus, les alertes d'impact et rester connecté !" }
];

export function FTUXSettings({ schoolYear }: { schoolYear: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageExists, setImageExists] = useState(true);
  const [imageTimestamp, setImageTimestamp] = useState(Date.now());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  useEffect(() => {
    setImageExists(true);
  }, [activeStepIndex, steps[activeStepIndex]?.imageUrl]);

  useEffect(() => {
    fetchConfig();
  }, [schoolYear]);

  const fetchConfig = async () => {
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stimulation/system-config?schoolYear=${schoolYear}`, {
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.ftuxSteps && Array.isArray(data.ftuxSteps) && data.ftuxSteps.length > 0) {
          setSteps(data.ftuxSteps);
        } else {
          setSteps([...DEFAULT_STEPS]);
        }
      }
    } catch (e) {
      console.error(e);
      setSteps([...DEFAULT_STEPS]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedSteps = steps.map((s, idx) => ({ ...s, badge: `Étape ${idx + 1} / ${steps.length}` }));
      setSteps(updatedSteps);

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stimulation/system-config?schoolYear=${schoolYear}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthData('access_token')}`,
        },
        body: JSON.stringify({ ftuxSteps: updatedSteps }),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const updateStep = (index: number, field: keyof OnboardingStep, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const moveStep = (index: number, dir: -1 | 1) => {
    if (index + dir < 0 || index + dir >= steps.length) return;
    const newSteps = [...steps];
    const temp = newSteps[index];
    newSteps[index] = newSteps[index + dir];
    newSteps[index + dir] = temp;
    setSteps(newSteps);
    setActiveStepIndex(index + dir);
  };

  const addStep = () => {
    setSteps([...steps, { id: Date.now(), badge: `Étape ${steps.length + 1} / ${steps.length + 1}`, title: 'Nouvelle Étape', targetId: '', position: 'bottom', explanation: '' }]);
    setActiveStepIndex(steps.length);
  };

  const removeStep = (index: number) => {
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    setSteps(newSteps);
    if (activeStepIndex >= newSteps.length) {
      setActiveStepIndex(newSteps.length - 1);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stimulation/system-config/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthData('access_token')}`
        },
        body: formData,
      });

      if (resp.ok) {
        const data = await resp.json();
        updateStep(index, 'imageUrl', data.url);
      }
    } catch (e) {
      console.error('Image upload failed', e);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRefreshImages = () => {
    setImageTimestamp(Date.now());
    setImageExists(true);
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-emerald-500" /></div>;

  const activeStep = steps[activeStepIndex];
  
  const paddedIndex = String(activeStepIndex + 1).padStart(2, '0');
  const defaultImageUrl = `/uploads/ftux/Etape_${paddedIndex}.png`;
  const rawImageUrl = activeStep?.imageUrl ? getAssetUrl(activeStep.imageUrl) : getAssetUrl(defaultImageUrl);
  const displayImageUrl = `${rawImageUrl}?t=${imageTimestamp}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-7xl mx-auto">
      {/* Colonne de Gauche : Liste des étapes */}
      <div className="lg:col-span-1 flex flex-col h-[78vh] bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Target className="text-emerald-500" size={20} />
            Étapes de l'On-boarding
          </h3>
          <div className="flex gap-2">
            <button 
              className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm shrink-0" 
              onClick={handleRefreshImages}
              title="Actualiser les images de toutes les étapes"
            >
              <ImagePlus size={18} />
            </button>
            <button 
              onClick={addStep} 
              title="Ajouter une étape"
              className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm shrink-0"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {steps.map((step, idx) => (
            <div 
              key={step.id}
              onClick={() => setActiveStepIndex(idx)}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex justify-between items-center group
                ${activeStepIndex === idx 
                  ? 'bg-emerald-50 border-emerald-200 shadow-[0_4px_12px_rgba(16,185,129,0.1)]' 
                  : 'bg-slate-50 border-transparent hover:bg-slate-100 hover:border-slate-200'}`}
            >
              <div className="flex-1 min-w-0 pr-2">
                <div className={`text-xs font-black mb-1 ${activeStepIndex === idx ? 'text-emerald-600' : 'text-emerald-500'}`}>{step.badge}</div>
                <div className={`text-sm font-bold truncate ${activeStepIndex === idx ? 'text-slate-900' : 'text-slate-600'}`}>{step.title}</div>
              </div>
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); moveStep(idx, -1); }} disabled={idx === 0} className="p-1.5 bg-white rounded-md text-slate-400 hover:text-emerald-600 shadow-sm disabled:opacity-30"><MoveUp size={12}/></button>
                <button onClick={(e) => { e.stopPropagation(); moveStep(idx, 1); }} disabled={idx === steps.length - 1} className="p-1.5 bg-white rounded-md text-slate-400 hover:text-emerald-600 shadow-sm disabled:opacity-30"><MoveDown size={12}/></button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-6 border-t border-slate-100 bg-slate-50">
          <Button className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
            Enregistrer la configuration
          </Button>
        </div>
      </div>

      {/* Colonne de Droite : Édition de l'étape active */}
      {activeStep ? (
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Edit2 className="text-emerald-500" size={20} />
                Édition : {activeStep.badge}
              </h2>
              <button 
                className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm shrink-0" 
                onClick={() => removeStep(activeStepIndex)}
                title="Supprimer l'étape"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-widest font-black mb-2 block">Titre de l'étape</label>
                  <Input 
                    value={activeStep.title} 
                    onChange={(e) => updateStep(activeStepIndex, 'title', e.target.value)} 
                    className="bg-white border-slate-200 text-slate-800 font-bold h-12 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-widest font-black mb-2 block">Cible UI (Target ID)</label>
                  <Input 
                    value={activeStep.targetId} 
                    onChange={(e) => updateStep(activeStepIndex, 'targetId', e.target.value)} 
                    className="bg-slate-50 border-slate-200 font-mono text-sm text-slate-600 h-12 rounded-xl focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">L'identifiant de l'élément HTML ciblé par le tutoriel.</p>
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-widest font-black mb-2 block">Position de l'infobulle</label>
                  <select 
                    value={activeStep.position}
                    onChange={(e) => updateStep(activeStepIndex, 'position', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl h-12 px-4 text-sm font-bold text-slate-600 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all cursor-pointer"
                  >
                    <option value="top">Haut (Top)</option>
                    <option value="bottom">Bas (Bottom)</option>
                    <option value="left">Gauche (Left)</option>
                    <option value="right">Droite (Right)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-widest font-black mb-2 flex items-center gap-2">
                    <ImageIcon size={14} /> Illustration (optionnelle)
                  </label>
                  <div className="flex items-center gap-2">
                    <Input 
                      placeholder="ex: /img/tuto/radar.png"
                      value={activeStep.imageUrl || (imageExists ? defaultImageUrl : '')} 
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === defaultImageUrl) {
                          updateStep(activeStepIndex, 'imageUrl', '');
                        } else {
                          updateStep(activeStepIndex, 'imageUrl', val);
                        }
                      }} 
                      className={`bg-white border-slate-200 font-bold h-12 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 flex-1 ${!activeStep.imageUrl && imageExists ? 'text-slate-400' : 'text-slate-800'}`}
                    />
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, activeStepIndex)}
                    />
                    <button 
                      type="button"
                      className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-500 flex items-center justify-center transition-all disabled:opacity-50"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      title="Uploader une illustration"
                    >
                      {uploading ? <Loader2 size={18} className="animate-spin text-emerald-500" /> : <Upload size={18} />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-6 h-full flex flex-col">
                <div className="flex-1 flex flex-col">
                  <label className="text-xs text-slate-400 uppercase tracking-widest font-black mb-2 block">Texte d'explication</label>
                  <textarea 
                    value={activeStep.explanation} 
                    onChange={(e) => updateStep(activeStepIndex, 'explanation', e.target.value)} 
                    className="w-full flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-600 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 resize-none transition-all leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Visualisation "Mockup" */}
          {imageExists ? (
            <div className="flex-1 w-full rounded-[2rem] overflow-hidden relative shadow-2xl border-4 border-slate-900 bg-slate-900 flex flex-col justify-center items-center">
              <img 
                src={displayImageUrl} 
                alt="Aperçu FTUX" 
                className="w-full h-auto object-contain" 
                onError={() => setImageExists(false)}
              />
            </div>
          ) : (
            <div className="p-8 flex-1 bg-slate-800 rounded-[2rem] overflow-hidden relative min-h-[350px] shadow-2xl border-4 border-slate-900 flex flex-col">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                <Target size={14} className="text-emerald-400"/> Simulation du ciblage (Aperçu schématique)
              </h3>
              
              <div className="relative w-full flex-1 min-h-[320px] rounded-2xl bg-[#050a16] overflow-hidden flex items-center justify-center p-4 border border-slate-700/50">
                <div className="text-center text-slate-600 text-xs font-bold absolute top-4 left-4 z-10">
                  Interface Evoe simulée
                </div>
                
                {/* Représentation symbolique de l'élément ciblé */}
                <div className="relative p-6 border-2 border-dashed border-emerald-400 bg-emerald-500/10 rounded-2xl flex items-center justify-center min-w-[220px] min-h-[110px] z-20 backdrop-blur-sm">
                  <div className="absolute -top-6 -right-6 text-4xl animate-bounce filter drop-shadow-lg">👆</div>
                  <div className="text-emerald-300 font-mono text-sm font-bold tracking-wide">
                    #{activeStep.targetId}
                  </div>
                </div>

                {/* Simulation de l'infobulle */}
                <div className={`absolute bg-slate-900 border border-emerald-500/30 p-5 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] max-w-[280px] z-30
                  ${activeStep.position === 'bottom' ? 'mt-[180px]' : ''}
                  ${activeStep.position === 'top' ? 'mb-[180px]' : ''}
                  ${activeStep.position === 'left' ? 'mr-[350px]' : ''}
                  ${activeStep.position === 'right' ? 'ml-[350px]' : ''}
                `}>
                  <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-black mb-2">{activeStep.badge}</div>
                  <div className="text-sm font-bold text-white mb-2 leading-tight">{activeStep.title}</div>
                  <div className="text-xs text-slate-300 leading-relaxed font-medium">{activeStep.explanation}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="lg:col-span-2 flex items-center justify-center h-[75vh] bg-white rounded-[2rem] border border-slate-100">
          <div className="text-slate-400 text-sm font-bold">Sélectionnez une étape pour la modifier</div>
        </div>
      )}
    </div>
  );
}
