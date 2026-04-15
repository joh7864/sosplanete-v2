import React, { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { useNavigate, useParams } from "react-router-dom";
import useWindowSize from "react-use/lib/useWindowSize";
import { NnauruAPI } from "../../api/nnauruAPI";
import icon from "../../assets/home.svg";
import Mascotte from "../../components/Mascotte/Mascotte";
import useSwipe from "../../hooks/useSwipe";
import { useAuth } from "../../utils/AuthContext";
import VignetteAction from "./Action";
import CategoriesNavbar from "./CategoriesNavbar";

import "./Actions.css";

const Actions = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [actions, setActions] = useState([]);
  const { user, childId, currentWeek } = useAuth();
  const [currentCategorieId, setCurrentCategorieId] = useState(id);
  const [currentCategorieName, setCurrentCategorieName] = useState("");
  const [currentCategorieIcon, setCurrentCategorieIcon] = useState({});
  const [title, setTitle] = useState("Mes actions");
  const [actionsRealisees, setActionsRealisees] = useState(0);
  const [totalActions, setTotalActions] = useState(0);
  const [categories, setCategories] = useState([]);
  const [actionRealiseChanged, setActionRealiseChanged] = useState(0);
  const [showNavigation, setShowNavigation] = useState(false);

  const { width, height } = useWindowSize();
  const [bingo, setBingo] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [mascotteTitre, setMascotteTitre] = useState("");
  const [mascotteLigne1, setMascotteLigne1] = useState("");
  const [mascotteLigne2, setMascotteLigne2] = useState("");
  const [mascotteState, setMascotteState] = useState(
    localStorage.getItem("mascotte") === "on" ? true : false
  );

  // Chargement de la configuration des mini-jeux
  const gc = JSON.parse(localStorage.getItem("gamesConfig"));

  // Mise en place du swipe sur les catgories
  useSwipe(
    () => {
      var i = categories.findIndex((c) => {
        return c.id === currentCategorieId;
      });
      var index = i + 1 >= categories.length ? 0 : i + 1;
      //ChangeCategorie(categories[index]);
    },
    () => {
      var i = categories.findIndex((c) => {
        return c.id === currentCategorieId;
      });
      var index = i - 1 < 0 ? categories.length - 1 : i - 1;
      //ChangeCategorie(categories[index]);
    }
  );

  function handleMascotteStateChanged(newState) {
    setMascotteState(newState);
  }

  // Mise à jour des textes de la mascotte
  const handleUpdateMascotte = (titre, ligne1, ligne2) => {
    setMascotteTitre(titre);
    setMascotteLigne1(ligne1);
    setMascotteLigne2(ligne2);
  };

  // Changement de catégorie
  function ChangeCategorie(newCategorie) {
    setCurrentCategorieId(newCategorie?.id);
    setCurrentCategorieName(newCategorie?.name);
    setTitle(newCategorie?.name);
    setCurrentCategorieIcon(newCategorie?.icon);
  }

  // Màj. de catégorie
  function UpdateCategorie() {
    var result = categories.filter((c) => c.id == currentCategorieId);
    setCurrentCategorieName(result[0]?.name);
    setTitle(result[0]?.name);
    setCurrentCategorieIcon(result[0]?.icon);
  }

  function VignetteUpdated(lastActionIdChanged) {
    // Astuce pour déclencher la mise à jour
    setActionRealiseChanged(Math.random());
  }

  // Notification de fermeture de la bulle de la mascotte
  function handleMascotteClosed() {
    setMascotteTitre("");
    setMascotteLigne1("");
    setMascotteLigne2("");
  }

  function handleBingo() {
    if (actionsRealisees == totalActions) {
      setBingo(true);
    } else {
      setBingo(false);
      handleMascotteClosed();
    }
  }

  // Evènement de mount du composant (Appel API)
  useEffect(() => {
    // Chargement de la liste des catégorie (1 seule fois)
    NnauruAPI.get(user, "/categories", true).then((items) => {
      setCategories(items);
      setShowNavigation(true);
    });
  }, []);

  // Calcul des actions réalisées dans la semaine par l'enfant (Appelé lorsaue la liste des actions change)
  useEffect(() => {
    if (currentWeek?.id === null || childId == null) return;

    NnauruAPI.get(
      user,
      "/children/" + childId + "/actionsdone?week_id=" + currentWeek?.id,
      true
    ).then((items) => {
      setActionsRealisees(
        items.filter((done) => done.category_id == currentCategorieId).length
      );
      setLoaded(true);
      return () => {};
    });

    UpdateCategorie();
  }, [actions, totalActions, actionRealiseChanged]);

  // Chargement de la liste des actions de la catégorie courante (Appelé quand la catégorie courante change)
  useEffect(() => {
    // Clear des actions IMPORTANT!!!
    setActions([]);

    NnauruAPI.get(
      user,
      "/categories/" + currentCategorieId + "/actions",
      true
    ).then((items) => {
      setActions(items);
      setTotalActions(items?.length);
    });
  }, [currentCategorieId]);

  // Chargement des actions réalisées
  useEffect(() => {
    handleBingo();

    if (actionsRealisees == totalActions) {
      setMascotteTitre("Formidable");
      setMascotteLigne1(
        "Tu as réalisé toutes les actions prévues, félicitations !"
      );
      setMascotteLigne2("");
    }

    if (actionsRealisees == 0 && totalActions > 0) {
      setMascotteTitre("Heureux de te voir");
      setMascotteLigne1(
        "C'est le début, j'ai hâte de le découvrir tes actions de la période !"
      );
      setMascotteLigne2("");
    }
  }, [actions, totalActions, actionsRealisees]);

  // --------------------------------
  // Render : Rendu HTML du composant
  // --------------------------------
  return (
    <>
      {/* Le header n'est que disponible lors du responsive Tablette/Mobile */}
      <div className="top-menu-container">
        <div className="top-menu-icon">
          <img src={icon} onClick={() => navigate("/")} />
        </div>

        <div className="top-menu-title">Actions</div>
      </div>

      {/* Affichage des confettis si toutes les actions ont été réalisées */}
      {loaded && bingo && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={4000}
          style={{ background: "transparent" }}
        />
      )}

      <Mascotte
        titre={mascotteTitre}
        ligne1={mascotteLigne1}
        ligne2={mascotteLigne2}
        onClosed={handleMascotteClosed}
        onStateChanged={handleMascotteStateChanged}
      ></Mascotte>

      <div className="actions-page-container">
        <div>
          {/* Barre de navigation entre les catégories */}
          {showNavigation && (
            <CategoriesNavbar
              categories={categories}
              currentActionsRealisees={actionsRealisees}
              currentCategorie={currentCategorieId}
              changeCategorie={setCurrentCategorieId}
              currentTotalActions={totalActions}
            />
          )}
        </div>

        {/* Affichage de la liste des actions et de la mascotte en fonction du nombre d'actions traitées */}

        <div className="bg-support">
          {actions.length > 0 ? (
            <>
              <div className="vignettes-actions">
                {actions.map((item) => (
                  <div key={item.id}>
                    <VignetteAction
                      categorie={item.category_name}
                      action={item}
                      currentWeek={currentWeek}
                      actionId={item.id}
                      childId={childId}
                      user={user}
                      categorieId={currentCategorieId}
                      onChangeEvent={VignetteUpdated}
                      onRefreshMascotte={handleUpdateMascotte}
                      onMascotteStateChanged={mascotteState}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <></>
          )}
        </div>
      </div>
    </>
  );
};

export default Actions;
