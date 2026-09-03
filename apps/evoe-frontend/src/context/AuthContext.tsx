import React, { createContext, useContext, useEffect, useState } from 'react';
import { evoeClient } from '../lib/api';
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
  refreshContext: () => Promise<void>;
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

  const refreshContext = async () => {
    const savedToken = localStorage.getItem("evoe_token") || sessionStorage.getItem("evoe_token");
    const savedAuth = localStorage.getItem("evoe_auth") || sessionStorage.getItem("evoe_auth");
    const savedInstanceId = localStorage.getItem("instanceId") || sessionStorage.getItem("instanceId");

    if ((savedToken || savedAuth) && savedInstanceId) {
      const authHeader = savedToken ? `Bearer ${savedToken}` : `Basic ${savedAuth}`;
      const headers = {
        "content-type": "application/json",
        Authorization: authHeader,
        "x-instance-id": savedInstanceId
      };
      try {
        const res = await evoeClient.get(`${EVOE_API_URL}/context`, { headers });
        setChildInfos(res.data.childInfos);
        setMissions(res.data.missions);
        setPlayers(res.data.players || []);
      } catch (e) {
        console.error("Erreur rafraîchissement contexte:", e);
      }
    }
  };

  const finishLogin = (instId: string, _schoolName: string, headers: any, _loginPseudo: string) => {
    headers["x-instance-id"] = instId;
    
    setInstanceId(instId);
    // Sauvegarder l'instanceId pour checkUserStatus
    localStorage.setItem("instanceId", instId);
    sessionStorage.setItem("instanceId", instId);
    
    // Configurer le client API isolé pour toutes les futures requêtes
    evoeClient.defaults.headers.common['Authorization'] = headers['Authorization'];
    evoeClient.defaults.headers.common['x-instance-id'] = instId;

    setErrorAuthentification("");

    // Charger le contexte dynamique Evoe (avatars, missions)
    evoeClient.get(`${EVOE_API_URL}/context`, { headers })
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

      const result = await evoeClient.get(`${API_URL}/check_auth`, { headers });
      
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
            const token = choice.token || choice.access_token || encodedAuth;
            setUser(token);
            setPseudo(resolvedPseudo);
            setInstanceChoices(null);
            setPendingAuth(null); // On efface le cache des credentials

            // Nettoyage de l'ancien basic auth
            localStorage.removeItem("evoe_auth");
            sessionStorage.removeItem("evoe_auth");

            if (userInfo.keepLogged) {
              localStorage.setItem("evoe_token", token);
              sessionStorage.removeItem("evoe_token");
            } else {
              sessionStorage.setItem("evoe_token", token);
              localStorage.removeItem("evoe_token");
            }
            
            const authHeader = token.includes('.') ? `Bearer ${token}` : `Basic ${token}`;
            finishLogin(choice.instanceId, choice.schoolName, { ...headers, Authorization: authHeader }, resolvedPseudo);
            navigate("/");
          }
        }
      } else if (result.data.instanceId) {
        const token = result.data.token || result.data.access_token || encodedAuth;
        setUser(token);
        setPseudo(resolvedPseudo);
        setPendingAuth(null);

        // Nettoyage de l'ancien basic auth
        localStorage.removeItem("evoe_auth");
        sessionStorage.removeItem("evoe_auth");

        if (userInfo.keepLogged) {
          localStorage.setItem("evoe_token", token);
          sessionStorage.removeItem("evoe_token");
        } else {
          sessionStorage.setItem("evoe_token", token);
          localStorage.removeItem("evoe_token");
        }

        const authHeader = token.includes('.') ? `Bearer ${token}` : `Basic ${token}`;
        finishLogin(result.data.instanceId, result.data.schoolName, { ...headers, Authorization: authHeader }, resolvedPseudo);
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
    localStorage.removeItem("evoe_token");
    localStorage.removeItem("evoe_auth");
    localStorage.removeItem("instanceId");
    sessionStorage.removeItem("evoe_token");
    sessionStorage.removeItem("evoe_auth");
    sessionStorage.removeItem("instanceId");
    delete evoeClient.defaults.headers.common['Authorization'];
    delete evoeClient.defaults.headers.common['x-instance-id'];
    navigate("/login");
  };

  const checkUserStatus = async () => {
    const savedToken = localStorage.getItem("evoe_token") || sessionStorage.getItem("evoe_token");
    const savedAuth = localStorage.getItem("evoe_auth") || sessionStorage.getItem("evoe_auth");
    const savedInstanceId = localStorage.getItem("instanceId") || sessionStorage.getItem("instanceId");

    // 1. Session avec JWT Bearer token
    if (savedToken && savedInstanceId) {
      try {
        const headers = {
          "content-type": "application/json",
          Authorization: `Bearer ${savedToken}`,
          "x-instance-id": savedInstanceId
        };
        
        const result = await evoeClient.get(`${API_URL}/check_auth`, { headers });
        if (result.data.status === 'success' || result.data.instanceId) {
          setUser(savedToken);
          setPseudo(result.data.pseudo);
          finishLogin(savedInstanceId, result.data.schoolName || "", headers, result.data.pseudo);
        } else {
          logoutUser();
        }
      } catch (e) {
        logoutUser();
      }
    } 
    // 2. Migration automatique transparente pour les anciens comptes Basic Auth
    else if (savedAuth && savedInstanceId) {
      try {
        const headers = {
          "content-type": "application/json",
          Authorization: "Basic " + savedAuth,
          "x-instance-id": savedInstanceId
        };
        
        const decoded = atob(savedAuth);
        const savedPseudo = decoded.split(":")[0];
        
        const result = await evoeClient.get(`${API_URL}/check_auth`, { headers });
        if (result.data.instanceId || result.data.status === 'multiple_choices' || result.data.status === 'success') {
          const newToken = result.data.token || result.data.access_token;
          if (newToken) {
            // Migrer vers evoe_token
            if (localStorage.getItem("evoe_auth")) {
              localStorage.setItem("evoe_token", newToken);
              localStorage.removeItem("evoe_auth");
            } else {
              sessionStorage.setItem("evoe_token", newToken);
              sessionStorage.removeItem("evoe_auth");
            }
            setUser(newToken);
            setPseudo(result.data.pseudo || savedPseudo);
            finishLogin(savedInstanceId, result.data.schoolName || "", { ...headers, Authorization: `Bearer ${newToken}` }, result.data.pseudo || savedPseudo);
          } else {
            setUser(savedAuth);
            setPseudo(savedPseudo);
            finishLogin(savedInstanceId, result.data.schoolName || "", headers, savedPseudo);
          }
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
      user, pseudo, loading, errorAuthentification, instanceChoices, loginUser, finishLogin, logoutUser, childInfos, instanceId, teamId, missions, players, refreshContext
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
