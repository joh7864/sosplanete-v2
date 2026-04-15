import React, { useEffect, useState } from "react";
import "./Quizz.css";
import QuizzQuestion from "./QuizzQuestion";

const QuizzGame = ({ actions, categories, setGameOver, level }) => {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let max = 5 * level;
    setCount(max);
    let tirage = tirageAuSort(actions, max);

    setQuestions([...tirage]);

    setSelectedQuestion(0);

    console.log("Démarrage du jeu", categories);
  }, []);

  useEffect(() => {}, [selectedQuestion]);

  function handleNextQuestion() {
    let nextQuestion = selectedQuestion + 1;

    if (nextQuestion >= questions.length) {
      setGameOver(true);
    }
    setSelectedQuestion(nextQuestion);
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
      const action = actionsCopy.splice(index, 1)[0];
      let q = {
        question: action,
        reponse: null,
      };
      resultat.push(q);
    }

    return resultat;
  }

  return (
    <div className="quizz-container">
      <p className="quizz-titre-principal">
        Retrouve les bonnes catégories en répondant aux{" "}
        <span style={{ fontWeight: 800 }}>{count}</span> questions du quizz
      </p>
      <QuizzQuestion
        quizz={questions[selectedQuestion]}
        index={selectedQuestion + 1}
        categories={categories}
        next={handleNextQuestion}
        abort={handleAbortGame}
      />
    </div>
  );
};

export default QuizzGame;
