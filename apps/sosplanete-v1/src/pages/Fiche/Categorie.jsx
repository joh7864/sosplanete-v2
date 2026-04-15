import React, { useEffect, useState } from "react";
import { CircularProgressbarWithChildren } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { NnauruAPI } from "../../api/nnauruAPI";
import checked from "../../assets/checked.svg";
import appcfg from "../../config.json";
import { useAuth } from "../../utils/AuthContext";
import "./Categories.css";

// -----------------------------------------
// Composant pour l'affichage d'une catégorie de la page Fiche
// -----------------------------------------
function Categorie({ categorie, actionsChildDones }) {
  // Variables d'état pour le fonctionnement du composant
  const [categorieCount, setCategorieCount] = useState(0);
  const [donesCount, setDonesCount] = useState(0);
  const [dones, setDones] = useState([]);
  const { user, childId, currentWeek } = useAuth();

  useEffect(() => {
    if (currentWeek !== undefined) {
      if (currentWeek?.id === null || childId == null) return;

      // Chargement des actions "done" de l'enfant pour la cattégorie (Appel de l'API)
      NnauruAPI.get(
        user,
        "/children/" + childId + "/actionsdone?week_id=" + currentWeek?.id,
        true
      ).then((dones) => {
        setDonesCount(
          dones?.filter((actionDone) => actionDone.category_id == categorie?.id)
            .length
        );
      });
    }
  }, [categorieCount]);

  // -----------------------------------
  // Evènement de Mount du composant
  // -----------------------------------
  useEffect(() => {
    // Chargement des actions de la catégorie (Appel de l'API)
    NnauruAPI.get(user, "/categories/" + categorie.id + "/actions", true).then(
      (items) => {
        setCategorieCount(items.length);
      }
    );
  }, []);

  // -----------------------------------
  // Render : Rendu HTML du composant
  // -----------------------------------
  return (
    <>
      <div className="categorie-container">
        <div className="categorie-image">
          <img src={appcfg.imgRootUrl + categorie?.icon} />
        </div>

        <div className="categorie-title">
          <div className="categorie-name">{categorie?.name}</div>

          {/* AFFICHAGE DE LA COCHE DE VALIDATION si toutes les actions sont validées*/}
          {donesCount == categorieCount && categorieCount > 0 ? (
            <div className="categorie-validated">
              <img src={checked} />
            </div>
          ) : (
            <div className="categorie-count">
              <CircularProgressbarWithChildren
                value={donesCount}
                maxValue={categorieCount}
              >
                <strong>{donesCount}</strong>
              </CircularProgressbarWithChildren>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Categorie;
