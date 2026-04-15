import React, { useEffect, useState } from "react";
import { NnauruAPI } from "../../api/nnauruAPI";
import Mascotte from "../../components/Mascotte/Mascotte";
import { useAuth } from "../../utils/AuthContext";
import ActionRealisees from "./ActionRealisees";
import ChildCard from "./ChildCard";

import tree from "../../assets/arbre.svg";
import arbre from "../../assets/arbretempo4.svg";
import moiIcon from "../../assets/user.svg";
import Header from "../../components/Header";
import Foret from "./Foret";
import "./Moi.css";

const Moi = () => {
  const { pseudo, user, currentWeek, childId, teams, childInfos, actions } =
    useAuth();
  const [actionsRealisees, setActionsRealisees] = useState([]);
  const [actionsRealiseesDepuitDebut, setActionsRealiseesDepuitDebut] =
    useState([]);
  const [refActions, setRefActions] = useState(actions);
  const [infos, setInfos] = useState(null);
  const [score, setScore] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  const [mascotteLastUpdate, setMascotteLastUpdate] = useState(Date.now());

  const [mascotteTitre, setMascotteTitre] = useState("");
  const [mascotteLigne1, setMascotteLigne1] = useState("");
  const [mascotteLigne2, setMascotteLigne2] = useState("");

  // Update des infos
  useEffect(() => {
    return () => {};
  }, [infos]);

  // Evènement de MOUNT du composant
  useEffect(() => {
    // Appel de l'API pour récupérer les actions de l'enfant connecté
    NnauruAPI.get(
      user,
      "/children/" + childId + "/actionsdone?week_id=" + currentWeek.id,
      true
    ).then((result) => {
      // Actions réalisées de la semaine
      setActionsRealisees(result);
    });

    // Appel de l'API pour récupérer les actions de l'enfant depuis le début du jeu
    NnauruAPI.get(user, "/children/" + childId + "/actionsdone2", true).then(
      (result) => {
        // Actions réalisées depuis le début du jeu
        setActionsRealiseesDepuitDebut(result);

        // Récupération des infos de l'équipe de l'enfant connnecté
        var i = teams.filter((team) => team.id == childInfos.team_id)[0];
        setInfos(i);
      }
    );

    var d1 = new Date(currentWeek.begin);
    var d2 = new Date(currentWeek.end);
    setStart(d1.toLocaleDateString("fr-FR"));
    setEnd(d2.toLocaleDateString("fr-FR"));
  }, []);

  // Evènement qui nous donne le signe que les données sont chargées
  useEffect(() => {
    handleUpdateMascotte(
      "Tes résultats",
      "C'est bien, tu as " +
        actionsRealisees?.length +
        " actions(s). Continue comme ça, tu progresses vite :)",
      ""
    );
  }, [actionsRealisees]);

  // Notification de fermeture de la mascotte
  function handleClosedMascotte() {
    var d = Date.now();
    setMascotteLastUpdate(d);
    setMascotteTitre("");
    setMascotteLigne1("");
    setMascotteLigne2("");
  }

  // Notification de réaffichage de la mascotte
  const handleUpdateMascotte = (titre, ligne1, ligne2) => {
    var d = Date.now();
    setMascotteLastUpdate(d);
    setMascotteTitre(titre);
    setMascotteLigne1(ligne1);
    setMascotteLigne2(ligne2);
  };

  return (
    <>
      <Header
        title={"Moi, scores du " + currentWeek.begin + " au " + currentWeek.end}
        icon={moiIcon}
      />

      <Mascotte
        titre={mascotteTitre}
        ligne1={mascotteLigne1}
        ligne2={mascotteLigne2}
        LastUpdate={mascotteLastUpdate}
        onClosed={handleClosedMascotte}
      />

      <div className="moi-container">
        <div className="branche-action">
          {/* Branche de l'arbre */}
          <img src={arbre} alt="arbre" />
        </div>

        <ChildCard
          pseudo={pseudo}
          infos={infos}
          tree={tree}
          semaineCount={actionsRealisees?.length}
          totalCount={actionsRealiseesDepuitDebut?.length}
        />

        <Foret actionsRealisees={actionsRealisees} />

        {actionsRealisees.length > 0 ? (
          <>
            <div className="vignettes-dernieres-actions-container">
              <h1>
                Tes actions du {start} au {end}
              </h1>
            </div>

            <ActionRealisees
              actionsRealisees={actionsRealisees}
              refActions={refActions}
              updateMascotte={handleUpdateMascotte}
            />
          </>
        ) : (
          <></>
        )}
      </div>
    </>
  );
};

export default Moi;
