import React, { useEffect, useState } from "react";
import { NnauruAPI } from "../../api/nnauruAPI";
import Exclamation from "../../assets/exclamation.svg";
import ToggleSwitch from "../../components/Toggles/ToggleSwitch";
import appcfg from "../../config.js";
import Star from "../../minigames/images/etoile.svg";
import { useAuth } from "../../utils/AuthContext";
import "./Action.css";

// Le composant Vignette avec ces propriété
// id : l'id de la catégorie
// name : le nom de la catégorie
// img : le chmin vers l'image de la catégorie
// count : le nombre d'actions réalisées de la catégorie
function VignetteAction({
  actionId,
  currentWeek,
  action,
  categorieId,
  childId,
  user,
  onChangeEvent,
  onRefreshMascotte,
  onMascotteStateChanged,
}) {
  const [statutAction, setStatutAction] = useState(false);
  const [realisedActionId, setRealisedActionId] = useState(0);
  const [viewInfoCard, setViewInfoCard] = useState(false);
  const [currentInfoName, setCurrentInfoName] = useState("");
  const [currentInfoId, setCurrentInfoId] = useState("");
  const [currentInfoDescription, setCurrentInfoDescription] = useState("");
  const [mascotteState, setMascotteState] = useState(onMascotteStateChanged);
  const { actions } = useAuth();

  // ------------------------------------------------------------------------------------
  // Gestion du changement d'état de l'action avec appel de l'API pour noter ce changement
  // ------------------------------------------------------------------------------------
  const handleStatutChanged = (checked) => {
    if (checked) {
      // Création de l'action
      var payload = [{ id_action: actionId, id_week: currentWeek.id }];

      NnauruAPI.post(user, "/actiondone/" + childId, payload, true).then(
        (result) => {
          setRealisedActionId(result.id);
          setStatutAction(checked);
          // évènement pour le parent
          onChangeEvent(result.id);
        }
      );
    } else {
      // Delete de l'action
      NnauruAPI.delete(user, "/actiondone/" + realisedActionId, true).then(
        (result) => {
          setStatutAction(checked);
          setRealisedActionId(0);
          onChangeEvent(realisedActionId);
        }
      );
    }
  };

  // Vérification du statut de l'action
  function checkDone(id, dones) {
    var x = dones.filter(
      (actionRealisee) => actionRealisee.action_id === actionId
    );

    if (x.length > 0) {
      setStatutAction(true);
      setRealisedActionId(x[0].id);
    } else {
      setStatutAction(false);
      setRealisedActionId(0);
    }
  }

  // ---------------------------------------------
  // Evènement lors de la modification du statut de l'action
  // ---------------------------------------------
  useEffect(() => {
    if (currentWeek?.id === null || childId == null) return;

    NnauruAPI.get(
      user,
      "/children/" + childId + "/actionsdone?week_id=" + currentWeek.id,
      true
    ).then((dones) => {
      checkDone(
        actionId,
        dones.filter((done) => done.category_id == categorieId)
      );
    });

    return () => {};
  }, [statutAction, realisedActionId]);

  // ---------------------------------------------
  // Evènement lors de la modification du statut de l'action
  // ---------------------------------------------
  useEffect(() => {
    setMascotteState(onMascotteStateChanged);
  }, [onMascotteStateChanged]);

  // -----------------------------------------------------
  // Interception de l'évènement d'affichage de la description de l'action
  // -----------------------------------------------------
  const handleShowActionDescription = (id, name) => {
    let titre = name;
    let ligne1 = "";

    var a = actions.filter((action) => action.id === id);
    if (a !== undefined && a.length > 0) {
      ligne1 = a[0]?.description;
    }

    onRefreshMascotte(titre, ligne1, "");
  };
  // -----------------------------------------------------
  // Calcul du nombre d'étoile à afficher
  // -----------------------------------------------------
  const computeStars = (nbStars, img) => {
    let content = [];
    for (let i = 0; i < nbStars; i++) {
      content.push(
        <div style={{ maxWidth: 20 }}>
          <img key={i} src={img} />
        </div>
      );
    }
    return content;
  };

  // --------------------------------
  // Render : Rendu HTML du composant
  // --------------------------------
  return (
    <>
      <div id={"action-" + action.id} className="vignette-action-container">
        <div className="action-header" id={action.id}>
          <div className="bg-img">
            <img src={appcfg.imgRootUrl + action?.icon} />
          </div>

          <div className="action-label">{action.name}</div>
        </div>

        <div className="action-footer">
          <div className="action-switch">
            <ToggleSwitch
              id={"chkFait" + action.id}
              name={action.name}
              checked={statutAction}
              onChange={handleStatutChanged}
              optionLabels={["Fait", "Non"]}
            />
          </div>

          <div className="action-footer-info-container">
            <div className="action-footer-info-container-star">
              {computeStars(
                action.metadata ? parseInt(action.metadata) : 0,
                Star
              )}
            </div>

            {mascotteState && (
              <div
                onClick={() =>
                  handleShowActionDescription(action.id, action.name)
                }
                className="button-info"
              >
                <img
                  src={Exclamation}
                  alt="boutton exclamation"
                  onClick={() =>
                    handleShowActionDescription(action.id, action.name)
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default VignetteAction;
