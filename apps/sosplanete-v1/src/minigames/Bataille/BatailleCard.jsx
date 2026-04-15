import React from "react";
import appcfg from "../../config.json";
import Star from "../images/etoile.svg";

const BatailleCard = ({
  action,
  onChoosed,
  choice,
  selectedAction,
  perspective,
  updateMascotte,
}) => {
  const isSelectedAction = action?.id == selectedAction || !choice;

  // -----------------------------------------------------
  // Calcul du nombre d'étoile à afficher
  // -----------------------------------------------------
  const computeStars = (nbStars, img) => {
    let content = [];
    for (let i = 0; i < nbStars; i++) {
      content.push(
        <div key={i} style={{ maxWidth: 20 }}>
          <img src={img} />
        </div>
      );
    }
    return content;
  };

  // -----------------------------------------------------
  // Gestion du choix
  // Si la carte n'a pas été déjà choisie, on notifie au parent
  // -----------------------------------------------------
  function handleChoice() {
    if (!choice) onChoosed(action);
    updateMascotte("", "", "");
  }
  function handleUpdateMascotte(e, action) {
    e.stopPropagation();
    updateMascotte("En savoir +", action?.description, "");
  }
  // -----------------------------------------------------
  // Affichage des infos de la carte
  // -----------------------------------------------------

  return (
    <div
      onClick={(e) => handleChoice(e, action)}
      className="bataille-action-container"
      style={{
        backgroundColor: isSelectedAction
          ? action?.category.color
          : "rgb(200, 200, 200, .5)",
        width: "100%",
      }}
    >
      <div className="bataille-card-images">
        <div
          onClick={(e) => handleUpdateMascotte(e, action)}
          className="bataille-card-image-info-container"
        >
          <p style={{ fontWeight: 950, fontSize: "1.4rem" }}>!</p>
        </div>

        <img
          src={appcfg.imgRootUrl + action?.icon}
          className="bataille-card-image-action"
        />
        <div className="bataille-card-image-category-container">
          <img
            src={appcfg.imgRootUrl + action?.category.icon}
            className="bataille-card-image-category"
          />
        </div>
      </div>

      <p className="bataille-actions-titre">{action?.name}</p>
      {choice && (
        <div className="action-footer-info-container-star">
          {computeStars(
            action?.metadata ? parseInt(action?.metadata) : 0,
            Star
          )}
        </div>
      )}
    </div>
  );
};

export default BatailleCard;
