import React, { useEffect, useRef, useState } from "react";
import Mascotte from "../../components/Mascotte/Mascotte";
import useBreakpoints from "../../hooks/useBreakpoints";
import bronze from "../images/bronze.svg";
import gold from "../images/gold.svg";
import silver from "../images/silver.svg";
import Dechets from "./Dechets";
import Game from "./Game";
import GameResultat from "./Resultats";
import { useTriGame } from "./TriGameContext";
import logo from "/image/games/tri.png";

function Tri() {
  const {
    resultats,
    gameOver,
    startGame,
    setStartGame,
    bonnesReponses,
    currentLevel,
    setCurrentLevel,
  } = useTriGame();

  const [showRules, setShowRules] = useState(true);
  const [over, setOver] = useState(false);

  const [mascotteLastUpdate, setMascotteLastUpdate] = useState(Date.now());
  const [mascotteTitre, setMascotteTitre] = useState("");
  const [mascotteLigne1, setMascotteLigne1] = useState("");
  const [mascotteLigne2, setMascotteLigne2] = useState("");

  const breakPoint = useBreakpoints();

  const dragItem = useRef();

  const titre = {
    textAlign: "center",
    padding: "20px",
    fontSize: "1.3rem",
    fontWeight: "700",
    marginTop: "30px",
    marginBottom: "30px",
  };
  const rule = {
    fontSize: "1rem",
    fontWeight: "300",
    marginBottom: "5px",
  };

  useEffect(() => {
    handleUpdateMascotte("Alors, es-tu prêt(e) à jouer ?", "", "");
    return () => {};
  }, []);

  // Notification de fermeture de la mascotte
  function handleClosedMascotte() {
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

  function handleStartGame() {
    setShowRules(false);
    setStartGame(true);
  }

  function handleChangeLevel(level, icon) {
    setCurrentLevel(level);
    handleStartGame();
  }

  return (
    <>
      <Mascotte
        titre={mascotteTitre}
        ligne1={mascotteLigne1}
        ligne2={mascotteLigne2}
        onClosed={handleClosedMascotte}
      >
        {showRules && (
          <div
            style={{ textAlign: "left", fontFamily: "Segoe UI", fontSize: 16 }}
          >
            <p>
              Trier ses déchets permet d'éviter de polluer la nature ou la mer
              et la Terre s'en porte mieux.
              <br />
              Les poubelles jaunes, vertes, ou encore noires sont là pour nous
              aider à le faire.
              <br />
              Avec le <strong>jeu du tri</strong>, si tu places tous les déchets
              dans le bon container, tu gagnes la partie.
            </p>
            <br />
            <div>
              <p>
                <strong> Voici les règles</strong>
              </p>
              <ul style={{ fontFamily: "Segoe UI", fontSize: 16, margin: 2 }}>
                <li style={{ listStyle: "disc", listStylePosition: "inside" }}>
                  Tu dois placer chaque déchet dans le bon container
                </li>
                <li style={{ listStyle: "disc", listStylePosition: "inside" }}>
                  Chaque déchet bien placé te rapporte 1 étoile
                </li>
                <li style={{ listStyle: "disc", listStylePosition: "inside" }}>
                  Tu as droit à même nombre d'essais, qu'il y a de déchets à
                  placer
                </li>
              </ul>
              <br />
            </div>
            <p>
              Une astuce : en cliquant sur un container, tu sauras à quoi il
              sert :-)
              <br />
              <br />
              Bonne partie
            </p>
          </div>
        )}
      </Mascotte>

      {currentLevel == -1 && !gameOver && (
        <div style={{ display: "flex" }}>
          <div className="game-container">
            <div className="game-titre-header">Bienvenue au jeu du tri !</div>

            <div className="ch">
              <img
                className="max-w-[200px]"
                src={logo}
                style={{
                  width: breakPoint.isMobile ? 300 : 450,
                  cursor: "pointer",
                }}
              />
            </div>

            <div className="game-titre">Choisi ton niveau !</div>

            <div className="choix-niveau-container">
              <div onClick={() => handleChangeLevel(1, bronze)}>
                <div className="medaille-container">
                  <img src={bronze} style={{ cursor: "pointer" }} />
                  <div>Niveau 1</div>
                </div>
              </div>

              <div onClick={() => handleChangeLevel(2, silver)}>
                <div className="medaille-container">
                  <img src={silver} style={{ cursor: "pointer" }} />
                  <div>Niveau 2</div>
                </div>
              </div>

              <div onClick={() => handleChangeLevel(3, gold)}>
                <div className="medaille-container">
                  <img src={gold} style={{ cursor: "pointer" }} />
                  <div>Niveau 3</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Affichage du jeu */}
      {!showRules && !gameOver && currentLevel > -1 && (
        <Game dechets={Dechets} updateMascotte={handleUpdateMascotte} />
      )}

      {/* Affichage des résultats à la fin du jeu */}
      {!showRules && gameOver && (
        <GameResultat dechets={Dechets} restart={startGame} />
      )}
    </>
  );
}

export default Tri;
