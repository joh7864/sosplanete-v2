import React from "react";
//import nextArrow from '../images/next-arrow.svg'
import Confetti from "react-confetti";
import useWindowSize from "react-use/lib/useWindowSize";
import chat from "../../assets/mascotte.svg";
import SlideIn from "../../components/animations/Slides/SlideIn/SlideIn";
import ZoomIn from "../../components/animations/ZoomIn/ZoomIn";
import { useGame } from "../GameContext";
import Kids from "../components/Kids";

function BatailleResultats({ ...props }) {
  const {
    resultats,
    bonnesReponses,
    tentativesMax,
    gameAborted,
    setGameOver,
    setStartGame,
    gameOverTime,
    currentLevel,
  } = useGame();

  const { width, height } = useWindowSize();

  const styleTextGain = {
    textDecoration: "none",
    color: "green",
    fontWeight: 700,
  };
  const styleTextPerte = {
    textDecoration: "line-through",
    color: "red",
    fontStyle: "italic",
    fontWeight: 300,
  };

  const br = resultats?.filter((r) => r.statut).length;
  const total = resultats?.length;
  const percent = br / total;

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: "30px",
          minHeight: "100%",
          width: "100%",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          marginBottom: "200px",
        }}
      >
        {/* Affichage des confettis si toutes les actions ont été réalisées */}
        {gameAborted == false && percent >= 0.6 && (
          <Confetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={1000 * currentLevel * br}
            style={{ background: "transparent" }}
          />
        )}
        <ZoomIn>
          <div className="game-narrator">
            <img src={chat} />
          </div>
        </ZoomIn>

        <ZoomIn>
          <div className="game-text-result">
            {gameOverTime && (
              <>
                <strong>Oops ! </strong>le temps limite a été dépassé, dommage !
                <br></br>
              </>
            )}
            {gameAborted && (
              <>
                <strong>Tu as abandonné ! </strong>Ce n'est pas grave, tu
                essaieras une autre fois !<br></br>
              </>
            )}

            {resultats.filter((r) => r.statut == false).length == 0 &&
            !gameAborted ? (
              <>
                Fantastique ! tu n'as que des bonnes réponses.{" "}
                <strong>Tu es un as</strong> dans la connaissance des actions !
              </>
            ) : (
              <>
                {!gameAborted && (
                  <>
                    Tu as obtenu{" "}
                    <strong>{resultats.filter((r) => r.statut).length}</strong>{" "}
                    bonne(s) réponse(s) sur {total} !
                  </>
                )}
              </>
            )}
          </div>
        </ZoomIn>

        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap",
            textAlign: "center",
          }}
        ></div>
        <Kids />
        <SlideIn>
          <div className="game-new" onClick={() => setStartGame(true)}>
            Si tu veux <strong>rejouer</strong> clique ici !
          </div>
        </SlideIn>
      </div>
    </>
  );
}

export default BatailleResultats;
