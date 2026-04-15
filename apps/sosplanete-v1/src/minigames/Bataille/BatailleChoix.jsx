import { useEffect, useState } from "react";
import ZoomIn from "../../components/animations/ZoomIn/ZoomIn";
import useBreakpoints from "../../hooks/useBreakpoints";
import { t } from "../../utils/Langage";
import { useGame } from "../GameContext";
import etoile from "../images/etoile.svg";
import redcross from "../images/redcross.svg";
import cmdstop from "../images/stop.svg";
import "./Bataille.css";
import textes from "./Bataille.json";
import BatailleCard from "./BatailleCard";

const BatailleChoix = ({
  bataille,
  index,
  categories,
  next,
  updateMascotte,
}) => {
  const [reponses, setReponses] = useState([]);
  const breakPoint = useBreakpoints();
  const { setGameAborted, setResultats } = useGame();
  const [onChoixMarked, setOnChoixMarked] = useState(false);
  const [selectedAction, setSelectedAction] = useState({});
  const [message, setMessage] = useState("");

  const dialog = "petits";

  useEffect(() => {
    //--------------------------------------------------------
    // ATTENTION TIRAGE AU SORT des déchets
    //--------------------------------------------------------
  }, [index]);

  useEffect(() => {
    //--------------------------------------------------------
    // Initialisation
    //--------------------------------------------------------
    setMessage(t(textes, dialog, "question"));
  }, []);

  useEffect(() => {
    // Vérification de bon aloua...
    if (bataille === undefined) return;
    //--------------------------------------------------------
    // Changement de bataille
    //--------------------------------------------------------
    setOnChoixMarked(false);
  }, [bataille]);

  //-----------------------------------------
  // Fonction pour obtenir un index aléatoire
  //-----------------------------------------
  function getRandomIndex(max) {
    return Math.floor(Math.random() * max);
  }
  //-----------------------------------------
  // Fonction pour obtenir un index aléatoire
  //-----------------------------------------
  function getGoodResult(action) {
    let result = {};

    if (bataille.a1.id != action.id) {
      result = parseInt(bataille?.a1?.metadata) <= parseInt(action?.metadata);
      if (result) return action;
      else return bataille?.a1;
    } else {
      result = parseInt(bataille?.a2?.metadata) <= parseInt(action?.metadata);
      if (result) return action;
      else return bataille?.a2;
    }
  }

  //---------------------------------
  // Vérification du résultat
  //---------------------------------

  function checkResult(action) {
    let result = false;
    let diff = 0;

    if (bataille.a1.id != action.id) {
      result = parseInt(bataille?.a1?.metadata) <= parseInt(action?.metadata);
      diff = parseInt(bataille?.a1?.metadata) - parseInt(action?.metadata);
    } else {
      result = parseInt(bataille?.a2?.metadata) <= parseInt(action?.metadata);
      diff = parseInt(bataille?.a2?.metadata) - parseInt(action?.metadata);
    }

    if (diff == 0) setMessage(t(textes, dialog, "egalite"));

    if (diff < 0) setMessage(t(textes, dialog, "gagne"));

    if (diff > 0) setMessage(t(textes, dialog, "perdu"));

    return result;
  }

  // Gestion de la réponse
  function handleChoice(action) {
    setOnChoixMarked(true);
    setSelectedAction(action);

    let r = [...reponses];

    // Stockage du résultat
    r.push({
      statut: checkResult(action),
      best: getGoodResult(action),
      reponse: action,
    });

    setReponses(r);
    setResultats([...r]);
  }
  // Bataille suivante
  // eslint-disable-next-line no-unused-vars
  function handleNextBataille(action) {
    // on note la réponse

    // Bataille suivante on réinitialise
    setSelectedAction({});
    setMessage(t(textes, dialog, "question"));

    next();
  }
  function handleGameAborted() {
    setGameAborted(true);
  }

  return (
    <div className="bataille-panel-container">
      <div className="quizz-header">
        <div className="quizz-header-command">
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
      <ZoomIn>
        <div className="quizz-titre-container">
          <div className="quizz-image">
            <img src="/image/mascotte.svg" />
          </div>
          <p className="bataille-titre">
            {/**<SpeechText textToSpeech={message} autoplay={true} /> */}

            <span style={{ fontSize: "0.8rem" }}>
              {/*quizz?.question?.category.name*/}
            </span>
          </p>
        </div>
      </ZoomIn>
      {/*JSON.stringify(bataille?.a1)*/}
      <div className="bataille-actions-container">
        <BatailleCard
          action={bataille?.a1}
          perspective="rotateX(5deg) rotateY(35deg)"
          onChoosed={handleChoice}
          choice={onChoixMarked}
          selectedAction={selectedAction?.id}
          updateMascotte={updateMascotte}
        />
        <BatailleCard
          action={bataille?.a2}
          perspective="rotateX(5deg) rotateY(-35deg)"
          onChoosed={handleChoice}
          choice={onChoixMarked}
          selectedAction={selectedAction?.id}
          updateMascotte={updateMascotte}
        />
      </div>
      {onChoixMarked && (
        <div
          className="bataille-next-container"
          onClick={() => handleNextBataille()}
        >
          <p>Bataille suivante</p>
          <p className="bataille-next">{">"}</p>
        </div>
      )}
    </div>
  );
};

export default BatailleChoix;
