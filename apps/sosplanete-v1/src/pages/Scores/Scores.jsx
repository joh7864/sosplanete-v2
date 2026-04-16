import React, { Suspense, useEffect, useState } from "react";
import { NnauruAPI } from "../../api/nnauruAPI";
import { useAuth } from "../../utils/AuthContext";

import Loading from "../../components/Loading";
import Mascotte from "../../components/Mascotte/Mascotte";

import Header from "../../components/Header";
import TabContent from "../../components/Tabs/TabContent";
import TabNavItem from "../../components/Tabs/TabNavItem";
import DeblocageAnimaux from "./DeblocageAnimaux";
import Semaine from "./ScoresSemaine";
import Equipes from "./ScoresTeams";
import Total from "./ScoresTotal";

import branche from "../../assets/arbretempo4.svg";
import chat from "../../assets/chat.svg";
import iconInfo from "../../assets/info.svg";
import tropheeIcon from "../../assets/trophee.svg";
import "../../components/Tabs/Tabs.css";
import appcfg from "../../config.js";
import useBreakpoints from "../../hooks/useBreakpoints";
import "./DeblocageAnimaux.css";
import "./Scores.css";
// Liste des animaux
import baleine from "./images/baleine.svg";
import ecureuil from "./images/ecureuil.svg";
import elephant from "./images/elephant.svg";
import grospoisson from "./images/gros-poisson.svg";
import lion from "./images/lion.svg";
import loup from "./images/loup.svg";
import ours from "./images/ours.svg";
import poisson from "./images/poisson.svg";
import requin from "./images/requin.svg";

// --------------------------------------------
// Composant d'affichage de la page scores
// --------------------------------------------
const Scores = () => {
  const { user, currentWeek, teams, school } = useAuth();
  const [activeTab, setActiveTab] = useState("semaine");
  const [impact, setImpact] = useState({});

  const [showMascotte, setShowMascotte] = useState(false);
  const [mascotteTitre, setMascotteTitre] = useState("");
  const [mascotteLigne1, setMascotteLigne1] = useState("");
  const [mascotteLigne2, setMascotteLigne2] = useState("");
  const [mascotteState, setMascotteState] = useState(
    localStorage.getItem("mascotte") === "on" ? true : false
  );

  const [playAnimation, setPlayAnimation] = useState(Date.now());
  const [showAnimation, setShowAnimation] = useState(true);
  const [titreDeblocage, setTitreDeblocage] = useState("");

  const animaux = [
    { name: "L'écureuil", icon: ecureuil, suffixe: "", verbe: " est débloqué" },
    { name: "Le loup", icon: loup, suffixe: "", verbe: " est débloqué" },
    { name: "Le lion", icon: lion, suffixe: "", verbe: " est débloqué" },
    { name: "L'ours", icon: ours, suffixe: "", verbe: " est débloqué" },
    { name: "L'éléphant", icon: elephant, suffixe: "", verbe: " est débloqué" },
    {
      name: "Les petits poissons",
      icon: poisson,
      suffixe: "",
      verbe: " sont débloqués",
    },
    { name: "Le thon", icon: grospoisson, suffixe: "", verbe: " est débloqué" },
    { name: "Le requin", icon: requin, suffixe: "", verbe: " est débloqué" },
    { name: "La baleine", icon: baleine, suffixe: "e", verbe: " est débloqué" },
  ];

  const breakPoint = useBreakpoints();

  const handleReplayAnimation = () => {
    let d = Date.now();
    setPlayAnimation(d);
  };

  // Affichage de la mascotte
  const handleShowMascotte = (show) => {
    setMascotteTitre("Tu veux débloquer d'autres animaux ?");
    setMascotteLigne1(impact?.deblocageanimal);
    setShowMascotte(show);
  };
  // Fermeture de la mascotte

  function handleMascotteClosed() {
    setMascotteTitre("");
    setMascotteLigne1("");
    setMascotteLigne2("");
  }

  function handleMascotteStateChanged(newState) {
    setMascotteState(newState);
  }

  function islittleScreen() {
    try {
      var result = breakPoint.isMobile || breakPoint.isTablet;
      return result;
    } catch {
      //
    }

    return false;
  }

  useEffect(() => {
    setMascotteTitre(impact?.bravotitre);
    setMascotteLigne1(impact?.bravotext);

    if (impact?.animalnum > 0) {
      if (breakPoint.isMobile)
        setTitreDeblocage(
          animaux[impact?.animalnum - 1]?.name +
            animaux[impact?.animalnum - 1]?.verbe +
            animaux[impact?.animalnum - 1]?.suffixe
        );
      else
        setTitreDeblocage(
          "Vous avez débloqué" +
            " " +
            animaux[impact?.animalnum - 1]?.name.toLocaleLowerCase()
        );
    } else setTitreDeblocage("Pas d'animal débloqué");
    return () => {};
  }, [impact, breakPoint]);

  // --------------------------------------------
  // Evènement de MOUNT du composant
  // --------------------------------------------
  useEffect(() => {
    // Appel de l'API pour récupérer les équipes
    NnauruAPI.get(user, "/impact?week_id=" + currentWeek.id, true).then(
      (result) => {
        setImpact(result);
      }
    );
    setTitreDeblocage("");
  }, []);

  // --------------------------------------------
  // Rendere : Rendu HTML du composant
  // --------------------------------------------
  return (
    <>
      <Mascotte
        mascotteId="Scores"
        titre={mascotteTitre}
        ligne1={mascotteLigne1}
        onClosed={handleMascotteClosed}
        onStateChanged={handleMascotteStateChanged}
      />
      <Suspense fallback={<Loading />}>
        <Header title="Scores" icon={tropheeIcon} />

        <div className="scores-container">
          {/* Lien vers SOS planete*/}

          <div className="branche-scores">
            <img src={branche} />
            <div className="chat-assis">
              <a href={appcfg.sosUrl} target="_blank" rel="noreferrer">
                <img src={chat} />
              </a>
              <div className="text-chat">
                Si tu veux en savoir plus, clique sur moi
              </div>
            </div>
          </div>

          {/* Affichage DU déblocage des animaux */}
          <div className="animation-container">
            <div className="titre-align">
              <div className="titre-animaux-container">
                <div>{titreDeblocage}</div>

                {mascotteState && (
                  <div
                    className="dot-blue"
                    onClick={() => handleShowMascotte()}
                  >
                    <img src={iconInfo} />
                  </div>
                )}
              </div>
            </div>

            <div className="animaux-container">
              <DeblocageAnimaux
                impacts={impact}
                animaux={animaux}
                playAnimation={playAnimation}
                replay={handleReplayAnimation}
              />
            </div>
          </div>

          {/* Affichage des scores en mode desktop ou paysage */}
          {!islittleScreen() && (
            <>
              <div className="container-cadre">
                <Equipes teams={teams} ecole={school} />

                <Semaine />

                <Total />
              </div>
            </>
          )}

          {/* Affichage des scores sous forme de TABS pour les mobiles */}
          {islittleScreen() && (
            <div className="tabs">
              <ul className="nav">
                <TabNavItem
                  title="Scores de la Semaine"
                  id="semaine"
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
                <TabNavItem
                  title="Scores depuis le début"
                  id="total"
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
              </ul>

              <div className="tabs-contens">
                <TabContent id="semaine" activeTab={activeTab}>
                  <Semaine />
                </TabContent>
                <TabContent id="total" activeTab={activeTab}>
                  <Total />
                </TabContent>
              </div>
            </div>
          )}
        </div>
      </Suspense>
    </>
  );
};

export default Scores;
