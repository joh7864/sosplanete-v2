import React, { useEffect, useRef, useState } from "react";
import { NnauruAPI } from "../../api/nnauruAPI";
import Mascotte from "../../components/Mascotte/Mascotte";
import useBreakpoints from "../../hooks/useBreakpoints";
import { useAuth } from "../../utils/AuthContext";
import { useGame } from "../GameContext";
import LevelManager from "../components/LevelManager";
import BatailleGame from "./BatailleGame";
import BatailleResultats from "./BatailleResultats";
import logo from "/image/games/logo.png";

function Bataille() {
  const {
    resultats,
    gameOver,
    startGame,
    setStartGame,
    bonnesReponses,
    setGameOver,
    currentLevel,
    setCurrentLevel,
  } = useGame();
  const { actions, user } = useAuth();
  const [categories, setCategories] = useState([]);

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
    //--------------------------------------------------------
    // Chargement des catégories
    //--------------------------------------------------------
    NnauruAPI.get(user, "/categories", true).then((categoriesItems) => {
      setCategories(categoriesItems);
    });
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
  function handleChangeLevel(level) {
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
              Bien mesurer l'efficacité de ses actions !
              <br />
              Avec la <strong>Bataille</strong>, tu dois choisir entre 2
              actions. Choisi celle qui aura le plus d'impact sur
              l'environnement
            </p>
            <p>A chaque choix tu cumuleras une économie en tco2</p>
            <br />
            <div>
              <p>
                <strong> Voici les règles</strong>
              </p>
              <ul style={{ fontFamily: "Segoe UI", fontSize: 16, margin: 2 }}>
                <li style={{ listStyle: "disc", listStylePosition: "inside" }}>
                  Choisi le niveau 5, 10 ou 15 batailles
                </li>
                <li style={{ listStyle: "disc", listStylePosition: "inside" }}>
                  Trouve l'action avec le plus d'impact sur l'environnement
                </li>
                <li style={{ listStyle: "disc", listStylePosition: "inside" }}>
                  Fais les bons choix !
                </li>
              </ul>
              <br />
            </div>
          </div>
        )}
      </Mascotte>

      {!gameOver && showRules && (
        <div style={{ display: "flex" }}>
          <div className="game-container">
            <div className="game-titre-header">La bataille</div>

            <div
              className="ch"
              style={{
                backgroundImage: `url(${logo})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover",
                minWidth: 300,
                minHeight: 300,
              }}
            ></div>
            <LevelManager onLevelSelected={handleChangeLevel} />
          </div>
        </div>
      )}
      {/* Affichage du jeu */}
      {!showRules && !gameOver && (
        <div className="bataille-container">
          <BatailleGame
            actions={[...actions]}
            categories={categories}
            setGameOver={setGameOver}
            level={currentLevel}
            updateMascotte={handleUpdateMascotte}
          />
        </div>
      )}

      {/* Affichage des résultats à la fin du jeu */}
      {!showRules && gameOver && <BatailleResultats />}
    </>
  );
}

export default Bataille;
