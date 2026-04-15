import React, { useEffect, useRef, useState } from "react";
import { NnauruAPI } from "../../api/nnauruAPI";
import Mascotte from "../../components/Mascotte/Mascotte";
import useBreakpoints from "../../hooks/useBreakpoints";
import { useAuth } from "../../utils/AuthContext";
import { useGame } from "../GameContext";
import LevelManager from "../components/LevelManager";
import QuizzGame from "./QuizzGame";
import QuizzResultat from "./QuizzResultat";
import logo from "/image/games/logo.png";

function Quizz() {
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
      console.log("categories chargées", categoriesItems);
    });

    handleUpdateMascotte("Bonne chance !", "", "");
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
              Bien connaitre la portée de ses actions !
              <br />
              Avec le <strong>Quizz</strong>, si tu retrouves un maximum de
              bonnes catégories, tu gagnes la partie.
            </p>
            <br />
            <div>
              <p>
                <strong> Voici les règles</strong>
              </p>
              <ul style={{ fontFamily: "Segoe UI", fontSize: 16, margin: 2 }}>
                <li style={{ listStyle: "disc", listStylePosition: "inside" }}>
                  Tu dois trouver la bonne catégorie de l'action proposée
                </li>
                <li style={{ listStyle: "disc", listStylePosition: "inside" }}>
                  Tu peux choisir entre entre 4 propositions
                </li>
                <li style={{ listStyle: "disc", listStylePosition: "inside" }}>
                  Fais le bon choix !
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
            <div className="game-titre-header">Quizz Action</div>

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
        <div className="quizz-container">
          <QuizzGame
            actions={[...actions]}
            categories={categories}
            setGameOver={setGameOver}
            level={currentLevel}
          />
        </div>
      )}

      {/* Affichage des résultats à la fin du jeu */}
      {!showRules && gameOver && <QuizzResultat />}
    </>
  );
}

export default Quizz;
