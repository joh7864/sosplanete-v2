import React from "react";
import AudioPlayer from "react-h5-audio-player";
import chat from "../../assets/mascotte.svg";
import "../Stories.css";
import bg from "../story.png";

const ChapitreItem = ({ chap, onStart }) => {
  if (chap === undefined) return;

  // Démarrage de la lecture d'un chapitre
  function HandleStartChapter() {
    chap.isPlaying = true;
    chap.isReaded = false;
    onStart(chap.id);
  }
  // Pause de la lecture d'un chapitre
  function HandlePauseChapter() {
    chap.isPlaying = false;
  }
  // Replay d'un chapitre
  function HandleReplay() {
    chap.isReaded = false;
    chap.isPlaying = true;
  }
  // Fin de la lecture d'un chapitre
  function HandleClose() {
    chap.isReaded = true;
    chap.illustrationIndex = -1;
  }
  // Chapitre en cours de lecture
  function HandlePlayingChapter() {
    chap.isPlaying = true;
  }

  // Gestion de l'affichage des images

  // Reset de l'index illustration pour le chapitre en cours
  function HandleResetIllustrationIndex() {
    chap.illustrationIndex = -1;
    chap.isReaded = true;
  }

  // Changement d'image sur le chapitre en cours de lecture
  function HandleNextImage() {
    if (chap.isPlaying) {
      // remise à zéro en cas de dépassement
      if (chap.illustrationIndex + 1 <= chap.illustrations.length)
        chap.illustrationIndex = chap.illustrationIndex + 1;
      else chap.illustrationIndex = 0;
    }
  }

  function HandlePrevImage() {
    // On accepte le changement que si le chapitre est en cours de lecture
    if (chap.isPlaying) {
      // remise à zéro en cas de dépassement
      if (chap.illustrationIndex - 1 >= -1)
        chap.illustrationIndex = chap.illustrationIndex - 1;
      else chap.illustrationIndex = chap.illustrations.length - 1;
    }
  }

  // Récupération de l'image en cours
  function GetCurrentImage(chapitreId) {
    // Si on n'a pas commencé
    //if(lastPlayingChapter == -1)
    //    return bg

    // Si on n'a dépassé la dernière image
    if (chap.illustrationIndex === -1) return bg;

    // Si on n'a dépassé la dernière image
    if (chap.illustrationIndex > chap.illustrations.length - 1) {
      return bg;
    }

    // Récupération de l'index ilustration du chapitre demandé
    let index = chap.illustrationIndex;

    // on renvoie l'illustrattion
    return chap.illustrations[index];
  }

  return (
    <>
      <div
        className="chapitre"
        style={{
          background: "rgb(255, 255, 255, .35)",
          boxShadow:
            "rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px",
          borderRadius: 8,
          marginTop: 25,
          borderSize: 0,
        }}
      >
        <div
          className="chapitre-titre-container"
          style={{
            padding: 8,
            fontWeight: 700,
            fontSize: "1.1rem",
          }}
        >
          <p>{chap?.titre}</p>
          <div
            style={{
              fontWeight: 400,
              fontSize: "0.9rem",
              padding: 12,
            }}
          >
            {chap?.resume}
          </div>
        </div>

        {chap?.disponible && (
          <>
            <img
              src={GetCurrentImage()}
              className="chapitre-images"
              style={{
                cursor: chap.isPlaying ? "pointer" : "not-allowed",
              }}
              onClick={() => HandleNextImage()}
            />

            {chap.isPlaying && (
              <div className="chapitre-image-nav">
                <div
                  className="chapitre-image-nav-item"
                  onClick={() => HandlePrevImage()}
                >
                  &lt;
                </div>
                <div className="chapitre-quitter" onClick={() => HandleClose()}>
                  Terminer la lecture
                </div>
                <div
                  className="chapitre-image-nav-item"
                  onClick={() => HandleNextImage()}
                >
                  &gt;
                </div>
              </div>
            )}
          </>
        )}

        {chap.isReaded && (
          <>
            <div
              onClick={() => HandleReplay()}
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: 112,
                cursor: "pointer",
                width: "100%",
              }}
            >
              {chap.disponible ? (
                <>
                  <img src={chat} onClick={() => HandleReplay()} />
                  <p style={{ alignSelf: "center" }}>
                    Clique ici pour écouter ce chapitre
                  </p>
                </>
              ) : (
                <>
                  <p
                    style={{
                      alignSelf: "center",
                      padding: 12,
                    }}
                  >
                    Prochainement dans l'histoire ...
                  </p>
                </>
              )}
            </div>
          </>
        )}

        {chap.disponible && !chap.isReaded && (
          <>
            <AudioPlayer
              src={chap.content}
              onPlay={() => HandleStartChapter()}
              onPause={() => HandlePauseChapter()}
              onEnded={() => HandleResetIllustrationIndex()}
              onPlaying={() => HandlePlayingChapter()}
              showJumpControls={false}
              showSkipControls={false}
              volume={0.5}
              autoPlay={true}
              style={{
                background: "rgb(255, 255, 255, .85)",
                borderRadius: "0 0 8px 8px",
                marginTop: 25,
                borderSize: 0,
              }}
            />
          </>
        )}
      </div>
    </>
  );
};

export default ChapitreItem;
