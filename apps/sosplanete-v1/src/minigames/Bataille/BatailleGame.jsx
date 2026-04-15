/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import "./Bataille.css";
import BatailleChoix from "./BatailleChoix";

const BatailleGame = ({
  actions,
  categories,
  setGameOver,
  level,
  updateMascotte,
}) => {
  const [batailles, setBatailles] = useState([]);
  const [selectedBataille, setSelectedBataille] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let max = 5 * level;
    setCount(max);
    let tirage = tirageAuSort(actions, max);

    setBatailles([...tirage]);

    setSelectedBataille(0);
  }, []);

  useEffect(() => {
    if (updateMascotte !== undefined) updateMascotte("En garde !", "", "");

    const timeout = setTimeout(() => {
      if (updateMascotte !== undefined) updateMascotte("", "", "");
    }, 3000);
  }, [selectedBataille]);

  function handleNextQuestion() {
    let nextBataille = selectedBataille + 1;

    if (nextBataille >= batailles.length) {
      setGameOver(true);
    }
    setSelectedBataille(nextBataille);
  }
  function handleAbortGame() {}

  //-----------------------------------------
  // Fonction de tirage au sort sans doublons
  //-----------------------------------------
  function tirageAuSort(actions, nombreDeTirages) {
    // Copie du tableau original pour ne pas le modifier directement
    let actionsCopy = [...actions];

    // Tableau résultat
    const resultat = [];

    // Fonction pour obtenir un index aléatoire
    function getRandomIndex(max) {
      return Math.floor(Math.random() * max);
    }

    // Tirage au sort sans doublons
    for (let i = 0; i < nombreDeTirages; i++) {
      const index = getRandomIndex(actionsCopy.length);
      const index2 = getRandomIndex(actionsCopy.length);

      const action = actionsCopy.splice(index, 1)[0];
      const action2 = actionsCopy.splice(index2, 1)[0];

      let b = {
        a1: action,
        a2: action2,
      };
      resultat.push(b);
    }

    return resultat;
  }

  return (
    <div className="bataille-container">
      <p className="bataille-titre-principal">
        Accumule les meilleurs économies en gagnant les{" "}
        <span style={{ fontWeight: 800 }}>{count}</span> batailles du co2
      </p>
      <BatailleChoix
        bataille={batailles[selectedBataille]}
        index={selectedBataille + 1}
        categories={categories}
        next={handleNextQuestion}
        abort={handleAbortGame}
        updateMascotte={updateMascotte}
      />
    </div>
  );
};

export default BatailleGame;
