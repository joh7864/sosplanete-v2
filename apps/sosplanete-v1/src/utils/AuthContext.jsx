import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import appcfg from "../config.js";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [pseudo, setPseudo] = useState(null);
  const [childId, setChildId] = useState(null);
  const [childEquipeName, setChildEquipeName] = useState(null);
  const [childEquipeColor, setChildEquipeColor] = useState(null);
  const [childEquipeImage, setChildEquipeCImage] = useState(null);
  const [childrens, setChildrens] = useState(null);
  const [currentWeek, setCurrentWeek] = useState({});
  const [school, setSchool] = useState({});
  const [teams, setTeams] = useState(null);
  const [actions, setActions] = useState(null);
  const [childInfos, setChildInfos] = useState(null);
  const [errorAuthentification, setErrorAuthentification] = useState("");
  const [rootUrl, setrootUrl] = useState(appcfg.apiRootUrl);
  const [activeSchoolName, setActiveSchoolName] = useState(null);
  const [instanceChoices, setInstanceChoices] = useState(null);

  const finishLogin = (instanceId, schoolName, headers, loginPseudo) => {
    const currentPseudo = loginPseudo || pseudo;
    headers["x-instance-id"] = instanceId;
    setActiveSchoolName(schoolName);
    localStorage.setItem("instanceId", instanceId.toString());
    localStorage.setItem("sos_last_instance_id", instanceId.toString());
    
    // récup de la période en cours
    axios
      .get(rootUrl + "/week", { headers })
      .then((result) => {
        setCurrentWeek(result.data);
      })
      .catch((error) => setCurrentWeek(null));

    localStorage.setItem("inProgress", "on");
    setErrorAuthentification("");

    // Chargement des principales données
    axios
      .get(rootUrl + "/children", { headers })
      .then((result) => setChildrens(result.data))
      .catch((error) => setUser(null));

    let url = rootUrl + "/children/" + currentPseudo + "/pseudo";
    axios
      .get(url, { headers })
      .then((result) => {
        setChildId(result.data.id);
        axios
          .get(rootUrl + "/child/" + result.data?.id, { headers })
          .then((result) => {
            setChildInfos(result.data);
            axios
              .get(rootUrl + "/teams", { headers })
              .then((result) => {
                setTeams(result.data);
                axios
                  .get(rootUrl + "/actions", { headers })
                  .then((result) => setActions(result.data))
                  .catch((error) => setTeams(null));
                axios
                  .get(rootUrl + "/school", { headers })
                  .then((result) => setSchool(result.data))
                  .catch((error) => setTeams(null));
              })
              .catch((error) => setTeams(null));
          })
          .catch((error) => setChildInfos(null));
      })
      .catch((error) => setChildId(null));
  };

  const loginUser = async (userInfo) => {
    setLoading(true);

    let uname = userInfo.pseudo + ":" + userInfo.password;

    setUser(btoa(uname));
    setPseudo(userInfo.pseudo);

    try {
      const headers = {
        "content-type": "application/json",
        Authorization: "Basic " + btoa(uname),
      };

      // Vérification de l'authentification
      await axios
        .get(rootUrl + "/check_auth", { headers })
        .then((result) => {
          if (result.data.status === 'multiple_choices') {
            const lastUsed = localStorage.getItem("sos_last_instance_id");
            const choices = result.data.choices;
            setInstanceChoices(choices);
            const autoChoice = lastUsed ? choices.find(c => c.instanceId.toString() === lastUsed) : null;
            
            if (autoChoice) {
              finishLogin(autoChoice.instanceId, autoChoice.schoolName, headers, userInfo.pseudo);
            } else {
              localStorage.setItem("inProgress", "on"); // keep auth alive
              navigate("/discovery");
            }
          } else if (result.data.instanceId) {
            finishLogin(result.data.instanceId, result.data.schoolName, headers, userInfo.pseudo);
          }
        })
        .catch((error) => {
          setUser(null);
          setErrorAuthentification(
            "Ton pseudo ou ton mot de passe est incorrect !"
          );
        });
      // Fin de chargement
    } catch (error) {
      console.error(error);
      logoutUser();
      setErrorAuthentification(error);
      setUser(null);
    }

    setLoading(false);
  };

  const logoutUser = async () => {
    setUser(null);
    setPseudo(null);
    setChildrens(null);
    setCurrentWeek(null);
    setTeams(null);
    setActions(null);
    setActiveSchoolName(null);
    setInstanceChoices(null);
    localStorage.setItem("inProgress", "off");
    localStorage.removeItem("instanceId");
  };

  const checkUserStatus = async () => {
    try {
      //let accountDetails = await account.get();
      //setUser(accountDetails)
    } catch (error) {
      //
    }
    setLoading(false);
  };

  useEffect(() => {
    checkUserStatus();
  }, []);

  const contextData = {
    errorAuthentification,
    user,
    pseudo,
    childId,
    childrens,
    currentWeek,
    teams,
    school,
    actions,
    childInfos,
    childEquipeName,
    childEquipeColor,
    childEquipeImage,
    rootUrl,
    activeSchoolName,
    instanceChoices,
    loginUser,
    finishLogin,
    logoutUser,
  };

  return (
    <AuthContext.Provider value={contextData}>
      {loading ? <p>Loading...</p> : children}
    </AuthContext.Provider>
  );
};

//Custom Hook
export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;
