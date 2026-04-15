import React from "react";

const ResumeChapitre = ({ chapitre, onSelected }) => {
  return (
    <div className="flex flex-col flex-wrap justify-start items-center">
      <img
        onClick={() => onSelected(chapitre.id)}
        src={chapitre.illustrations[0]}
        className="rounded-lg opacity-100 hover:opacity-30 shadow-2xl w-[140px] md:w-[200px] cursor-pointer"
      />
      <p className="text-sm  text-center ">{chapitre.titre}</p>
    </div>
  );
};

export default ResumeChapitre;
