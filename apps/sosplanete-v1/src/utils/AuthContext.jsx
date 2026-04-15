import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import appcfg from "../config.json";

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
          // récup de la période en cours
          axios
            .get(rootUrl + "/week", { headers })
            .then((result) => {
              setCurrentWeek(result.data);
              console.log("Week :", result.data);
            })
            .catch((error) => setCurrentWeek(null));

          console.log("OK, authentifié, on continue ! ");
          localStorage.setItem("inProgress", "on");

          setErrorAuthentification("");

          // Chargement des principales données
          // récup de la liste des enfant
          axios
            .get(rootUrl + "/children", { headers })
            .then((result) => setChildrens(result.data))
            .catch((error) => setUser(null));

          // Construction des informations contexturlles de l'enfant
          let url = rootUrl + "/children/" + userInfo.pseudo + "/pseudo";
          axios
            .get(url, { headers })
            .then((result) => {
              setChildId(result.data.id);
              console.log("Id :", result.data);

              axios
                .get(rootUrl + "/child/" + result.data?.id, { headers })
                .then((result) => {
                  setChildInfos(result.data);
                  console.log("Child infos :", result.data);

                  // récup de la liste des équipes
                  axios
                    .get(rootUrl + "/teams", { headers })
                    .then((result) => {
                      setTeams(result.data);
                      console.log("Teams :", result.data);

                      // récup de la liste des actions
                      axios
                        .get(rootUrl + "/actions", { headers })
                        .then((result) => {
                          setActions(result.data);
                          console.log("Actions :", result.data);

                          // récup de la liste des actions
                          axios
                            .get(rootUrl + "/school", { headers })
                            .then((result) => {
                              setSchool(result.data);
                              console.log("school :", result.data);
                            })
                            .catch((error) => setTeams(null));
                        })
                        .catch((error) => setTeams(null));
                    })
                    .catch((error) => setTeams(null));
                })
                .catch((error) => setChildInfos(null));
            })
            .catch((error) => setChildId(null));
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
    localStorage.setItem("inProgress", "off");
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
    loginUser,
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
