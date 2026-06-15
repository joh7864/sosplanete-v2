import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3011/legacy';
const EVOE_API_URL = import.meta.env.VITE_EVOE_API_URL || 'http://localhost:3011/evoe';

interface AuthContextType {
  user: string | null;
  pseudo: string | null;
  loading: boolean;
  errorAuthentification: string;
  instanceChoices: any[] | null;
  loginUser: (userInfo: { pseudo: string; password: string; keepLogged: boolean }, selectedInstanceId?: string | null) => Promise<void>;
  finishLogin: (instanceId: string, schoolName: string, headers: any, loginPseudo: string) => void;
  logoutUser: () => void;
  childInfos: any;
  instanceId: string | null;
  teamId: string | null;
  missions: any[];
  players: any[];
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true); // Vrai uniquement au démarrage
  const [user, setUser] = useState<string | null>(null);
  const [pseudo, setPseudo] = useState<string | null>(null);
  const [errorAuthentification, setErrorAuthentification] = useState("");
  const [instanceChoices, setInstanceChoices] = useState<any[] | null>(null);
  // Stockage temporaire des credentials pendant la sélection d'instance (quelques secondes max)
  const [pendingAuth, setPendingAuth] = useState<string | null>(null);
  
  // Contexte du joueur
  const [childInfos, setChildInfos] = useState<any>(null);
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [missions, setMissions] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);

  const finishLogin = (instId: string, schoolName: string, headers: any, loginPseudo: string) => {
    const currentPseudo = loginPseudo || pseudo;
    headers["x-instance-id"] = instId;
    
    setInstanceId(instId);
    localStorage.setItem("instanceId", instId);
    
    // Configurer axios pour toutes les futures requêtes
    axios.defaults.headers.common['Authorization'] = headers['Authorization'];
    axios.defaults.headers.common['x-instance-id'] = instId;

    setErrorAuthentification("");

    // Charger le contexte dynamique Evoe (avatars, missions)
    axios.get(`${EVOE_API_URL}/context`, { headers })
      .then(res => {
        setChildInfos(res.data.childInfos);
        setMissions(res.data.missions);
        setPlayers(res.data.players || []);
      })
      .catch(() => {
        setChildInfos(null);
        setMissions([]);
        setPlayers([]);
      });
  };

  const loginUser = async (userInfo: { pseudo: string; password: string; keepLogged: boolean }, selectedInstanceId: string | null = null) => {
    setLoading(true);
    setErrorAuthentification("");

    // Si on est au 2e appel (choix d'instance), les credentials locaux de Login
    // peuvent être vides car le composant a été remonté. On utilise le cache du contexte.
    const resolvedUname = (userInfo.pseudo && userInfo.password)
      ? userInfo.pseudo + ":" + userInfo.password
      : (pendingAuth ? atob(pendingAuth) : "");

    const resolvedPseudo = resolvedUname.split(":")[0];
    const encodedAuth = btoa(resolvedUname);

    try {
      const headers = {
        "content-type": "application/json",
        Authorization: "Basic " + encodedAuth,
      };

      const result = await axios.get(`${API_URL}/check_auth`, { headers });
      
      if (result.data.status === 'multiple_choices') {
        const choices = result.data.choices;

        if (!selectedInstanceId) {
          // 1er appel : on met les credentials en cache et on affiche les choix
          setPendingAuth(encodedAuth);
          setInstanceChoices(choices);
        } else {
          // 2e appel : on sélectionne l'instance
          const choice = choices.find((c: any) => c.instanceId.toString() === selectedInstanceId.toString());
          if (choice) {
            setUser(encodedAuth);
            setPseudo(resolvedPseudo);
            setInstanceChoices(null);
            setPendingAuth(null); // On efface le cache des credentials
            if (userInfo.keepLogged) {
              localStorage.setItem("evoe_auth", encodedAuth);
            }
            finishLogin(choice.instanceId, choice.schoolName, headers, resolvedPseudo);
            navigate("/");
          }
        }
      } else if (result.data.instanceId) {
        setUser(encodedAuth);
        setPseudo(resolvedPseudo);
        setPendingAuth(null);
        if (userInfo.keepLogged) {
          localStorage.setItem("evoe_auth", encodedAuth);
        }
        finishLogin(result.data.instanceId, result.data.schoolName, headers, resolvedPseudo);
        navigate("/");
      }
    } catch (error) {
      console.error(error);
      setUser(null);
      setPendingAuth(null);
      setErrorAuthentification("Pseudo ou mot de passe incorrect, ou espace fermé !");
    }
    setLoading(false);
  };

  const logoutUser = () => {
    setUser(null);
    setPseudo(null);
    setChildInfos(null);
    setInstanceId(null);
    setTeamId(null);
    localStorage.removeItem("evoe_auth");
    localStorage.removeItem("instanceId");
    delete axios.defaults.headers.common['Authorization'];
    delete axios.defaults.headers.common['x-instance-id'];
    navigate("/login");
  };

  const checkUserStatus = async () => {
    const savedAuth = localStorage.getItem("evoe_auth");
    const savedInstanceId = localStorage.getItem("instanceId");

    if (savedAuth && savedInstanceId) {
      try {
        const headers = {
          "content-type": "application/json",
          Authorization: "Basic " + savedAuth,
          "x-instance-id": savedInstanceId
        };
        
        // On décode le pseudo depuis le token basic
        const decoded = atob(savedAuth);
        const savedPseudo = decoded.split(":")[0];
        
        // Vérifier que le token est toujours valide
        const result = await axios.get(`${API_URL}/check_auth`, { headers });
        if (result.data.instanceId || result.data.status === 'multiple_choices') {
           setUser(savedAuth);
           setPseudo(savedPseudo);
           // On utilise finishLogin pour recharger les infos (qui configure aussi axios)
           finishLogin(savedInstanceId, result.data.schoolName || "", headers, savedPseudo);
        } else {
           logoutUser();
        }
      } catch (e) {
        logoutUser();
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    checkUserStatus().finally(() => setInitialLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{
      user, pseudo, loading, errorAuthentification, instanceChoices, loginUser, finishLogin, logoutUser, childInfos, instanceId, teamId, missions, players
    }}>
      {initialLoading ? null : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
