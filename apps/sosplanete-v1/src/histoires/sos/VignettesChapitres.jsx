import React, { Fragment, useState } from "react";
import ResumeChapitre from "./ResumeChapitre";
import Story from "./Story";

const VignettesChapitres = ({ selectedChapitre }) => {
  const [currentChapitre, setCurrentChapitre] = useState(0);

  function handleSelected(chapitreId) {
    setCurrentChapitre(chapitreId);
    selectedChapitre(chapitreId);
  }
  return (
    <div className="w-[90%]  flex flex-col justify-center items-center gap-5">
      <div className="md:w-full flex  flex-wrap gap-2 justify-center items-center">
        {Story.chapitres
          .filter(function (c) {
            return c.disponible === true;
          })
          .map((item) => (
            <Fragment key={item.titre}>
              <ResumeChapitre
                chapitre={item}
                onSelected={handleSelected}
                className="flex justify-center items-center rounded-lg border-1 text-slate-800"
              />
            </Fragment>
          ))}
      </div>
    </div>
  );
};

export default VignettesChapitres;
