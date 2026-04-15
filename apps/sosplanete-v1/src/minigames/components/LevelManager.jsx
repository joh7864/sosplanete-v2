import React from "react";
import bronze from "../images/bronze.svg";
import gold from "../images/gold.svg";
import silver from "../images/silver.svg";

const LevelManager = ({ onLevelSelected }) => {
  function handleChangeLevel(level) {
    onLevelSelected(level);
  }
  return (
    <>
      <div className="game-titre">Choisi ton niveau !</div>

      <div className="choix-niveau-container">
        <div onClick={() => handleChangeLevel(1, bronze)}>
          <div className="medaille-container">
            <img src={bronze} style={{ cursor: "pointer" }} />
            <div>Niveau 1</div>
          </div>
        </div>

        <div onClick={() => handleChangeLevel(2, silver)}>
          <div className="medaille-container">
            <img src={silver} style={{ cursor: "pointer" }} />
            <div>Niveau 2</div>
          </div>
        </div>

        <div onClick={() => handleChangeLevel(3, gold)}>
          <div className="medaille-container">
            <img src={gold} style={{ cursor: "pointer" }} />
            <div>Niveau 3</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LevelManager;
