import React, { useEffect, useRef, useState } from "react";
import etoile from "../images/etoile.svg";
import redcross from "../images/redcross.svg";
//import cmdplay from '../images/play.svg'
//import cmdpause from '../images/pause.svg'
import cmdstop from "../images/stop.svg";
import Container from "./container";
//import CountDown from '../components/CountDown'
import useBreakpoints from "../../hooks/useBreakpoints";
import "../Games.css";
import bronze from "../images/bronze.svg";
import gold from "../images/gold.svg";
import silver from "../images/silver.svg";
import DechetsFromJson from "./Dechets";
import { useTriGame } from "./TriGameContext";

function Game({ ...props }) {
  const {
    pauseGame,
    gameIsRunning,
    tentatives,
    tentativesMax,
    tempsMax,
    currentLevel,
    startGame,
    setPauseGame,
    setGameOverTime,
    setGameAborted,
    setGameOver,
    setTentatives,
    setBonnesReponses,
    setResultats,
  } = useTriGame();

  const [userTerminateGame, setUserTerminateGame] = useState(false);
  const [gameDechets, setGameDechets] = useState([]);
  const [reponses, setReponses] = useState([]);
  const [essais, setEssais] = useState(0);

  const dragItem = useRef();
  const breakPoint = useBreakpoints();

  //__________________________________________________________________________________
  // Système de Drag and drop
  //__________________________________________________________________________________
  // Lors du drag du dechet
  const drag = (event) => {
    event.dataTransfer.setData("text/plain", event.currentTarget.dataset.id);
  };

  // Lors du drop du dechet sur une poubelle
  const drop = (event) => {
    event.preventDefault();

    if (pauseGame) setPauseGame(false);

    setEssais((prev) => prev - 1);

    var index = event.dataTransfer.getData("text/plain");
    var r = [...reponses];

    // Gestion de la suppression des bonnes réponses
    let newDechets = [...gameDechets];
    if (newDechets[index].trash === event.target.parentElement.id) {
      r.push({ statut: true, dechet: newDechets[index] });
      newDechets.splice(index, 1);
    } else {
      var errorName = newDechets[index].name;
      var errorTrash = event.target.parentElement.parentElement.id;
      r.push({ statut: false, dechet: { name: errorName, trash: errorTrash } });
    }
    setReponses(r);
    setResultats(r);
    setGameDechets([...newDechets]);

    if (essais - 1 <= 0) {
      setBonnesReponses(r.filter((r) => r.statut).length);
      setGameOver(true);
    }
  };
  // Autorisation du drop
  const allowDrop = (event) => {
    event.preventDefault();
  };

  //-----------------------------------------
  // Fonction de tirage au sort sans doublons
  //-----------------------------------------
  function tirageAuSort(dechets, nombreDeTirages) {
    // Copie du tableau original pour ne pas le modifier directement
    let dechetsCopy = [];

    if (currentLevel === 1)
      dechetsCopy = dechets.filter(
        (d) => d.trash !== "vetement" && d.trash !== "compost"
      );
    else if (currentLevel === 2)
      dechetsCopy = dechets.filter((d) => d.trash !== "compost");
    else dechetsCopy = [...dechets];

    console.log(dechetsCopy);

    // Vérifier que le nombre de tirages demandé n'excède pas la taille du tableau
    if (nombreDeTirages > dechetsCopy.length) {
      console.error(
        "Le nombre de tirages demandé est supérieur à la taille du tableau."
      );
      return [];
    }

    // Tableau résultat
    const resultat = [];

    // Fonction pour obtenir un index aléatoire
    function getRandomIndex(max) {
      return Math.floor(Math.random() * max);
    }

    // Tirage au sort sans doublons
    for (let i = 0; i < nombreDeTirages; i++) {
      const index = getRandomIndex(dechetsCopy.length);
      const dechetChoisi = dechetsCopy.splice(index, 1)[0];
      resultat.push(dechetChoisi);
    }

    return resultat;
  }

  //__________________________________________________________________________________

  useEffect(() => {
    // initialisation Mascotte

    if (props?.updateMascotte !== undefined)
      props?.updateMascotte("C'est parti !");

    const timeout = setTimeout(() => {
      if (props?.updateMascotte !== undefined) props?.updateMascotte("");
    }, 3000);

    //--------------------------------------------------------
    // ATTENTION TIRAGE AU SORT des déchets
    //--------------------------------------------------------
    let max = tentativesMax + currentLevel;

    setEssais(max);
    setTentatives(max);

    let tirage = tirageAuSort(DechetsFromJson, max);

    setGameDechets([...tirage]);

    return () => clearTimeout(timeout);
  }, []);

  // Gestion du dépassement du temps
  function handleTimeOver() {
    setGameOverTime(true);
  }
  // Fin de partie décrétée par le joueur
  function handleGameAborted() {
    setGameAborted(true);
  }
  // Le joueur vient de mettre en pause
  function handleGameRestarted() {
    setPauseGame(false);
  }
  // Le joueur vient de mettre en pause
  function handleGamePaused() {
    setPauseGame(true);
  }

  return (
    <>
      <div className="game-container">
        <div className="game-header">
          <div className="game-chrono">
            <div className="game-chrono-cmd">
              <img src={cmdstop} onClick={() => handleGameAborted()} />
            </div>
            <div className="game-chrono-cmd-texte">
              {" "}
              {breakPoint.isMobile
                ? "Arrêter !"
                : " Clique ici pour arrêter le jeu"}
            </div>
          </div>

          <div className="game-score">
            {reponses.map((r, index) => (
              <div key={index} className="game-recompense">
                {r.statut ? <img src={etoile} /> : <img src={redcross} />}
              </div>
            ))}
          </div>
        </div>

        <div className="game-wastes">
          <Container
            id="verte"
            onDragOver={allowDrop}
            onDrop={drop}
            titre="verte"
            updateMascotte={props?.updateMascotte}
            borderColor="#248F5B"
            fillColor="#2DB473"
            description="le verre va dans la poubelle verte (facile à retenir). Il ne doit pas y avoir de bouchons ou couvercles sur les objets que tu jetes."
          />

          <Container
            id="jaune"
            onDragOver={allowDrop}
            onDrop={drop}
            titre="jaune"
            updateMascotte={props?.updateMascotte}
            borderColor="#bcc449"
            fillColor="#edc709"
            description="la poubelle jaune accepte le plastique, le carton et le papier (s’il n’y a pas de poubelle bleue). Tu peux laisser les bouchons des bouteilles plastiques. Encore mieux, vous pouvez les donner à une association caritative comme Bouchons d’amour."
          />

          <Container
            id="noire"
            titre="noire"
            onDragOver={allowDrop}
            onDrop={drop}
            updateMascotte={props?.updateMascotte}
            borderColor="#405369"
            fillColor="#1c1901"
            description="il s’agit de la poubelle “classique”. Elle sert à collecter le reste des déchets qui ne conviennent pas aux autres compartiments."
          />

          {currentLevel >= 2 && (
            <Container
              id="vetement"
              titre="vetement"
              onDragOver={allowDrop}
              onDrop={drop}
              updateMascotte={props?.updateMascotte}
              borderColor="rgb(30, 111, 156)"
              fillColor="rgb(210, 230, 200)"
              description="Tous les types de tissus recyclabes peuvent venir dans cette poubelle. "
            />
          )}
          {currentLevel > 2 && (
            <Container
              id="compost"
              titre="compost"
              onDragOver={allowDrop}
              onDrop={drop}
              updateMascotte={props?.updateMascotte}
              borderColor="rgb(80, 80, 80)"
              fillColor="rgb(200, 200, 200)"
              description="Cette poubelle accueille tous les déchets organiques. "
            />
          )}
        </div>

        <div className="game-titre">
          Allez, voici ta liste de déchets, attrape les et glisse les vers le
          bon container !{" "}
        </div>

        <div className="game-info">
          <div>
            {currentLevel === 1 && <img src={bronze} />}
            {currentLevel === 2 && <img src={silver} />}
            {currentLevel === 3 && <img src={gold} />}
          </div>
          <p>
            Il te reste <strong>{essais}</strong> tentative(s) !
          </p>
        </div>

        <div className="game-dechets-container">
          {gameDechets?.map((item, index) => (
            <div
              draggable
              onDragStart={drag}
              data-id={index}
              key={item?.name}
              className="game-dechet"
            >
              <div className="game-dechet-texte">{item?.name}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Game;
