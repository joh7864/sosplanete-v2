import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  CloudRain, 
  Droplets,
  Trash2, 
  Globe, 
  Calendar,
  ShieldCheck,
  MapPin,
  ChevronRight,
  Info,
  TrendingUp,
  X,
  HelpCircle,
  Users,
  Zap,
  Building2,
  Home,
  Factory
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuthData } from '@/utils/storage';

// --- MODALE PÉDAGOGIQUE ---
const ImpactMethodologyModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden"
        >
          <div className="absolute top-6 right-6">
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
              <X size={24} />
            </button>
          </div>

          <div className="p-10 md:p-14">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                <HelpCircle size={28} />
              </div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Comprendre le calcul</h2>
            </div>

            <div className="flex flex-col gap-10">
              {/* --- GRAPHIQUE 40/60 EXPLICATIF --- */}
              <div className="relative pt-8">
                <div className="flex h-12 w-full rounded-2xl overflow-hidden shadow-inner bg-slate-100 border border-slate-200">
                  <div className="w-[40%] bg-emerald-500 h-full flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest relative">
                    40% Actionnable
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-emerald-600 whitespace-nowrap flex flex-col items-center">
                       <span className="leading-none">Levier Citoyen</span>
                       <div className="w-px h-2 bg-emerald-500 mt-1" />
                    </div>
                  </div>
                  <div className="w-[60%] bg-slate-200 h-full flex items-center justify-center text-slate-500 text-[10px] font-black uppercase tracking-widest relative">
                    60% Incompressible
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-slate-400 whitespace-nowrap flex flex-col items-center">
                       <span className="leading-none">Socle ÉTAT / Collectif</span>
                       <div className="w-px h-2 bg-slate-300 mt-1" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-emerald-600 font-black uppercase text-[11px] tracking-widest">
                    <Zap size={20} /> Zone Verte : Agir Réellement
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    Selon l'étude de référence de <strong>Carbone 4</strong>, 40% de notre empreinte carbone dépend directement de nos choix de vie : alimentation, transport individuel (vélo/marche), et consommation responsable. C'est ici que vos actions ont un impact immédiat !
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-slate-500 font-black uppercase text-[11px] tracking-widest">
                    <Building2 size={20} /> Zone Grise : Le Système
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium text-balance">
                    Les 60% restants sont liés au fonctionnement de la société : hopitaux, écoles, routes, industrie lourde. Cette part est dite "incompressible" pour un individu seul et demande des changements structurels au niveau de l'État.
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 rounded-[2.5rem] p-8 border border-amber-100/50">
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-[1.2rem] flex items-center justify-center shrink-0 shadow-sm">
                    <Users size={28} />
                  </div>
                  <div>
                    <h4 className="font-black text-amber-900 text-base mb-2 uppercase tracking-tight">Le Multiplicateur "Ambassadeur" (x4)</h4>
                    <p className="text-sm text-amber-800/70 leading-relaxed font-medium">
                      Un enfant qui adopte un geste éco-responsable influence son foyer (parents et fratrie). Nous multiplions l'impact réel par <strong>4 x participation</strong> pour valoriser cette propagation familiale unique.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-10 border-t border-slate-100 text-center">
              <button 
                onClick={onClose}
                className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg hover:shadow-emerald-500/20"
              >
                J'ai compris !
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// --- COMPOSANT PRINCIPAL ---
export function IndicatorsTab({ instanceId, userRole, schoolYear, helpOpen, setHelpOpen }: { 
  instanceId: number | null, 
  userRole: string | null, 
  schoolYear: string,
  helpOpen: boolean,
  setHelpOpen: (open: boolean) => void
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, [schoolYear, instanceId]);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const summaryUrl = instanceId 
        ? `${process.env.NEXT_PUBLIC_API_URL}/impact/instance/${instanceId}?schoolYear=${schoolYear}`
        : `${process.env.NEXT_PUBLIC_API_URL}/impact/summary?schoolYear=${schoolYear}`;

      const summaryResp = await fetch(summaryUrl, { 
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` } 
      });
      
      if (summaryResp.ok) {
        const summaryJson = await summaryResp.json();
        setData(summaryJson);
      } else {
        setError(true);
      }
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const formatSmartUnit = (value: number, type: 'water' | 'waste' | 'co2') => {
    if (type === 'water') {
      if (value >= 1000) return { val: (value / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 }), unit: 'm³' };
      return { val: Math.round(value).toLocaleString('fr-FR'), unit: 'L' };
    }
    if (type === 'waste') {
      if (value >= 1000) return { val: (value / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 }), unit: 't' };
      return { val: Math.round(value).toLocaleString('fr-FR'), unit: 'kg' };
    }
    if (value < 1 && value > 0) return { val: Math.round(value * 1000).toLocaleString('fr-FR'), unit: 'kg' };
    return { val: (value || 0).toLocaleString('fr-FR', { maximumFractionDigits: 1 }), unit: 't' };
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40">
      <Loader2 className="text-[#10b981] animate-spin mb-4" size={32} />
      <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest text-center">SYNCHRONISATION DES DONNÉES PLANÉTAIRES...</p>
    </div>
  );

  if (error || !data) return (
    <div className="p-12 text-center bg-white rounded-2xl shadow-sm border border-slate-100 max-w-xl mx-auto">
      <Info className="mx-auto text-slate-300 mb-4" size={32} />
      <p className="text-slate-500 font-bold text-sm tracking-tight">Analyse indisponible pour l'année {schoolYear}</p>
    </div>
  );

  const globalImpact = data.global || data;
  const globalResults = globalImpact.results || globalImpact;

  const showFallbackWarning = data?.global?.isDefaultConstants || data?.isDefaultConstants;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
      
      <ImpactMethodologyModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />

      {/* Warning banner if default constants are used */}
      {showFallbackWarning && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-[2rem] bg-amber-50 border border-amber-200/60 shadow-[0_4px_20px_rgba(245,158,11,0.05)] flex items-start gap-4"
        >
          <span className="text-2xl mt-0.5">⚠️</span>
          <div className="flex-1 space-y-3">
            <p className="text-sm font-bold text-amber-900 leading-relaxed">
              Les constantes d'impact globales pour l'année {schoolYear} ne sont pas configurées. Les calculs utilisent des valeurs génériques temporaires.
              {userRole === 'AM' && (
                <> Une notification a été envoyé à votre Administrateur du Référentiel pour initialiser les constantes mondiales. Vous recevrez une notification quand cela sera fait et vous pourrez alors finaliser la configuration de votre espace.</>
              )}
            </p>
            {userRole === 'AS' && (
              <button
                onClick={() => window.location.href = '/dashboard/settings?tab=data'}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-amber-600/10"
              >
                Configurer les constantes
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* --- CENTRE DE COMMANDE --- */}
      <section className="relative overflow-hidden">
        
        {/* --- TITRE ET SOUS-TITRE (Seulement pour le Dashboard Global) --- */}
        {!instanceId && (
          <div className="mb-10 px-4">
             <h1 className="text-2xl font-black text-emerald-500 tracking-tight">
               Impact de nos gestes sur la nature, si tout le monde faisait comme nous
             </h1>
          </div>
        )}

        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        
        {/* --- INDICATEURS CLÉS (TOP ROW) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 p-10">
          {[
            { 
              label: 'Impact Global', 
              val: globalResults.nbPlanetes || '--', 
              unit: 'Planètes', 
              icon: Globe, 
              color: 'text-[#10b981]',
              sub: 'Modèle Ambassadeur'
            },
            { 
              label: 'Dépassement', 
              val: globalResults.dateDepassement?.split('/')[0] + '/' + globalResults.dateDepassement?.split('/')[1] || '--/--', 
              unit: '', 
              icon: Calendar, 
              color: 'text-indigo-600',
              sub: `Gain : +${globalResults.effortPlanetairePercent || 0}%`
            },
            { label: 'CO2 Évité', ...formatSmartUnit(globalImpact.realSums?.totalCo2 || 0, 'co2'), icon: CloudRain, color: 'text-rose-500', sub: 'Énergie & Climat' },
            { label: 'Eau Économisée', ...formatSmartUnit(globalImpact.realSums?.totalWater || 0, 'water'), icon: Droplets, color: 'text-blue-500', sub: 'Cycle de l\'eau' },
            { label: 'Déchets Évités', ...formatSmartUnit(globalImpact.realSums?.totalWaste || 0, 'waste'), icon: Trash2, color: 'text-amber-500', sub: 'Pollution sol' }
          ].map((stat, i) => {
            const isMain = i < 2;
            const mainBg = i === 0 ? 'bg-[#10b981]' : 'bg-indigo-600';
            
            return (
              <div 
                key={i} 
                className={`${isMain ? mainBg + ' text-white border-transparent' : 'bg-white text-slate-800 border-slate-100 shadow-sm'} p-6 rounded-[2rem] border flex flex-col justify-between hover:shadow-lg transition-all duration-300 group`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className={`text-[10px] font-black ${isMain ? 'text-white/60' : 'text-slate-400'} uppercase tracking-widest mb-1`}>{stat.label}</p>
                    <p className={`text-[10px] font-bold ${isMain ? 'text-white/40' : 'text-slate-300'} uppercase leading-none`}>{stat.sub}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isMain ? 'bg-white/20 text-white' : stat.color.replace('text-', 'bg-').replace('500', '50').replace('600', '50') + ' ' + stat.color} group-hover:scale-110 transition-transform`}>
                    <stat.icon size={20} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-black tracking-tighter leading-none ${isMain ? 'text-white' : 'text-slate-800'}`}>{stat.val}</span>
                  <span className={`text-[10px] font-black uppercase ${isMain ? 'text-white/60' : 'text-slate-400'}`}>{stat.unit}</span>
                </div>
              </div>
            );
          })}
        </div>

        </div>
      </section>


    </div>
  );
}
