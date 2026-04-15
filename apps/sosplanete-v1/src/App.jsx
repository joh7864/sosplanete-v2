import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import NavBar from "./components/NavBar";
import SosStory from "./histoires/sos/SosStory";
import useBeforeUnload from "./hooks/useBeforeUnload";
import Bataille from "./minigames/Bataille/Bataille";
import { GameProvider } from "./minigames/GameContext";
import Games from "./minigames/Games";
import Quizz from "./minigames/Quizz/Quizz";
import Tri from "./minigames/Tri/Tri";
import { TriGameProvider } from "./minigames/Tri/TriGameContext";
import Actions from "./pages/Actions/Actions";
import Fiche from "./pages/Fiche/Fiche";
import Impacts from "./pages/Impacts/Impacts";
import Login from "./pages/Login/Login";
import Moi from "./pages/Moi/Moi";
import Profile from "./pages/Profile/Profile";
import Scores from "./pages/Scores/Scores";
import { AuthProvider } from "./utils/AuthContext";
import PrivateRoutes from "./utils/PrivateRoutes";

function App() {
  const beforeUnload = useBeforeUnload("Tu veux quitter l'application ?");

  return (
    <Router>
      <AuthProvider>
        <div className="wrapper">
          <div className="content">
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route element={<PrivateRoutes />}>
                <Route path="/fiche" element={<Fiche />} />

                <Route path="/" element={<Fiche />} />

                <Route exact path="/actions/:id" element={<Actions />} />

                <Route path="/moi" element={<Moi />} />

                <Route path="/scores" element={<Scores />} />

                <Route path="/games" element={<Games />} />

                <Route
                  path="/games/tri"
                  element={
                    <TriGameProvider>
                      <Tri />
                    </TriGameProvider>
                  }
                />

                <Route
                  path="/games/bataille"
                  element={
                    <GameProvider>
                      <Bataille />
                    </GameProvider>
                  }
                />
                <Route
                  path="/games/quizz"
                  element={
                    <GameProvider>
                      <Quizz />
                    </GameProvider>
                  }
                />

                <Route path="/sosstory" element={<SosStory />} />

                <Route path="/games/quizz" element={<Quizz />} />

                <Route path="/impacts" element={<Impacts />} />

                <Route path="/profile" element={<Profile />} />

                <Route path="*" element={<Login />} />
              </Route>
            </Routes>
          </div>

          <div className="footer">
            <NavBar />
          </div>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
