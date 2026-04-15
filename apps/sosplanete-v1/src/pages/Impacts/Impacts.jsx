import React, { useEffect, useState } from "react";
import { NnauruAPI } from "../../api/nnauruAPI";
import { useAuth } from "../../utils/AuthContext";
//import TabNavItem from '../../components/Tabs/TabNavItem';
import BadgeInfo from "../../components/Badges/BadgeInfo";
import Header from "../../components/Header";
import TabContent from "../../components/Tabs/TabContent";
import "../../components/Tabs/Tabs.css";
import Depassement from "./Depassement";
import ImpactCard from "./Impact";
import "./impacts.css";

import impactsIcon from "../../assets/calendar.svg";
import earth from "../../assets/eartheco.svg";
import eau from "../../assets/eaueco.svg";
import poubelle from "../../assets/poubelleeco.svg";
import Mascotte from "../../components/Mascotte/Mascotte";
import pomme from "./images/pomme.png";

const Impacts = () => {
  const { user } = useAuth();
  const [impacts, setImpacts] = useState({});
  const [activeTab, setActiveTab] = useState("tab1");
  const [showDescription, setShowDescription] = useState(false);
  const [showInfoComplementaire, setShowInfoComplementaire] = useState(true);

  const [mascotteTitre, setMascotteTitre] = useState("");
  const [mascotteLigne1, setMascotteLigne1] = useState("");
  const [mascotteLigne2, setMascotteLigne2] = useState("");
  const [mascotteLastUpdate, setMascotteLastUpdate] = useState(Date.now());
  const [mascotteState, setMascotteState] = useState(
    localStorage.getItem("mascotte") === "on" ? true : false
  );

  useEffect(() => {
    // Appel de l'API pour récupérer les impacts
    NnauruAPI.get(user, "/impact", true).then((result) => {
      setImpacts(result);
    });

    // Valeur initiale de la mascotte
    setMascotteTitre("Economies réalisées et Jour du dépassement");
    setMascotteLigne1("");
    setMascotteLigne2("");

    setShowInfoComplementaire(true);
  }, []);

  const ajusteUnitePoids = (value) => {
    var poids = (value / 1000).toFixed(1);

    if (poids >= 1) return poids + " tonnes";
    else return value + " kg";
  };

  const ajusteUniteVolumeEau = (value) => {
    var volume = (value / 1000).toFixed(1);

    if (volume >= 1) return volume + " m3";
    else return value + " litres";
  };

  // Affichage des descriptions
  const handleShowDescription = (show) => {
    setShowDescription(show);
  };

  function handleMascotteStateChanged(newState) {
    setMascotteState(newState);
  }

  // Mise à jour des textes de la mascotte pour le jour du dépassement
  const handleUpdateMascotte = (titre, ligne1, ligne2) => {
    var d = Date.now();
    setMascotteLastUpdate(d);

    setMascotteTitre(titre);
    setMascotteLigne1(ligne1);
    setMascotteLigne2(ligne2);
    setShowInfoComplementaire(false);
  };
  // Mise à jour a la cloture pour que la prochaine ouverteur soit OK
  const handleClosedMascotte = () => {
    setMascotteTitre("");
    setMascotteLigne1("");
    setMascotteLigne2("");
  };

  return (
    <>
      <Header title="Impacts" icon={impactsIcon} />

      <Mascotte
        mascotteId="Impacts"
        titre={mascotteTitre}
        ligne1={mascotteLigne1}
        ligne2={mascotteLigne2}
        LastUpdate={mascotteLastUpdate}
        onClosed={handleClosedMascotte}
        onStateChanged={handleMascotteStateChanged}
      >
        {showInfoComplementaire && (
          <div style={{ color: "black", marginTop: 15 }}>
            <p style={{ marginBottom: 15 }}>
              Cet écran te montre que si tout le monde faisait comme vous, le{" "}
              <strong>jour du dépassement</strong> qui est la date à partir de
              laquelle l'empreinte écologique de l'homme (surface de la Terre
              utilisée par l'Homme pour pêcher, élever, cultiver, déboiser,
              construire et brûler des énergies fossiles), dépasse la
              bio-capacité de la planète (surface de la planète nécessaire pour
              faire face à ces pressions).{" "}
            </p>
            <p style={{ marginBottom: 15 }}>
              Et tu peux aussi voir,{" "}
              <strong>le résultat réel de vos actions</strong>. Il concerne
              l'économie en gaz à effet de serre (tCO2e), l'économie d'eau
              (litre) ainsi que l'économie de déchet (kg) que tous ensemble,
              vous avez réalisé depuis le début du jeu.{" "}
            </p>
            <p style={{ marginBottom: 15 }}>
              Avec SOS Planète, le jour du dépassement recule,{" "}
              <strong>l'air devient plus respirable</strong>, il y a moins de
              plastiques et autres déchets dans la nature, et{" "}
              <strong>l'eau est disponible pour tous</strong> les animaux et
              humains.
            </p>
            <p style={{ marginBottom: 15 }}>
              Alors continues d'Agir pour le vivant !
            </p>
          </div>
        )}

        {!showInfoComplementaire && (
          <div style={{ color: "black", marginTop: 15 }}>
            <p style={{ marginBottom: 2 }}>
              L’<strong>empreinte écologique</strong>, caractérise la surface de
              la Terre utilisée par l’homme, pour pêcher, élever les animaux,
              cultiver, déboiser, construire et brûler des énergies fossiles.
            </p>
            <p style={{ marginBottom: 15 }}>
              La <strong>biocapacité</strong>, quant à elle, représente la
              surface de la planète nécessaire pour faire face à ces pressions.
            </p>
            <p style={{ marginBottom: 0 }}>
              <div className="ch">
                <div>
                  Depuis les années 1970, la date du Jour du dépassement se
                  dégrade. <br />
                  <ul
                    style={{ fontFamily: "Segoe UI", fontSize: 16, margin: 2 }}
                  >
                    <li
                      style={{
                        listStyle: "disc",
                        listStylePosition: "inside",
                        margin: 0,
                      }}
                    >
                      En <b>1986</b>, elle avait lieu le{" "}
                      <strong>30 octobre</strong>
                    </li>
                    <li
                      style={{
                        listStyle: "disc",
                        listStylePosition: "inside",
                        margin: 0,
                      }}
                    >
                      En <b>2019</b>, c'est 3 mois plus tôt, le{" "}
                      <strong>29 juillet</strong>
                    </li>
                    <li
                      style={{
                        listStyle: "disc",
                        listStylePosition: "inside",
                        margin: 0,
                      }}
                    >
                      En <b>2020</b>, elle arrive plus tard le{" "}
                      <strong>22 août</strong>. C’est l’effet "
                      <strong>Covid</strong>", car l’homme, pendant quelques
                      mois, a cessé de polluer et d’utiliser les ressources de
                      la planète !
                    </li>
                  </ul>
                  <br />
                </div>
                <div className="impact-pomme">
                  <img src={pomme} style={{ width: 110, margin: 0 }} />
                </div>
              </div>
            </p>
            <p style={{ marginBottom: 15 }}>
              Mais en 2023, elle est revenue au <strong>2 août.</strong>
            </p>
            <p style={{ marginBottom: 15 }}>
              Alors continues d'Agir pour le vivant !
            </p>
          </div>
        )}
      </Mascotte>

      <div className="impacts-container">
        {/* <img src={branche} className="branche" />  */}
        {/* retirer pour le moment */}

        <div className="tabs">
          {/* <ul className="nav">
						<TabNavItem
							title="Economie"
							id="tab1"
							activeTab={activeTab}
							setActiveTab={setActiveTab}
						/>
						<TabNavItem
							title="Terre-momètre"
							id="tab2"
							activeTab={activeTab}
							setActiveTab={setActiveTab}
						/>
					</ul> */}
          {/* retirer pour le moment */}

          <div className="outlet">
            <TabContent id="tab1" activeTab={activeTab}>
              <div className="container-v">
                <div
                  className="titre-container"
                  onClick={() =>
                    handleUpdateMascotte("Jour du dépassement", "", "")
                  }
                >
                  <h1>Jour du dépassement</h1>
                  {mascotteState && <BadgeInfo />}
                </div>

                <p className="impact-card-info-text">
                  Si tout le monde faisait comme nous, il nous faudrait :{" "}
                  <span className="impact-info-textbrillance">
                    {impacts.depassementnombreplanetes} planètes
                  </span>
                </p>

                <div className="impact-terres-container">
                  <div>
                    <img src={earth} className="big" />
                  </div>
                  <div>
                    <img src={earth} className="normal" />
                  </div>
                </div>

                <div className="impact-dates-container">
                  <Depassement
                    icon={impactsIcon}
                    backgroundColor="#E9F7EC"
                    borderColor="#00A35A"
                    text="Jour du dépassement avec SOS Planète"
                    date={impacts.jourdepassementavec}
                  />
                  <Depassement
                    icon={impactsIcon}
                    backgroundColor="#FFEDE5"
                    borderColor="#FF1D15"
                    text="Jour du dépassement sans SOS Planète"
                    date={impacts.jourdepassementsans}
                  />
                </div>

                <div
                  className="titre-container height-margin"
                  onClick={() => handleShowDescription(!showDescription)}
                >
                  <h1>Economies réalisées</h1>
                  <BadgeInfo />
                </div>

                <div className="impact-card-info-text">
                  Grâce à vos actions, vous avez réussi à économiser, ...
                </div>

                <div className="container-h spacing-element">
                  {/* j'ai ajouté une propriété pour modifier l'espace entre les cartes */}

                  <ImpactCard
                    icon={earth}
                    keycard={1}
                    title={impacts.scoreglobal + " tCO2e"}
                    complementInfo="L'air est plus pur, il y a moins de gaz à effet de serre dissipé dans l'atmosphère et donc une diminution du réchauffement climatique"
                    content="Tonnes d'équivalent CO², qui ne se sont pas dissipées"
                    showDescription={showDescription}
                  />

                  <ImpactCard
                    icon={poubelle}
                    keycard={2}
                    title={ajusteUnitePoids(impacts.scorepollution)}
                    complementInfo="Il y a moins de plastiques ou d'autres déchets dans la nature, dans la mer et la Terre s'en porte mieux"
                    content="Quantité de déchets qui ne sont pas jetés"
                    showDescription={showDescription}
                  />

                  <ImpactCard
                    icon={eau}
                    keycard={3}
                    title={ajusteUniteVolumeEau(impacts.scorewater)}
                    complementInfo="L'eau, c'est la vie. Plus on l'économise, plus il y en aura pour tous les animaux et les humains de la Terre"
                    content="Quantité d'eau économisée"
                    showDescription={showDescription}
                  />
                </div>
              </div>
            </TabContent>
            <TabContent id="tab2" activeTab={activeTab}>
              <div className="tab-content-container">
                Terre-momètre...coming soon !
                <Mascotte
                  mascotteId="Impacts"
                  titre="C'est en cours !"
                  ligne1="Bientôt, tu pourras voir les impacts de toutes vos actions sur le Terre-momètre de la planète"
                  timeout={7000}
                />
              </div>
            </TabContent>
          </div>
        </div>
      </div>
    </>
  );
};

export default Impacts;
