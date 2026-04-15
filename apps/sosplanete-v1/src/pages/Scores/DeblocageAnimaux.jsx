import { useEffect, useState } from "react";

import ZoomIn from "../../components/animations/ZoomIn/ZoomIn";
import PlaneteAnimee from "../../components/planete/PlaneteAnimee";
import useBreakpoints from "../../hooks/useBreakpoints";
import "./DeblocageAnimaux.css";
import ImageSlider from "./ImageSlider";

function DeblocageAnimaux({ ...props }) {
  const breakPoint = useBreakpoints();
  const modeAffichageMobile = islittleScreen() ? "deblocage-v" : "deblocage-h";
  const [inProgress, setInProgress] = useState(false);

  function islittleScreen() {
    try {
      var result = breakPoint.isMobile;
      return result;
    } catch {
      false;
    }

    return false;
  }

  // --------------------------------------------
  // Evènement de MOUNT du composant
  // --------------------------------------------
  useEffect(() => {
    // Par défaut l'animation se joue automatiquement
    setInProgress(true);
  }, []);

  useEffect(() => {}, [props?.setPlayAnimation]);

  useEffect(() => {}, [props?.impacts.animalnum]);

  // --------------------------------------------
  // FONCTIONS
  // --------------------------------------------
  function handleReplay() {
    setInProgress(true);
    props?.replay();
    console.log("Replay de l'animation");
  }
  function handleStoppedAnimation() {
    setInProgress(false);
    console.log("Fin de l'animation");
  }
  return (
    <>
      <div className={modeAffichageMobile}>
        {1 == 1 && (
          <>
            {breakPoint.isMobile ? (
              <>
                <ZoomIn>
                  {props?.impacts?.animalnum > 0 && (
                    <div
                      className="deblocage-cercle"
                      onClick={() => handleReplay()}
                    >
                      <ImageSlider
                        images={props?.animaux.slice(
                          0,
                          props?.animaux.length -
                            (props?.animaux.length - props?.impacts?.animalnum)
                        )}
                        replay={props?.playAnimation}
                        repetitions={1}
                        onAnimationEnded={handleStoppedAnimation}
                      />
                    </div>
                  )}

                  <PlaneteAnimee
                    lastAnimal={props?.impacts?.animalnum}
                    lastRefresh={props?.playAnimation}
                  />
                </ZoomIn>
              </>
            ) : (
              <>
                <ZoomIn>
                  {props?.impacts?.animalnum > 0 && (
                    <div
                      className="deblocage-cercle"
                      onClick={() => handleReplay()}
                    >
                      <ImageSlider
                        images={props?.animaux.slice(
                          0,
                          props?.animaux.length -
                            (props?.animaux.length - props?.impacts?.animalnum)
                        )}
                        onAnimationEnded={handleStoppedAnimation}
                        replay={props?.playAnimation}
                        repetitions={1}
                      />
                    </div>
                  )}
                  <PlaneteAnimee
                    lastAnimal={props?.impacts?.animalnum}
                    lastRefresh={props?.playAnimation}
                  />
                </ZoomIn>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default DeblocageAnimaux;
