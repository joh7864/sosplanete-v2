import React, { useEffect, useState } from "react";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import { NnauruAPI } from "../../api/nnauruAPI";
import chat from "../../assets/mascotte.svg";
import Mascotte from "../../components/Mascotte/Mascotte";
import { useAuth } from "../../utils/AuthContext";
import "../Stories.css";
import bg from "../story.png";
import Story from "./Story";
import VignettesChapitres from "./VignettesChapitres";

const SosStory = () => {
  const { user } = useAuth();

  const [chapitreIndisponibles, setChapitreIndisponible] = useState(false);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [chapitres, setChapitres] = useState([...Story.chapitres]);
  const [storyInProgress, setStoryInProgress] = useState(false);
  const [lastPlayingChapter, setLastPlayingChapter] = useState(-1);

  const [mascotteLastUpdate, setMascotteLastUpdate] = useState(Date.now());
  const [mascotteTitre, setMascotteTitre] = useState("");
  const [mascotteLigne1, setMascotteLigne1] = useState("");
  const [mascotteLigne2, setMascotteLigne2] = useState("");

  const [lastAvailableChapter, setLastAvailableChapter] = useState(0);
  const [selectedChapitre, setSelectedChapitre] = useState(0);
  const [showVignettes, setShowshowVignettes] = useState(true);

  // Mount du composant
  useEffect(() => {
    NnauruAPI.get(user, "/school", true).then((result) => {
      // FIX : Récupérer la donnée de l'API et mettre à la place du zéro
      setLastAvailableChapter(result?.numchapter);
    });
  }, []);

  // Libération des chapitres de l'histoire en fonction du paramétrage de l'application
  // Les chapitres sont déblocables par l'interface d'administration...
  useEffect(() => {
    let chapitreLibere = lastAvailableChapter;

    let listeChapitres = [...chapitres];

    listeChapitres.forEach((chap) => {
      if (chap.id < chapitreLibere) {
        chap.disponible = true;
      } else chap.disponible = false;
    });

    setChapitres(listeChapitres);
  }, [lastAvailableChapter]);

  // Démarrage de la lecture d'un chapitre
  function HandleStartChapter(chapitreId) {
    setChapterIndex(chapitreId);

    let listeChapitres = [...chapitres];

    listeChapitres.forEach((chap) => {
      if (chap.id === chapitreId) {
        chap.isPlaying = true;
        setStoryInProgress(true);

        if (lastPlayingChapter != chapitreId) setLastPlayingChapter(chapitreId);
      } else {
        if (chap.isPlaying) HandleClose(chap.id);
        chap.isPlaying = false;
      }
    });

    setChapitres(listeChapitres);
  }

  // Pause de la lecture d'un chapitre
  function HandlePauseChapter(chapitreId) {
    let listeChapitres = [...chapitres];

    listeChapitres.forEach((chap) => {
      if (chap.id === chapitreId) chap.isPlaying = false;
    });

    setChapitres(listeChapitres);
  }
  // Pause de la lecture d'un chapitre
  function HandleReplay(chapitreId) {
    let listeChapitres = [...chapitres];

    listeChapitres.forEach((chap) => {
      if (chap.id === chapitreId) chap.isReaded = false;
    });

    setChapitres(listeChapitres);
  }
  function HandleClose(chapitreId) {
    let listeChapitres = [...chapitres];

    listeChapitres.forEach((chap) => {
      if (chap.id === chapitreId) {
        chap.isReaded = true;
        chap.illustrationIndex = -1;
        setStoryInProgress(false);
      }
    });

    setChapitres(listeChapitres);
    setShowshowVignettes(true);
  }
  // Chapitre en cours de lecture
  function HandlePlayingChapter(chapitreId) {
    let listeChapitres = [...chapitres];

    listeChapitres.forEach((chap) => {
      if (chap.id === chapitreId) chap.isPlaying = true;
    });

    setChapitres(listeChapitres);
  }

  // Reset de l'index illustration pour le chapitre en cours
  function HandleResetIllustrationIndex(chapitreId) {
    let listeChapitres = [...chapitres];

    listeChapitres.forEach((chap) => {
      if (chap.id === chapitreId) {
        chap.illustrationIndex = -1;
        chap.isReaded = true;
      }
    });

    setChapitres(listeChapitres);
  }

  // Changement d'image sur le chapitre en cours de lecture
  function HandleNextImage(chapitreId) {
    let listeChapitres = [...chapitres];

    listeChapitres.forEach((chap) => {
      // On accepte le changement que si le chapitre est en cours de lecture
      if (chap.id === chapitreId && chap.isPlaying) {
        // remise à zéro en cas de dépassement
        if (chap.illustrationIndex + 1 <= chap.illustrations.length)
          chap.illustrationIndex = chap.illustrationIndex + 1;
        else chap.illustrationIndex = 0;
      }
    });

    setChapitres([...listeChapitres]);
  }

  function HandlePrevImage(chapitreId) {
    let listeChapitres = [...chapitres];

    listeChapitres.forEach((chap) => {
      // On accepte le changement que si le chapitre est en cours de lecture
      if (chap.id === chapitreId && chap.isPlaying) {
        // remise à zéro en cas de dépassement
        if (chap.illustrationIndex - 1 >= -1)
          chap.illustrationIndex = chap.illustrationIndex - 1;
        else chap.illustrationIndex = chap.illustrations.length - 1;
      }
    });

    setChapitres([...listeChapitres]);
  }

  // Récupération de l'image en cours
  function GetCurrentImage(chapitreId) {
    // Si on n'a pas commencé
    //if(lastPlayingChapter == -1)
    //    return bg

    // Si on n'a dépassé la dernière image
    if (chapitres[chapitreId].illustrationIndex === -1) return bg;

    // Si on n'a dépassé la dernière image
    if (
      chapitres[chapitreId].illustrationIndex >
      chapitres[chapitreId].illustrations.length - 1
    ) {
      return bg;
    }

    // Récupération de l'index ilustration du chapitre demandé
    let index = chapitres[chapitreId].illustrationIndex;

    // on renvoie l'illustrattion
    return chapitres[chapitreId].illustrations[index];
  }

  // Petit message d'erreur si aucun chapitre n'est disponible !
  // on verra si on garde...risque de flick !
  if (lastAvailableChapter == 0)
    return (
      <>
        <div className="story-page-error">
          <div className="game-narrator">
            <img src={chat} />
          </div>
          <h1 className="titre" style={{ maxWidth: 600 }}>
            {
              "C'est ici que tu pourras écouter et voir l'histoire de SOS PLANÈTE quand vous aurez tous ensemble marqué suffisamment de points pour débloquer le premier chapitre"
            }
          </h1>
        </div>
      </>
    );

  function handleSelectedChapitre(id) {
    setSelectedChapitre(id);
    HandleReplay(Story.chapitres[id].id);
    setShowshowVignettes(false);
  }

  return (
    <>
      <Mascotte
        titre="Audio"
        ligne1="L'histoire comporte 12 chapitres"
        ligne2="Lorsqu'elle commence,"
      >
        <p>tu pourras faire défiler les images</p>
        <p>en cliquant sur l'image ou sur</p>
        <p>les boutons de navigation</p>
        <div className="chapitre-image-nav p-10">
          <div className="chapitre-image-nav-item">&lt;</div>
          <div className="chapitre-image-nav-item">&gt;</div>
        </div>
        <p>Le signal de changement d'image</p>
        <p>sera donné par le tintement</p>
        <p>de la clochette...</p>
      </Mascotte>
      <div className="flex w-full justify-center items-center mb-40">
        <div className="flex flex-col justify-center items-center mt-5 gap-5">
          {/** Entete */}
          <div className="text-4xl font-bold">{Story.titre}</div>

          {showVignettes && (
            <VignettesChapitres selectedChapitre={handleSelectedChapitre} />
          )}

          {/** Chapitre */}
          {!showVignettes && (
            <div
              id={Story.chapitres[selectedChapitre].titre}
              className="max-w-[95%] md:w-[420px] flex flex-col justify-center items-center rounded-lg bg-cyan-200 shadow-2xl bg-opacity-35 "
            >
              <p className="text-lg font-semibold">
                {Story.chapitres[selectedChapitre].titre}
              </p>
              <p>{storyInProgress}</p>
              <div className="text-center">
                {Story.chapitres[selectedChapitre].resume}
              </div>
              <div className="flex flex-col justify-center items-center">
                <img
                  src={GetCurrentImage(Story.chapitres[selectedChapitre].id)}
                  className="w-full"
                  style={{
                    cursor: Story.chapitres[selectedChapitre].isPlaying
                      ? "pointer"
                      : "not-allowed",
                  }}
                  onClick={() =>
                    HandleNextImage(Story.chapitres[selectedChapitre].id)
                  }
                />
                {Story.chapitres[selectedChapitre].disponible && (
                  <>
                    {Story.chapitres[selectedChapitre].isPlaying && (
                      <div className="w-full flex justify-between px-4">
                        <div
                          className="chapitre-image-nav-item"
                          onClick={() =>
                            HandlePrevImage(
                              Story.chapitres[selectedChapitre].id
                            )
                          }
                        >
                          &lt;
                        </div>
                        <div
                          className="p-2 text-center bg-slate-900 rounded-2xl min-w-[160px] text-slate-200 cursor-pointer"
                          onClick={() =>
                            HandleClose(Story.chapitres[selectedChapitre].id)
                          }
                        >
                          Terminer la lecture
                        </div>
                        <div
                          className="chapitre-image-nav-item"
                          onClick={() =>
                            HandleNextImage(
                              Story.chapitres[selectedChapitre].id
                            )
                          }
                        >
                          &gt;
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/** Replay */}
              {Story.chapitres[selectedChapitre].isReaded && (
                <>
                  <div
                    onClick={() =>
                      HandleReplay(Story.chapitres[selectedChapitre].id)
                    }
                    className="flex justify-center items-center cursor-pointer w-full"
                  >
                    {Story.chapitres[selectedChapitre].disponible && (
                      <>
                        <img
                          src={chat}
                          onClick={() =>
                            HandleReplay(Story.chapitres[selectedChapitre].id)
                          }
                        />
                        <p style={{ alignSelf: "center" }}>
                          Clique ici pour écouter ce chapitre
                        </p>
                      </>
                    )}
                  </div>
                </>
              )}
              {/** Player audio */}
              {Story.chapitres[selectedChapitre].disponible &&
                !Story.chapitres[selectedChapitre].isReaded && (
                  <>
                    <AudioPlayer
                      src={Story.chapitres[selectedChapitre].content}
                      onPlay={() =>
                        HandleStartChapter(Story.chapitres[selectedChapitre].id)
                      }
                      onPause={() =>
                        HandlePauseChapter(Story.chapitres[selectedChapitre].id)
                      }
                      onEnded={() =>
                        HandleResetIllustrationIndex(
                          Story.chapitres[selectedChapitre].id
                        )
                      }
                      onPlaying={() =>
                        HandlePlayingChapter(
                          Story.chapitres[selectedChapitre].id
                        )
                      }
                      showJumpControls={false}
                      showSkipControls={false}
                      volume={0.5}
                      autoPlay={true}
                      className="bg-slate-100 bg-opacity-85 rounded-b-lg mt-2"
                    />
                  </>
                )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SosStory;
