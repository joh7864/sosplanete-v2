'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { Users, Plus, Upload, Search, Trash2, Loader2, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getAuthData, setAuthData, removeAuthData, clearAuthData } from '@/utils/storage';

export default function PlayersPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>}>
      <PlayersContent />
    </Suspense>
  );
}

function PlayersContent() {
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [newPseudo, setNewPseudo] = useState('');

  const searchParams = useSearchParams();
  const urlInstanceId = searchParams.get('instanceId');
  const [instanceId, setInstanceId] = useState<number | null>(null);

  useEffect(() => {
    if (urlInstanceId) {
      setInstanceId(parseInt(urlInstanceId));
    } else {
      const savedId = getAuthData('active_instance_id');
      if (savedId) setInstanceId(parseInt(savedId));
    }
  }, [urlInstanceId]);

  useEffect(() => {
    if (instanceId) fetchTeams();
  }, [instanceId]);

  const fetchTeams = async () => {
    if (!instanceId) return;
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams?instanceId=${instanceId}`, {
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        setTeams(data);
        if (data.length > 0) setSelectedTeamId(data[0].id);
      }
    } catch (e) {
      console.error('Teams fetch error:', e);
    }
  };

  useEffect(() => {
    if (selectedTeamId) {
      fetchGroups(selectedTeamId);
    }
  }, [selectedTeamId]);

  const fetchGroups = async (teamId: number) => {
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups?teamId=${teamId}`, {
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        setGroups(data);
        if (data.length > 0) setSelectedGroupId(data[0].id);
        else setSelectedGroupId(null);
      }
    } catch (e) {
      console.error('Groups fetch error:', e);
    }
  };

  useEffect(() => {
    if (selectedGroupId) {
      fetchPlayers(selectedGroupId);
    } else {
      setPlayers([]);
    }
  }, [selectedGroupId]);

  const fetchPlayers = async (groupId: number) => {
    setLoading(true);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/children?groupId=${groupId}`, {
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
      });
      if (resp.ok) setPlayers(await resp.json());
    } catch (e) {
      console.error('Players fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async () => {
    if (!newPseudo || !selectedGroupId) return;
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/children`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthData('access_token')}`,
        },
        body: JSON.stringify({ pseudo: newPseudo, groupId: selectedGroupId }),
      });
      if (resp.ok) {
        setNewPseudo('');
        fetchPlayers(selectedGroupId);
      }
    } catch (e) {
      console.error('Add player error:', e);
    }
  };

  const handleDeletePlayer = async (id: number) => {
    if (!confirm('Supprimer ce joueur ?')) return;
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/children/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
      });
      if (resp.ok && selectedGroupId) fetchPlayers(selectedGroupId);
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  const handleImportCsv = async () => {
    if (!csvContent || !selectedGroupId) return;
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/children/import/${selectedGroupId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthData('access_token')}`,
        },
        body: JSON.stringify({ fileContent: csvContent }),
      });
      if (resp.ok) {
        setShowImport(false);
        setCsvContent('');
        fetchPlayers(selectedGroupId);
      }
    } catch (e) {
      console.error('Import error:', e);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Gestion des Joueurs</h1>
          <p className="text-slate-500 mt-1">Gérez les enfants par équipe et par groupe.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="sky" onClick={() => setShowImport(true)} className="gap-2">
            <Upload size={18} /> Import CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
        {/* Selection Sidebar */}
        <div className="flex flex-col gap-6">
          <GlassCard className="p-6 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Équipe</h3>
            <div className="flex flex-col gap-2">
              {teams.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTeamId(t.id)}
                  className={`px-4 py-3 rounded-xl text-left transition-all ${selectedTeamId === t.id ? 'bg-[var(--accent-primary)] text-white shadow-md' : 'hover:bg-slate-50 text-slate-600'}`}
                >
                  {t.name}
                </button>
              ))}
            </div>

            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-4">Groupe</h3>
            <div className="flex flex-col gap-2">
              {groups.length > 0 ? groups.map(g => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGroupId(g.id)}
                  className={`px-4 py-3 rounded-xl text-left transition-all ${selectedGroupId === g.id ? 'bg-[var(--color-sky)] text-slate-800 shadow-md font-bold' : 'hover:bg-slate-50 text-slate-600'}`}
                >
                  {g.name}
                </button>
              )) : <span className="text-xs italic text-slate-400">Aucun groupe</span>}
            </div>
          </GlassCard>
        </div>

        {/* Players List */}
        <div className="flex flex-col gap-6">
          {selectedGroupId ? (
            <GlassCard className="p-0 overflow-hidden">
              <div className="p-6 flex justify-between items-center border-b border-slate-100 bg-white/50">
                <div className="relative flex-1 max-w-md">
                   <Input 
                      placeholder="Ajouter un joueur (Pseudo)..." 
                      value={newPseudo}
                      onChange={(e) => setNewPseudo(e.target.value)}
                      className="h-10 rounded-xl"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddPlayer()}
                   />
                </div>
                <Button onClick={handleAddPlayer} className="ml-4 h-10 px-6">
                  <Plus size={18} /> Ajouter
                </Button>
              </div>

              {loading ? (
                <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-sky-500" /></div>
              ) : (
                <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
                  {players.map(p => (
                    <div key={p.id} className="p-4 px-6 flex justify-between items-center hover:bg-slate-50/50 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          {p.pseudo.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-700">{p.pseudo}</span>
                      </div>
                      <button 
                         onClick={() => handleDeletePlayer(p.id)}
                         className="p-2 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {players.length === 0 && (
                    <div className="p-20 text-center flex flex-col items-center gap-3 text-slate-300 italic">
                      <Users size={40} className="opacity-20" />
                      Aucun joueur dans ce groupe
                    </div>
                  )}
                </div>
              )}
            </GlassCard>
          ) : (
            <div className="p-20 text-center text-slate-400 italic">
              Sélectionnez un groupe pour gérer les joueurs.
            </div>
          )}
        </div>
      </div>

      {/* Import Modal */}
      <AnimatePresence>
        {showImport && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl"
            >
              <GlassCard className="flex flex-col gap-6 p-8 relative">
                <h3 className="text-xl font-bold text-slate-800">Importer des joueurs</h3>
                <p className="text-sm text-slate-500">Copiez-collez le contenu de votre fichier CSV. Format attendu : une colonne 'pseudo'.</p>
                
                <textarea 
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  placeholder="pseudo&#10;Jean&#10;Marie&#10;Lucas"
                  className="w-full h-48 p-4 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-sm focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                />

                <div className="flex justify-end gap-3">
                  <Button variant="sky" className="bg-slate-200 text-slate-600 hover:bg-slate-300" onClick={() => setShowImport(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleImportCsv} disabled={!csvContent} variant="primary" className="px-8">
                    Importer
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
