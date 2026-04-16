import React from "react";
import SlideIn from "../../components/animations/Slides/SlideIn/SlideIn";
import ZoomIn from "../../components/animations/ZoomIn/ZoomIn";
import appcfg from "../../config.js";
import useBreakpoints from "../../hooks/useBreakpoints";
import "./ChildCard.css";

//------------------------------------------------
// Composant représentant le panneau de l'enfant
//------------------------------------------------
const ChildCard = ({ pseudo, infos, tree, semaineCount, totalCount }) => {
  const breakPoint = useBreakpoints();

  function islittleScreen() {
    try {
      var result = breakPoint.isMobile;
      return result;
    } catch {
      false;
    }

    return false;
  }

  return (
    <div className="child-card-container">
      {/* Affichage des informations concernant l'enfant */}
      <div className="user-container">
        {/* Avatar et icone de l'équipe*/}
        <SlideIn speed="3s">
          <ZoomIn>
            <div className="icon-card-content">
              <img
                src={appcfg.imgRootUrl + infos?.icon}
                className="w-full h-full"
              />
            </div>
          </ZoomIn>
        </SlideIn>

        {/* pseudo */}
        <div className="user-card-content">
          <div className="user-infos">{pseudo}</div>
          {/* il faudrait une Div permettant d'afficher le nom de sa classe/equipe  */}
          <div className="user-team">{infos?.name}</div>
        </div>
      </div>

      {/* Affichage du panneau résultat */}
      <div className="stats-container">
        {/* Total des actions de la semaine pour l'enfant */}
        <div className="w-full flex justify-between items-center">
          <div className="icon">
            <img src={tree} />
          </div>
          <div className="text w-full">
            <div className="text-sm">Cette semaine</div>
            <div className="md:text-xl font-extrabold">
              {semaineCount} actions
            </div>
          </div>
        </div>

        {/* Total des actions de l'enfant depuis le début du jeu */}
        <div className="child-card-content">
          <div className="icon">
            <img src={tree} />
          </div>
          <div className="text">
            <div className="text-sm">
              {!islittleScreen() ? (
                <span>Depuis le début du jeu</span>
              ) : (
                <span>Depuis le début</span>
              )}
            </div>
            <div className="md:text-xl font-extrabold">
              {totalCount} actions
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildCard;
