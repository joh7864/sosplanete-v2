import React, { useEffect, useState } from "react";
import SlideIn from "../../components/animations/Slides/SlideIn/SlideIn";
import ZoomIn from "../../components/animations/ZoomIn/ZoomIn";
import appcfg from "../../config.js";
import useBreakpoints from "../../hooks/useBreakpoints";
import { useGame } from "../GameContext";
import etoile from "../images/etoile.svg";
import redcross from "../images/redcross.svg";
import cmdstop from "../images/stop.svg";

const QuizzQuestion = ({ quizz, index, categories, next }) => {
  const [propositions, setPropositions] = useState([]);
  const [reponses, setReponses] = useState([]);
  const breakPoint = useBreakpoints();
  const { setGameAborted, setResultats } = useGame();

  useEffect(() => {
    //--------------------------------------------------------
    // ATTENTION TIRAGE AU SORT des déchets
    //--------------------------------------------------------

    console.log("categories", categories);
    let max = 4;
    let tirage = tirageAuSort(categories, max);

    setPropositions([...tirage]);
  }, [index]);

  useEffect(() => {
    // Vérification de bon aloua...
    if (quizz === undefined) return;
    //--------------------------------------------------------
    // Vérification que notre catégorie fait bien partie des propositions retenues
    //--------------------------------------------------------
    let exist = propositions.filter(
      (p) => p.name === quizz?.question?.category.name
    );
    if (exist?.length == 0) {
      let update = [...propositions];
      const index = getRandomIndex(update.length);
      console.log("on va remplacer l'index", index);
      console.log("quizz", quizz);

      update[index] = categories.filter(
        (x) => x.name === quizz?.question?.category.name
      )[0];
      setPropositions([...update]);
    }
  }, [propositions]);

  //-----------------------------------------
  // Fonction pour obtenir un index aléatoire
  //-----------------------------------------
  function getRandomIndex(max) {
    return Math.floor(Math.random() * max);
  }
  //-----------------------------------------
  // Fonction de tirage au sort sans doublons
  //-----------------------------------------
  function tirageAuSort(origine, nombreDeTirages) {
    // Copie du tableau original pour ne pas le modifier directement
    let copie = [...origine];

    // Tableau résultat
    const resultat = [];

    // Tirage au sort sans doublons
    for (let i = 0; i < nombreDeTirages; i++) {
      const index = getRandomIndex(copie.length);
      const item = copie.splice(index, 1)[0];
      resultat.push(item);
    }

    return resultat;
  }

  // Gestion de la réponse
  function handleNextQuestion(propal) {
    // on note la réponse
    let r = [...reponses];

    r.push({
      statut: propal.name === quizz?.question?.category.name ? true : false,
      proposition: propal,
      reponse: quizz?.question?.category.name,
    });
    setReponses(r);
    setResultats([...r]);
    // Question suivante
    next();
  }
  function handleGameAborted() {
    setGameAborted(true);
  }

  return (
    <div className="quizz-panel-container">
      <div className="quizz-header">
        <div className="quizz-header-command">
          <div className="quizz-header-command2">
            <img src={cmdstop} onClick={() => handleGameAborted()} />
            <p className="">
              {breakPoint.isMobile
                ? "Arrêter !"
                : " Clique ici pour arrêter le jeu"}
            </p>
          </div>

          <div className="quizz-header-reponses">
            {reponses.map((r, index) => (
              <div key={index} className="game-recompense">
                {r.statut ? <img src={etoile} /> : <img src={redcross} />}
              </div>
            ))}
          </div>
        </div>
      </div>
      <ZoomIn>
        <div className="quizz-titre-container">
          <div className="quizz-image">
            <img src="/image/mascotte.svg" />
          </div>
          <p className="quizz-titre">
            Question n°{index}{" "}
            <span style={{ fontSize: "0.8rem" }}>
              {/*quizz?.question?.category.name*/}
            </span>
          </p>
        </div>
      </ZoomIn>

      <SlideIn>
        <div className="quizz-question-container">
          <div className="vignette-action">
            <div className="vignette-action-content">
              <img src={appcfg.imgRootUrl + quizz?.question?.icon} />
            </div>
          </div>
          <p className="quizz-question">{quizz?.question?.name}</p>
        </div>
      </SlideIn>

      <p className="quizz-consigne">
        Tu as le choix entre les {propositions.length} catégories ci-dessous,
        choisi la bonne !
      </p>

      <div className="choix-container">
        {propositions?.map((propal, index) => (
          <div
            className="choix"
            key={index}
            onClick={() => handleNextQuestion(propal)}
          >
            <div className="choix-categorie-image">
              <img src={appcfg.imgRootUrl + propal?.icon} />
            </div>
            <p className="choix-categorie-name">{propal?.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuizzQuestion;
