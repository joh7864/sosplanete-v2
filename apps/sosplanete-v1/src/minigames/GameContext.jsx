import { createContext, useContext, useEffect, useState } from "react";
//import appcfg from "../../config.json"

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const TENTATIVES_MAX = 10;
  const TEMPS_MAX = 120;

  const [loading, setLoading] = useState(false);
  const [startGame, setStartGame] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverTime, setGameOverTime] = useState(false);
  const [gameAborted, setGameAborted] = useState(false);
  const [tempsMax, setTempsMax] = useState(TEMPS_MAX);
  const [tentativesMax, setTentativesMax] = useState(TENTATIVES_MAX);
  const [count, setCount] = useState(TEMPS_MAX);
  const [tentatives, setTentatives] = useState(TENTATIVES_MAX);
  const [resultats, setResultats] = useState([]);
  const [bonnesReponses, setBonnesReponses] = useState(0);
  const [pauseGame, setPauseGame] = useState(false);
  const [gameIsRunning, setGameIsRunning] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(-1);

  useEffect(() => {}, [count]);

  useEffect(() => {
    if (startGame) {
      setTentatives(TENTATIVES_MAX);
      setTentativesMax(TENTATIVES_MAX);
      setCount(TEMPS_MAX);

      setGameOver(false);
      setPauseGame(false);
      setGameOverTime(false);
      setGameAborted(false);

      setResultats([]);
      setBonnesReponses(0);
    }
  }, [startGame]);

  useEffect(() => {
    if (gameOver) {
      setGameIsRunning(false);
      setStartGame(false);
    } else setGameIsRunning(true);
  }, [gameOver]);

  useEffect(() => {}, [pauseGame]);

  useEffect(() => {
    if (gameOverTime) setGameOver(true);
  }, [gameOverTime]);

  useEffect(() => {
    if (gameAborted) setGameOver(true);
  }, [gameAborted]);

  const contextData = {
    count,
    resultats,
    tentatives,
    tentativesMax,
    gameOver,
    gameOverTime,
    gameAborted,
    pauseGame,
    gameIsRunning,
    bonnesReponses,
    tempsMax,
    currentLevel,
    setCurrentLevel,
    setCount,
    setStartGame,
    setPauseGame,
    setGameIsRunning,
    setGameOverTime,
    setGameAborted,
    setGameOver,
    setTempsMax,
    setTentatives,
    setResultats,
    setBonnesReponses,
  };

  return (
    <GameContext.Provider value={contextData}>
      {loading ? <p>Loading...</p> : children}
    </GameContext.Provider>
  );
};

//Custom Hook
export const useGame = () => {
  return useContext(GameContext);
};

export default GameContext;
