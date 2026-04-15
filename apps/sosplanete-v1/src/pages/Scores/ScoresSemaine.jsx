import React, { useEffect, useState } from "react";
import { NnauruAPI } from "../../api/nnauruAPI";
//import fond from "../../assets/scorecarddesk.svg";
import "../../components/Tabs/Tabs.css";
import { useAuth } from "../../utils/AuthContext";
import Histogramme from "./Histogramme";

const Scores = () => {
  const { user, currentWeek, teams } = useAuth();
  const [scores, setScores] = useState([]);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [totalActions, setTotalActions] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const totalActions = scores.reduce(
      (total, { count_week }) => total + count_week,
      0
    );
    setTotalActions(totalActions);
  }, [scores, start, end]);

  useEffect(() => {
    setIsLoading(true);
    // Appel de l'API pour récupérer les scores de la semaine
    NnauruAPI.get(user, "/teams/total?week_id=" + currentWeek.id, true).then(
      (result) => {
        setScores(result);
        setIsLoading(false);
      }
    );

    var d1 = new Date(currentWeek.begin);
    var d2 = new Date(currentWeek.end);
    setStart(d1.toLocaleDateString("fr-FR"));
    setEnd(d2.toLocaleDateString("fr-FR"));
  }, []);

  return (
    <>
      <div className="panel-container">
        <div className="panel-content-container">
          <h1 className="titre-cadre">Score semaine</h1>
          <div className="text-cadre">
            Le score de chaque équipe du <strong>{start}</strong> au{" "}
            <strong>{end}</strong> est …
          </div>
          <ul className="scores-semaine-chart">
            {scores.map((item) => (
              <li key={item.id}>
                <Histogramme
                  id={item.id}
                  count={item.count_week}
                  refTeams={teams}
                  totalActions={totalActions}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

export default Scores;
