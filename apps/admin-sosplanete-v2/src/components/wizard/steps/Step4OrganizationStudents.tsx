'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ShieldCheck,
  UserPlus,
  RefreshCw,
  Sparkles,
  Check,
  X
} from 'lucide-react';
import { StepHeader } from '../StepHeader';
import { WizardDraftState, WizardTeam, WizardStudent } from '@/types/wizard';
import { getAuthData } from '@/utils/storage';

interface Step4OrganizationStudentsProps {
  state: WizardDraftState;
  onChange: (updater: (prev: WizardDraftState) => WizardDraftState) => void;
}

export const Step4OrganizationStudents: React.FC<Step4OrganizationStudentsProps> = ({ state, onChange }) => {
  const [dragActive, setDragActive] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [loadingSync, setLoadingSync] = useState(false);

  // Quick manual student add modal / state
  const [addingStudentTo, setAddingStudentTo] = useState<{ teamName: string; groupName: string } | null>(null);
  const [newStudentPseudo, setNewStudentPseudo] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('planete123');
  const [newStudentAvatar, setNewStudentAvatar] = useState('🦊');
  const [newStudentDelegate, setNewStudentDelegate] = useState(false);

  const isDuplicate = state.mode === 'duplicate' && Boolean(state.duplication.sourceInstanceId);

  // Auto reload from source if in duplicate mode and teams are still default placeholder
  useEffect(() => {
    if (isDuplicate && state.organization.students.length === 0 && state.duplication.sourceInstanceId) {
      handleReloadFromSource();
    }
  }, [state.duplication.sourceInstanceId, state.duplication.fromSchoolYear]);

  const handleReloadFromSource = async () => {
    if (!state.duplication.sourceInstanceId) return;
    setLoadingSync(true);
    setCsvError(null);
    try {
      const token = getAuthData('access_token');
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/teams?instanceId=${state.duplication.sourceInstanceId}&schoolYear=${state.duplication.fromSchoolYear}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (resp.ok) {
        const rawTeams = await resp.json();
        const mappedTeams: WizardTeam[] = rawTeams.map((t: any) => ({
          id: t.id,
          name: t.name,
          color: t.color || '#10b981',
          icon: t.icon || '🌿',
          groups: (t.groups || []).map((g: any) => ({
            id: g.id,
            name: g.name,
            color: g.color || t.color,
            childrenCount: g.children?.length || g._count?.children || 0,
          })),
        }));

        const mappedStudents: WizardStudent[] = [];
        rawTeams.forEach((t: any) => {
          (t.groups || []).forEach((g: any) => {
            (g.children || []).forEach((c: any) => {
              mappedStudents.push({
                pseudo: c.pseudo,
                password: c.password || '',
                avatar: c.avatar || '🌿',
                isDelegate: c.isDelegate || false,
                teamName: t.name,
                groupName: g.name,
              });
            });
          });
        });

        onChange((prev) => ({
          ...prev,
          duplication: { ...prev.duplication, cloneChildren: true },
          organization: {
            teams: mappedTeams.length > 0 ? mappedTeams : prev.organization.teams,
            students: mappedStudents,
          },
        }));

        setImportSuccess(
          `Données de la saison ${state.duplication.fromSchoolYear} chargées : ${mappedTeams.length} équipes et ${mappedStudents.length} élèves avec leurs avatars !`,
        );
      } else {
        setCsvError('Impossible de récupérer les équipes de la saison source.');
      }
    } catch (e) {
      setCsvError('Erreur réseau lors de la synchronisation.');
    } finally {
      setLoadingSync(false);
    }
  };

  const handleToggleCloneChildren = (keepChildren: boolean) => {
    onChange((prev) => ({
      ...prev,
      duplication: { ...prev.duplication, cloneChildren: keepChildren },
      organization: {
        ...prev.organization,
        students: keepChildren ? prev.organization.students : [],
      },
    }));
    if (!keepChildren) {
      setImportSuccess('Liste des élèves vidée. Les équipes et classes restent prêtes pour votre nouvel import CSV.');
    }
  };

  // Download Sample CSV
  const handleDownloadTemplate = () => {
    const csvContent = 
      "Equipe,Classe,Pseudo,MotDePasse,Delegue,Avatar\n" +
      "Les Aventuriers de la Terre,CM1-A,Lucas75,soleil12,oui,🦊\n" +
      "Les Aventuriers de la Terre,CM1-A,Emma92,etoile44,non,🐼\n" +
      "Les Gardiens de l Eau,CM2-B,Thomas10,pluie99,non,🐬\n" +
      "Les Gardiens de l Eau,CM2-B,Sarah06,foret33,oui,🦉\n";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modele_import_eleves_sosplanete.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Parsing
  const handleFileUpload = (file: File) => {
    setCsvError(null);
    setImportSuccess(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          setCsvError("Le fichier CSV est vide ou ne contient pas d'élèves.");
          return;
        }

        const parsedStudents: WizardStudent[] = [];
        const teamsMap = new Map<string, Set<string>>();

        // Start from line 1 (skip header)
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.trim());
          if (cols.length >= 3) {
            const teamName = cols[0] || 'Équipe 1';
            const groupName = cols[1] || 'Classe A';
            const pseudo = cols[2];
            const password = cols[3] || 'planete123';
            const isDelegate = cols[4]?.toLowerCase() === 'oui' || cols[4]?.toLowerCase() === 'true';
            const avatar = cols[5] || '🌿';

            if (pseudo) {
              parsedStudents.push({
                pseudo,
                password,
                teamName,
                groupName,
                isDelegate,
                avatar,
              });

              if (!teamsMap.has(teamName)) {
                teamsMap.set(teamName, new Set());
              }
              teamsMap.get(teamName)?.add(groupName);
            }
          }
        }

        if (parsedStudents.length === 0) {
          setCsvError("Aucun élève valide n'a pu être extrait du fichier.");
          return;
        }

        // Merge with existing teams or create new structure
        const updatedTeams: WizardTeam[] = [...state.organization.teams];
        const colors = ['#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ec4899'];
        let colorIdx = updatedTeams.length;

        teamsMap.forEach((groupsSet, teamName) => {
          let existingTeam = updatedTeams.find((t) => t.name.toLowerCase() === teamName.toLowerCase());
          if (!existingTeam) {
            existingTeam = {
              tempId: `team-${Date.now()}-${colorIdx}`,
              name: teamName,
              color: colors[colorIdx % colors.length],
              icon: '🌿',
              groups: [],
            };
            updatedTeams.push(existingTeam);
            colorIdx++;
          }

          groupsSet.forEach((groupName) => {
            let existingGroup = existingTeam?.groups.find((g) => g.name.toLowerCase() === groupName.toLowerCase());
            if (!existingGroup) {
              existingTeam?.groups.push({
                tempId: `group-${Date.now()}-${colorIdx}`,
                name: groupName,
                childrenCount: 0,
              });
            }
          });
        });

        // Combine students (replace or append)
        const combinedStudents = [...parsedStudents];

        onChange((prev) => ({
          ...prev,
          organization: {
            teams: updatedTeams,
            students: combinedStudents,
          },
        }));

        setImportSuccess(`${parsedStudents.length} élèves importés avec succès !`);
      } catch (err) {
        setCsvError("Erreur lors de la lecture du fichier CSV. Vérifiez le format des colonnes.");
      }
    };
    reader.readAsText(file);
  };

  const handleAddTeam = () => {
    const newTeamNum = state.organization.teams.length + 1;
    const colors = ['#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ec4899'];
    const newTeam: WizardTeam = {
      tempId: `team-${Date.now()}`,
      name: `Équipe ${newTeamNum}`,
      color: colors[(newTeamNum - 1) % colors.length],
      icon: '🌿',
      groups: [
        {
          tempId: `group-${Date.now()}`,
          name: `Classe ${newTeamNum}`,
          childrenCount: 0,
        },
      ],
    };

    onChange((prev) => ({
      ...prev,
      organization: {
        ...prev.organization,
        teams: [...prev.organization.teams, newTeam],
      },
    }));
  };

  const handleRemoveTeam = (teamTempId?: string, teamId?: number) => {
    const teamToRemove = state.organization.teams.find(
      (t) => (teamTempId ? t.tempId === teamTempId : t.id === teamId),
    );
    onChange((prev) => ({
      ...prev,
      organization: {
        teams: prev.organization.teams.filter(
          (t) => (teamTempId ? t.tempId !== teamTempId : t.id !== teamId),
        ),
        students: prev.organization.students.filter((s) => s.teamName !== teamToRemove?.name),
      },
    }));
  };

  const handleAddGroupToTeam = (teamTempId?: string, teamId?: number) => {
    onChange((prev) => ({
      ...prev,
      organization: {
        ...prev.organization,
        teams: prev.organization.teams.map((t) => {
          if ((teamTempId && t.tempId === teamTempId) || (teamId && t.id === teamId)) {
            const nextGroupNum = t.groups.length + 1;
            return {
              ...t,
              groups: [
                ...t.groups,
                {
                  tempId: `group-${Date.now()}-${nextGroupNum}`,
                  name: `Classe ${t.name} - ${nextGroupNum}`,
                  childrenCount: 0,
                },
              ],
            };
          }
          return t;
        }),
      },
    }));
  };

  const handleDeleteStudent = (pseudo: string) => {
    onChange((prev) => ({
      ...prev,
      organization: {
        ...prev.organization,
        students: prev.organization.students.filter((s) => s.pseudo !== pseudo),
      },
    }));
  };

  const handleSaveManualStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingStudentTo || !newStudentPseudo.trim()) return;

    const newStudent: WizardStudent = {
      pseudo: newStudentPseudo.trim(),
      password: newStudentPassword || 'planete123',
      avatar: newStudentAvatar || '🦊',
      isDelegate: newStudentDelegate,
      teamName: addingStudentTo.teamName,
      groupName: addingStudentTo.groupName,
    };

    onChange((prev) => ({
      ...prev,
      organization: {
        ...prev.organization,
        students: [...prev.organization.students.filter((s) => s.pseudo !== newStudent.pseudo), newStudent],
      },
    }));

    setNewStudentPseudo('');
    setAddingStudentTo(null);
  };

  const totalStudents = state.organization.students.length;

  return (
    <div>
      <StepHeader
        stepNumber={4}
        title="Structure Organisationnelle & Effectifs Élèves"
        subtitle="Créez ou reconduisez les équipes, les classes et les comptes élèves avec leurs identifiants et avatars de jeu."
        objective="Structurer les équipes et rattacher les élèves (reconduits automatiquement ou importés par CSV)."
        impact="Chaque enfant aura son propre profil pour enregistrer ses actions et faire gagner son équipe."
        tip="En mode Duplication, vos élèves et avatars de l'an dernier sont chargés automatiquement. Vous pouvez les conserver ou importer une nouvelle liste."
      />

      {/* Duplication Banner & Controls if in Duplicate Mode */}
      {isDuplicate && (
        <div className="mb-6 p-5 rounded-2xl bg-blue-50/80 border-2 border-blue-300 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-blue-200 text-blue-900 rounded">
                  Duplication Active
                </span>
                <span className="text-xs font-bold text-slate-700">
                  Source : Saison {state.duplication.fromSchoolYear}
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-900 mt-0.5">
                {state.organization.teams.length} équipe(s) • {totalStudents} élève(s) récupéré(s) avec leurs avatars
              </h4>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleToggleCloneChildren(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                state.duplication.cloneChildren
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Check size={14} /> Conserver les {totalStudents} élèves
            </button>

            <button
              type="button"
              onClick={() => handleToggleCloneChildren(false)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                !state.duplication.cloneChildren
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Trash2 size={14} /> Vider les élèves (garder les classes)
            </button>

            <button
              type="button"
              disabled={loadingSync}
              onClick={handleReloadFromSource}
              className="p-2 rounded-xl bg-white border border-slate-300 text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
              title="Recharger depuis la saison source"
            >
              <RefreshCw size={16} className={loadingSync ? 'animate-spin text-blue-600' : ''} />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Left Column : Teams & Groups Tree */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Users size={18} className="text-emerald-600" />
              Équipes & Classes ({state.organization.teams.length})
            </h3>
            <button
              type="button"
              onClick={handleAddTeam}
              className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus size={14} /> Ajouter une équipe
            </button>
          </div>

          <div className="space-y-3">
            {state.organization.teams.map((team, tIdx) => (
              <div
                key={team.tempId || team.id || tIdx}
                className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5 flex-1">
                    <input
                      type="color"
                      value={team.color}
                      onChange={(e) => {
                        const col = e.target.value;
                        onChange((prev) => ({
                          ...prev,
                          organization: {
                            ...prev.organization,
                            teams: prev.organization.teams.map((t, idx) =>
                              idx === tIdx ? { ...t, color: col } : t,
                            ),
                          },
                        }));
                      }}
                      className="w-8 h-8 rounded-lg cursor-pointer border-none p-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={team.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        onChange((prev) => ({
                          ...prev,
                          organization: {
                            ...prev.organization,
                            teams: prev.organization.teams.map((t, idx) =>
                              idx === tIdx ? { ...t, name: val } : t,
                            ),
                          },
                        }));
                      }}
                      className="font-bold text-sm text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none flex-1"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveTeam(team.tempId, team.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                    title="Supprimer cette équipe"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Groups within team */}
                <div className="pl-4 space-y-3 border-l-2 border-slate-100">
                  {team.groups.map((grp, gIdx) => {
                    const groupStudents = state.organization.students.filter(
                      (s) => s.teamName === team.name && s.groupName === grp.name,
                    );
                    return (
                      <div key={grp.tempId || grp.id || gIdx} className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-bold text-slate-800">🏫 {grp.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-semibold text-[11px]">
                              {groupStudents.length} élève(s)
                            </span>
                            <button
                              type="button"
                              onClick={() => setAddingStudentTo({ teamName: team.name, groupName: grp.name })}
                              className="p-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
                              title="Ajouter un élève à cette classe"
                            >
                              <UserPlus size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Avatars preview of children in this group */}
                        {groupStudents.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {groupStudents.map((st, sIdx) => (
                              <span
                                key={sIdx}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] text-slate-700 shadow-xs"
                                title={`Élève : ${st.pseudo} (${st.isDelegate ? 'Délégué' : 'Joueur'})`}
                              >
                                <span>{st.avatar || '👤'}</span>
                                <span className="font-bold">{st.pseudo}</span>
                                {st.isDelegate && (
                                  <span className="text-[9px] font-black text-amber-700 bg-amber-100 px-1 rounded">
                                    ★
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStudent(st.pseudo)}
                                  className="text-slate-300 hover:text-rose-500 ml-0.5"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => handleAddGroupToTeam(team.tempId, team.id)}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 mt-1 pt-1"
                  >
                    <Plus size={12} /> Ajouter une classe
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column : Drag & Drop CSV Import */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Upload size={18} className="text-blue-600" />
              Import Rapide d'Élèves (CSV)
            </h3>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5 transition-colors border border-blue-200"
            >
              <Download size={14} /> Modèle CSV
            </button>
          </div>

          <div
            onDragEnter={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragActive(false);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            className={`p-8 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
              dragActive
                ? 'bg-blue-50 border-blue-500 scale-102'
                : 'bg-white/80 border-slate-300 hover:border-blue-400 hover:bg-blue-50/40'
            }`}
            onClick={() => document.getElementById('csv-file-input')?.click()}
          >
            <input
              id="csv-file-input"
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />

            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3 shadow-inner">
              <FileText size={28} />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">
              Glissez-déposez votre fichier CSV ici
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              ou cliquez pour parcourir vos fichiers sur votre ordinateur
            </p>
            <span className="px-4 py-1.5 rounded-full bg-blue-600 text-white font-bold text-xs uppercase tracking-wider shadow-sm">
              Sélectionner un fichier
            </span>
          </div>

          {/* Feedback messages */}
          {csvError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              {csvError}
            </div>
          )}

          {importSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              {importSuccess}
            </div>
          )}

          {/* Preview of all students */}
          {state.organization.students.length > 0 && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm max-h-60 overflow-y-auto">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                <span>Tous les élèves enregistrés ({totalStudents})</span>
                <span className="text-emerald-700 font-bold">Prêts pour le jeu</span>
              </div>
              <div className="divide-y divide-slate-100">
                {state.organization.students.map((st, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{st.avatar || '👤'}</span>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          {st.pseudo}
                          {st.isDelegate && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 font-bold">
                              Délégué
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {st.teamName} • {st.groupName}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteStudent(st.pseudo)}
                      className="text-slate-300 hover:text-rose-600 p-1 transition-colors"
                      title="Retirer cet élève"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Quick Add Student */}
      {addingStudentTo && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-black text-slate-900">
                Ajouter un élève à {addingStudentTo.groupName}
              </h4>
              <button
                type="button"
                onClick={() => setAddingStudentTo(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveManualStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Pseudo de l'élève *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Lucas75"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  value={newStudentPseudo}
                  onChange={(e) => setNewStudentPseudo(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Avatar (Emoji)
                </label>
                <div className="flex gap-2">
                  {['🦊', '🐼', '🦉', '🐬', '🦁', '🌿'].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setNewStudentAvatar(em)}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center ${
                        newStudentAvatar === em
                          ? 'bg-emerald-100 ring-2 ring-emerald-500'
                          : 'bg-slate-50 border border-slate-200'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={newStudentDelegate}
                  onChange={(e) => setNewStudentDelegate(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-slate-700">
                  Attribuer le statut de Délégué Éco-Citoyen
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddingStudentTo(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  Ajouter l'élève
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
