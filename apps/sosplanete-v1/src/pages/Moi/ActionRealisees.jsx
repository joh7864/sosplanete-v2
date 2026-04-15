import React, { useEffect, useState } from "react";
import appcfg from "../../config.json";
import "./ActionRealisees.css";

//----------------------------------------------------------
// Composant d'affichage de la liste des actions réalisées sous forme de vignette
//----------------------------------------------------------
function ActionRealisees({ actionsRealisees, refActions, updateMascotte }) {
  const [actionSelected, setActionSelected] = useState({});

  // Selection d'une action
  function handleActionSelected(itemSelected) {
    //setActionSelected(action);
    let desc = "";

    var a = refActions.filter(
      (action) => action.id === itemSelected?.action_id
    );
    if (a !== undefined && a.length > 0) {
      desc = a[0].description;
    }

    updateMascotte(itemSelected?.action_name, desc, "");
  }

  //------------------------------------
  // Récupération de l'icone de l'action, dans le référentiel des actions
  //------------------------------------
  const getIcon = (searchId) => {
    return refActions.filter((ra) => ra.id == searchId)[0].icon;
  };

  //------------------------------------
  // Evènement de MOUNT du composant
  //------------------------------------
  useEffect(() => {
    let desc = "";

    var a = refActions.filter(
      (action) => action.id === actionSelected?.action_id
    );
    if (a !== undefined && a.length > 0) {
      desc = a[0].description;
    }

    updateMascotte(actionSelected?.action_name, desc, "");
  }, [actionSelected]);

  //------------------------------------
  // Evènement de MOUNT du composant
  //------------------------------------
  useEffect(() => {}, []);

  return (
    <>
      <ul className="vignettes-action-container">
        {actionsRealisees.map((action) => (
          <li
            key={action.action_id}
            className="vignette-action"
            onClick={() => handleActionSelected(action)}
          >
            {/* style={{backgroundImage:`url(${fondVignette})`, backgroundSize: `100% 100%`}} J'ai retiré cette élément car je ne voyais pas l'utilité et cela affecté mon css */}
            <div
              className="vignette-action-content"
              onClick={() => handleActionSelected(action)}
            >
              <img
                src={appcfg.imgRootUrl + getIcon(action.action_id)}
                onClick={() => handleActionSelected(action)}
              />
            </div>
            <div
              className="vignette-action-content-title"
              onClick={() => handleActionSelected(action)}
            >
              {action.action_name}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

export default ActionRealisees;
